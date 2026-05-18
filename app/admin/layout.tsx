"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { verifyServerAdmin } from "../actions/admin";
import { useRouter, usePathname } from "next/navigation";
import {
  Loader2,
  ShieldX,
  Menu,
  X,
  Home,
  Globe,
  Cpu,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarContentProps {
  pathname: string;
}

const SidebarContent = ({ pathname }: SidebarContentProps) => {
  const navLinks = [
    { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
    { href: "/admin/builder", label: "مهندس الواجهات المرئي", icon: Globe },
    { href: "/admin/ai", label: "مساعد الذكاء الاصطناعي", icon: Cpu },
  ];

  return (
    <>
      <div className="flex flex-col items-center py-8">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-orange-500 shadow-lg shadow-red-600/20">
          <span className="text-2xl font-black text-white">S^</span>
        </div>
        <h2 className="text-xl font-bold tracking-widest text-white">اللوحة الخارقة</h2>
      </div>

      <nav className="mt-4 flex w-full flex-1 flex-col gap-2 px-4">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                isActive
                  ? "border border-red-600/20 bg-red-600/10 text-red-400"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 p-4">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 px-4 py-3 text-sm font-medium transition hover:bg-slate-700"
        >
          <Home className="h-4 w-4" />
          العودة للموقع
        </Link>
      </div>
    </>
  );
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push("/");
      return;
    }

    const checkAdmin = async () => {
      const idToken = await user.getIdToken();
      const isOk = await verifyServerAdmin(idToken);
      setIsAdmin(isOk);
    };
    checkAdmin();
  }, [user, loading, router]);

  // Handle mobile sidebar close on navigation
  const prevPathname = React.useRef(pathname);
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsSidebarOpen(false);
      prevPathname.current = pathname;
    }
  }, [pathname]);

  if (loading || isAdmin === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center border-t-4 border-red-500 bg-slate-900">
        <Loader2 className="h-12 w-12 animate-spin text-red-500" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center border-t-8 border-red-600 bg-slate-900 p-6 text-center">
        <ShieldX className="mb-6 h-24 w-24 text-red-500" />
        <h1 className="mb-4 text-4xl font-bold text-white">تم الحظر الكامل</h1>
        <p className="mb-8 max-w-md text-lg text-red-400">
          هذه المنطقة مشفرة ومؤمنة بالكامل كخرسانة صلبة للمسؤول فقط. يرجى مغادرة الصفحة
          فوراً.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-red-600 px-8 py-3 font-bold text-white transition-all hover:bg-red-700"
        >
          العودة للرئيسية
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100"
      dir="rtl"
    >
      {/* Mobile Header */}
      <header className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6 lg:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 font-black">
            S^
          </div>
          <span className="text-sm font-bold">Dashboard</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400">
          <Menu className="h-6 w-6" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-l border-slate-800 bg-slate-900 lg:flex">
        <SidebarContent pathname={pathname} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 z-[50] bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 z-[60] flex w-80 flex-col bg-slate-900 shadow-2xl lg:hidden"
            >
              <div className="absolute top-4 left-4">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-slate-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <SidebarContent pathname={pathname} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="w-full flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="mx-auto max-w-7xl p-6 md:p-10">{children}</div>
      </main>
    </div>
  );
}
