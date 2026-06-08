import { Package } from "lucide-react";

export type StoreItem = {
  id: number;
  name: string;
  price: number;
  iconColor: string;
};

// المصفوفة المخصصة للـ Frontend لعرض المنتجات
export const ITEMS: StoreItem[] = [
  { id: 1, name: "كاب كات برو لمدة 7 أيام", price: 2, iconColor: "text-blue-500" },
  { id: 2, name: "كانفا برو لمدة 30 يوم", price: 2, iconColor: "text-purple-500" },
];

// ➕ إضافة: تحويل المصفوفة تلقائياً إلى خريطة (Map) لتسهيل العمليات في الخلفية (Backend) دون تكرار الأسعار
export const ITEMS_MAP: Record<number, StoreItem> = ITEMS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<number, StoreItem>
);
