"use client";

import React from "react";
import { motion } from "framer-motion";
import { Gift, Wallet, LogOut } from "lucide-react";
import { FocusWrapper } from "./FocusWrapper";
import { HomeHero } from "../home/HomeHero";
import { HomeClaim } from "../home/HomeClaim";
import { StoreItems } from "../StoreItems";
import { DesignPatch, mapDesignPatchToStyle, LayoutSectionId } from "../../lib/design";

interface BuilderPreviewProps {
  viewMode: "desktop" | "mobile";
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  items: LayoutSectionId[];
  design: Record<string, DesignPatch>;
  controlElements: any[];
}

export function BuilderPreview({
  viewMode,
  selectedId,
  setSelectedId,
  hoveredId,
  setHoveredId,
  items,
  design,
  controlElements
}: BuilderPreviewProps) {
  
  const getStyle = (id: string) => mapDesignPatchToStyle(design[id] || {});
  const getLabel = (id: string) => controlElements.find(e => e.id === id)?.label || id;

  const componentsMap: Record<string, React.ReactNode> = {
    hero: (
      <FocusWrapper 
        id="hero" 
        key="hero" 
        label={getLabel("hero")}
        className="mb-8" 
        selectedId={selectedId} 
        setSelectedId={setSelectedId} 
        hoveredId={hoveredId} 
        setHoveredId={setHoveredId}
      >
        <HomeHero user={{}} signIn={() => {}} style={getStyle("hero")} />
      </FocusWrapper>
    ),
    claim: (
      <FocusWrapper 
        id="claim" 
        key="claim" 
        label={getLabel("claim")}
        className="mb-8" 
        selectedId={selectedId} 
        setSelectedId={setSelectedId} 
        hoveredId={hoveredId} 
        setHoveredId={setHoveredId}
      >
        <HomeClaim user={{ uid: "test" }} handleClaim={() => {}} code="" setCode={() => {}} claiming={false} errorMsg="" setErrorMsg={() => {}} style={getStyle("claim")} />
      </FocusWrapper>
    ),
    store: (
      <FocusWrapper 
        id="store" 
        key="store" 
        label={getLabel("store")}
        className="mb-8" 
        selectedId={selectedId} 
        setSelectedId={setSelectedId} 
        hoveredId={hoveredId} 
        setHoveredId={setHoveredId}
      >
        <StoreItems balance={100} stockMap={{}} style={getStyle("store")} />
      </FocusWrapper>
    ),
  };

  return (
    <div className="flex-1 overflow-y-auto p-12 flex justify-center items-start scrollbar-hide">
      <motion.div 
        layout
        className={`bg-white min-h-screen shadow-[0_0_100px_rgba(0,0,0,0.5)] transition-all duration-700 relative origin-top ${
          viewMode === "mobile" ? 'w-[375px] rounded-[50px] border-[12px] border-[#1a1a1a] overflow-hidden' : 'w-full max-w-5xl rounded-2xl'
        }`}
      >
        {/* Header Preview */}
        <FocusWrapper 
          id="nav" 
          label={getLabel("nav")}
          selectedId={selectedId} 
          setSelectedId={setSelectedId} 
          hoveredId={hoveredId} 
          setHoveredId={setHoveredId}
        >
          <header className="p-6 flex items-center justify-between border-b" style={getStyle("nav")}>
            <FocusWrapper 
              id="brand" 
              label={getLabel("brand")}
              selectedId={selectedId} 
              setSelectedId={setSelectedId} 
              hoveredId={hoveredId} 
              setHoveredId={setHoveredId}
            >
              <div className="flex items-center gap-3 bg-white border border-slate-200 pl-4 pr-3 py-1.5 rounded-2xl shadow-sm" style={getStyle("brand")}>
                <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0" style={getStyle("icon_bg")}>
                  <Gift className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-sm font-bold text-slate-900 whitespace-nowrap" style={getStyle("brand_text")}>
                  متجر <span className="text-blue-600" style={getStyle("accent_text")}>المكافآت</span>
                </h1>
              </div>
            </FocusWrapper>

            <div className="flex items-center gap-3">
               <FocusWrapper 
                 id="wallet" 
                 label={getLabel("wallet")}
                 selectedId={selectedId} 
                 setSelectedId={setSelectedId} 
                 hoveredId={hoveredId} 
                 setHoveredId={setHoveredId}
               >
                 <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm text-xs" style={getStyle("wallet")}>
                   <span className="font-bold">$100.00</span>
                   <Wallet className="w-4 h-4 text-blue-600" style={getStyle("wallet_icon")} />
                 </div>
               </FocusWrapper>
               <FocusWrapper 
                 id="logout_btn" 
                 label={getLabel("logout_btn")}
                 selectedId={selectedId} 
                 setSelectedId={setSelectedId} 
                 hoveredId={hoveredId} 
                 setHoveredId={setHoveredId}
               >
                 <button className="p-2 text-slate-400" style={getStyle("logout_btn")}><LogOut className="w-4 h-4" /></button>
               </FocusWrapper>
            </div>
          </header>
        </FocusWrapper>

        {/* Dynamic Content Sections */}
        <div className="p-0">
          {items.map(it => componentsMap[it])}
        </div>
      </motion.div>
    </div>
  );
}
