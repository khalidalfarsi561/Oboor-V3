import { Package } from "lucide-react";

export type StoreItem = {
  id: number;
  name: string;
  price: number;
  iconColor: string;
};

export const ITEMS: StoreItem[] = [
  { id: 1, name: "كاب كات برو لمدة 7 أيام",  price: 2,  iconColor: "text-blue-500"  },
  { id: 2, name: "حساب نتفلكس 30 يوم",        price: 5,  iconColor: "text-red-500"   },
  { id: 3, name: "بطاقة هدايا أبل 10$",       price: 10, iconColor: "text-green-500" },
];
