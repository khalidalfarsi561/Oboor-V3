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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-4">حدث خطأ غير متوقع</h2>
      <p className="text-slate-500 mb-8 max-w-md">
        نأسف، لقد واجهنا مشكلة أثناء معالجة طلبك.
      </p>
      <button
        onClick={() => reset()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transition-colors"
      >
        حاول مرة أخرى
      </button>
    </div>
  );
}
