"use client";

import React, { useEffect } from "react";
import { AlertCircle } from "lucide-react";

export default function ErrorBoundaryPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50">
        <AlertCircle className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="mb-4 text-2xl font-bold text-slate-900">حدث خطأ غير متوقع</h2>
      <p className="mb-8 max-w-md text-slate-500">
        نأسف، لقد واجهنا مشكلة أثناء معالجة طلبك.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg transition-colors hover:bg-blue-700"
      >
        حاول مرة أخرى
      </button>
    </div>
  );
}
