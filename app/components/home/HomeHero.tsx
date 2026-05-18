"use client";

import React, { CSSProperties } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export const HomeHero = ({ user, signIn, style = {} }: { user: any, signIn: () => void, style?: CSSProperties }) => (
  <motion.section 
    key="hero"
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    style={style}
    className="mb-8 md:mb-12 bg-white shadow-sm border border-slate-100 p-6 sm:p-8 md:p-12 rounded-[24px] sm:rounded-[32px] relative overflow-hidden"
  >
    <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-50 rounded-full blur-3xl pointer-events-none" />
    
    <div className="max-w-2xl relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-right">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 tracking-tight">اربح رصيداً مجانياً يومياً!</h2>
        <p className="text-slate-500 text-base md:text-lg mb-6 sm:mb-8 leading-relaxed">
          تخطَ الرابط المختصر لاختبار سرعتك واحصل على كود بقيمة <strong className="text-blue-600">1$</strong> مجاناً كل 24 ساعة.
        </p>
        
        <button 
          onClick={async () => {
            if (!user) {
              toast.error("يجب تسجيل الدخول أولاً قبل تخطي الرابط.");
              signIn();
              return;
            }
            toast.loading("جاري تحضير الرابط السري...", { id: "intent-toast" });
            try {
              const { initiateClaimIntent } = await import("../../actions/rewards");
              const res = await initiateClaimIntent(user.uid, "daily_link_1");
              if (res.success) {
                toast.success("تم التوجيه نحو الرابط!", { id: "intent-toast" });
                window.location.href = "https://short-jambo.ink/Gate";
              } else if (res.error === "VPN_DETECTED") {
                toast.error("عذراً، محاولة الوصول مرفوضة لتفعيلك VPN أو Proxy. يرجى إيقافه والمحاولة مرة أخرى لحماية المعلنين.", { id: "intent-toast", duration: 8000 });
              } else {
                toast.error(res.error || "حدث خطأ في النظام.", { id: "intent-toast" });
              }
            } catch (e) {
              toast.error("تأكد من اتصالك بالإنترنت", { id: "intent-toast" });
            }
          }}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3.5 sm:py-4 rounded-2xl font-semibold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 text-base sm:text-lg w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 cursor-pointer"
        >
          احصل على الكود الآن
        </button>
      </div>
    </div>
  </motion.section>
);
