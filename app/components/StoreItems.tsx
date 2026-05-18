"use client";

import React, { useState, useEffect, memo, CSSProperties } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";
import { ITEMS, StoreItem } from "../lib/data";
import { purchaseItem, getStockNotificationMap, toggleStockNotification } from "../actions/store";
import { StoreItemCard, StoreItemSkeleton } from "./StoreItemCard";

export const StoreItems = memo(function StoreItems({ balance, stockMap, style = {} }: { balance: number | null, stockMap: Record<number, number> | null, style?: CSSProperties }) {
  const { user } = useAuth();
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [notificationMap, setNotificationMap] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (user) {
      getStockNotificationMap(user.uid, ITEMS.map(it => it.id)).then(setNotificationMap);
    }
  }, [user]);

  const onToggleNotify = async (itemId: number) => {
    if (!user) return;
    try {
      const res = await toggleStockNotification(user.uid, itemId);
      setNotificationMap(prev => ({ ...prev, [itemId]: !!res.subscribed }));
      if (res.subscribed) {
        toast.success("سنقوم بإعلامك فور توفر المنتج مرة أخرى!");
      } else {
        toast.info("تم إلغاء التنبيه.");
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBuy = async (item: StoreItem) => {
    if (!stockMap || (stockMap[item.id] ?? 0) <= 0) {
      toast.error("عذراً، هذا المنتج غير متوفر حالياً.");
      return;
    }
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً لتتمكن من الشراء.");
      return;
    }
    if (balance === null || balance < item.price) {
      toast.error("عذراً، رصيدك غير كافٍ لإتمام عملية الشراء.", {
        icon: <div className="text-red-500 font-bold">X</div>
      });
      return;
    }

    setPurchasingId(item.id);
    try {
      await purchaseItem(user.uid, item.id, item.name, item.price);

      toast.success(`مبروك! تم شراء "${item.name}" بنجاح.`, {
        icon: <CheckCircle2 className="text-green-500 w-5 h-5" />
      });
    } catch (err: unknown) {
      console.error("Purchase error:", err);
      toast.error(err instanceof Error ? err.message : "حدث خطأ غير متوقع أثناء الشراء.");
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <section style={style}>
      <div className="flex items-center justify-between mb-10">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">المنتجات المتوفرة</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <AnimatePresence mode="popLayout">
          {!stockMap ? (
            Array.from({ length: ITEMS.length }).map((_, i) => (
              <StoreItemSkeleton key={`skeleton-${i}`} />
            ))
          ) : (
            ITEMS.map((item, i) => (
              <StoreItemCard 
                key={item.id}
                item={item}
                stock={stockMap[item.id] ?? 0}
                purchasingId={purchasingId}
                onBuy={handleBuy}
                index={i}
                isSubscribed={!!notificationMap[item.id]}
                onToggleNotify={() => onToggleNotify(item.id)}
              />
            ))
          )}
        </AnimatePresence>
    </div>
  </section>
  );
});
