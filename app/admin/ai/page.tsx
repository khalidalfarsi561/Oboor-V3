"use client";

import React, { useState, useTransition } from "react";
import { Loader2, Send, Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { askAdminAI } from "../../actions/admin";

export default function AiAssistant() {
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    { role: 'ai', text: 'أهلاً أيها القائد! أنا مساعدك المدعوم بأقوى النماذج في الهندسة العكسية. أعرف بنية التخزين، المكونات، وواجهات الموقع. اسألني عن حالة النظام أو اطلب مني التعديلات!' }
  ]);
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!input.trim() || isPending) return;

    const userPrompt = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userPrompt }]);

    startTransition(async () => {
      try {
        const context = "User dashboard states: System is running smoothly. Drag and Drop builder is enabled.";
        const fullPrompt = `You are the master site-managing AI assistant.
Website Context: Next.js Vercel app matching Firestore rules. The Admin UI has visual drag and drop, and anti-fraud systems.
Current Status: ${context}
User Admin Query: ${userPrompt}`;

        const res = await askAdminAI(fullPrompt, []);
        
        if (res.success && res.text) {
          setMessages(prev => [...prev, { role: 'ai', text: res.text! }]);
        } else {
          throw new Error(res.error || "No response from AI.");
        }
      } catch (err: any) {
        console.error("AI Assistant Error:", err);
        setMessages(prev => [...prev, { role: 'ai', text: `خطأ في الاتصال: ${err.message}` }]);
      }
    });
  };

  return (
    <div className="w-full max-w-4xl flex flex-col h-[85vh]">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          <Bot className="w-10 h-10 text-red-500" />
          مساعد النظام الخبير
        </h1>
        <p className="text-slate-400">موصول مباشرة بقاعدة البيانات وكود المصدر.</p>
      </header>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-[32px] p-6 lg:p-8 flex flex-col overflow-hidden shadow-2xl">
        <div className="flex-1 overflow-y-auto mb-6 flex flex-col gap-6 pr-2">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-red-600' : 'bg-slate-800 border border-slate-700'}`}>
                {m.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-red-500" />}
              </div>
              <div className={`px-6 py-4 rounded-3xl max-w-[85%] leading-relaxed ${m.role === 'user' ? 'bg-red-600 text-white rounded-tr-sm' : 'bg-slate-800 text-slate-200 rounded-tl-sm'}`}>
                {m.role === 'user' ? m.text : (
                  <div className="markdown-body text-slate-200">
                    <ReactMarkdown>{m.text}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isPending && (
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Bot className="w-5 h-5 text-red-500 animate-pulse" />
              </div>
              <div className="px-6 py-4 bg-slate-800 rounded-3xl rounded-tl-sm text-slate-400 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                جعل الذكاء الاصطناعي يحلل...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className="relative">
          <input 
            type="text" 
            placeholder="اطلب تقريراً، اسأل عن الهندسة، أو اطلب تحليلاً لبياناتك..."
            className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-full px-8 py-5 pr-16 text-white placeholder:text-slate-600 focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all font-medium text-lg"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isPending}
          />
          <button 
            type="submit" 
            disabled={isPending || !input.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-50 disabled:hover:bg-red-600 focus:outline-square"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
      </div>
    </div>
  );
}
