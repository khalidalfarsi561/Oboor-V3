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
import puppeteer from "puppeteer-core";

export async function sendCanvaInvitation(userEmail: string) {
  // 1. جلب الكوكيز والتوكنز من إعدادات السيرفر بـ Firestore
  const settingsSnap = await adminDb.collection("settings").doc("canvaConfig").get();
  if (!settingsSnap.exists) {
    throw new Error("لم يتم تهيئة كوكيز حساب كانفا في لوحة التحكم بعد.");
  }

  const config = settingsSnap.data();
  const canvaCookies = config?.cookies || "";

  // 2. رابط الاتصال بـ Browserless مع تفعيل وضع التخفي (Stealth Mode)
  const BROWSERLESS_API_KEY = process.env.BROWSERLESS_API_KEY;
  if (!BROWSERLESS_API_KEY) {
    throw new Error("لم يتم تكوين BROWSERLESS_API_KEY في السيرفر.");
  }
  const browserWSEndpoint = `wss://chrome.browserless.io?token=${BROWSERLESS_API_KEY}&stealth=true&--disable-blink-features=AutomationControlled`;

  let browser;
  try {
    // 3. الاتصال بالمتصفح السحابي عن بعد
    browser = await puppeteer.connect({ browserWSEndpoint });
    const page = await browser.newPage();

    // ضبط أبعاد الشاشة ومحاكاة مظهر ديسكتوب عريض ومستقر
    await page.setViewport({ width: 1920, height: 1080 });

    // 4. تعيين حقل الـ User-Agent ليبدو كمتصفح طبيعي
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    );

    // 5. تهيئة وحقن الكوكيز داخل المتصفح السحابي قبل فتح الصفحة
    const cookieArray = canvaCookies.split(";").map((pair: string) => {
      const [name, ...valueParts] = pair.trim().split("=");
      return {
        name: name,
        value: valueParts.join("="),
        domain: ".canva.com",
        path: "/",
      };
    });
    await page.setCookie(...cookieArray);

    // 6. التوجه إلى صفحة الأعضاء في كانفا والانتظار حتى استقرار الشبكة
    await page.goto("https://www.canva.com/settings/people", {
      waitUntil: "networkidle2",
      timeout: 50000,
    });

    // 7. الأتمتة المرئية الذكية والمقاومة للنوافذ المنبثقة وتغير العناصر
    try {
      // 🍪 [تخطي بنر الكوكيز]
      const buttons = await page.$$("button");
      for (const button of buttons) {
        const text = await page.evaluate((el) => el.textContent, button);
        if (text && (text.includes("Accept all cookies") || text.includes("Accept"))) {
          await button.click();
          console.log("🍪 تم رصد بنر الكوكيز وإغلاقه بنجاح آلياً!");
          await new Promise((resolve) => setTimeout(resolve, 1500));
          break;
        }
      }

      // 📧 [الخطوة 2]: النقر على زر "Invite people" المفتوح في الواجهة
      console.log("🔍 جاري الفحص الديناميكي عن زر Invite people الحقيقي...");
      const allClickables = await page.$$("button, a, div[role='button']");
      let clickedInvite = false;

      for (const el of allClickables) {
        const text = await page.evaluate((element) => element.textContent, el);
        if (
          text &&
          (text.trim() === "Invite people" ||
            text.includes("Invite people") ||
            text.includes("دعوة أشخاص") ||
            text.includes("إضافة أعضاء"))
        ) {
          await el.click();
          clickedInvite = true;
          console.log(
            `🎯 تم العثور على زر الدعوة ونقره بنجاح! النص المستهدف: "${text.trim()}"`
          );
          break;
        }
      }

      if (!clickedInvite) {
        console.log("⚠️ لم ينجح النقر النصي، محاولة الاستهداف المباشر لأي عنصر دعوة...");
        await page.click("button, a:has-text('Invite people')").catch(() => null);
      }

      // الانتظار ثانيتين ونصف لتستقر النافذة التعبيرية لكانفا تماماً وينبثق الحقل بشكل آمن
      await new Promise((resolve) => setTimeout(resolve, 2500));

      // 📧 [الخطوة 3 المحدثة لحل مشكلة الزر الرمادي]:
      console.log("✏️ جاري حقن البريد الإلكتروني للعميل وإطلاق نبضات التفعيل البشري...");
      const inputSelector =
        "input.bCVoGQ, input[placeholder='Enter email address...'], input[inputmode='email']";
      await page.waitForSelector(inputSelector, { timeout: 15000, visible: true });

      // 🚀 نقوم بعمل Focus حقيقي أولاً
      await page.focus(inputSelector);

      // حقن الإيميل كاملاً ما عدا الحرف الأخير برمجياً لتسريع العملية
      const emailPrefix = userEmail.slice(0, -1);
      const emailLastChar = userEmail.slice(-1);

      await page.evaluate(
        (selector, text) => {
          const input = document.querySelector(selector);
          if (input) {
            // استخدام تكتيك التعيين الديناميكي لتخطي قيود التايب سكريبت في السيرفر
            (input as any).value = text;

            // إطلاق كافة أحداث الإدخال لجعل المتصفح يستيقظ
            input.dispatchEvent(new Event("focus", { bubbles: true }));
            input.dispatchEvent(new Event("input", { bubbles: true }));
            input.dispatchEvent(new Event("change", { bubbles: true }));
          }
        },
        inputSelector,
        emailPrefix
      );

      // 💥 [الضربة القاضية]: محاكاة كتابة الحرف الأخير بالـ Keyboard الفعلي للـ Puppeteer
      // هذا الحرف يجعل كود كانفا يرى حركة كيبورد حقيقية فينشط الزر البنفسجي فوراً!
      await page.type(inputSelector, emailLastChar, { delay: 100 });

      // تحريك الماوس أو عمل مسح للـ Focus للتأكيد
      await page.evaluate((selector) => {
        const input = document.querySelector(selector) as HTMLInputElement;
        if (input) input.dispatchEvent(new Event("blur", { bubbles: true }));
      }, inputSelector);

      // انتظار ثانية ونصف كاملة ليستوعب كود كانفا الحرف ويتحول الزر للون البنفسجي النشط
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 📧 [الخطوة 4]: الضغط على زر "Confirm and invite" النهائي لتفجير الإرسال
      console.log("🚀 جاري الضغط على زر تأكيد وإرسال الدعوة البنفسجي النشط...");

      const clickedConfirm = await page.evaluate(() => {
        const finalButtons = Array.from(document.querySelectorAll("button"));
        for (const btn of finalButtons) {
          const btnText = btn.textContent || "";
          if (
            btnText.includes("Confirm and invite") ||
            btnText.includes("Confirm") ||
            btnText.includes("تأكيد") ||
            btnText.includes("إرسال")
          ) {
            // التحقق من أن الزر لم يعد معطلاً قبل نقره
            if (!(btn as HTMLButtonElement).disabled) {
              (btn as HTMLButtonElement).click();
              return true;
            }
          }
        }
        return false;
      });

      if (!clickedConfirm) {
        console.log(
          "🔄 لم يتم النقر عبر السكريبت، جاري الإرسال النهائي عبر كيبورد Enter..."
        );
        await page.keyboard.press("Enter");
      } else {
        console.log("✅ تم الضغط بنجاح على الزر البنفسجي بعد تنشيطه كلياً!");
      }

      console.log(`✅ تم إنهاء معالجة الضغط النهائي بنجاح لإيميل العميل: ${userEmail}`);

      // التقاط صورة نجاح نهائية لمراقبة خروج الطلب بنجاح للبريد
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await page.screenshot({ path: "canva-success-check.jpg" }).catch(() => null);

      await new Promise((resolve) => setTimeout(resolve, 2000));
      await browser.close();
      return true;
    } catch (selectorError) {
      console.warn("⚠️ حدث عائق أثناء الأتمتة، جاري التقاط صورة سريعة...");
      if (browser) {
        await page.screenshot({ path: "canva-error.png" }).catch(() => null);
        await browser.close().catch(() => null);
      }
      throw selectorError;
    }
  } catch (error: any) {
    console.error("Browserless Automation Error:", error);
    if (browser) await browser.close().catch(() => null);
    throw new Error(error.message || "فشل المتصفح السحابي في إرسال الدعوة.");
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

  // تشغيل دالة الإرسال الآلي فوراً (ترمي الخطأ الحقيقي إذا فشلت)
  await sendCanvaInvitation(userEmail);
  return { success: true };
}
