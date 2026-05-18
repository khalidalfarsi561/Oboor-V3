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
  design = {},
}: {
  stockMap: Record<number, number> | null;
  layoutOrder?: LayoutSectionId[];
  design?: Record<string, DesignPatch>;
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
      const idToken = await user.getIdToken();
      const result = await claimRewardCode(idToken, code);

      if (!result.success || result.error) {
        setErrorMsg(result.error || "حدث خطأ غير متوقع أثناء معالجة الكود.");
        return;
      }

      toast.success(`تم بنجاح! تمت إضافة ${result.amount}$ إلى رصيدك.`, {
        icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      });
      setCode("");

      const { default: confetti } = await import("canvas-confetti");
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563eb", "#4f46e5", "#38bdf8"],
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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-50 selection:bg-blue-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-blue-50 to-transparent" />

      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10 lg:px-8">
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
