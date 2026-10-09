import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "LiveShop — خرید زنده با قیمت ثابت",
  description:
    "پلتفرم ایرانی لایو شاپ: فروشنده زنده کالا را نشان می‌دهد و تو همان لحظه با قیمت ثابت می‌خری — پرداخت امانی، دمو با داده‌های آزمایشی",
  keywords: ["LiveShop", "خرید زنده", "لایو شاپینگ", "قیمت ثابت", "فروش زنده"],
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='0.9em' font-size='88'%3E%F0%9F%9B%8D%EF%B8%8F%3C/text%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0a12",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="dark" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans">
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root layout in App Router */}
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        {children}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
