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
