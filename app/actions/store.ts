"use server";

import { adminDb, adminAuth } from "../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

async function getUidFromToken(idToken: string): Promise<string> {
  if (!idToken) throw new Error("غير مصرح.");
  const decoded = await adminAuth.verifyIdToken(idToken);
  return decoded.uid;
}

export async function getStoreStock() {
  try {
    const snap = await adminDb
      .collection("capcutAccounts")
      .where("status", "==", "available")
      .count()
      .get();

    return { 1: snap.data().count };
  } catch (err) {
    console.warn("Failed to fetch CapCut inventory:", err);
    return { 1: 0 };
  }
}

const STORE_ITEMS: Record<number, { name: string; price: number }> = {
  1: {
    name: "CapCut Pro Account",
    price: 1,
  },
};

export async function purchaseItem(idToken: string, itemId: number) {
  const userId = await getUidFromToken(idToken);

  const item = STORE_ITEMS[itemId];

  if (!item) {
    throw new Error("منتج غير مدعوم حالياً.");
  }

  const itemName = item.name;
  const price = item.price;

  const purchasedAccount = await adminDb.runTransaction(async (transaction) => {
    const userRef = adminDb.collection("users").doc(userId);
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists) throw new Error("المستخدم غير موجود.");
    const currentBalance = userSnap.data()?.balance || 0;

    if (currentBalance < price) {
      throw new Error("رصيد غير كافٍ.");
    }

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
      email: accountDoc.data().email || "",
      password: accountDoc.data().password || "",
    };
  });

  return {
    success: true,
    account: purchasedAccount,
  };
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
