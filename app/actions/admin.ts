"use server";

import { adminDb } from "../lib/firebase/admin";
import { revalidateTag } from "next/cache";

import { GoogleGenAI } from "@google/genai";

const ALLOWED_STYLE_PROPS = [
  "backgroundColor", "color", "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "borderRadius", "borderWidth", "borderColor", "borderStyle",
  "fontSize", "fontWeight", "letterSpacing", "lineHeight", "textAlign",
  "boxShadow", "opacity", "transform", "transition", "width", "height",
  "display", "flexDirection", "alignItems", "justifyContent", "gap"
];

export async function generateDesignPatch(
  elementId: string, 
  currentStyle: any, 
  userPrompt: string
): Promise<{ success: boolean; patch?: Record<string, any>; error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not configured on the server.");

    const ai = new GoogleGenAI({ apiKey });
    
    const aiPrompt = `You are an expert Frontend AI Stylist. 
Selected Element ID: ${elementId}
Current Style JSON: ${JSON.stringify(currentStyle)}
User Request: ${userPrompt}

Rules:
1. Return ONLY a valid JSON object representing the UPDATED style properties for this element.
2. Properties must be camelCase React-compatible CSS.
3. Only include these allowed properties: ${ALLOWED_STYLE_PROPS.join(", ")}.
4. Support Arabic RTL context.
5. Do NOT include Markdown code blocks, only the JSON.

Example: {"backgroundColor": "#ff0000", "borderRadius": "12px"}`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash", 
      contents: aiPrompt,
    });
    
    const responseText = response.text;
    if (!responseText) throw new Error("AI returned empty response");
    const rawJson = responseText.replace(/```json|```/g, "").trim();
    
    let patch;
    try {
      patch = JSON.parse(rawJson);
    } catch (e) {
      throw new Error("AI returned invalid JSON: " + responseText);
    }

    // Validation: Only allowed keys
    const sanitizedPatch: Record<string, any> = {};
    for (const key in patch) {
      if (ALLOWED_STYLE_PROPS.includes(key)) {
        sanitizedPatch[key] = patch[key];
      }
    }

    return { success: true, patch: sanitizedPatch };
  } catch (e: any) {
    console.error("AI Generation Error:", e);
    return { success: false, error: e.message };
  }
}

export async function askAdminAI(userPrompt: string, history?: any[]) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured.");

    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: userPrompt,
    });

    return { success: true, text: response.text || "" };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Cache the admin verification since it happens inside layout
export async function verifyServerAdmin(uid: string, email: string): Promise<boolean> {
  if (!uid || !email) return false;
  
  const adminRef = adminDb.collection('admins').doc(uid);
  const adminDoc = await adminRef.get();
  
  // Concrete security: only an existing doc in 'admins' allows entry.
  // BUT to bootstrap the owner (you), if the email is 'khalidalfarsi1995@gmail.com' 
  // and there's no admin doc yet, we create it to lock it down to you.
  if (adminDoc.exists) {
    return true;
  } else if (email === "khalidalfarsi1995@gmail.com") {
    // Bootstrap master admin
    await adminRef.set({ email, createdAt: new Date() });
    return true;
  }
  
  return false;
}

import { LayoutSectionId, DesignPatch } from "../lib/design";

export async function saveSiteSettings(layoutOrder: LayoutSectionId[], designSpecs?: Record<string, DesignPatch>): Promise<{success: boolean; error?: string}> {
  try {
    const data: { order: LayoutSectionId[], updatedAt: Date, design?: Record<string, DesignPatch> } = {
      order: layoutOrder,
      updatedAt: new Date(),
    };
    if (designSpecs) {
      data.design = designSpecs;
    }
    await adminDb.collection('settings').doc('layout').set(data, { merge: true });
    revalidateTag("site-settings");
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getDashboardStats() {
  const usersSnap = await adminDb.collection("users").count().get();
  const codesSnap = await adminDb.collection("rewardCodes").count().get();
  
  return {
    usersC: usersSnap.data().count,
    codesC: codesSnap.data().count
  };
}

export async function updateItemStock(itemId: number, newStock: number) {
  try {
    const stockDocs = await adminDb.collection("storeItems").where("itemId", "==", itemId).get();
    if (stockDocs.empty) {
      await adminDb.collection("storeItems").add({ itemId, stock: newStock });
    } else {
      await stockDocs.docs[0].ref.update({ stock: newStock });
    }

    // If stock became positive, "notify" users
    if (newStock > 0) {
      const subscriptions = await adminDb.collection("stockNotifications").where("itemId", "==", itemId).get();
      
      const batch = adminDb.batch();
      subscriptions.docs.forEach(doc => {
        const userId = doc.data().userId;
        const msgRef = adminDb.collection("userNotifications").doc();
        batch.set(msgRef, {
          userId,
          message: `المنتج الذي كنت تنتظره متوفر الآن!`,
          type: "stock_update",
          createdAt: new Date(),
          read: false
        });
        batch.delete(doc.ref);
      });
      await batch.commit();
    }

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
