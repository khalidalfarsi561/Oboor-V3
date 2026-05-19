import { adminDb } from "./firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function assertRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const ref = adminDb.collection("rateLimits").doc(key);

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.data();

    if (!snap.exists || now - data!.windowStart > windowMs) {
      tx.set(ref, {
        count: 1,
        windowStart: now,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return;
    }

    if (data!.count >= limit) {
      throw new Error("طلبات كثيرة جداً، حاول لاحقاً.");
    }

    tx.update(ref, {
      count: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
}
