import React from "react";
import { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { getStoreStock } from "./actions/store";
import { HomeClient } from "./components/home/HomeClient";
import { getPublicSiteSettings } from "./lib/site-settings";

export const metadata: Metadata = {
  title: "متجر المكافآت - الرئسية",
  description:
    "احصل على رصيد مجاني يومياً عن طريق تخطي الروابط المختصرة واسترداده فوراً في متجر المكافآت.",
};

// عمل كاش للإعدادات باستخدام التاج المخصص لها
const getCachedSiteSettings = unstable_cache(
  async () => getPublicSiteSettings(),
  ["public-site-settings"],
  { tags: ["site-settings"] }
);

// عمل كاش ديناميكي للمخزون لتسريع الموقع وتقليل قراءات قاعدة البيانات
const getCachedStoreStock = unstable_cache(
  async () => getStoreStock(),
  ["public-store-stock"],
  { tags: ["store-items"] } // نفس التاج المستخدم في الـ Action تماماً
);

export default async function HomePage() {
  const [stockMap, siteSettings] = await Promise.all([
    getCachedStoreStock(),
    getCachedSiteSettings(),
  ]);

  return (
    <HomeClient
      stockMap={stockMap}
      layoutOrder={siteSettings.order}
      design={siteSettings.design}
    />
  );
}
