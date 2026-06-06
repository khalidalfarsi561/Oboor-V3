"use client";

import React, { CSSProperties } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { UI_MESSAGES } from "../../lib/messages";

export const HomeHero = ({
  user,
  signIn,
  style = {},
}: {
  user: any;
  signIn: () => void;
  style?: CSSProperties;
}) => (
  <motion.section
    key="hero"
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    style={style}
    className="relative mb-8 overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm sm:rounded-[32px] sm:p-8 md:mb-12 md:p-12"
  >
    <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-50 blur-3xl" />

    <div className="relative z-10 flex w-full flex-col items-center justify-between gap-8 text-center md:flex-row md:text-right">
      <div>
        <h2 className="font-inkbrush mb-3 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {UI_MESSAGES.home.heroTitle}
        </h2>
        <p className="mb-6 text-base leading-relaxed text-slate-500 sm:mb-8 md:text-lg">
          {UI_MESSAGES.home.heroDescStart}
          <strong className="text-blue-600">1$</strong>
          {UI_MESSAGES.home.heroDescEnd}
        </p>

        <button
          onClick={async () => {
            if (!user) {
              toast.error(UI_MESSAGES.errors.loginRequired);
              signIn();
              return;
            }
            toast.loading("جاري تحضير الرابط السري...", { id: "intent-toast" });
            try {
              const { initiateClaimIntent } = await import("../../actions/rewards");
              const idToken = await user.getIdToken();
              const res = await initiateClaimIntent(idToken, "daily_link_1");
              if (res.success) {
                toast.success("تم التوجيه نحو الرابط!", { id: "intent-toast" });
                window.location.href = "https://short-jambo.ink/Gate1";
              } else if (res.error === "VPN_DETECTED") {
                toast.error(UI_MESSAGES.errors.vpnMessage, {
                  id: "intent-toast",
                  duration: 8000,
                });
              } else {
                toast.error(res.error || "حدث خطأ في النظام.", { id: "intent-toast" });
              }
            } catch (e) {
              toast.error(UI_MESSAGES.errors.internetError, { id: "intent-toast" });
            }
          }}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 focus-visible:outline-none sm:w-auto sm:py-4 sm:text-lg"
        >
          {UI_MESSAGES.home.heroButton}
        </button>
      </div>
    </div>
  </motion.section>
);
