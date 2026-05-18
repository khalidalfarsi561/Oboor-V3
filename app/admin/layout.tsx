"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { verifyServerAdmin } from "../actions/admin";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, ShieldX, Menu, X, Home, Globe, Cpu, LayoutDashboard } from "lucide-react";
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
        <div className="w-16 h-16 bg-gradient-to-tr from-red-600 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-600/20 mb-4">
          <span className="font-black text-2xl text-white">S^</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-widest">اللوحة الخارقة</h2>
      </div>
      
      <nav className="w-full flex-1 px-4 flex flex-col gap-2 mt-4">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href}
              href={link.href} 
              className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                isActive 
                  ? "bg-red-600/10 text-red-400 border border-red-600/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/50"
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium text-sm">{link.label}</span>
            </Link>
          );
        })}
      </nav>
      
      <div className="mt-auto p-4 flex flex-col gap-2">
        <Link 
          href="/" 
          className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 rounded-xl text-sm font-medium hover:bg-slate-700 transition"
        >
          <Home className="w-4 h-4" />
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
      const isOk = await verifyServerAdmin(user.uid, user.email || "");
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
      <div className="flex h-screen w-full items-center justify-center bg-slate-900 border-t-4 border-red-500">
        <Loader2 className="w-12 h-12 animate-spin text-red-500" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-slate-900 border-t-8 border-red-600 text-center p-6">
        <ShieldX className="w-24 h-24 text-red-500 mb-6" />
        <h1 className="text-4xl font-bold text-white mb-4">تم الحظر الكامل</h1>
        <p className="text-red-400 mb-8 max-w-md text-lg">هذه المنطقة مشفرة ومؤمنة بالكامل كخرسانة صلبة للمسؤول فقط. يرجى مغادرة الصفحة فوراً.</p>
        <Link href="/" className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans overflow-hidden" dir="rtl">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 inset-x-0 h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center font-black">S^</div>
           <span className="font-bold text-sm">Dashboard</span>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-slate-900 border-l border-slate-800 flex-col shrink-0 overflow-y-auto">
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
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]"
            />
            <motion.aside 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 right-0 w-80 bg-slate-900 z-[60] shadow-2xl flex flex-col"
            >
              <div className="absolute left-4 top-4">
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-slate-500">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <SidebarContent pathname={pathname} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 overflow-y-auto w-full pt-16 lg:pt-0">
        <div className="p-6 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
