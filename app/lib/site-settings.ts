import { adminDb } from "./firebase/admin";

export type LayoutSectionId = "hero" | "claim" | "store";

export const DEFAULT_LAYOUT_ORDER: LayoutSectionId[] = ["hero", "claim", "store"];
export const DEFAULT_DESIGN = {};

export async function getPublicSiteSettings() {
  try {
    const settingsSnap = await adminDb.collection("settings").doc("layout").get();
    if (settingsSnap.exists) {
      const data = settingsSnap.data();
      return {
        order: (data?.order as LayoutSectionId[]) || DEFAULT_LAYOUT_ORDER,
        design: data?.design || DEFAULT_DESIGN
      };
    }
  } catch (e) {
    console.error("Error fetching site settings:", e);
  }
  return { 
    order: DEFAULT_LAYOUT_ORDER, 
    design: DEFAULT_DESIGN 
  };
}
