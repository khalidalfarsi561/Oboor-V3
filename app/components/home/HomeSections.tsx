"use client";

import React from "react";
import { HomeHero } from "./HomeHero";
import { HomeClaim } from "./HomeClaim";
import { StoreItems } from "../StoreItems";
import { LayoutSectionId, DesignPatch, mapDesignPatchToStyle } from "../../lib/design";

interface HomeSectionsProps {
  layoutOrder: LayoutSectionId[];
  design: Record<string, DesignPatch>;
  stockMap: Record<number, number> | null;
  user: any;
  balance: number | null;
  signIn: () => void;
  handleClaim: (e: React.FormEvent) => void;
  code: string;
  setCode: (val: string) => void;
  claiming: boolean;
  errorMsg: string;
  setErrorMsg: (val: string) => void;
}

export function HomeSections({
  layoutOrder,
  design,
  stockMap,
  user,
  balance,
  signIn,
  handleClaim,
  code,
  setCode,
  claiming,
  errorMsg,
  setErrorMsg
}: HomeSectionsProps) {
  const getSectionStyle = (id: string) => mapDesignPatchToStyle(design[id] || {});

  const componentsMap: Record<LayoutSectionId, React.ReactNode> = {
    hero: (
      <HomeHero 
        key="hero" 
        user={user} 
        signIn={signIn} 
        style={getSectionStyle("hero")} 
      />
    ),
    claim: (
      <HomeClaim 
        key="claim" 
        user={user} 
        handleClaim={handleClaim} 
        code={code} 
        setCode={setCode} 
        claiming={claiming} 
        errorMsg={errorMsg} 
        setErrorMsg={setErrorMsg} 
        style={getSectionStyle("claim")} 
      />
    ),
    store: (
      <StoreItems 
        key="store" 
        balance={balance} 
        stockMap={stockMap} 
        style={getSectionStyle("store")} 
      />
    ),
  };

  return (
    <>
      {layoutOrder.map((sectionId) => componentsMap[sectionId])}
    </>
  );
}
