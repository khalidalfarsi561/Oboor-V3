"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../AuthProvider";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, LogIn, AlertCircle, Copy, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { generateRewardCode } from "../../actions/rewards";
import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../../lib/firebase/client";

export function SecretClient({ linkId, token }: { linkId: string, token: string }) {
  const router = useRouter();
  const { user, loading, signIn } = useAuth();
  
  const [status, setStatus] = useState<"checking" | "allowed" | "denied" | "generated">("checking");
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
    const EXPECTED_TOKEN = "jambo-secure-77X"; // You can change this later
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
      const result = await generateRewardCode(user.uid, linkId);
      
      if (!result.success || result.error) {
        setStatus("denied");
        if (result.error?.includes("النقر على زر التخطي")) {
          setErrorMessage("لا يمكنك الوصول المباشر لهذه الصفحة! يجب عليك البدء بالضغط على الزر من الصفحة الرئيسية لتخطي الرابط بشكل شرعي.");
        } else if (result.error?.includes("الرابط غير صالح حالياً")) {
          setErrorMessage("انتهت صلاحية الجلسة أو حاولت تكرار التخطي الوهمي. ارجع للصفحة الرئيسية وابدأ من جديد.");
        } else if (result.error?.includes("محاولة تجاوز")) {
          setErrorMessage("النظام رصد محاولة تجاوز أو تخطي غير منطقي للإعلانات بالرجوع السريع جداً! العب بإنصاف.");
        } else if (result.error === "VPN_DETECTED") {
          setErrorMessage("عذراً، محاولة الوصول مرفوضة لتفعيلك VPN أو Proxy. يرجى إيقافه والمحاولة مرة أخرى لحماية المعلنين.");
        } else {
          setErrorMessage(result.error || "حدث خطأ أثناء إصدار الكود.");
        }
        return;
      }
      
      setGeneratedCode(result.code!);
      setStatus("generated");
    } catch(err: unknown) {
      setStatus("denied");
      setErrorMessage(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
      console.error(err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success("تم نسخ الكود بنجاح!");
    
    // Kick user to main page
    setTimeout(() => {
      router.push("/");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-6" />
        <p className="text-slate-500 font-medium">التحقق من الاتصال الآمن...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto relative z-10">
      <AnimatePresence mode="wait">
        {!user ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 md:p-10 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)]"
          >
            <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
              <ShieldAlert className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-3">تسجيل الدخول مطلوب</h1>
            <p className="text-slate-500 mb-10 text-lg">
              لإكمال العملية وإنشاء الكود السري يجب أن تقوم بتسجيل الدخول لحسابك لتجنب الاحتيال.
            </p>
            <button
              onClick={signIn}
              className="w-full flex justify-center items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-lg transition-all"
            >
              <LogIn className="w-5 h-5 ml-2" />
              سجل الدخول فوراً
            </button>
          </motion.div>
        ) : (
          <motion.div
            key={status}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-100 rounded-[32px] p-6 sm:p-8 md:p-10 text-center shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] relative overflow-hidden"
          >
            {status === "checking" && (
              <div className="py-8 bg-white">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-6" />
                <h1 className="text-xl font-bold text-slate-900 mb-2">جاري التحقق...</h1>
              </div>
            )}

            {status === "allowed" && (
              <div className="py-4 bg-white">
                <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <CheckCircle2 className="w-10 h-10 text-green-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">نجاح التخطي!</h1>
                <p className="text-slate-500 mb-8">
                  أنت الآن مستعد لإنشاء الكود السري الخاص بك والذي يمنحك 1$ مجاناً!
                </p>
                <button
                  onClick={generateCode}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-lg"
                >
                  إنشاء الكود السري
                </button>
              </div>
            )}

            {status === "generated" && (
              <div className="py-4 bg-white">
                <h1 className="text-2xl font-bold text-slate-900 mb-2">تم إنشاء الكود بنجاح</h1>
                <p className="text-slate-500 mb-8">انسخ الكود ثم الصقه في الصفحة الرئيسية لاسترداد الرصيد.</p>
                
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-4 sm:p-6 mb-8 relative group">
                  <p className="text-3xl sm:text-4xl font-mono font-bold tracking-widest sm:tracking-[0.2em] text-slate-900 break-all">{generatedCode}</p>
                </div>

                <button
                  onClick={handleCopy}
                  className={`${copied ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-700'} w-full flex justify-center items-center gap-2 text-white px-8 py-4 rounded-2xl font-bold text-base sm:text-lg shadow-lg transition-colors`}
                >
                  {copied ? <CheckCircle2 className="w-6 h-6 ml-2" /> : <Copy className="w-6 h-6 ml-2" />}
                  {copied ? "تم النسخ بنجاح! سيتم تحويلك..." : "نسخ الكود والعودة"}
                </button>
              </div>
            )}

            {status === "denied" && (
              <div className="py-4 bg-white">
                <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <AlertCircle className="w-10 h-10 text-red-500" strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-4">تم الرفض</h1>
                <p className="text-slate-600 font-medium text-base sm:text-lg leading-relaxed text-balance text-red-600 bg-red-50 p-4 rounded-xl mb-6 break-words">
                  {errorMessage}
                </p>

                {errorMessage.includes("ساعة") && process.env.NODE_ENV === 'development' && (
                  <button 
                    onClick={async () => {
                      if (!user || !linkId) return;
                      await deleteDoc(doc(db, "linkClaims", `${user.uid}_${linkId}`));
                      window.location.reload();
                    }}
                    className="text-sm font-medium text-slate-400 hover:text-blue-600 transition-colors underline"
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
