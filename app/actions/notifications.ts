"use server";

import { adminDb, adminAuth } from "../lib/firebase/admin";

async function getUidFromToken(idToken: string): Promise<string> {
  if (!idToken) throw new Error("غير مصرح.");
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}

export async function getUserNotifications(idToken: string) {
  if (!idToken) return [];

  const userId = await getUidFromToken(idToken);

  try {
    const snap = await adminDb
      .collection("userNotifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now(),
    }));
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
}

export async function markNotificationAsRead(idToken: string, notificationId: string) {
  if (!idToken || !notificationId) return { success: false };

  const userId = await getUidFromToken(idToken);

  try {
    const ref = adminDb.collection("userNotifications").doc(notificationId);
    const snap = await ref.get();
    if (snap.exists && snap.data()?.userId === userId) {
      await ref.update({ read: true });
    }
    return { success: true };
  } catch (err) {
    return { success: false };
  }
}
