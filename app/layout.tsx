import type { Metadata } from 'next';
import { Tajawal, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from './components/AuthProvider';
import { Toaster } from 'sonner';

const tajawal = Tajawal({
  subsets: ['arabic'],
  weight: ['200', '300', '400', '500', '700', '800', '900'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'متجر المكافآت',
  description: 'احصل على رصيد مجاني عن طريق تخطي الروابط واسترداده في متجر المكافآت.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'متجر المكافآت',
    description: 'احصل على رصيد مجاني عن طريق تخطي الروابط.',
    type: 'website',
    locale: 'ar_SA',
  },
  twitter: {
    card: 'summary',
    title: 'متجر المكافآت',
    description: 'احصل على رصيد مجاني عن طريق تخطي الروابط.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className={`${tajawal.className} bg-slate-50 text-slate-900 antialiased min-h-screen flex flex-col scroll-smooth`} suppressHydrationWarning>
        <AuthProvider>
          {children}
          <Toaster theme="light" position="bottom-center" dir="rtl" />
        </AuthProvider>
      </body>
    </html>
  );
}
