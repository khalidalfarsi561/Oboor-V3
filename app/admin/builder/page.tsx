"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { 
  Move as MoveIcon, Save as SaveIcon, Loader2 as LoaderIcon, Maximize as MaximizeIcon, 
  Smartphone as SmartphoneIcon, MousePointer2 as MousePointer2Icon, RefreshCcw as RefreshCcwIcon, 
  Sparkles as SparklesIcon, Bot
} from "lucide-react";
import { toast } from "sonner";
import { saveSiteSettings, generateDesignPatch } from "../../actions/admin";
import { getFullSiteSettings } from "../../actions/settings";
import { LayoutSectionId, DesignPatch, SiteSettings } from "../../lib/design";
import { FocusWrapper } from "../../components/admin/FocusWrapper";
import { BuilderPreview } from "../../components/admin/BuilderPreview";
import { BuilderPromptBar } from "../../components/admin/BuilderPromptBar";

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
    setSaving(true);
    toast.loading("يتم حفظ التصميم الجديد...", { id: "builder" });
    const res = await saveSiteSettings(items, design);
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
        
        const res = await generateDesignPatch(currentId, currentStyle, aiPrompt);
        
        if (res.success && res.patch) {
          setDesign(prev => ({
            ...prev,
            [currentId]: {
              ...prev[currentId],
              ...res.patch
            }
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
      <div className="h-96 w-full flex flex-col items-center justify-center gap-4">
        <LoaderIcon className="w-12 h-12 animate-spin text-red-500" />
        <p className="text-slate-400 animate-pulse">جاري تحضير بيئة التصميم الحية...</p>
      </div>
    );
  }

  const selectedElement = CONTROL_ELEMENTS.find(e => e.id === selectedId);

  return (
    <div className="w-full flex h-[calc(100vh-100px)] overflow-hidden bg-slate-950 rounded-[40px] border border-slate-800 shadow-2xl relative" dir="rtl">
      
      {/* Sidebar - UI Sections Ordering & Publishing */}
      <aside className="w-72 border-r border-slate-800 bg-slate-900 overflow-y-auto flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 bg-slate-800/30">
          <div className="flex items-center justify-between mb-4">
             <h2 className="font-bold text-white flex items-center gap-2">
               <SparklesIcon className="w-5 h-5 text-red-500" />
               الذكاء الاصطناعي
             </h2>
             <button 
               disabled={saving}
               onClick={handleSave}
               className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-red-600/10 transition-all font-bold text-sm flex items-center gap-2"
             >
               {saving ? <LoaderIcon className="w-4 h-4 animate-spin" /> : <SaveIcon className="w-4 h-4" />}
               نشر الموقع
             </button>
          </div>
          <p className="text-[10px] text-slate-500 font-medium">تم حذف التعديل اليدوي. استخدم ذكاء المنصة لتغيير أي شيء تراه في المعاينة.</p>
        </div>

        <div className="flex-1 p-5 space-y-8">
            <div className="bg-slate-800/20 p-4 rounded-3xl border border-slate-800">
               <h3 className="text-xs font-black text-slate-600 uppercase mb-4 tracking-tighter">ترتيب عناصر الموقع</h3>
               <Reorder.Group axis="y" values={items} onReorder={setItems} className="space-y-2">
                 {items.map(it => (
                    <Reorder.Item key={it} value={it} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/50 flex items-center justify-between cursor-grab group transition-all hover:bg-slate-800">
                      <div className="flex items-center gap-3">
                        <MoveIcon className="w-3 h-3 text-slate-500 group-hover:text-red-500" />
                        <span className="text-[11px] font-bold text-slate-300 capitalize">{it}</span>
                      </div>
                    </Reorder.Item>
                 ))}
               </Reorder.Group>
            </div>

            <div className="bg-slate-900 border border-slate-700/50 p-4 rounded-3xl">
               <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
                 <Bot className="w-4 h-4 text-red-500" />
                 رؤية التصميم
               </h4>
               <p className="text-[10px] text-slate-400 leading-relaxed italic">&quot;تخيل موقعك كما تريده، وسأقوم بهندسته لك في ثوانٍ. اضغط على أي عنصر وابدأ الحوار.&quot;</p>
            </div>
        </div>
      </aside>

      {/* Workspace Canvas */}
      <section className="flex-1 bg-[#0a0a0a] overflow-hidden relative flex flex-col">
        {/* Device & Toolbar */}
        <div className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8 shrink-0 backdrop-blur-xl">
           <div className="flex items-center gap-6">
             <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
               <button onClick={() => setViewMode("desktop")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === "desktop" ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><MaximizeIcon className="w-3 h-3" /> ديسكتوب</button>
               <button onClick={() => setViewMode("mobile")} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${viewMode === "mobile" ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}><SmartphoneIcon className="w-3 h-3" /> جوال</button>
             </div>
             <div className="h-4 w-[1px] bg-slate-800" />
             <div className="flex items-center gap-2 px-3 py-1 bg-slate-950 rounded-lg border border-slate-800">
               <MousePointer2Icon className="w-3 h-3 text-red-500" />
               <span className="text-[10px] font-black text-slate-500 uppercase">Focus & Annotate Mode ACTIVE</span>
             </div>
           </div>

           <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setDesign({});
                  toast.success("تم تصفير التصميم، عدنا للبداية!");
                }}
                className="text-xs text-slate-500 hover:text-white transition-all flex items-center gap-1"
              >
                <RefreshCcwIcon className="w-3 h-3" /> تصفير
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
