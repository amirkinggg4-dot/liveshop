"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — سؤالات متداول (آکاردئون: امانی، ارسال، بازگشت کالا،
   اختلاف، کیف پول) — متن‌ها پیش‌نویس دمو هستند.
   ───────────────────────────────────────────────────────────── */

import { ChevronDown, ScrollText } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/liveshop/shared";
import { useAppStore } from "@/store/app-store";
import { DraftBadge } from "@/components/liveshop/trust-badge";
import { cn } from "@/lib/utils";

type Topic = "escrow" | "shipping" | "returns" | "disputes" | "wallet";

const FAQS: Array<{ topic: Topic; q: string; a: string }> = [
  {
    topic: "escrow",
    q: "پرداخت امانی یعنی چه؟",
    a: "پول تو بلافاصله به فروشنده نمی‌رسد؛ نزد LiveShop امانت می‌ماند. بعد از اینکه «تحویل گرفتم» را بزنی یا ۳ روز بعد از تحویل، پول به فروشنده آزاد می‌شود.",
  },
  {
    topic: "escrow",
    q: "اگر از خرید پشیمان شوم چه کنم؟",
    a: "تا قبل از ارسال، دکمهٔ «لغو سفارش» را بزن — مبلغ همان لحظه به کیف پولت برمی‌گردد. بعد از ارسال می‌توانی «گزارش مشکل» ثبت کنی.",
  },
  {
    topic: "shipping",
    q: "سفارش چه زمانی ارسال می‌شود؟",
    a: "فروشنده باید ظرف ۲۴ ساعت بعد از خرید، سفارش را آماده و ارسال کند و کد رهگیری را ثبت کند. در صورت تأخیر، امکان لغو و بازگشت کامل مبلغ داری.",
  },
  {
    topic: "shipping",
    q: "هزینهٔ ارسال را چه کسی می‌دهد؟",
    a: "هزینهٔ ارسال در صفحهٔ پرداخت جدا نمایش داده می‌شود و با قیمت کالا جمع می‌شود — هیچ هزینهٔ پنهانی بعداً اضافه نمی‌شود.",
  },
  {
    topic: "returns",
    q: "بازگشت کالا چطور است؟",
    a: "اگر کالا با توضیحات مطابق نبود یا آسیب‌دیده بود، تا ۷۲ ساعت بعد از تحویل «گزارش مشکل» بزن؛ کارشناس پرونده را بررسی و نتیجه (بازپرداخت یا آزادسازی) را در تایم‌لاین سفارش می‌نویسد.",
  },
  {
    topic: "returns",
    q: "کالای اصل چطور تضمین می‌شود؟",
    a: "فروشنده‌ها هنگام ثبت کالا اصالت را تأیید می‌کنند و در پروندهٔ اختلاف، بار اثبات با فروشنده است. کالای تقلبی یعنی بازگشت کامل مبلغ به تو.",
  },
  {
    topic: "disputes",
    q: "اختلاف را کی حل می‌کند؟",
    a: "تیم پشتیبانی LiveShop پرونده را بررسی می‌کند و نتیجه (بازپرداخت به تو یا آزادسازی به فروشنده) در بخش «پیگیری اختلاف» همان سفارش ثبت می‌شود.",
  },
  {
    topic: "disputes",
    q: "مهلت ثبت اختلاف چند ساعت است؟",
    a: "از لحظهٔ تحویل ۷۲ ساعت. قبل از ارسال، به‌جای اختلاف دکمهٔ «لغو سفارش» را می‌بینی.",
  },
  {
    topic: "wallet",
    q: "شارژ کیف پول چقدر می‌توانم باشد؟",
    a: "از ۵۰٬۰۰۰ تا ۵۰٬۰۰۰٬۰۰۰ تومان در هر بار. شارژ فوراً اعمال می‌شود و در خرید لایو یک‌کلیکه استفاده می‌شود.",
  },
  {
    topic: "wallet",
    q: "پول بازگشتی کجا می‌رود؟",
    a: "هر بازگشتی (لغو سفارش یا نتیجهٔ اختلاف) فوراً به کیف پولت برمی‌گردد و به‌عنوان تراکنش «بازگشت وجه» با لینک سفارش در تاریخچه می‌بینی.",
  },
];

const TOPIC_TITLES: Record<Topic, string> = {
  escrow: "پرداخت امانی",
  shipping: "ارسال",
  returns: "بازگشت کالا",
  disputes: "اختلاف",
  wallet: "کیف پول",
};

const TOPIC_ORDER: Topic[] = ["escrow", "shipping", "returns", "disputes", "wallet"];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-ls-card border border-white/5 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 p-4 text-right hover:bg-white/5 transition-colors"
        aria-label={`سؤال: ${q}`}
      >
        <span className="min-w-0 flex-1 text-xs font-bold leading-6">{q}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-white/40 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && (
        <p className="px-4 pb-4 text-xs leading-6 text-white/60">{a}</p>
      )}
    </div>
  );
}

export default function FaqView() {
  const back = useAppStore((s) => s.back);
  return (
    <div className="flex flex-1 flex-col" aria-label="سؤالات متداول">
      <PageHeader
        title="سؤالات متداول"
        onBack={back}
        trailing={<DraftBadge />}
      />
      <div className="px-4 py-4 space-y-5">
        {TOPIC_ORDER.map((topic) => (
          <section key={topic} className="space-y-2" aria-label={TOPIC_TITLES[topic]}>
            <h2 className="flex items-center gap-1.5 text-sm font-extrabold">
              <ScrollText className="h-4 w-4 text-ls-purple-soft" aria-hidden />
              {TOPIC_TITLES[topic]}
            </h2>
            <div className="space-y-2">
              {FAQS.filter((f) => f.topic === topic).map((f) => (
                <FaqItem key={f.q} q={f.q} a={f.a} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
