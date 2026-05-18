"use server";

import { unstable_cache } from "next/cache";
import { adminDb } from "../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export const getStoreStock = unstable_cache(
  async () => {
    try {
      const snap = await adminDb.collection("storeItems").get();
      const stockMap: Record<number, number> = {};
      snap.docs.forEach((doc) => {
        stockMap[doc.data().itemId] = doc.data().stock;
      });
      return stockMap;
    } catch (err) {
      console.warn("Failed to fetch store inventory during build:", err);
      // Return empty map on build fail so build doesn't crash
      return {};
    }
  },
  ["store-items"],
  { tags: ["store-items"] }
);

export async function purchaseItem(userId: string, itemId: number, itemName: string, price: number) {
  if (!userId) throw new Error("يرجى تسجيل الدخول أولاً لتتمكن من الشراء.");

  await adminDb.runTransaction(async (transaction) => {
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists) throw new Error("المستخدم غير موجود.");
    const currentBalance = userSnap.data()?.balance || 0;

    if (currentBalance < price) {
      throw new Error("رصيد غير كافٍ.");
    }

    // Optional: check stock on server
    const stockDocs = await transaction.get(adminDb.collection("storeItems").where("itemId", "==", itemId));
    if (!stockDocs.empty) {
      const stockDoc = stockDocs.docs[0];
      const stock = stockDoc.data().stock;
      if (stock <= 0) {
         throw new Error("عذراً، هذا المنتج غير متوفر حالياً.");
      }
      transaction.update(stockDoc.ref, { stock: stock - 1 });
    }

    const newPurchaseRef = adminDb.collection("purchases").doc();
    transaction.set(newPurchaseRef, {
      userId,
      itemId,
      itemName,
      price,
      createdAt: FieldValue.serverTimestamp()
    });

    transaction.update(userRef, {
      balance: currentBalance - price
    });
  });
}

export async function toggleStockNotification(userId: string, itemId: number) {
  if (!userId) throw new Error("يرجى تسجيل الدخول.");
  
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
      createdAt: FieldValue.serverTimestamp()
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

export async function getStockNotificationMap(userId: string, itemIds: number[]) {
  if (!userId || !itemIds.length) return {};
  
  try {
    const snap = await adminDb.collection("stockNotifications")
      .where("userId", "==", userId)
      .where("itemId", "in", itemIds)
      .get();

    const map: Record<number, boolean> = {};
    snap.docs.forEach(doc => {
      map[doc.data().itemId] = true;
    });
    return map;
  } catch (err) {
    console.error("Error fetching notification map:", err);
    return {};
  }
}
