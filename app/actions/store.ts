"use server";

import { adminDb, adminAuth } from "../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { ITEMS_MAP } from "../lib/data";

async function getUidFromToken(idToken: string): Promise<string> {
  if (!idToken) throw new Error("غير مصرح.");
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}

export async function getStoreStock() {
  try {
    // 1. جلب مخزون كاب كات (المنتج 1) من كولكشن الحسابات المتاحة
    const capcutSnap = await adminDb
      .collection("capcutAccounts")
      .where("status", "==", "available")
      .count()
      .get();

    // 2. جلب مخزون كانفا (المنتج 2) من كولكشن storeItems
    const canvaStockDoc = await adminDb
      .collection("storeItems")
      .where("itemId", "==", 2)
      .limit(1)
      .get();

    let canvaStock = 0;
    if (!canvaStockDoc.empty) {
      canvaStock = canvaStockDoc.docs[0].data().stock || 0;
    }

    // إرجاع خريطة المخزون للمنتجين معاً ديناميكياً
    return {
      1: capcutSnap.data().count,
      2: canvaStock,
    };
  } catch (err) {
    console.warn("Failed to fetch inventory map:", err);
    return { 1: 0, 2: 0 };
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

    // 🔵 منتج كانفا (id: 2) — يعتمد على المخزون الوهمي وإرسال دعوة، بدون حسابات جاهزة
    if (itemId === 2) {
      const canvaStockQuery = adminDb
        .collection("storeItems")
        .where("itemId", "==", 2)
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

    // 🔵 المنتجات الأخرى (مثل كاب كات id: 1) — تسحب حساباً جاهزاً من capcutAccounts
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
      .orderBy("createdAt", "desc")
      .get();

    if (snap.empty) {
      return { success: true, purchases: [] };
    }

    // 1. استخراج جميع بيانات المشتريات ومجال معرفات الحسابات
    const purchasesData = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    const accountIds = Array.from(new Set(purchasesData.map((p: any) => p.accountId)));

    // 2. جلب كل الحسابات بطلب واحد مجمع لتقليل وقت الانتظار
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

// دالة إرسال دعوة كانفا الآلية من السيرفر
export async function sendCanvaInvitation(userEmail: string) {
  // جلب الكوكيز والتوكنز المحدثة من إعدادات السيرفر بـ Firestore
  const settingsSnap = await adminDb.collection("settings").doc("canvaConfig").get();
  if (!settingsSnap.exists) {
    throw new Error("لم يتم تهيئة كوكيز حساب كانفا في لوحة التحكم بعد.");
  }

  const config = settingsSnap.data();
  const canvaCookies = config?.cookies || "";
  const authzToken = config?.authz || "";

  try {
    const response = await fetch(
      "https://www.canva.com/_ajax/invitation/brand/invitations/create",
      {
        method: "POST",
        headers: {
          accept: "*/*",
          "accept-language": "en-US,en;q=0.9,ar;q=0.8",
          "content-type": "application/json;charset=UTF-8",
          cookie: canvaCookies,
          origin: "https://www.canva.com",
          referer: "https://www.canva.com/settings/people",
          "user-agent":
            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1",
          "x-canva-active-user": "eyJBIjoiVUFITDVQbUQ5bHciLCJCIjoiQkFITDVKT1BTWVEifQ==",
          "x-canva-brand": "BAHL5JOPSYQ",
          "x-canva-request": "createbrandinvitations",
          "x-canva-user": "UAHL5PmD9lw",
          "x-canva-authz": authzToken,
        },
        body: JSON.stringify({
          K: "BAHL5JOPSYQ",
          "A?": "A",
          A: [{ A: userEmail, B: "B" }],
          B: true,
          D: {
            G: "408fd7ec-c259-4d5a-9f41-914f32487595",
            B: [
              {
                A: "F",
                B: "WzQzMjA5LFswLDEsMTcsMTksOSwyMyw2LDMxLDgsMTgsMTMsMjgsMiwxNCwyMiwxNiwxNSwyNSwyNCwzMCwxMSw3LDI2LDI3LDMsMj9LCzQxLDEwLDUsMTJfXSxbIjY2ajZxUGVvL2FqNXFQK28rS2d5cVR1cEtxa3ZxU3FwSEtucHFBR3AvYWo2cUE2cC9xajZxUGlvTHFrMXFUS3BLNms0cVJhcDZhaitxUGVvQWFuNnFQaW9ONms0cVJLcFBLazdxUzZwSDZucHFQS29PS2swcVN5cExxa1FxZW1vTHFrMHFUS3BOYW5wcVBXb0Zha1dxUjJwRWFrVXFYRyIsImZLbDhxWHlwZiIsIlc0VlE9PSIsIkhxcXFxK3JhcXRGcXh5cllhdG9xMk9yYTZ0cnEwT3JIcXM9IiwibktvNnFuZXFmTXEvcWxLcGFxbXlxVDZvNnFsZ21xbXlxUzZvNnE2b1pxbXlxUzZvNnEiLCIyYWtVa1E9PSIsIlphbz0iLCI2bjFxaWlxbTZxN3FxbnFnNnBqcWlLcG1xbC9xcDZvN3FucXFlNm9ucW9icW02cTdxbm9xbXE2bzdvbHFuNnBqcWlLbzJxL3FwNm83cW5hcTZvN3FvYnFhNnBycWlLbE9xbmFxWTZvcG9yMHE2b2Nvam9xMnFlNnFNNm9yYTY2cDZvL29xYXE2b0ZxbXFxQzZveW9qYXE2b3pxYVNxNnA2cVdpcTZvM3FucXFWNm94cWlLbHlxb2FxeTZvMnFvU3FhNm9WcW5xcUs2b2JxbENwNnFzNnJGNm9WcWFhcUs2b1hxYWExNm9HcW1NcTI2b3pxcUtxTTZvMWFLbHFGNm9ScW5NcU02cHJxbUtxVTZvVnFScXFTNm9icW1lcU02b0NxVkNxVDZvMHFtTXFXNiIsIkY2b0hxbUtxNjZvSnFsQ3F2Nm9KcW1PcWE2b0ZxbUtxRTZvM3FuZXFXNiIsIjZvUnFyMks2b25xbUtxbTZvMXFuS3E2NnA2b2NxakttNm9ucW9icU02cHpxbVNxQzZvT2FtQ3FNNm9jYW1DcU02cHJxbUtxUjZvdnFrS3FONm9UcW1lcVQ2b1JhbUtxVTZva3FtU3FRNm9icW1lcU02b0NxVkNxVDZvMHFtTXFXNiIsIjZvamFrS3FDNm9qYWpLcU02b1JhbUtxVDZvanFtZ3FPNm9SYW1LcVQ2b05uYW1DVVNvbW1pNnBONm9SYW5LcVciLCI2YXIycXZhUTZhcjJxdnFiNjZyMnF2cU02YXIycXY2cjZhcjJxdnFiNjZyMnF2NnI2cTYzcTZxcjZxdjZyYXZPNmEycjZxdjZhNjZyMnF2cU02YXIycXZhciIsIjZhcjJxdnFiNjZyMnF2cU02YXIycXZhciIsImV5TkpjMjUwYm5Rc0lBPT0iLCJLS25scWVXb0E2aFdxZXFYMnBPYWtpcWMycEthb09xV21wRUtuRnFXMnBSYWtkcVFLbVhxZTJwS2FraXFPbXBGS2xucWJxcG9ha2JxYUdvS2FuRnFhV3BMYWhxcVdHcEVLa0NxSldwbmFob3FlbXA0YWtEcWVLcEthbkNxS21wSWFqMnFQV3BVYWtScVMycG9ha0ZxYUdvZ2FtNnFQV3BWYWtocVNtcHphbXpxU1dwRGFrVnFOMnBiYWxScVFLcEthbkNxS21wS2FsQ3FXbXBQYWp5cU1XcEthalZxUm1wY2FqcXFPS3BqYWtMcVFXcHFhbE9xRldwQ2FtTnFRV3BPYWxEcVJtcGRhbnpxTDFwRGFsNnFPV3BOYWtMcVJ1dyIsIjZvU3FqYXFPNm9YYWpLcU42b0Rha0dxTTZveGFrS3FXNiIsIktLa2FxT21wV2FraXFPbXBGYW5scWVXbzZhaFdxZStwbGFrMnFPbXBTYWtMcVFhb2Zhb3pxTzZvWGFqS3FPNm9UYWtlcWMyb0lhbGVxV0dvZmFpdXFPV3BWYWxFcVIyb0ZhbUdxUzJvamFtcXFQV3BWYWtMcVMybzZhazNxT21wSWFuS3FQV3BWYWtScVMyb3Vha2JxTVdwSEFha0JxUkdvQ2FtcXFWbXBqYWtkcVFLcExhbENxS21wSmFscXFQV3BaYWhoUU9hcGhhbG5xV0dvcmFtcXFQV3BwYWtacVMyb1phazNxT2xWc1FtSlVjV3BqYWtkcVFLcEhhbENxS21wRGJHa1FZblJxT0dwUWFtOExVbUlLYlZzRGFrUnFRR29oYW1lcVcyb3dha3FxTjZvMGFsdHFjMm9uYWxsYUdsbFk=",
              },
            ],
          },
          F: "https://www.canva.com/settings/people",
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("Canva API Server Error:", error);
    return false;
  }
}

// دالة استدعائها من الـ Frontend لحفظ إيميل الدعوة بعد الشراء الناجح لكانفا
export async function processCanvaPurchase(idToken: string, userEmail: string) {
  const userId = await getUidFromToken(idToken);

  // تحديث آخر عملية شراء لكانفا بإيميل العميل (تم إنشاؤها مسبقاً داخل purchaseItem)
  const purchasesSnap = await adminDb
    .collection("purchases")
    .where("userId", "==", userId)
    .where("itemId", "==", 2)
    .orderBy("createdAt", "desc")
    .limit(1)
    .get();

  if (!purchasesSnap.empty) {
    await purchasesSnap.docs[0].ref.update({ customerEmail: userEmail });
  }

  // تشغيل دالة الإرسال الآلي فوراً
  const inviteSuccess = await sendCanvaInvitation(userEmail);

  if (inviteSuccess) {
    return { success: true };
  } else {
    return {
      success: false,
      error: "عذراً، فشل الإرسال التلقائي. الجلسة منتهية أو هناك ضغط على خوادم كانفا.",
    };
  }
}
