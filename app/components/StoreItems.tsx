"use client";

import React, { useState, memo, CSSProperties } from "react";
import { AnimatePresence } from "framer-motion";
import { CheckCircle2, Copy, X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";
import { ITEMS, StoreItem } from "../lib/data";
import { purchaseItem, getUserPurchases, processCanvaPurchase } from "../actions/store";
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
  const [purchasedAccount, setPurchasedAccount] = useState<PurchasedAccount | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pastPurchases, setPastPurchases] = useState<PastPurchase[]>([]);
  const [canvaModalOpen, setCanvaModalOpen] = useState(false);
  const [capcutModalOpen, setCapcutModalOpen] = useState(false);
  const [customerCanvaEmail, setCustomerCanvaEmail] = useState("");
  const [canvaSubmitting, setCanvaSubmitting] = useState(false);

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
    // إذا كان المنتج غير متوفر أو ضغط على الدليل، نفتح النافذة الإرشادية بناءً على الـ ID
    if (!stockMap || (stockMap[item.id] ?? 0) <= 0) {
      if (item.id === 1) {
        setCapcutModalOpen(true);
      } else if (item.id === 2) {
        setCanvaModalOpen(true);
      }
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

      // أولاً: خصم الرصيد من محفظة العميل وتوثيق الفاتورة
      await purchaseItem(idToken, 2);

      // ثانياً: تسجيل التذكرة مباشرة في طابور الـ Firestore للـ VPS
      const res = await processCanvaPurchase(idToken, customerCanvaEmail.trim());

      if (res && res.success) {
        toast.success(
          "مبروك! تم حجز طلبك بنجاح، سيقوم متصفح السيرفر بتفعيل اشتراكك آلياً في أقل من دقيقة، تفقد بريدك الآن!",
          { id: "canva-buy", duration: 8000 }
        );
        setCanvaModalOpen(false);
        setCustomerCanvaEmail("");
      } else {
        throw new Error(res.error || "حدث خطأ أثناء حفظ تذكرة التفعيل.");
      }
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

      {/* 🎬 نافذة دليل استلام كاب كات برو */}
      <AnimatePresence>
        {capcutModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[32px] border border-white/20 bg-white p-6 shadow-2xl text-right" dir="rtl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">✨ دليل استلام كاب كات برو (7 أيام)</h3>
                  <p className="mt-1 text-xs text-slate-500">تفاصيل المنتج وآلية الاستلام الفوري بعد الشراء</p>
                </div>
                <button onClick={() => setCapcutModalOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm leading-relaxed text-slate-600">
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                  <p className="font-bold text-slate-800 mb-1">🎁 ماذا ستحصل عليه؟</p>
                  <ul className="list-disc list-inside space-y-1 text-xs text-slate-500 pr-2">
                    <li>الوصول الكامل لميزات البرو (الفلاتر، الانتقالات، والتأثيرات المدفوعة).</li>
                    <li>أدوات تعديل الصوت وتحسين الجودة المتقدمة بالذكاء الاصطناعي.</li>
                    <li>إزالة العلامة المائية وتصدير الفيديوهات بدقة عادية وعالية تصل إلى 4K.</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-blue-50/50 p-4 border border-blue-100/50">
                  <p className="font-bold text-blue-800 mb-1">📦 كيف ستستلم الحساب؟</p>
                  <p className="text-xs text-blue-700">
                    النظام لدينا مبرمج آلياً وفورياً! بمجرد شحن رصيدك والضغط على &ldquo;شراء الآن&rdquo;، ستظهر لك نافذة فورية على الشاشة تحتوي على (البريد الإلكتروني وكلمة المرور) مع زر لنسخ البيانات بضغطة واحدة لتسجيل الدخول في تطبيقك مباشرة.
                  </p>
                </div>
              </div>

              <button onClick={() => setCapcutModalOpen(false)} className="mt-5 w-full rounded-2xl bg-slate-900 py-3.5 font-bold text-white transition hover:bg-slate-800">
                فهمت ذلك
              </button>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* 🎨 نافذة طلب إيميل ودليل كانفا برو */}
      <AnimatePresence>
        {canvaModalOpen && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-[32px] border border-white/20 bg-white p-6 shadow-2xl text-right" dir="rtl">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900">🎨 تفعيل اشتراك كانفا برو (30 يوم)</h3>
                  <p className="mt-1 text-xs text-slate-500">سيتم ترقية حسابك الشخصي الحالي دون فقدان تصاميمك</p>
                </div>
                <button onClick={() => setCanvaModalOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-500 transition hover:bg-slate-200">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* الشرح للمشتري */}
              <div className="mb-4 rounded-2xl bg-purple-50/50 p-4 border border-purple-100/50 text-xs text-purple-800 leading-relaxed">
                <p className="font-bold mb-1">✨ مميزات التفعيل على حسابك الشخصي:</p>
                <li>الوصول لأكثر من 100 مليون قالب وعنصر وصورة مدفوعة.</li>
                <li>أداة إزالة الخلفيات الذكية وتغيير حجم التصاميم بضغطة زر.</li>
                <li>تنزيل التصاميم بأعلى جودة وخلفية شفافة تماماً للطباعة.</li>
              </div>

              <form onSubmit={handleCanvaSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500">البريد الإلكتروني لحسابك في كانفا:</label>
                  <input
                    type="email"
                    required
                    disabled={canvaSubmitting}
                    placeholder="example@gmail.com"
                    value={customerCanvaEmail}
                    onChange={(e) => setCustomerCanvaEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left font-mono text-sm text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 italic">💡 بعد التأكيد، تفقد بريدك الإلكتروني (صندوق الوارد أو الرسائل الترويجية) لتجد دعوة رسمية من Canva، اضغط &ldquo;قبول الدعوة&rdquo; لتفعيل البرو فوراً.</p>
                </div>

                <button type="submit" disabled={canvaSubmitting} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50">
                  {canvaSubmitting ? "جاري معالجة الدعوة..." : "تأكيد الشراء وإرسال الدعوة الآلية"}
                </button>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
});
