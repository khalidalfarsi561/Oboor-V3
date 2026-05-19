"use client";

import React, { useState, useEffect, memo, CSSProperties } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";
import { ITEMS, StoreItem } from "../lib/data";
import {
  purchaseItem,
  getStockNotificationMap,
  toggleStockNotification,
} from "../actions/store";
import { StoreItemCard, StoreItemSkeleton } from "./StoreItemCard";

type PurchasedAccount = {
  email: string;
  password: string;
};

export const StoreItems = memo(function StoreItems({
  balance,
  stockMap,
  style = {},
}: {
  balance: number | null;
  stockMap: Record<number, number> | null;
  style?: CSSProperties;
}) {
  const { user } = useAuth();
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [notificationMap, setNotificationMap] = useState<Record<number, boolean>>({});
  const [purchasedAccount, setPurchasedAccount] = useState<PurchasedAccount | null>(null);

  useEffect(() => {
    if (user) {
      user.getIdToken().then((idToken) => {
        getStockNotificationMap(
          idToken,
          ITEMS.map((it) => it.id)
        ).then(setNotificationMap);
      });
    }
  }, [user]);

  const onToggleNotify = async (itemId: number) => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await toggleStockNotification(idToken, itemId);
      setNotificationMap((prev) => ({ ...prev, [itemId]: !!res.subscribed }));
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
        icon: <div className="font-bold text-red-500">X</div>,
      });
      return;
    }

    setPurchasingId(item.id);
    try {
      const idToken = await user.getIdToken();
      const res = await purchaseItem(idToken, item.id, item.name, item.price);

if (res?.account) {
  setPurchasedAccount(res.account);
}

      toast.success(`مبروك! تم شراء "${item.name}" بنجاح.`, {
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
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
      <div className="mb-6 flex items-center justify-between px-1 sm:mb-10 sm:px-0">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          المنتجات المتوفرة
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {!stockMap
            ? Array.from({ length: ITEMS.length }).map((_, i) => (
                <StoreItemSkeleton key={`skeleton-${i}`} />
              ))
            : ITEMS.map((item, i) => (
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
              ))}
        </AnimatePresence>
      </div>
      <AnimatePresence>
  {purchasedAccount && (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] border border-white/20 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">تم الشراء بنجاح</h3>
            <p className="mt-1 text-sm text-slate-500">
              هذه بيانات حساب كاب كات الخاص بك.
            </p>
          </div>

          <button
            onClick={() => setPurchasedAccount(null)}
            className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3" dir="ltr">
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-1 text-xs font-bold text-slate-400">EMAIL</p>
            <p className="break-all font-mono text-sm font-bold text-slate-900">
              {purchasedAccount.email}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-1 text-xs font-bold text-slate-400">PASSWORD</p>
            <p className="break-all font-mono text-sm font-bold text-slate-900">
              {purchasedAccount.password}
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            navigator.clipboard.writeText(
              `Email: ${purchasedAccount.email}\nPassword: ${purchasedAccount.password}`
            );
            toast.success("تم نسخ بيانات الحساب");
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 py-3.5 font-bold text-white transition hover:bg-slate-800"
        >
          <Copy className="h-4 w-4" />
          نسخ بيانات الحساب
        </button>
      </div>
    </div>
  )}
</AnimatePresence>
    </section>
  );
});
