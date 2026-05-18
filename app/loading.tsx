import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-8">
      <Loader2 className="mb-6 h-10 w-10 animate-spin text-blue-600" />
      <p className="font-medium text-slate-500">جاري التحميل...</p>
    </div>
  );
}
