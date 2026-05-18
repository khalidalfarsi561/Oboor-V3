"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import {
  Move as MoveIcon,
  Save as SaveIcon,
  Loader2 as LoaderIcon,
  Maximize as MaximizeIcon,
  Smartphone as SmartphoneIcon,
  MousePointer2 as MousePointer2Icon,
  RefreshCcw as RefreshCcwIcon,
  Sparkles as SparklesIcon,
  Bot,
} from "lucide-react";
import { toast } from "sonner";
import { saveSiteSettings, generateDesignPatch } from "../../actions/admin";
import { getFullSiteSettings } from "../../actions/settings";
import { LayoutSectionId, DesignPatch, SiteSettings } from "../../lib/design";
import { FocusWrapper } from "../../components/admin/FocusWrapper";
import { BuilderPreview } from "../../components/admin/BuilderPreview";
import { BuilderPromptBar } from "../../components/admin/BuilderPromptBar";
import { useAuth } from "../../components/AuthProvider";

const CONTROL_ELEMENTS = [
  { id: "nav", label: "شريط التنقل (Navbar)", type: "container", area: "header" },
  { id: "brand", label: "بطاقة الهوية (Brand Chip)", type: "element", area: "header" },
  { id: "brand_text", label: "نص المتجر", type: "text", area: "header" },
  { id: "accent_text", label: "نص التمييز (المكافآت)", type: "text", area: "header" },
  { id: "login_btn", label: "زر تسجيل الدخول", type: "button", area: "header" },
  { id: "logout_btn", label: "زر خروج", type: "button", area: "header" },
  { id: "wallet", label: "بطاقة المحفظة", type: "element", area: "header" },
  { id: "icon_bg", label: "خلفية أيقونة الشعار", type: "element", area: "header" },
  { id: "hero", label: "قسم البطل (Hero)", type: "container", area: "content" },
  { id: "claim", label: "قسم استرداد الأكواد", type: "container", area: "content" },
  { id: "store", label: "قسم المتجر", type: "container", area: "content" },
];

export default function VisualBuilder() {
  const { user } = useAuth();
  const [items, setItems] = useState<LayoutSectionId[]>(["hero", "claim", "store"]);
  const [design, setDesign] = useState<Record<string, DesignPatch>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");

  const [isAiPending, startAiTransition] = useTransition();

  useEffect(() => {
    const load = async () => {
      const data = await getFullSiteSettings();
      setItems(data.order as LayoutSectionId[]);
      setDesign(data.design as Record<string, DesignPatch>);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول.");
      return;
    }
    setSaving(true);
    toast.loading("يتم حفظ التصميم الجديد...", { id: "builder" });
    const idToken = await user.getIdToken();
    const res = await saveSiteSettings(idToken, items, design);
    if (res.success) {
      toast.success("تم بنجاح! الموقع الآن يرتدي حلته الجديدة.", { id: "builder" });
    } else {
      toast.error(res.error, { id: "builder" });
    }
    setSaving(false);
  };

  const applyAiStyling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim() || isAiPending) return;

    const toastId = "ai-style";
    toast.loading("جاري تحليل طلبك وتنفيذ التعديلات...", { id: toastId });

    startAiTransition(async () => {
      try {
        const currentId = selectedId || "global";
        const currentStyle = design[currentId] || {};

        if (!user) {
          toast.error("يرجى تسجيل الدخول.");
          return;
        }

        const idToken = await user.getIdToken();

        const res = await generateDesignPatch(idToken, currentId, currentStyle, aiPrompt);

        if (res.success && res.patch) {
          setDesign((prev) => ({
            ...prev,
            [currentId]: {
              ...prev[currentId],
              ...res.patch,
            },
          }));
          setAiPrompt("");
          toast.success("تم تنفيذ التعديل بنجاح عبر الذكاء الاصطناعي!", { id: toastId });
        } else {
          throw new Error(res.error || "فشل توليد التعديلات.");
        }
      } catch (err: any) {
        console.error(err);
        toast.error(`فشل التعديل: ${err.message}`, { id: toastId });
      }
    });
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full flex-col items-center justify-center gap-4">
        <LoaderIcon className="h-12 w-12 animate-spin text-red-500" />
        <p className="animate-pulse text-slate-400">جاري تحضير بيئة التصميم الحية...</p>
      </div>
    );
  }

  const selectedElement = CONTROL_ELEMENTS.find((e) => e.id === selectedId);

  return (
    <div
      className="relative flex h-[calc(100vh-100px)] w-full overflow-hidden rounded-[40px] border border-slate-800 bg-slate-950 shadow-2xl"
      dir="rtl"
    >
      {/* Sidebar - UI Sections Ordering & Publishing */}
      <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-r border-slate-800 bg-slate-900">
        <div className="border-b border-slate-800 bg-slate-800/30 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-bold text-white">
              <SparklesIcon className="h-5 w-5 text-red-500" />
              الذكاء الاصطناعي
            </h2>
            <button
              disabled={saving}
              onClick={handleSave}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-600/10 transition-all hover:bg-red-700"
            >
              {saving ? (
                <LoaderIcon className="h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4" />
              )}
              نشر الموقع
            </button>
          </div>
          <p className="text-[10px] font-medium text-slate-500">
            تم حذف التعديل اليدوي. استخدم ذكاء المنصة لتغيير أي شيء تراه في المعاينة.
          </p>
        </div>

        <div className="flex-1 space-y-8 p-5">
          <div className="rounded-3xl border border-slate-800 bg-slate-800/20 p-4">
            <h3 className="mb-4 text-xs font-black tracking-tighter text-slate-600 uppercase">
              ترتيب عناصر الموقع
            </h3>
            <Reorder.Group
              axis="y"
              values={items}
              onReorder={setItems}
              className="space-y-2"
            >
              {items.map((it) => (
                <Reorder.Item
                  key={it}
                  value={it}
                  className="group flex cursor-grab items-center justify-between rounded-xl border border-slate-700/50 bg-slate-800/80 p-3 transition-all hover:bg-slate-800"
                >
                  <div className="flex items-center gap-3">
                    <MoveIcon className="h-3 w-3 text-slate-500 group-hover:text-red-500" />
                    <span className="text-[11px] font-bold text-slate-300 capitalize">
                      {it}
                    </span>
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>

          <div className="rounded-3xl border border-slate-700/50 bg-slate-900 p-4">
            <h4 className="mb-2 flex items-center gap-2 text-xs font-bold text-white">
              <Bot className="h-4 w-4 text-red-500" />
              رؤية التصميم
            </h4>
            <p className="text-[10px] leading-relaxed text-slate-400 italic">
              &quot;تخيل موقعك كما تريده، وسأقوم بهندسته لك في ثوانٍ. اضغط على أي عنصر
              وابدأ الحوار.&quot;
            </p>
          </div>
        </div>
      </aside>

      {/* Workspace Canvas */}
      <section className="relative flex flex-1 flex-col overflow-hidden bg-[#0a0a0a]">
        {/* Device & Toolbar */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 bg-slate-900/50 px-8 backdrop-blur-xl">
          <div className="flex items-center gap-6">
            <div className="flex rounded-xl border border-slate-800 bg-slate-950 p-1">
              <button
                onClick={() => setViewMode("desktop")}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${viewMode === "desktop" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
              >
                <MaximizeIcon className="h-3 w-3" /> ديسكتوب
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-xs font-bold transition-all ${viewMode === "mobile" ? "bg-red-600 text-white shadow-lg" : "text-slate-500 hover:text-white"}`}
              >
                <SmartphoneIcon className="h-3 w-3" /> جوال
              </button>
            </div>
            <div className="h-4 w-[1px] bg-slate-800" />
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1">
              <MousePointer2Icon className="h-3 w-3 text-red-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase">
                Focus & Annotate Mode ACTIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                setDesign({});
                toast.success("تم تصفير التصميم، عدنا للبداية!");
              }}
              className="flex items-center gap-1 text-xs text-slate-500 transition-all hover:text-white"
            >
              <RefreshCcwIcon className="h-3 w-3" /> تصفير
            </button>
          </div>
        </div>

        <BuilderPreview
          viewMode={viewMode}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          items={items}
          design={design}
          controlElements={CONTROL_ELEMENTS}
        />

        <BuilderPromptBar
          selectedId={selectedId}
          selectedLabel={selectedElement?.label || "العنصر"}
          aiPrompt={aiPrompt}
          setAiPrompt={setAiPrompt}
          aiLoading={isAiPending}
          applyAiStyling={applyAiStyling}
          setSelectedId={setSelectedId}
        />
      </section>
    </div>
  );
}
