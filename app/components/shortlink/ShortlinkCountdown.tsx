"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ShortlinkCountdown() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10); // Updated to 10 seconds per task instructions

  useEffect(() => {
    // Optionally check local storage for bypass as per instruction "local storage bypass"
    const skip = localStorage.getItem("skip_shortlink_timer");
    if (process.env.NODE_ENV === "development" && skip === "true") {
      router.push("/secret?linkId=daily_link_1");
      return;
    }

    const targetTime = Date.now() + 10 * 1000; // وقت النهاية الفعلي بعد 10 ثوانٍ

    const interval = setInterval(() => {
      const remaining = Math.ceil((targetTime - Date.now()) / 1000);

      if (remaining <= 0) {
        clearInterval(interval);
        setCountdown(0);
        router.push("/secret?linkId=daily_link_1");
      } else {
        setCountdown(remaining);
      }
    }, 500); // الفحص كل نصف ثانية لضمان الدقة العالية

    return () => clearInterval(interval);
  }, [router]);

  return (
    <>
      <div className="mb-4 rounded-2xl bg-blue-50 py-6 text-4xl font-bold text-blue-700 transition-all sm:py-8 sm:text-5xl">
        {countdown}
      </div>
      <p className="text-sm font-medium text-slate-400 sm:text-base">
        جاري التوجيه التلقائي إلى الصفحة السرية...
      </p>
    </>
  );
}
