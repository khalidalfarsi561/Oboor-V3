"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function ShortlinkCountdown() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10); // Updated to 10 seconds per task instructions

  useEffect(() => {
    // Optionally check local storage for bypass as per instruction "local storage bypass"
    const skip = localStorage.getItem("skip_shortlink_timer");
    if (skip === "true") {
      router.push("/secret?linkId=daily_link_1");
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push("/secret?linkId=daily_link_1");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <>
      <div className="bg-blue-50 text-blue-700 font-bold text-4xl sm:text-5xl py-6 sm:py-8 rounded-2xl mb-4 transition-all">
        {countdown}
      </div>
      <p className="text-sm sm:text-base font-medium text-slate-400">
        جاري التوجيه التلقائي إلى الصفحة السرية...
      </p>
    </>
  );
}
