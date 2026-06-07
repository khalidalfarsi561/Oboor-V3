"use client";

import React, { useState, useEffect, memo, CSSProperties } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";
import { ITEMS, StoreItem } from "../lib/data";
import { Package } from "lucide-react";
import {
  purchaseItem,
  getStockNotificationMap,
  toggleStockNotification,
  getUserPurchases,
} from "../actions/store";
import { StoreItemCard, StoreItemSkeleton } from "./StoreItemCard";
import { UI_MESSAGES } from "../lib/messages";

type PurchasedAccount = {
  email: string;
  password: string;
};

type PastPurchase = {
  id: string;
  itemName: string;
  createdAt: number;
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
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pastPurchases, setPastPurchases] = useState<PastPurchase[]>([]);
  const [canvaModalOpen, setCanvaModalOpen] = useState(false);
  const [customerCanvaEmail, setCustomerCanvaEmail] = useState("");
  const [canvaSubmitting, setCanvaSubmitting] = useState(false);

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
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ غير متوقع.");
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await getUserPurchases(idToken);
      if (res.success && res.purchases) {
        setPastPurchases(res.purchases);
        setHistoryOpen(true);
      } else {
        toast.error(res.error || UI_MESSAGES.store.historyFetchError);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    }
  };

  const handleBuy = async (item: StoreItem) => {
    if (!stockMap || (stockMap[item.id] ?? 0) <= 0) {
      toast.error(UI_MESSAGES.store.outOfStock);
      return;
    }
    if (!user) {
      toast.error(UI_MESSAGES.store.loginRequiredToBuy);
      return;
    }
    if (balance === null || balance < item.price) {
      toast.error(UI_MESSAGES.store.insufficientBalance, {
        icon: <div className="font-bold text-red-500">X</div>,
      });
      return;
    }

    // إذا كان المنتج المختار هو كانفا (id: 2)، نفتح نافذة طلب الإيميل فوراً
    if (item.id === 2) {
      setCanvaModalOpen(true);
      return;
    }

    // شراء المنتجات العادية ذات الحسابات الجاهزة (كاب كات)
    setPurchasingId(item.id);
    try {
      const idToken = await user.getIdToken();
      const res = await purchaseItem(idToken, item.id);

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

  // دالة معالجة شراء وإرسال دعوة كانفا التلقائية
  const handleCanvaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerCanvaEmail.trim() || !customerCanvaEmail.includes("@")) {
      toast.error("يرجى إدخال بريد إلكتروني صحيح.");
      return;
    }

    if (!user) {
      toast.error("يجب تسجيل الدخول أولاً.");
      return;
    }

    setCanvaSubmitting(true);
    toast.loading("جاري حجز رصيدك وإرسال دعوة كانفا برو آلياً...", { id: "canva-buy" });

    try {
      const idToken = await user.getIdToken();

      // أولاً: خصم الرصيد وتنفيذ عملية الشراء الهيكلية عبر الـ Backend الأساسي للمتجر
      await purchaseItem(idToken, 2);

      // ثانياً: استدعاء سكريبت السيرفر التلقائي لحقن الكوكيز وإرسال الدعوة إلى إيميل العميل فوراً
      const { processCanvaPurchase } = await import("../actions/store");
      const inviteRes = await processCanvaPurchase(idToken, customerCanvaEmail.trim());

      // نجاح — processCanvaPurchase يرمي خطأ إذا فشل، ولا يعيد إلا { success: true }
      toast.success(
        "مبروك! نجحت العملية، تفقد بريدك الإلكتروني الآن (صندوق الوارد أو السبام) لتفعيل الاشتراك.",
        { id: "canva-buy", duration: 8000 }
      );
      setCanvaModalOpen(false);
      setCustomerCanvaEmail("");
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء معالجة الطلب.", { id: "canva-buy" });
    } finally {
      setCanvaSubmitting(false);
    }
  };

  return (
    <section style={style}>
      <div className="mb-6 flex items-center justify-between px-1 sm:mb-10 sm:px-0">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {UI_MESSAGES.home.storeTitle}
        </h2>
        {user && (
          <button
            onClick={fetchHistory}
            className="cursor-pointer rounded-xl bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100"
          >
            {UI_MESSAGES.home.storeHistoryButton}
          </button>
        )}
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
                  <p className="font-mono text-sm font-bold break-all text-slate-900">
                    {purchasedAccount.email}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="mb-1 text-xs font-bold text-slate-400">PASSWORD</p>
                  <p className="font-mono text-sm font-bold break-all text-slate-900">
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

      <AnimatePresence>
        {historyOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-[32px] border border-white/20 bg-white p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-black text-slate-900">حساباتي المشتراة</h3>
                <button
                  onClick={() => setHistoryOpen(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-slate-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4" dir="ltr">
                {pastPurchases.length === 0 ? (
                  <p className="py-4 text-center text-sm text-slate-400">
                    لم تقم بأي عمليات شراء بعد.
                  </p>
                ) : (
                  pastPurchases.map((p) => (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left"
                    >
                      <p
                        className="mb-2 text-right text-xs font-bold text-slate-400"
                        dir="rtl"
                      >
                        {p.itemName}
                      </p>
                      <p className="mb-2 text-[10px] text-slate-400">
                        EMAIL:{" "}
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {p.email}
                        </span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        PASSWORD:{" "}
                        <span className="font-mono text-xs font-bold text-slate-900">
                          {p.password}
                        </span>
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* نافذة طلب إيميل كانفا التلقائي */}
      <AnimatePresence>
        {canvaModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[32px] border border-white/20 bg-white p-6 shadow-2xl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-2xl font-black text-slate-900">
                    تفعيل اشتراك Canva Pro
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    أدخل إيميلك الشخصي الذي تستخدمه في كانفا لتصلك دعوة الانضمام للفريق
                    آلياً.
                  </p>
                </div>
                <button
                  onClick={() => setCanvaModalOpen(false)}
                  className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCanvaSubmit} className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <label className="mb-2 block text-xs font-bold text-slate-500">
                    البريد الإلكتروني للعميل
                  </label>
                  <input
                    type="email"
                    required
                    disabled={canvaSubmitting}
                    placeholder="example@gmail.com"
                    value={customerCanvaEmail}
                    onChange={(e) => setCustomerCanvaEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-mono text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={canvaSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {canvaSubmitting
                    ? "جاري معالجة الدعوة..."
                    : "تأكيد الشراء وإرسال الدعوة"}
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
});
