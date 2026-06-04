"use client";

import React, { useState } from "react";
import { Bell } from "lucide-react";
import { useUserNotifications } from "../hooks/useUserNotifications";
import { markNotificationAsRead } from "../actions/notifications";
import { useAuth } from "./AuthProvider";

export function NotificationCenter({ userId }: { userId: string }) {
  const { notifications, unreadCount } = useUserNotifications(userId);
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    setIsOpen(!isOpen);
  };

  const handleRead = async (id: string) => {
    if (!user) return;
    const idToken = await user.getIdToken();
    await markNotificationAsRead(idToken, id);
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative cursor-pointer p-2 text-slate-400 transition-colors hover:text-blue-600"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full border-2 border-white bg-red-500"></span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 z-50 mt-2 max-h-96 w-80 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-xl"
          dir="rtl"
        >
          <h4 className="mb-3 text-sm font-bold text-slate-900">التنبيهات</h4>
          {notifications.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              لا توجد تنبيهات حالياً.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleRead(n.id)}
                  className={`cursor-pointer rounded-xl p-3 text-xs transition-all ${n.read ? "bg-slate-50 text-slate-500" : "border border-blue-100 bg-blue-50/50 font-medium text-slate-900"}`}
                >
                  <p>{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
