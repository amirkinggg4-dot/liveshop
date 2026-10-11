"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — حریم خصوصی (پیش‌نویس دمو — نیاز به بازبینی حقوقی)
   ───────────────────────────────────────────────────────────── */

import { PageHeader } from "@/components/liveshop/shared";
import { DraftBadge } from "@/components/liveshop/trust-badge";
import { useAppStore } from "@/store/app-store";

const SECTIONS: Array<{ title: string; items: string[] }> = [
  {
    title: "چه داده‌هایی جمع می‌کنیم؟",
    items: [
      "شمارهٔ موبایل برای ورود و اعلان‌ها؛ نام و آدرس برای ارسال سفارش؛ تاریخچهٔ سفارش و تراکنش‌های کیف پول برای کارکرد سرویس.",
      "داده‌های پرداخت کارت شما نزد LiveShop ذخیره نمی‌شود؛ پرداخت از درگاه بانکی انجام می‌شود.",
    ],
  },
  {
    title: "داده‌ها با چه کسی به اشتراک گذاشته می‌شود؟",
    items: [
      "فروشنده فقط اطلاعات لازم برای ارسال (نام گیرنده، آدرس و موبایل) را می‌بیند.",
      "شرکت پیامک‌رسان فقط شمارهٔ موبایل را برای ارسال کد تأیید دریافت می‌کند.",
    ],
  },
  {
    title: "حقوق تو",
    items: [
      "هر زمان می‌توانی خروجی داده‌هایت را درخواست کنی یا حساب را حذف کنی (تنظیمات ← حذف حساب).",
      "نمایش خریدهایت در فید عمومی از تنظیمات قابل خاموش‌کردن است.",
    ],
  },
  {
    title: "نگهداری و امنیت",
    items: [
      "کدهای یک‌بارمصرف رمزنگاری‌شده و با مهلت ۲ دقیقه ذخیره می‌شوند و پس از استفاده می‌سوزند.",
      "این متن پیش‌نویس است و پیش از انتشار واقعی توسط مشاور حقوقی بازبینی می‌شود.",
    ],
  },
];

export default function PrivacyView() {
  const back = useAppStore((s) => s.back);
  return (
    <div className="flex flex-1 flex-col" aria-label="حریم خصوصی">
      <PageHeader title="حریم خصوصی" onBack={back} trailing={<DraftBadge />} />
      <div className="px-4 py-4 space-y-4">
        {SECTIONS.map((s) => (
          <section
            key={s.title}
            className="bg-ls-card border border-white/5 rounded-2xl p-4 space-y-2"
            aria-label={s.title}
          >
            <h2 className="text-xs font-extrabold">{s.title}</h2>
            <ul className="space-y-1.5">
              {s.items.map((it) => (
                <li key={it} className="text-[11px] leading-6 text-white/60">
                  {it}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
