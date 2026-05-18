"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

interface FocusWrapperProps {
  id: string;
  label: string;
  children: React.ReactNode;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  className?: string;
}

export const FocusWrapper = ({ 
  id, 
  label,
  children, 
  selectedId, 
  setSelectedId, 
  hoveredId, 
  setHoveredId, 
  className = "" 
}: FocusWrapperProps) => {
  const isSelected = selectedId === id;
  const isHovered = hoveredId === id;

  return (
    <div 
      className={`relative group/focus ${className} cursor-crosshair transition-all`}
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId(null)}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedId(id);
      }}
    >
      <AnimatePresence>
        {(isHovered || isSelected) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute -inset-2 border-2 z-40 pointer-events-none rounded-xl transition-colors ${
              isSelected ? 'border-red-500 ring-4 ring-red-500/10' : 'border-blue-400 border-dashed'
            }`}
          >
            <div className={`absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-sm flex items-center gap-1 ${
              isSelected ? 'bg-red-500' : 'bg-blue-400'
            }`}>
              <Sparkles className="w-2.5 h-2.5" />
              {label} {isSelected && "• المحدد للذكاء الاصطناعي"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className={`${isSelected ? 'relative z-10' : ''}`}>
        {children}
      </div>
    </div>
  );
};
