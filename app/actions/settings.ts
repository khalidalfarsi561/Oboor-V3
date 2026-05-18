"use server";

import { getPublicSiteSettings } from "../lib/site-settings";
import { SiteSettings } from "../lib/design";

export async function getFullSiteSettings(): Promise<SiteSettings> {
  return await getPublicSiteSettings();
}
