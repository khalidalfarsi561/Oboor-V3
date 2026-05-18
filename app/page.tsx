import React from "react";
import { getStoreStock } from "./actions/store";
import { HomeClient } from "./components/home/HomeClient";
import { getPublicSiteSettings } from "./lib/site-settings";

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [stockMap, siteSettings] = await Promise.all([
    getStoreStock(),
    getPublicSiteSettings()
  ]);
  
  return (
    <HomeClient 
      stockMap={stockMap} 
      layoutOrder={siteSettings.order} 
      design={siteSettings.design} 
    />
  );
}
