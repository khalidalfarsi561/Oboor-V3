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
  setSelectedId
}: BuilderPromptBarProps) {
  const aiInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="absolute inset-x-0 bottom-10 flex justify-center px-10 pointer-events-none">
       <AnimatePresence>
         {selectedId ? (
           <motion.div 
             initial={{ y: 50, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 50, opacity: 0 }}
             className="w-full max-w-2xl pointer-events-auto"
           >
             <div className="bg-slate-900/90 backdrop-blur-2xl border border-slate-700 p-2 rounded-[32px] shadow-2xl flex items-center gap-3 ring-8 ring-slate-950/20">
                <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xs shrink-0 whitespace-nowrap">
                   <Sparkles className="w-3 h-3 animate-pulse" />
                   تعديل {selectedLabel}
                </div>
                <form onSubmit={applyAiStyling} className="flex-1 flex gap-2">
                   <input 
                     ref={aiInputRef}
                     autoFocus
                     type="text" 
                     placeholder="أخبر الذكاء الاصطناعي ماذا تريد أن تفعل بهذا العنصر..." 
                     className="flex-1 bg-transparent px-4 py-2 text-sm text-white focus:outline-none placeholder:text-slate-600"
                     value={aiPrompt}
                     onChange={(e) => setAiPrompt(e.target.value)}
                     disabled={aiLoading}
                   />
                   <button 
                     type="submit"
                     disabled={aiLoading || !aiPrompt.trim()}
                     className="p-3 bg-white text-slate-950 rounded-2xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-30 flex items-center justify-center shrink-0"
                   >
                     {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                   </button>
                   <div className="w-[1px] h-6 bg-slate-800 self-center mx-1" />
                   <button 
                     type="button"
                     onClick={() => setSelectedId(null)}
                     className="p-3 text-slate-500 hover:text-white transition-all"
                   >
                     <X className="w-4 h-4" />
                   </button>
                </form>
             </div>
           </motion.div>
         ) : (
           <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="text-xs bg-slate-900/50 backdrop-blur border border-slate-800 text-slate-500 px-6 py-3 rounded-full flex items-center gap-3"
           >
             <Info className="w-4 h-4 text-blue-500" />
             اضغط على أي عنصر في المعاينة لتشغيل محرك تعديل الذكاء الاصطناعي
           </motion.div>
         )}
       </AnimatePresence>
    </div>
  );
}
