"use client";

import React, { CSSProperties } from "react";
import { motion } from "framer-motion";
import { Loader2, AlertCircle } from "lucide-react";

export const HomeClaim = ({ user, handleClaim, code, setCode, claiming, errorMsg, setErrorMsg, style = {} }: { 
  user: any, 
  handleClaim: (e: React.FormEvent) => void,
  code: string,
  setCode: (val: string) => void,
  claiming: boolean,
  errorMsg: string,
  setErrorMsg: (val: string) => void,
  style?: CSSProperties
}) => {
  if(!user) return null;
  return (
    <motion.section 
      key="claim"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={style}
      className="mb-12 md:mb-20 bg-slate-50 border border-slate-200 p-6 sm:p-8 md:p-10 rounded-[24px] sm:rounded-[32px]"
    >
      <div className="max-w-xl mx-auto md:mx-0 text-center md:text-right">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2 sm:mb-3">هل لديك كود سري؟</h2>
        <p className="text-slate-500 text-sm md:text-base mb-6">
          أدخل الكود المكون من 8 رموز في الأسفل لاسترداد قيمة الكود وإضافته إلى رصيدك.
        </p>
        
        <form onSubmit={handleClaim} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4">
            <input
              type="text"
              placeholder="أدخل الكود (مثال: ABCD1234)"
              className={`w-full bg-white border ${errorMsg ? 'border-red-400 focus:ring-red-500/10 focus:border-red-500' : 'border-slate-200 focus:ring-blue-600/10 focus:border-blue-600'} rounded-2xl px-5 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus-visible:ring-offset-1 transition-all font-mono text-center sm:text-right text-lg tracking-widest uppercase`}
              value={code}
              maxLength={8}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setErrorMsg("");
              }}
            />
            <button
              type="submit"
              disabled={claiming || code.trim().length !== 8}
              className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-2xl font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
            >
              {claiming ? <div aria-busy="true"><Loader2 className="w-6 h-6 animate-spin" /></div> : "استرداد"}
            </button>
          </div>
          {errorMsg && (
            <motion.div aria-live="polite" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-600 bg-red-50 border border-red-100 p-3 sm:p-4 rounded-xl flex items-center gap-3 font-medium">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm md:text-base text-right">{errorMsg}</p>
            </motion.div>
          )}
        </form>
      </div>
    </motion.section>
  );
};
