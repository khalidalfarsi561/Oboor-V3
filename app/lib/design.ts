import { CSSProperties } from "react";

export type LayoutSectionId = "hero" | "claim" | "store" | "nav";

export type EditableElementId = 
  | "brand" | "brand_text" | "brand_desktop" | "accent_text" | "icon_bg" 
  | "nav" | "login_btn" | "login_btn_mobile" | "wallet" | "wallet_mobile" | "wallet_icon"
  | "admin_btn" | "logout_btn";

export interface DesignPatch {
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  borderRadius?: string;
  padding?: string;
  margin?: string;
  fontFamily?: string;
  [key: string]: any;
}

export interface SiteSettings {
  order: LayoutSectionId[];
  design: Record<string, DesignPatch>;
}

export function mapDesignPatchToStyle(patch: DesignPatch): CSSProperties {
  const style: Record<string, any> = {};
  
  if (patch.backgroundColor) style.backgroundColor = patch.backgroundColor;
  if (patch.color) style.color = patch.color;
  if (patch.fontSize) style.fontSize = patch.fontSize;
  if (patch.borderRadius) style.borderRadius = patch.borderRadius;
  if (patch.padding) style.padding = patch.padding;
  if (patch.margin) style.margin = patch.margin;
  if (patch.fontFamily) style.fontFamily = patch.fontFamily;
  
  // Add other properties if needed
  Object.keys(patch).forEach(key => {
    if (!style[key]) style[key] = patch[key];
  });

  return style as CSSProperties;
}
