"use server";

import { adminDb, adminAuth } from "../lib/firebase/admin";
import { assertRateLimit } from "../lib/rate-limit";
import { FieldValue } from "firebase-admin/firestore";
import { headers, cookies } from "next/headers";

function generateRandomCode(): string {
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(36).padStart(2, "0"))
    .join("")
    .substring(0, 8)
    .toUpperCase();
}

async function getClientFraudData() {
  const headersList = await headers();
  // Vercel and edge providers set x-forwarded-for
  const xForwardedFor = headersList.get("x-forwarded-for");
  const userAgent = headersList.get("user-agent") || "unknown";
  let ip = "unknown";
  if (xForwardedFor) {
    ip = xForwardedFor.split(",")[0].trim();
  } else {
    ip = headersList.get("x-real-ip") || "unknown";
  }

  const cookieStore = await cookies();
  let deviceId = cookieStore.get("device_fingerprint")?.value;

  if (!deviceId) {
    // توليد معرف عشوائي فريد تماماً لكل متصفح (UUID) مستقل تماماً عن الـ IP
    deviceId = crypto.randomUUID
      ? crypto.randomUUID().substring(0, 16)
      : Math.random().toString(36).substring(2, 18).toUpperCase();

    cookieStore.set("device_fingerprint", deviceId, {
      maxAge: 60 * 60 * 24 * 365, // سنة كاملة
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
    });
  }

  return { ip, deviceId, userAgent };
}

async function detectVPN(): Promise<boolean> {
  try {
    const headersList = await headers();

    // 1. الفحص الأولي السريع عبر Vercel
    const isProxy = headersList.get("x-vercel-proxied") === "true";
    if (isProxy) return true;

    // 2. استخراج عنوان الـ IP الحقيقي للمستخدم القادم عبر شبكة Vercel
    const xForwardedFor = headersList.get("x-forwarded-for");
    let ip = "unknown";
    if (xForwardedFor) {
      ip = xForwardedFor.split(",")[0].trim();
    } else {
      ip = headersList.get("x-real-ip") || "unknown";
    }

    // إذا كنا على الجهاز المحلي أثناء التطوير، تخطى الفحص لكي لا يتم حظرك
    if (ip === "unknown" || ip === "::1" || ip === "127.0.0.1") {
      return false;
    }

    // 3. الفحص الصارم عبر API خارجي ذكي وسريع جداً
    // نضع مهلة زمنية صارمة (1.2 ثانية) لضمان عدم تأثر سرعة الموقع نهائياً
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,proxy,hosting,hostingProvider`,
      {
        signal: controller.signal,
        next: { revalidate: 3600 }, // تفعيل الكاش لـ Next.js لمنع تكرار الطلبات لنفس الـ IP وتسريع الاستجابة
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) return false;

    const data = await response.json();

    if (data && data.status === "success") {
      // كشف شبكات الـ VPN، البروكسي، أو محاولات السكربتات من خواف الاستضافة
      if (data.proxy === true || data.hosting === true) {
        console.warn(
          `[SECURITY] VPN/Proxy detected for IP: ${ip} via ${data.hostingProvider || "Unknown"}`
        );
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("خطأ أثناء فحص الـ VPN الخارجي:", error);
    // في حال حدوث أي مشكلة في الـ API الخارجي، نمرر المستخدم فوراً لضمان استمرارية عمل الموقع وسرعته
    return false;
  }
}

async function getUidFromToken(idToken: string): Promise<string> {
  if (!idToken) throw new Error("غير مصرح.");
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}

export async function initiateClaimIntent(
  idToken: string,
  linkId: string
): Promise<{ success: boolean; error?: string }> {
  if (!idToken || !linkId) return { success: false, error: "Missing parameters" };

  const userId = await getUidFromToken(idToken);
  await assertRateLimit(`intent:${userId}:${linkId}`, 5, 60 * 1000);

  try {
    const { ip, deviceId, userAgent } = await getClientFraudData();

    if (await detectVPN()) {
      return { success: false, error: "VPN_DETECTED" };
    }

    // Check pre-locks for IP and Device to prevent generating wasted intents
    const claimRefs = [];

    if (ip !== "unknown") {
      claimRefs.push(adminDb.collection("linkClaims").doc(`IP_${ip}_${linkId}`));
    }

    if (deviceId !== "unknown") {
      claimRefs.push(adminDb.collection("linkClaims").doc(`DEV_${deviceId}_${linkId}`));
    }

    const claimSnaps = await Promise.all(claimRefs.map((ref) => ref.get()));

    for (const snap of claimSnaps) {
      if (snap.exists) {
        const lastGen = snap.data()?.lastGeneratedAt;
        if (lastGen && Date.now() - lastGen.toMillis() < 86400000) {
          return {
            success: false,
            error:
              "تم استخدام هذا الرابط من نفس الجهاز أو الشبكة خلال 24 ساعة. يرجى المحاولة غداً لتجنب الحظر.",
          };
        }
      }
    }

    const intentRef = adminDb.collection("userIntents").doc(`${userId}_${linkId}`);
    await intentRef.set({
      userId,
      linkId,
      startedAt: FieldValue.serverTimestamp(),
      status: "pending",
      ip,
      deviceId,
      userAgent,
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error initiating intent:", error);
    return { success: false, error: error.message };
  }
}

export async function generateRewardCode(
  idToken: string,
  linkId: string
): Promise<{ success: boolean; code?: string; error?: string }> {
  if (!idToken || !linkId) return { success: false, error: "Missing parameters" };

  const userId = await getUidFromToken(idToken);
  await assertRateLimit(`generate-code:${userId}:${linkId}`, 3, 60 * 1000);

  try {
    const generatedCode = await adminDb.runTransaction(async (transaction) => {
      // 1. Check intent BEFORE doing anything
      const intentRef = adminDb.collection("userIntents").doc(`${userId}_${linkId}`);
      const intentSnap = await transaction.get(intentRef);

      if (!intentSnap.exists) {
        throw new Error(
          "عملية غير صالحة. يجب عليك النقر على زر التخطي من الصفحة الرئيسية أولاً."
        );
      }

      const intentData = intentSnap.data();
      if (intentData?.status !== "pending") {
        throw new Error(
          "عذراً، الرابط غير صالح حالياً أو تم استخدامه للتخطي مسبقاً. يرجى البدء من الزر في الصفحة الرئيسية."
        );
      }

      // Ads usually take time. To be very strictly mathematically sure they didn't just paste right away:
      if (!intentData?.startedAt) {
        throw new Error("جلسة غير صالحة، يرجى إعادة البدء من الصفحة الرئيسية.");
      }

      const startedAtTime = intentData.startedAt.toMillis();
      const serverNow = Date.now();
      const timeDiffSeconds = (serverNow - startedAtTime) / 1000;

      // رفع المدة الزمنية إلى 15 ثانية لمنع البوتات والتخطي الوهمي السريع
      if (timeDiffSeconds < 15) {
        throw new Error(
          "النظام رصد محاولة تجاوز للرابط المختصر! يجب عليك الانتظار والمرور بصفحات الإعلان بشكل طبيعي."
        );
      }

      const claimId = `${userId}_${linkId}`;
      const claimRef = adminDb.collection("linkClaims").doc(claimId);

      const ip = intentData?.ip || "unknown";
      const deviceId = intentData?.deviceId || "unknown";

      const lockRefs = [claimRef];

      if (ip !== "unknown") {
        lockRefs.push(adminDb.collection("linkClaims").doc(`IP_${ip}_${linkId}`));
      }

      if (deviceId !== "unknown") {
        lockRefs.push(adminDb.collection("linkClaims").doc(`DEV_${deviceId}_${linkId}`));
      }

      const lockSnaps = await Promise.all(lockRefs.map((ref) => transaction.get(ref)));

      // Lock check across User, IP, and Device
      for (const snap of lockSnaps) {
        if (snap.exists) {
          const lastGen = snap.data()?.lastGeneratedAt;
          if (lastGen) {
            const timeDiff = Date.now() - lastGen.toMillis();
            if (timeDiff < 86400000) {
              const hoursLeft = Math.ceil((86400000 - timeDiff) / (1000 * 60 * 60));
              throw new Error(
                `لقد تم استخدام هذا الرابط من هذا الحساب أو الجهاز أو الشبكة. يرجى الانتظار ${hoursLeft} ساعة.`
              );
            }
          }
        }
      }

      // توليد كود فريد جداً مضافاً إليه بصمة زمنية فريدة تضمن عدم التكرار نهائياً
      const randomCode = generateRandomCode();
      const codeRef = adminDb.collection("rewardCodes").doc(randomCode);

      // نضع الفحص هنا مباشرة، ونادراً جداً ما سيتكرر كود عشوائي مكون من 8 رموز في نفس أجزاء الملي ثانية

      transaction.set(codeRef!, {
        code: randomCode,
        amount: 1,
        isUsed: false,
        generatedBy: userId,
        linkId: linkId,
        createdAt: FieldValue.serverTimestamp(),
      });

      const claimData = {
        userId,
        linkId,
        ip,
        deviceId,
        lastGeneratedAt: FieldValue.serverTimestamp(),
      };

      transaction.set(claimRef, claimData, { merge: true });

      if (ip !== "unknown") {
        transaction.set(
          adminDb.collection("linkClaims").doc(`IP_${ip}_${linkId}`),
          claimData,
          { merge: true }
        );
      }

      if (deviceId !== "unknown") {
        transaction.set(
          adminDb.collection("linkClaims").doc(`DEV_${deviceId}_${linkId}`),
          claimData,
          { merge: true }
        );
      }

      // Invalidate intent so it can't be reused for bypassed regeneration
      transaction.update(intentRef, {
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
      });

      return randomCode;
    });

    return { success: true, code: generatedCode };
  } catch (error: any) {
    console.error("Error in generateRewardCode:", error);
    return { success: false, error: error.message || "حدث خطأ غير متوقع" };
  }
}

export async function claimRewardCode(
  idToken: string,
  codeStr: string
): Promise<{ success: boolean; amount?: number; error?: string }> {
  if (!idToken || !codeStr) return { success: false, error: "Missing parameters" };

  const userId = await getUidFromToken(idToken);
  await assertRateLimit(`claim-code:${userId}`, 10, 60 * 1000);
  const parsedCode = codeStr
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (!/^[A-Z0-9]{8}$/.test(parsedCode)) {
    return { success: false, error: "Invalid code" };
  }

  try {
    const amount = await adminDb.runTransaction(async (transaction) => {
      const codeRef = adminDb.collection("rewardCodes").doc(parsedCode);
      const codeSnap = await transaction.get(codeRef);

      if (!codeSnap.exists) {
        throw new Error("عذراً، هذا الكود غير صحيح أو لا يوجد.");
      }

      const codeData = codeSnap.data();
      if (codeData?.isUsed) {
        throw new Error("عذراً، تم استخدام هذا الكود مسبقاً، يرجى الحصول على كود جديد.");
      }

      const userRef = adminDb.collection("users").doc(userId);
      const userSnap = await transaction.get(userRef);

      const amountToAdd = codeData?.amount || 1;

      transaction.update(codeRef, {
        isUsed: true,
        usedBy: userId,
        usedAt: FieldValue.serverTimestamp(),
      });

      transaction.set(
        userRef,
        {
          uid: userId,
          balance: FieldValue.increment(amountToAdd),
          updatedAt: FieldValue.serverTimestamp(),
          ...(userSnap.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        },
        { merge: true }
      );

      return amountToAdd;
    });

    return { success: true, amount };
  } catch (error: any) {
    console.error("Error in claimRewardCode:", error);
    return { success: false, error: error.message || "عذراً، حدث خطأ أثناء الاسترداد." };
  }
}
