"use client";

import React, { useState, useTransition } from "react";
import { Loader2, Send, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { askAdminAI } from "../../actions/admin";
import { useAuth } from "../../components/AuthProvider";

export default function AiAssistant() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    {
      role: "ai",
      text: "أهلاً! أنا مساعدك التقني لإرشادك في إدارة المشروع وتحليل المشاكل واقتراح التحسينات الآمنة.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isPending) return;

    const userPrompt = input.trim();
    setInput("");
    setMessages((prev) =>
      [...prev, { role: "user" as const, text: userPrompt }].slice(-30)
    );

    startTransition(async () => {
      try {
        if (!user) {
          throw new Error("غير مصرح.");
        }

        const idToken = await user.getIdToken();
        const res = await askAdminAI(idToken, userPrompt, []);

        if (res.success && res.text) {
          setMessages((prev) =>
            [...prev, { role: "ai" as const, text: res.text! }].slice(-30)
          );
        } else {
          throw new Error(res.error || "No response from AI.");
        }
      } catch (err: any) {
        console.error("AI Assistant Error:", err);
        setMessages((prev) =>
          [
            ...prev,
            { role: "ai" as const, text: `خطأ في الاتصال: ${err.message}` },
          ].slice(-30)
        );
      }
    });
  };

  return (
    <div className="flex h-[85vh] w-full max-w-4xl flex-col">
      <header className="mb-8">
        <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold text-white">
          <Bot className="h-10 w-10 text-red-500" />
          مساعد النظام الخبير
        </h1>
        <p className="text-slate-400">مساعد تقني لتحليل المشروع واقتراح تحسينات آمنة.</p>
      </header>

      <div className="flex flex-1 flex-col overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900 p-6 shadow-2xl lg:p-8">
        <div className="mb-6 flex flex-1 flex-col gap-6 overflow-y-auto pr-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${m.role === "user" ? "bg-red-600" : "border border-slate-700 bg-slate-800"}`}
              >
                {m.role === "user" ? (
                  <User className="h-5 w-5 text-white" />
                ) : (
                  <Bot className="h-5 w-5 text-red-500" />
                )}
              </div>
              <div
                className={`max-w-[85%] rounded-3xl px-6 py-4 leading-relaxed ${m.role === "user" ? "rounded-tr-sm bg-red-600 text-white" : "rounded-tl-sm bg-slate-800 text-slate-200"}`}
              >
                {m.role === "user" ? (
                  m.text
                ) : (
                  <div className="markdown-body text-slate-200">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isPending && (
            <div className="flex gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-800">
                <Bot className="h-5 w-5 animate-pulse text-red-500" />
              </div>
              <div className="flex items-center gap-2 rounded-3xl rounded-tl-sm bg-slate-800 px-6 py-4 text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                جعل الذكاء الاصطناعي يحلل...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            placeholder="اطلب تقريراً، اسأل عن الهندسة، أو اطلب تحليلاً لبياناتك..."
            className="w-full rounded-full border border-slate-800 bg-slate-950 px-8 py-5 pr-16 text-lg font-medium text-white transition-all placeholder:text-slate-600 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 focus:outline-none"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending || !input.trim()}
            className="focus:outline-square absolute top-1/2 right-3 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white transition-all hover:bg-red-700 disabled:opacity-50 disabled:hover:bg-red-600"
          >
            <Send className="ml-1 h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
