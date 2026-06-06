import type { Metadata } from "next";
import { Tajawal, Cairo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./components/AuthProvider";
import { Toaster } from "sonner";

const tajawal = Tajawal({
  subsets: ["arabic"],
  weight: ["400", "700"],
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["700", "900"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "متجر المكافآت",
  description: "احصل على رصيد مجاني عن طريق تخطي الروابط واسترداده في متجر المكافآت.",
  robots: { index: true, follow: true },
  openGraph: {
    title: "متجر المكافآت",
    description: "احصل على رصيد مجاني عن طريق تخطي الروابط.",
    type: "website",
    locale: "ar_SA",
  },
  twitter: {
    card: "summary",
    title: "متجر المكافآت",
    description: "احصل على رصيد مجاني عن طريق تخطي الروابط.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${tajawal.className} flex min-h-screen flex-col scroll-smooth bg-slate-50 text-slate-900 antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          {children}
          <Toaster theme="light" position="bottom-center" dir="rtl" />
        </AuthProvider>
      </body>
    </html>
  );
}
