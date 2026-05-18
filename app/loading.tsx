import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-6" />
      <p className="text-slate-500 font-medium">جاري التحميل...</p>
    </div>
  );
}
