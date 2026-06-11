"use client";

import React, { CSSProperties } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Link2 } from "lucide-react"; // أيقونة صغيرة وجميلة لعدد الروابط المتاحة
import { UI_MESSAGES } from "../../lib/messages";
import { AVAILABLE_LINKS } from "../../lib/data"; // جلب مصفوفة الروابط المجمعة

export const HomeHero = ({
  user,
  signIn,
  style = {},
}: {
  user: any;
  signIn: () => void;
  style?: CSSProperties;
}) => {
  // حساب عدد الروابط الإجمالي المتاحة في ملف الإعدادات
  const availableLinksCount = AVAILABLE_LINKS.length;

  return (
    <motion.section
      key="hero"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      style={style}
      className="relative mb-8 overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm sm:rounded-[32px] sm:p-8 md:mb-12 md:p-12"
    >
      {/* خلفية جمالية مدمجة بالصندوق */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-50 blur-3xl" />

      <div className="relative z-10 flex w-full flex-col items-center justify-between gap-8 text-center md:flex-row md:text-right">
        <div className="w-full">
          <h2 className="font-inkbrush mb-3 text-xl font-bold tracking-tight text-slate-900 md:text-3xl">
            {UI_MESSAGES.home.heroTitle}
          </h2>
          <p className="font-lotus mb-4 text-sm leading-relaxed text-slate-500 sm:mb-8 md:text-lg">
            {UI_MESSAGES.home.heroDescStart}
            <strong className="text-blue-600">1$</strong>
            {UI_MESSAGES.home.heroDescEnd}
          </p>

          {/* زر واحد مجمع لكل الروابط */}
          <div className="flex justify-center md:justify-start">
            <button
              onClick={async () => {
                if (!user) {
                  toast.error(UI_MESSAGES.errors.loginRequired);
                  signIn();
                  return;
                }

                toast.loading("جاري اختيار وتجهيز الرابط السري المتاح...", {
                  id: "intent-toast",
                });

                try {
                  const { initiateClaimIntent } = await import("../../actions/rewards");
                  const idToken = await user.getIdToken();

                  /* 💡 استراتيجية التجميع الذكي:
                    هنا نقوم باختيار رابط عشوائي دوري من المصفوفة لتقسيم الترافيك بالتساوي
                    بين كافة مواقع الاختصار الخاصة بك دون تشتيت العميل بأزرار متعددة.
                  */
                  const randomIndex = Math.floor(Math.random() * AVAILABLE_LINKS.length);
                  const selectedLink = AVAILABLE_LINKS[randomIndex];

                  // إرسال معرف الرابط المختار تلقائياً إلى السيرفر لفحص قفل الـ 24 ساعة له
                  const res = await initiateClaimIntent(idToken, selectedLink.id);

                  if (res.success) {
                    toast.success("تم التوجيه بنجاح!", { id: "intent-toast" });
                    const targetUrl = res.targetUrl || selectedLink.url;
                    window.location.href = targetUrl;
                  } else if (res.error === "VPN_DETECTED") {
                    toast.error(UI_MESSAGES.errors.vpnMessage, {
                      id: "intent-toast",
                      duration: 8000,
                    });
                  } else {
                    toast.error(res.error || "حدث خطأ في النظام.", {
                      id: "intent-toast",
                    });
                  }
                } catch (e) {
                  toast.error(UI_MESSAGES.errors.internetError, { id: "intent-toast" });
                }
              }}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto sm:py-4 sm:text-lg"
            >
              <span className="flex items-center justify-center pt-[3px] leading-none">
                {UI_MESSAGES.home.heroButton}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-4 flex w-fit items-center justify-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-3 py-1.5 text-slate-500 shadow-sm transition-all hover:bg-slate-100 md:absolute md:bottom-4 md:left-4 md:mx-0 md:mt-0">
        {/* حاوية الأيقونة لتثبيت الارتفاع */}
        <div className="flex items-center justify-center">
          <Link2 className="h-3.5 w-3.5 shrink-0 text-blue-500" />
        </div>

        {/* حاوية النص الموزونة والمحمية ضد الميلان */}
        <div className="flex h-full items-center justify-center">
          <span className="flex items-center justify-center pt-[3px] text-[11px] leading-none font-bold tracking-tight text-slate-600">
            الروابط المتاحة للتخطي :{" "}
            <strong className="flex items-center justify-center px-1 font-black text-blue-600">
              {availableLinksCount}
            </strong>
          </span>
        </div>
      </div>
    </motion.section>
  );
};
