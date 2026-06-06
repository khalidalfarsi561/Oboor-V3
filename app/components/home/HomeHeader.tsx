"use client";

import React, { useState } from "react";
import Image from "next/image";
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const getStyle = (id: string) => mapDesignPatchToStyle(design[id] || {});

  // Placeholder for the logo URL - user can replace this
  const LOGO_URL = "https://i.ibb.co/sJd2xZ7V/oboor-logo.png"; // Replace with real logo URL

  return (
    <header
      className="group/nav mb-3 flex flex-row items-center justify-between gap-3 px-4 py-2 sm:px-0 md:mb-6"
      style={getStyle("nav")}
    >
      {/* Sign In Section - Exact match for image for mobile */}
      <div className="order-1 flex flex-row items-center md:order-2">
        {user ? (
          <div className="flex items-center gap-2">
            {/* Minimal Mobile view for logged in user */}
            <div className="relative -top-1 flex items-center gap-2 md:hidden">
              {/* كرت الرصيد في الجوال - النسخة المعدلة هندسياً للمحاذاة المطلقة */}
              <div
                className="flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-4 py-2.5 shadow-sm"
                dir="ltr"
                style={getStyle("wallet")}
              >
                <div className="flex h-full items-center justify-center">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={balance}
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="flex items-center justify-center pt-[5px] text-sm leading-none font-bold text-slate-800"
                    >
                      ${balance !== null ? balance : "..."}
                    </motion.span>
                  </AnimatePresence>
                </div>

                <div className="flex items-center justify-center">
                  <Wallet
                    className="h-4 w-4 text-blue-600"
                    style={getStyle("wallet_icon")}
                  />
                </div>
              </div>

              {/* حاوية الصورة الشخصية والقائمة المنبثقة */}
              <div className="relative">
                {/* زر الصورة الشخصية */}
                <button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="flex items-center justify-center transition-transform focus:outline-none active:scale-95"
                  title="قائمة المستخدم"
                >
                  <UserAvatar src={user.photoURL} alt={user.displayName} size={40} />
                </button>

                {/* القائمة المنبثقة عند النقر على الصورة */}
                <AnimatePresence>
                  {showMobileMenu && (
                    <>
                      {/* خلفية شفافة لإغلاق القائمة عند النقر في أي مكان خارجها */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowMobileMenu(false)}
                      />

                      {/* كرت زر الخروج المنبثق */}
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className="absolute left-0 z-50 mt-2 w-28 rounded-xl border border-slate-100 bg-white p-1 shadow-xl"
                      >
                        <button
                          onClick={() => {
                            signOut();
                            setShowMobileMenu(false);
                          }}
                          className="flex w-full items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-2 text-center text-xs font-bold text-red-600 transition-colors hover:bg-red-100"
                        >
                          تسجيل الخروج
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Desktop view for logged in user */}
            <div className="hidden items-center gap-3 md:flex">
              <UserAvatar src={user.photoURL} alt={user.displayName} />
              {user.email === "khalidalfarsi1995@gmail.com" && (
                <Link
                  href="/admin"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg shadow-slate-900/10 transition-all hover:scale-110 hover:bg-slate-800"
                  title="لوحة التحكم"
                  style={getStyle("admin_btn")}
                >
                  <Gift className="h-5 w-5" />
                </Link>
              )}
              <NotificationCenter userId={user.uid} />

              <div
                className="flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm"
                dir="ltr"
                title="الرصيد/المحفظة"
                style={getStyle("wallet")}
              >
                <AnimatePresence mode="popLayout">
                  <motion.span
                    key={balance}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="inline-block text-base font-bold text-slate-800 md:text-lg"
                  >
                    ${balance !== null ? balance : "..."}
                  </motion.span>
                </AnimatePresence>
                <Wallet
                  className="h-5 w-5 text-blue-600"
                  style={getStyle("wallet_icon")}
                />
              </div>

              <button
                onClick={signOut}
                title="تسجيل الخروج"
                className="flex items-center justify-center rounded-full p-2 text-slate-400 transition-colors hover:text-red-500 focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none"
                style={getStyle("logout_btn")}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Mobile Login Button (Exactly like image) */}
            <button
              onClick={signIn}
              className="font-childos rounded-[10px] bg-[#2563EB] px-6 py-2 text-[15px] font-bold text-white shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] transition-all hover:bg-blue-700 active:scale-95 md:hidden"
              style={getStyle("login_btn_mobile")}
            >
              تسجيل الدخول
            </button>

            {/* Desktop Login Button */}
            <button
              onClick={signIn}
              title="تسجيل الدخول"
              className="hidden items-center justify-center gap-2 rounded-full bg-blue-700 px-7 py-2.5 font-medium text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-700/20 focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 focus-visible:outline-none md:flex"
              style={getStyle("login_btn")}
            >
              <LogIn className="ml-1 h-4 w-4" />
              تسجيل الدخول
            </button>
          </>
        )}
      </div>

      {/* Brand / Logo Section - On the Right for Mobile */}
      <div className="flex min-w-0 items-center justify-start" style={getStyle("brand")}>
        {/* Mobile Logo */}
        <div className="relative -top-1 order-1 flex min-w-0 items-center justify-start md:order-1">
          <Link href="/" className="flex min-w-0 items-center">
            <Image
              src={LOGO_URL}
              alt="Logo"
              width={180}
              height={70}
              className="h-auto w-[clamp(85px,26vw,140px)] object-contain mix-blend-multiply"
              referrerPolicy="no-referrer"
              priority
            />
          </Link>
        </div>

        {/* Desktop Brand */}
        <div
          className="hidden items-center gap-3 rounded-2xl border border-slate-200/50 bg-white/50 py-2 pr-4 pl-6 shadow-sm backdrop-blur-md transition-all hover:-translate-y-0.5 hover:bg-white hover:shadow-md md:flex"
          style={getStyle("brand_desktop")}
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/20"
            style={getStyle("icon_bg")}
          >
            <Gift className="h-5 w-5 text-white" />
          </div>
          <h1
            className="text-xl font-bold tracking-tight whitespace-nowrap text-slate-900"
            style={getStyle("brand_text")}
          >
            متجر{" "}
            <span className="text-blue-600" style={getStyle("accent_text")}>
              المكافآت
            </span>
          </h1>
        </div>
      </div>
    </header>
  );
}
