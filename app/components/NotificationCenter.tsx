"use client";

import React from "react";
import { Bell } from "lucide-react";

export function NotificationCenter({ userId }: { userId: string }) {
  return (
    <button className="relative p-2 text-slate-400 transition-colors hover:text-blue-600">
      <Bell className="h-5 w-5" />
      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500"></span>
    </button>
  );
}
