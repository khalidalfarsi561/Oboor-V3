"use client";

import React, { useState } from "react";
import { useAuth } from "../AuthProvider";
import { useUserBalance } from "../../hooks/useUserBalance";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { claimRewardCode } from "../../actions/rewards";
import { HomeHeader } from "./HomeHeader";
import { HomeSections } from "./HomeSections";
import { LayoutSectionId, DesignPatch } from "../../lib/design";

export function HomeClient({ 
  stockMap, 
  layoutOrder = ["hero", "claim", "store"], 
  design = {} 
}: { 
  stockMap: Record<number, number> | null, 
  layoutOrder?: LayoutSectionId[], 
  design?: Record<string, DesignPatch> 
}) {
  const { user, loading, signIn, signOut } = useAuth();
  const { balance, isBalanceLoading } = useUserBalance(user?.uid);
  
  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [claiming, setClaiming] = useState(false);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً.");
      return;
    }
    if (!code.trim() || code.trim().length !== 8) {
      setErrorMsg("تأكد من إدخال كود صحيح مكون من 8 رموز.");
      return;
    }

    setClaiming(true);
    try {
      const result = await claimRewardCode(user.uid, code);

      if (!result.success || result.error) {
        setErrorMsg(result.error || "حدث خطأ غير متوقع أثناء معالجة الكود.");
        return;
      }

      toast.success(`تم بنجاح! تمت إضافة ${result.amount}$ إلى رصيدك.`, {
        icon: <CheckCircle2 className="text-green-500 w-5 h-5" />
      });
      setCode("");
      
      const { default: confetti } = await import("canvas-confetti");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563eb", "#4f46e5", "#38bdf8"]
      });

    } catch (err: unknown) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setClaiming(false);
    }
  };

  if (loading || (user && isBalanceLoading && balance === null)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div aria-busy="true"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-blue-100 relative">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-50 to-transparent pointer-events-none" />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 relative z-10">
        
        <HomeHeader 
          user={user} 
          balance={balance} 
          signIn={signIn} 
          signOut={signOut} 
          design={design} 
        />

        <HomeSections 
          layoutOrder={layoutOrder}
          design={design}
          stockMap={stockMap}
          user={user}
          balance={balance}
          signIn={signIn}
          handleClaim={handleClaim}
          code={code}
          setCode={setCode}
          claiming={claiming}
          errorMsg={errorMsg}
          setErrorMsg={setErrorMsg}
        />

      </main>
    </div>
  );
}
