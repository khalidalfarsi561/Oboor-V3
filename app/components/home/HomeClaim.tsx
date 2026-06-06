"use client";

import React, { CSSProperties } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";
import { UI_MESSAGES } from "../../lib/messages";

export const HomeClaim = ({
  user,
  handleClaim,
  code,
  setCode,
  claiming,
  errorMsg,
  setErrorMsg,
  style = {},
}: {
  user: any;
  handleClaim: (e: React.FormEvent) => void;
  code: string;
  setCode: (val: string) => void;
  claiming: boolean;
  errorMsg: string;
  setErrorMsg: (val: string) => void;
  style?: CSSProperties;
}) => {
  if (!user) return null;
  return (
    <motion.section
      key="claim"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={style}
      className="mb-12 rounded-[24px] border border-slate-200 bg-slate-50 p-6 sm:rounded-[32px] sm:p-8 md:mb-20 md:p-10"
    >
      <div className="mx-auto max-w-xl text-center md:mx-0 md:text-right">
        <h2 className="font-inkbrush mb-2 text-xl font-bold text-slate-900 sm:mb-3 sm:text-2xl">
          {UI_MESSAGES.home.claimTitle}
        </h2>
        <p className="font-lotus text-slate-550 mb-6 text-lg md:text-base">
          {UI_MESSAGES.home.claimDesc}
        </p>

        <form onSubmit={handleClaim} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:gap-4">
            <input
              type="text"
              placeholder={UI_MESSAGES.home.claimInputPlaceholder}
              className={`w-full border bg-white ${errorMsg ? "border-red-400 focus:border-red-500 focus:ring-red-500/10" : "border-slate-200 focus:border-blue-600 focus:ring-blue-600/10"} rounded-2xl px-5 py-3.5 text-center font-mono text-lg tracking-widest text-slate-900 uppercase transition-all placeholder:text-slate-400 focus:ring-4 focus:outline-none focus-visible:ring-offset-1 sm:text-right`}
              value={code}
              maxLength={8}
              onChange={(e) => {
                const cleanCode = e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, "")
                  .slice(0, 8);

                setCode(cleanCode);
                setErrorMsg("");
              }}
            />
            <button
              type="submit"
              disabled={claiming || code.trim().length !== 8}
              className="flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-8 py-3.5 text-lg font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {claiming ? (
                <div aria-busy="true">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                UI_MESSAGES.home.claimButton
              )}
            </button>
          </div>
          {errorMsg && (
            <motion.div
              aria-live="polite"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50 p-3 font-medium text-red-600 sm:p-4"
            >
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-right text-sm md:text-base">{errorMsg}</p>
            </motion.div>
          )}
        </form>
      </div>
    </motion.section>
  );
};
