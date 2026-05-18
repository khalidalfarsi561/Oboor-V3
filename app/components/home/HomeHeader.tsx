"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, LogIn, LogOut, Gift } from "lucide-react";
import Link from "next/link";
import { NotificationCenter } from "../NotificationCenter";
import { UserAvatar } from "../UserAvatar";
import { DesignPatch, mapDesignPatchToStyle } from "../../lib/design";

interface HomeHeaderProps {
  user: any;
  balance: number | null;
  signIn: () => void;
  signOut: () => void;
  design: Record<string, DesignPatch>;
}

export function HomeHeader({ user, balance, signIn, signOut, design }: HomeHeaderProps) {
  const getStyle = (id: string) => mapDesignPatchToStyle(design[id] || {});
  
  // Placeholder for the logo URL - user can replace this
  const LOGO_URL = "https://i.ibb.co/qYVNPk3z/202604212003.jpg"; // Replace with real logo URL

  return (
    <header className="flex flex-row items-center justify-between mb-8 md:mb-16 group/nav px-4 sm:px-0" style={getStyle("nav")}>
      {/* Sign In Section - Exact match for image for mobile */}
      <div className="flex flex-row items-center order-1 md:order-2">
        {user ? (
          <div className="flex items-center gap-2">
            {/* Minimal Mobile view for logged in user */}
            <div className="md:hidden flex items-center gap-2">
               <UserAvatar src={user.photoURL} alt={user.displayName} size={32} />
               <button
                  onClick={signOut}
                  className="bg-red-500/10 text-red-600 px-3 py-1 rounded-lg text-xs font-bold"
               >
                  خروج
               </button>
            </div>

            {/* Desktop view for logged in user */}
            <div className="hidden md:flex items-center gap-3">
              <UserAvatar src={user.photoURL} alt={user.displayName} />
              {user.email === "khalidalfarsi1995@gmail.com" && (
                <Link 
                  href="/admin" 
                  className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white hover:bg-slate-800 transition-all hover:scale-110 shadow-lg shadow-slate-900/10"
                  title="لوحة التحكم"
                  style={getStyle("admin_btn")}
                >
                  <Gift className="w-5 h-5" />
                </Link>
              )}
              <NotificationCenter userId={user.uid} />
              
              <div className="flex items-center justify-center gap-2 bg-white shadow-sm border border-slate-200 px-4 py-2 rounded-full" dir="ltr" title="الرصيد/المحفظة" style={getStyle("wallet")}>
                <AnimatePresence mode="popLayout">
                  <motion.span 
                    key={balance}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="font-bold text-slate-800 text-base md:text-lg inline-block"
                  >
                    ${balance !== null ? balance : "..."} 
                  </motion.span>
                </AnimatePresence>
                <Wallet className="w-5 h-5 text-blue-600" style={getStyle("wallet_icon")} />
              </div>

              <button
                onClick={signOut}
                title="تسجيل الخروج"
                className="flex items-center justify-center p-2 text-slate-400 hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-full"
                style={getStyle("logout_btn")}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Login Button (Exactly like image) */}
            <button
              onClick={signIn}
              className="md:hidden bg-[#2563EB] text-white px-6 py-2 rounded-[10px] text-[15px] font-bold shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:bg-blue-700 transition-all active:scale-95"
              style={{ fontFamily: "'Childos Arabic', sans-serif", ...getStyle("login_btn_mobile") }}
            >
              تسجيل الدخول
            </button>

            {/* Desktop Login Button */}
            <button
              onClick={signIn}
              title="تسجيل الدخول"
              className="hidden md:flex items-center justify-center gap-2 bg-blue-700 text-white shadow-sm hover:shadow-lg hover:shadow-blue-700/20 px-7 py-2.5 rounded-full font-medium transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
              style={getStyle("login_btn")}
            >
              <LogIn className="w-4 h-4 ml-1" />
              تسجيل الدخول
            </button>
          </>
        )}
      </div>

      {/* Brand / Logo Section - On the Right for Mobile */}
      <div className="flex items-center order-2 md:order-1" style={getStyle("brand")}>
        {/* Mobile Logo (Exactly like image) */}
        <div className="md:hidden flex items-center">
          <Link href="/">
            <img 
              src={LOGO_URL} 
              alt="Logo" 
              style={{ width: '243.6px', height: '117.2px', mixBlendMode: 'multiply' }}
              className="object-contain bg-transparent max-w-none" 
              referrerPolicy="no-referrer"
            />
          </Link>
        </div>

        {/* Desktop Brand */}
        <div className="hidden md:flex items-center gap-3 bg-white/50 backdrop-blur-md border border-slate-200/50 pl-6 pr-4 py-2 rounded-2xl shadow-sm hover:shadow-md transition-all hover:bg-white hover:-translate-y-0.5" style={getStyle("brand_desktop")}>
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20 shrink-0" style={getStyle("icon_bg")}>
            <Gift className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap" style={getStyle("brand_text")}>
            متجر <span className="text-blue-600" style={getStyle("accent_text")}>المكافآت</span>
          </h1>
        </div>
      </div>
    </header>
  );
}
