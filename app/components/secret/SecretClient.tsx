"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  LogIn,
  AlertCircle,
  Copy,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateRewardCode } from "../../actions/rewards";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase/client";

export function SecretClient({ linkId, token }: { linkId: string; token: string }) {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();

  const [status, setStatus] = useState<"checking" | "allowed" | "denied" | "generated">(
    "checking"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return; // UI will show login button

    if (!linkId) {
      setTimeout(() => {
        setStatus("denied");
        setErrorMessage("هذا الرابط غير صالح أو مفقود المعرّف.");
      }, 0);
      return;
    }

    // Basic security token to prevent users from bypassing the shortlink by sharing the final target URL
    const EXPECTED_TOKEN = process.env.NEXT_PUBLIC_JAMBO_TOKEN || "jambo-secure-77X";
    if (token !== EXPECTED_TOKEN) {
      setTimeout(() => {
        setStatus("denied");
        setErrorMessage("عذراً، محاولة وصول غير مصرّح بها. يرجى استخدام الرابط الأساسي.");
      }, 0);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("allowed");
  }, [user, loading, linkId, token]);

  const generateCode = async () => {
    if (!user || !linkId || status !== "allowed") return;

    try {
      setStatus("checking");
      const idToken = await user.getIdToken();
      const result = await generateRewardCode(idToken, linkId);

      if (!result.success || result.error) {
        setStatus("denied");
        if (result.error?.includes("النقر على زر التخطي")) {
          setErrorMessage(
            "لا يمكنك الوصول المباشر لهذه الصفحة! يجب عليك البدء بالضغط على الزر من الصفحة الرئيسية لتخطي الرابط بشكل شرعي."
          );
        } else if (result.error?.includes("الرابط غير صالح حالياً")) {
          setErrorMessage(
            "انتهت صلاحية الجلسة أو حاولت تكرار التخطي الوهمي. ارجع للصفحة الرئيسية وابدأ من جديد."
          );
        } else if (result.error?.includes("محاولة تجاوز")) {
          setErrorMessage(
            "النظام رصد محاولة تجاوز أو تخطي غير منطقي للإعلانات بالرجوع السريع جداً! العب بإنصاف."
          );
        } else if (result.error === "VPN_DETECTED") {
          setErrorMessage(
            "عذراً، محاولة الوصول مرفوضة لتفعيلك VPN أو Proxy. يرجى إيقافه والمحاولة مرة أخرى لحماية المعلنين."
          );
        } else {
          setErrorMessage(result.error || "حدث خطأ أثناء إصدار الكود.");
        }
        return;
      }

      setGeneratedCode(result.code!);
      setStatus("generated");
    } catch (err: unknown) {
      setStatus("denied");
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
      console.error(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("تم نسخ الكود بنجاح! سيتم تطبيق المكافأة تلقائياً.");

    // نقوم بتمرير الكود في الرابط حتى تلتقطه الصفحة الرئيسية فوراً
    setTimeout(() => {
      router.push(`/?autoClaim=${generatedCode}`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="mb-6 h-10 w-10 animate-spin text-blue-600" />
        <p className="font-medium text-slate-500">التحقق من الاتصال الآمن...</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 mx-auto w-full max-w-lg">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-[32px] border border-slate-100 bg-white p-6 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] sm:p-8 md:p-10"
          >
            <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50">
              <ShieldAlert className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="mb-3 text-2xl font-bold text-slate-900">تسجيل الدخول مطلوب</h1>
            <p className="mb-10 text-lg text-slate-500">
              لإكمال العملية وإنشاء الكود السري يجب أن تقوم بتسجيل الدخول لحسابك لتجنب
              الاحتيال.
            </p>
            <button
              onClick={signIn}
              className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:bg-blue-700"
            >
              <LogIn className="ml-2 h-5 w-5" />
              سجل الدخول فوراً
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-6 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] sm:p-8 md:p-10"
          >
            {status === "checking" && (
              <div className="bg-white py-8">
                <Loader2 className="mx-auto mb-6 h-12 w-12 animate-spin text-blue-600" />
                <h1 className="mb-2 text-xl font-bold text-slate-900">جاري التحقق...</h1>
              </div>
            )}

            {status === "allowed" && (
              <div className="bg-white py-4">
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-green-50">
                  <CheckCircle2 className="h-10 w-10 text-green-500" />
                </div>
                <h1 className="mb-2 text-2xl font-bold text-slate-900">نجاح التخطي!</h1>
                <p className="mb-8 text-slate-500">
                  أنت الآن مستعد لإنشاء الكود السري الخاص بك والذي يمنحك 1$ مجاناً!
                </p>
                <button
                  onClick={generateCode}
                  className="w-full rounded-2xl bg-slate-900 px-8 py-4 text-lg font-bold text-white shadow-lg hover:bg-slate-800"
                >
                  إنشاء الكود السري
                </button>
              </div>
            )}

            {status === "generated" && (
              <div className="bg-white py-4">
                <h1 className="mb-2 text-2xl font-bold text-slate-900">
                  تم إنشاء الكود بنجاح
                </h1>
                <p className="mb-8 text-slate-500">
                  انسخ الكود ثم الصقه في الصفحة الرئيسية لاسترداد الرصيد.
                </p>

                <div className="group relative mb-8 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 sm:p-6">
                  <p className="font-mono text-3xl font-bold tracking-widest break-all text-slate-900 sm:text-4xl sm:tracking-[0.2em]">
                    {generatedCode}
                  </p>
                </div>

                <button
                  onClick={handleCopy}
                  className={`${copied ? "bg-green-500" : "bg-blue-600 hover:bg-blue-700"} flex w-full items-center justify-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-lg transition-colors sm:text-lg`}
                >
                  {copied ? (
                    <CheckCircle2 className="ml-2 h-6 w-6" />
                  ) : (
                    <Copy className="ml-2 h-6 w-6" />
                  )}
                  {copied ? "تم النسخ بنجاح! سيتم تحويلك..." : "نسخ الكود والعودة"}
                </button>
              </div>
            )}

            {status === "denied" && (
              <div className="bg-white py-4">
                <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
                  <AlertCircle className="h-10 w-10 text-red-500" strokeWidth={2.5} />
                </div>
                <h1 className="mb-4 text-2xl font-bold text-slate-900">
                  تم تعليق الوصول
                </h1>
                <p className="mb-6 rounded-xl bg-red-50 p-4 text-sm leading-relaxed font-medium text-red-600 sm:text-base">
                  {errorMessage}
                </p>

                {errorMessage.includes("VPN") ? (
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full rounded-2xl bg-blue-600 px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-blue-700"
                  >
                    أغلقت الـ VPN، أعد الفحص الآن
                  </button>
                ) : (
                  <button
                    onClick={() => router.push("/")}
                    className="w-full rounded-2xl bg-slate-950 px-8 py-3.5 text-base font-bold text-white shadow-md transition-colors hover:bg-slate-800"
                  >
                    العودة للرئيسية
                  </button>
                )}

                {errorMessage.includes("ساعة") &&
                  process.env.NODE_ENV === "development" && (
                    <button
                      onClick={async () => {
                        if (!user || !linkId) return;
                        await deleteDoc(doc(db, "linkClaims", `${user.uid}_${linkId}`));
                        window.location.reload();
                      }}
                      className="mx-auto mt-4 block text-sm font-medium text-slate-400 underline transition-colors hover:text-blue-600"
                    >
                      🛠️ مطور: إعادة تعيين قفل الـ 24 ساعة للتجربة
                    </button>
                  )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
