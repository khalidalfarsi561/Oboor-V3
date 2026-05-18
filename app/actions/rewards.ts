"use server";

import { adminDb } from "../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import { headers, cookies } from "next/headers";

function generateRandomCode(): string {
  const array = new Uint8Array(6);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(36).padStart(2, '0'))
    .join('')
    .substring(0, 8)
    .toUpperCase();
}

async function getClientFraudData() {
  const headersList = await headers();
  // Vercel and edge providers set x-forwarded-for
  const xForwardedFor = headersList.get('x-forwarded-for');
  let ip = 'unknown';
  if (xForwardedFor) {
    ip = xForwardedFor.split(',')[0].trim();
  } else {
    ip = headersList.get('x-real-ip') || 'unknown';
  }

  const cookieStore = await cookies();
  let deviceId = cookieStore.get('device_fingerprint')?.value;
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    cookieStore.set('device_fingerprint', deviceId, { 
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
  }

  return { ip, deviceId };
}

async function detectVPN(ip: string): Promise<boolean> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.')) return false;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000); 

  try {
    const res = await fetch(`https://ip-api.com/json/${ip}?fields=proxy,hosting,status`, {
      signal: controller.signal,
      next: { revalidate: 3600 } 
    });
    
    if (!res.ok) return false;
    const data = await res.json();
    
    if (data.status !== "success") return false;
    return !!(data.proxy || data.hosting);
  } catch (err) {
    console.warn(`VPN detection failed for IP ${ip}:`, err);
    return false; 
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function initiateClaimIntent(userId: string, linkId: string): Promise<{ success: boolean; error?: string }> {
  if (!userId || !linkId) return { success: false, error: "Missing parameters" };

  try {
    const { ip, deviceId } = await getClientFraudData();

    if (await detectVPN(ip)) {
      return { success: false, error: "VPN_DETECTED" };
    }

    // Check pre-locks for IP and Device to prevent generating wasted intents
    const ipClaimRef = adminDb.collection("linkClaims").doc(`IP_${ip}_${linkId}`);
    const devClaimRef = adminDb.collection("linkClaims").doc(`DEV_${deviceId}_${linkId}`);
    
    const [ipSnap, devSnap] = await Promise.all([ipClaimRef.get(), devClaimRef.get()]);
    
    for (const snap of [ipSnap, devSnap]) {
      if (snap.exists) {
        const lastGen = snap.data()?.lastGeneratedAt;
        if (lastGen && (Date.now() - lastGen.toMillis() < 86400000)) {
           return { success: false, error: "تم استخدام هذا الرابط من نفس الجهاز أو الشبكة خلال 24 ساعة. يرجى المحاولة غداً لتجنب الحظر." };
        }
      }
    }

    const intentRef = adminDb.collection('userIntents').doc(`${userId}_${linkId}`);
    await intentRef.set({
      userId,
      linkId,
      startedAt: FieldValue.serverTimestamp(),
      status: 'pending',
      ip,
      deviceId
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error initiating intent:", error);
    return { success: false, error: error.message };
  }
}

export async function generateRewardCode(userId: string, linkId: string): Promise<{ success: boolean; code?: string; error?: string }> {
  if (!userId || !linkId) return { success: false, error: "Missing parameters" };

  try {
    const generatedCode = await adminDb.runTransaction(async (transaction) => {
      // 1. Check intent BEFORE doing anything
      const intentRef = adminDb.collection("userIntents").doc(`${userId}_${linkId}`);
      const intentSnap = await transaction.get(intentRef);

      if (!intentSnap.exists) {
        throw new Error("عملية غير صالحة. يجب عليك النقر على زر التخطي من الصفحة الرئيسية أولاً.");
      }

      const intentData = intentSnap.data();
      if (intentData?.status !== 'pending') {
        throw new Error("عذراً، الرابط غير صالح حالياً أو تم استخدامه للتخطي مسبقاً. يرجى البدء من الزر في الصفحة الرئيسية.");
      }

      // Ads usually take time. To be very strictly mathematically sure they didn't just paste right away:
      const startedAtTime = intentData?.startedAt?.toMillis() || Date.now();
      const timeDiffSeconds = (Date.now() - startedAtTime) / 1000;
      
      // Assume at least 5 seconds are physically needed to click through the ad
      if (timeDiffSeconds < 5) {
        throw new Error("النظام رصد محاولة تجاوز للرابط المختصر! يجب عليك الانتظار والمرور بصفحات الإعلان بشكل طبيعي.");
      }

      const claimId = `${userId}_${linkId}`;
      const claimRef = adminDb.collection("linkClaims").doc(claimId);
      
      const ip = intentData?.ip || "unknown";
      const deviceId = intentData?.deviceId || "unknown";
      const ipClaimRef = adminDb.collection("linkClaims").doc(`IP_${ip}_${linkId}`);
      const devClaimRef = adminDb.collection("linkClaims").doc(`DEV_${deviceId}_${linkId}`);

      const claimSnap = await transaction.get(claimRef);
      const ipSnap = await transaction.get(ipClaimRef);
      const devSnap = await transaction.get(devClaimRef);

      // Lock check across User, IP, and Device
      for (const snap of [claimSnap, ipSnap, devSnap]) {
        if (snap.exists) {
          const lastGen = snap.data()?.lastGeneratedAt;
          if (lastGen) {
            const timeDiff = Date.now() - lastGen.toMillis();
            if (timeDiff < 86400000) {
              const hoursLeft = Math.ceil((86400000 - timeDiff) / (1000 * 60 * 60));
              throw new Error(`لقد تم استخدام هذا الرابط من هذا الحساب أو الجهاز أو الشبكة. يرجى الانتظار ${hoursLeft} ساعة.`);
            }
          }
        }
      }

      const randomCode = generateRandomCode();
      const codeRef = adminDb.collection("rewardCodes").doc(randomCode);
      const codeSnap = await transaction.get(codeRef);

      if (codeSnap.exists) {
        throw new Error("حدث تضارب، يرجى المحاولة مرة أخرى");
      }

      transaction.set(codeRef, {
        code: randomCode,
        amount: 1,
        isUsed: false,
        generatedBy: userId,
        linkId: linkId,
        createdAt: FieldValue.serverTimestamp()
      });

      const claimData = {
        userId,
        linkId,
        ip,
        deviceId,
        lastGeneratedAt: FieldValue.serverTimestamp()
      };

      transaction.set(claimRef, claimData, { merge: true });
      transaction.set(ipClaimRef, claimData, { merge: true });
      if (deviceId !== 'unknown') {
        transaction.set(devClaimRef, claimData, { merge: true });
      }

      // Invalidate intent so it can't be reused for bypassed regeneration
      transaction.update(intentRef, {
        status: 'completed',
        completedAt: FieldValue.serverTimestamp()
      });

      return randomCode;
    });
    
    return { success: true, code: generatedCode };
  } catch (error: any) {
    console.error("Error in generateRewardCode:", error);
    return { success: false, error: error.message || "حدث خطأ غير متوقع" };
  }
}

export async function claimRewardCode(userId: string, codeStr: string): Promise<{ success: boolean; amount?: number; error?: string }> {
  if (!userId || !codeStr) return { success: false, error: "Missing parameters" };
  const parsedCode = codeStr.trim().toUpperCase();
  if (parsedCode.length !== 8) return { success: false, error: "Invalid code" };

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

      let newBalance = codeData?.amount || 1;
      if (userSnap.exists) {
        newBalance += userSnap.data()?.balance || 0;
      } else {
         // Should be bootstrapped, but fallback just in case
         transaction.set(userRef, { uid: userId, balance: 0, createdAt: FieldValue.serverTimestamp() });
      }

      transaction.update(codeRef, {
        isUsed: true,
        usedBy: userId
      });

      transaction.update(userRef, {
        balance: newBalance
      });

      return codeData?.amount || 1;
    });

    return { success: true, amount };
  } catch (error: any) {
    console.error("Error in claimRewardCode:", error);
    return { success: false, error: error.message || "عذراً، حدث خطأ أثناء الاسترداد." };
  }
}
