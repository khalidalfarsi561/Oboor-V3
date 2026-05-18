"use client";
import React from "react";

interface Props { children: React.ReactNode; fallback?: React.ReactNode; }
interface State { hasError: boolean; }

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false }; }

  static getDerivedStateFromError(): State { return { hasError: true }; }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center text-red-600 font-medium">
          حدث خطأ في تحميل هذا القسم. يرجى تحديث الصفحة.
        </div>
      );
    }
    return this.props.children;
  }
}
