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
      <div className="mb-4 rounded-2xl bg-blue-50 py-6 text-4xl font-bold text-blue-700 transition-all sm:py-8 sm:text-5xl">
        {countdown}
      </div>
      <p className="text-sm font-medium text-slate-400 sm:text-base">
        جاري التوجيه التلقائي إلى الصفحة السرية...
      </p>
    </>
  );
}
