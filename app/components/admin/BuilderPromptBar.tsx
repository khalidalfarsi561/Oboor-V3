"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Send, X, Info } from "lucide-react";

interface BuilderPromptBarProps {
  selectedId: string | null;
  selectedLabel: string;
  aiPrompt: string;
  setAiPrompt: (val: string) => void;
  aiLoading: boolean;
  applyAiStyling: (e: React.FormEvent) => void;
  setSelectedId: (id: string | null) => void;
}

export function BuilderPromptBar({
  selectedId,
  selectedLabel,
  aiPrompt,
  setAiPrompt,
  aiLoading,
  applyAiStyling,
  setSelectedId,
}: BuilderPromptBarProps) {
  const aiInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-10">
      <AnimatePresence>
        {selectedId ? (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="pointer-events-auto w-full max-w-2xl"
          >
            <div className="flex items-center gap-3 rounded-[32px] border border-slate-700 bg-slate-900/90 p-2 shadow-2xl ring-8 ring-slate-950/20 backdrop-blur-2xl">
              <div className="flex shrink-0 items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-xs font-bold whitespace-nowrap text-white">
                <Sparkles className="h-3 w-3 animate-pulse" />
                تعديل {selectedLabel}
              </div>
              <form onSubmit={applyAiStyling} className="flex flex-1 gap-2">
                <input
                  ref={aiInputRef}
                  autoFocus
                  type="text"
                  placeholder="أخبر الذكاء الاصطناعي ماذا تريد أن تفعل بهذا العنصر..."
                  className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={aiLoading}
                />
                <button
                  type="submit"
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="flex shrink-0 items-center justify-center rounded-2xl bg-white p-3 text-slate-950 transition-all hover:bg-red-500 hover:text-white disabled:opacity-30"
                >
                  {aiLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
                <div className="mx-1 h-6 w-[1px] self-center bg-slate-800" />
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  className="p-3 text-slate-500 transition-all hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3 rounded-full border border-slate-800 bg-slate-900/50 px-6 py-3 text-xs text-slate-500 backdrop-blur"
          >
            <Info className="h-4 w-4 text-blue-500" />
            اضغط على أي عنصر في المعاينة لتشغيل محرك تعديل الذكاء الاصطناعي
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
