"use server";

import { adminDb } from "../lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function bootstrapUser(uid: string) {
  if (!uid) throw new Error("Missing UID");
  
  const userRef = adminDb.collection("users").doc(uid);
  const userSnap = await userRef.get();
  
  if (!userSnap.exists) {
    await userRef.set({
      uid,
      balance: 0,
      createdAt: FieldValue.serverTimestamp(),
    });
  }
}
