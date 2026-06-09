"use server";

import { adminDb, getUidFromToken } from "../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { ITEMS_MAP, PRODUCT_IDS } from "../lib/data";

export async function getStoreStock() {
  try {
    // 1. جلب مخزون كاب كات من كولكشن الحسابات المتاحة
    const capcutSnap = await adminDb
      .collection("capcutAccounts")
      .where("status", "==", "available")
      .count()
      .get();

    // 2. جلب مخزون كانفا بطلب آمن
    const canvaStockDoc = await adminDb
      .collection("storeItems")
      .where("itemId", "==", PRODUCT_IDS.CANVA)
      .limit(1)
      .get();

    let canvaStock = 0;
    if (!canvaStockDoc.empty) {
      canvaStock = canvaStockDoc.docs[0].data().stock || 0;
    }

    // إرجاع خريطة المخزون للمنتجين معاً ديناميكياً
    return {
      [PRODUCT_IDS.CAPCUT]: capcutSnap.data().count,
      [PRODUCT_IDS.CANVA]: canvaStock,
    };
  } catch (err) {
    console.error("Failed to fetch inventory map:", err);
    throw new Error("عذراً، فشل في جلب بيانات المخزون من السيرفر.");
  }
}

export async function purchaseItem(idToken: string, itemId: number) {
  const userId = await getUidFromToken(idToken);

  const item = ITEMS_MAP[itemId];

  if (!item) {
    throw new Error("منتج غير مدعوم حالياً.");
  }

  const itemName = item.name;
  const price = item.price;

  const purchasedResult = await adminDb.runTransaction(async (transaction) => {
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists) throw new Error("المستخدم غير موجود.");
    const currentBalance = userSnap.data()?.balance || 0;

    if (currentBalance < price) {
      throw new Error("رصيد غير كافٍ.");
    }

    // 🔵 منتج كانفا — يعتمد على المخزون الوهمي وإرسال دعوة، بدون حسابات جاهزة
    if (itemId === PRODUCT_IDS.CANVA) {
      const canvaStockQuery = adminDb
        .collection("storeItems")
        .where("itemId", "==", PRODUCT_IDS.CANVA)
        .limit(1);
      const canvaStockSnap = await transaction.get(canvaStockQuery);

      let currentStock = 0;
      if (!canvaStockSnap.empty) {
        const canvaStockDoc = canvaStockSnap.docs[0];
        currentStock = canvaStockDoc.data().stock || 0;
        if (currentStock <= 0) {
          throw new Error("عذراً، نفدت كمية هذا المنتج حالياً.");
        }
        transaction.update(canvaStockDoc.ref, { stock: currentStock - 1 });
      } else {
        throw new Error("عذراً، هذا المنتج غير متوفر حالياً.");
      }

      const newPurchaseRef = adminDb.collection("purchases").doc();
      transaction.set(newPurchaseRef, {
        userId,
        itemId,
        itemName,
        price,
        createdAt: FieldValue.serverTimestamp(),
      });

      transaction.update(userRef, {
        balance: FieldValue.increment(-price),
      });

      return {
        success: true,
        requiresEmail: true,
      };
    }

    // 🔵 المنتجات الأخرى (مثل كاب كات) — تسحب حساباً جاهزاً من capcutAccounts
    const accountQuery = adminDb
      .collection("capcutAccounts")
      .where("status", "==", "available")
      .limit(1);

    const accountSnap = await transaction.get(accountQuery);

    if (accountSnap.empty) {
      throw new Error("عذراً، هذا المنتج غير متوفر حالياً.");
    }

    const accountDoc = accountSnap.docs[0];

    transaction.update(accountDoc.ref, {
      status: "sold",
      soldTo: userId,
      soldAt: FieldValue.serverTimestamp(),
    });

    const newPurchaseRef = adminDb.collection("purchases").doc();
    transaction.set(newPurchaseRef, {
      userId,
      itemId,
      itemName,
      price,
      accountId: accountDoc.id,
      createdAt: FieldValue.serverTimestamp(),
    });

    transaction.update(userRef, {
      balance: FieldValue.increment(-price),
    });

    return {
      success: true,
      requiresEmail: false,
      account: {
        email: accountDoc.data().email || "",
        password: accountDoc.data().password || "",
      },
    };
  });

  return purchasedResult;
}

export async function toggleStockNotification(idToken: string, itemId: number) {
  const userId = await getUidFromToken(idToken);

  const docId = `${userId}_${itemId}`;
  const notifyRef = adminDb.collection("stockNotifications").doc(docId);
  const snap = await notifyRef.get();

  if (snap.exists) {
    await notifyRef.delete();
    return { success: true, subscribed: false };
  } else {
    await notifyRef.set({
      userId,
      itemId,
      createdAt: FieldValue.serverTimestamp(),
    });
    return { success: true, subscribed: true };
  }
}

export async function getSubscriptionStatus(userId: string, itemId: number) {
  if (!userId) return false;
  const docId = `${userId}_${itemId}`;
  const snap = await adminDb.collection("stockNotifications").doc(docId).get();
  return snap.exists;
}

export async function getStockNotificationMap(idToken: string, itemIds: number[]) {
  if (!idToken || !itemIds.length) return {};

  const userId = await getUidFromToken(idToken);

  try {
    const snap = await adminDb
      .collection("stockNotifications")
      .where("userId", "==", userId)
      .where("itemId", "in", itemIds)
      .get();

    const map: Record<number, boolean> = {};
    snap.docs.forEach((doc) => {
      map[doc.data().itemId] = true;
    });
    return map;
  } catch (err) {
    console.error("Error fetching notification map:", err);
    return {};
  }
}

export async function getUserPurchases(idToken: string) {
  const userId = await getUidFromToken(idToken);
  try {
    const snap = await adminDb
      .collection("purchases")
      .where("userId", "==", userId)
      .where("itemId", "==", PRODUCT_IDS.CAPCUT)
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      return { success: true, purchases: [] };
    }

    // 1. استخراج جميع بيانات المشتريات وتصفية معرفات الحسابات من أي قيم undefined أو فارغة
    const purchasesData = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const accountIds = Array.from(
      new Set(
        purchasesData
          .map((p: any) => p.accountId)
          .filter((id) => id !== undefined && id !== null && id !== "")
      )
    );

    // إضافة أمان: إذا كانت مصفوفة الحسابات فارغة (مثلاً العميل اشترى Canva فقط)، ندمج البيانات ونرجعها مباشرة دون استعلام السيرفر
    if (accountIds.length === 0) {
      const purchases = purchasesData.map((p: any) => ({
        id: p.id,
        itemName: p.itemName,
        createdAt: p.createdAt?.toMillis() || Date.now(),
        email: "غير متوفر",
        password: "غير متوفر",
      }));
      return { success: true, purchases };
    }

    // 2. جلب كل الحسابات بطلب واحد مجمع إذا كانت المصفوفة تحتوي على عناصر
    const accountsSnap = await adminDb
      .collection("capcutAccounts")
      .where("__name__", "in", accountIds.slice(0, 30))
      .get();

    // 3. تحويل الحسابات إلى خريطة (Map) ليسهل قراءتها فوراً
    const accountsMap = new Map(accountsSnap.docs.map((doc) => [doc.id, doc.data()]));

    // 4. دمج البيانات ديناميكياً بدون استعلامات متكررة
    const purchases = purchasesData.map((p: any) => {
      const account: any = accountsMap.get(p.accountId);
      return {
        id: p.id,
        itemName: p.itemName,
        createdAt: p.createdAt?.toMillis() || Date.now(),
        email: account ? account.email : "غير متوفر",
        password: account ? account.password : "غير متوفر",
      };
    });

    return { success: true, purchases };
  } catch (err: any) {
    console.error("Error fetching purchases:", err);
    return { success: false, error: err.message };
  }
}

// دالة استقبال طلب شراء كانفا وحفظه كـ تذكرة معلقة في طابور الـ Firestore ليقرأها الـ VPS آلياً
export async function processCanvaPurchase(idToken: string, userEmail: string) {
  try {
    const userId = await getUidFromToken(idToken);

    // 1. تحديث الفاتورة الحالية بإيميل العميل في Firestore لتوثيق السجلات للمستخدم
    const purchasesSnap = await adminDb
      .collection("purchases")
      .where("userId", "==", userId)
      .where("itemId", "==", PRODUCT_IDS.CANVA)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (!purchasesSnap.empty) {
      await purchasesSnap.docs[0].ref.update({ customerEmail: userEmail });
    }

    // 2. تدوين التذكرة فوراً في طابور pendingInvites لكي تلتقطها إضافة Automa خلال دقيقة
    await adminDb.collection("pendingInvites").add({
      userId,
      email: userEmail,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Process Canva Purchase Error:", error);
    return {
      success: false,
      error: error.message || "حدث خطأ أثناء تسجيل طلب التفعيل الدوري.",
    };
  }
}
