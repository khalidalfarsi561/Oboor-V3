import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Loader2, Bell, BellOff } from "lucide-react";
import { StoreItem } from "../lib/data";
import { toggleStockNotification, getSubscriptionStatus } from "../actions/store";
import { useAuth } from "./AuthProvider";
import { toast } from "sonner";

interface StoreItemCardProps {
  item: StoreItem;
  stock: number;
  purchasingId: number | null;
  onBuy: (item: StoreItem) => void;
  index: number;
  isSubscribed?: boolean;
  onToggleNotify?: () => void;
}

export function StoreItemCard({
  item,
  stock,
  purchasingId,
  onBuy,
  index,
  isSubscribed = false,
  onToggleNotify,
}: StoreItemCardProps) {
  const isOutOfStock = stock <= 0;
  const isPurchasing = purchasingId === item.id;
  const isAnyPurchasing = purchasingId !== null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="group ui-reduced-motion relative flex min-h-[340px] flex-col overflow-hidden rounded-[28px] border border-slate-100 bg-white p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] sm:min-h-[360px] sm:p-8"
      aria-busy={isPurchasing}
      aria-disabled={isOutOfStock}
    >
      <div className="absolute top-6 left-6" dir="ltr">
        {isOutOfStock ? (
          <span className="rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-bold text-red-600">
            غير متوفر
          </span>
        ) : (
          <span className="rounded-full border border-green-100 bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
            متوفر
          </span>
        )}
      </div>

      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-50">
        <Package className={`h-8 w-8 ${item.iconColor}`} />
      </div>

      <h3 className="mb-2 text-xl font-bold text-slate-900">{item.name}</h3>

      <div
        className="mb-4 flex items-center gap-2 text-2xl font-bold text-blue-600"
        dir="ltr"
      >
        <span>${item.price}</span>
      </div>

      <div className="mt-auto flex flex-col gap-2">
        <button
          onClick={() => onBuy(item)}
          disabled={isAnyPurchasing || isOutOfStock}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-semibold transition-all ${
            isOutOfStock
              ? "cursor-not-allowed bg-slate-100 text-slate-400"
              : isAnyPurchasing && !isPurchasing
                ? "cursor-not-allowed bg-slate-900 text-white opacity-40"
                : "bg-slate-900 text-white hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50"
          }`}
        >
          {isOutOfStock ? (
            "نفدت الكمية"
          ) : isPurchasing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "شراء الآن"
          )}
        </button>

        {isOutOfStock && (
          <button
            onClick={onToggleNotify}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all hover:scale-[1.02] active:scale-95 ${
              isSubscribed
                ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            {isSubscribed ? (
              <>
                <BellOff className="h-4 w-4" />
                إلغاء التنبيه
              </>
            ) : (
              <>
                <Bell className="h-4 w-4" />
                أعلمني عند التوفر
              </>
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function StoreItemSkeleton() {
  return (
    <div className="flex min-h-[340px] flex-col items-start rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm sm:min-h-[360px] sm:p-8">
      <div className="mb-2 flex w-full justify-end">
        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="mb-6 h-16 w-16 animate-pulse rounded-2xl bg-slate-100" />
      <div className="mb-4 h-6 w-3/4 animate-pulse rounded-lg bg-slate-100" />
      <div className="mb-8 h-6 w-1/4 animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-auto h-12 w-full animate-pulse rounded-xl bg-slate-100" />
    </div>
  );
}
