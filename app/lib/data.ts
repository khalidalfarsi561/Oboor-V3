import { Package } from "lucide-react";

export type StoreItem = {
  id: number;
  name: string;
  price: number;
  iconColor: string;
};

export const ITEMS: StoreItem[] = [
  { id: 1, name: "كاب كات برو لمدة 7 أيام", price: 2, iconColor: "text-blue-500" },
];
