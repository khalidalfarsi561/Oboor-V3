import { Package } from "lucide-react";

export type StoreItem = {
  id: number;
  name: string;
  price: number;
  iconColor: string;
};

// معرفات المنتجات الثابتة لمنع الأرقام السحرية في الكود
export const PRODUCT_IDS = {
  CAPCUT: 1,
  CANVA: 2,
} as const;

// المصفوفة المخصصة للـ Frontend لعرض المنتجات
export const ITEMS: StoreItem[] = [
  {
    id: PRODUCT_IDS.CAPCUT,
    name: "كاب كات برو لمدة 7 أيام",
    price: 2,
    iconColor: "text-blue-500",
  },
  {
    id: PRODUCT_IDS.CANVA,
    name: "كانفا برو لمدة 30 يوم",
    price: 2,
    iconColor: "text-purple-500",
  },
];

// ➕ إضافة: تحويل المصفوفة تلقائياً إلى خريطة (Map) لتسهيل العمليات في الخلفية (Backend) دون تكرار الأسعار
export const ITEMS_MAP: Record<number, StoreItem> = ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<number, StoreItem>
);

// ========================
// روابط الاختصار الديناميكية
// ========================

export type ShortLinkItem = {
  id: string;
  name: string;
  url: string;
  provider: string; // اسم موقع الاختصار لتمييزه
};

export const AVAILABLE_LINKS: ShortLinkItem[] = [
  {
    id: "link_gate_1",
    name: "الرابط الأول (بوابة جامبو)",
    url: "https://short-jambo.ink/Gate1",
    provider: "Jambo",
  },
  {
    id: "link_gate_2",
    name: "الرابط الثاني (موقع الاختصار الثاني)",
    url: "https://site-2.com/xyz123",
    provider: "ShrinkMe",
  },
  {
    id: "link_gate_3",
    name: "الرابط الثالث (موقع الاختصار الثالث)",
    url: "https://nitro-link.com/zh3eS",
    provider: "NitroLink",
  },
];