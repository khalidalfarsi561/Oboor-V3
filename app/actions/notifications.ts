"use server";

import { adminDb } from "../lib/firebase/admin";

export async function getUserNotifications(userId: string) {
  if (!userId) return [];
  try {
    const snap = await adminDb.collection("userNotifications")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();
      
    return snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toMillis() || Date.now()
    }));
  } catch (err) {
    console.error("Error fetching notifications:", err);
    return [];
  }
}

export async function markNotificationAsRead(userId: string, notificationId: string) {
  if (!userId || !notificationId) return { success: false };
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
