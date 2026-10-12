"use client";

/* ─────────────────────────────────────────────────────────────
   v2.0.1 — سؤالات متداول فروشنده (FAQ مخصوص فروشنده)
   مقصد دکمهٔ «سؤالات متداول فروشنده» در شیت معرفی فروشندگی.
   ساختار همان FaqView خریدار است (آکاردئون موضوعی + بج پیش‌نویس)؛
   متن‌ها با fees.ts (پلکان کارمزد) و جریان onboarding v1.9.1
   هم‌راستاست. بدون ایموجی.
   ───────────────────────────────────────────────────────────── */

import { ChevronDown, ScrollText } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/liveshop/shared";
import { useAppStore } from "@/store/app-store";
import { DraftBadge } from "@/components/liveshop/trust-badge";
import { cn } from "@/lib/utils";

type Topic = "start" | "fees" | "escrow" | "shipping" | "disputes";

const FAQS: Array<{ topic: Topic; q: string; a: string }> = [
  {
    topic: "start",
    q: "برای فروشنده شدن چه مدارکی لازم است؟",
    a: "نام فروشگاه و شناسهٔ عمومی، کد ملی و شماره شبا برای تسویه، و عکس مدرک هویتی. بررسی درخواست حداکثر ۴۸ ساعت کاری طول می‌کشد و نتیجه در صندوق ورودی اعلام می‌شود.",
  },
  {
    topic: "start",
    q: "درخواستم رد شد؛ چه کنم؟",
    a: "دلیل رد در کارت وضعیت فروشندگی نمایش داده می‌شود. پس از اصلاح، «ویرایش و ارسال دوباره» را بزن تا درخواستت دوباره در صف بررسی قرار بگیرد.",
  },
  {
    topic: "start",
    q: "چه زمانی می‌توانم پخش زنده شروع کنم؟",
    a: "بعد از تأیید فروشندگی، از «اتاق آماده‌به‌پخش» لایو را شروع کن؛ کالاها را از انبار به شو اضافه کن و قیمت ثابت هر کالا را ثبت کن.",
  },
  {
    topic: "fees",
    q: "کارمزد فروشنده چند درصد است؟",
    a: "کارمزد پلکانی است و فقط از فروش موفق کسر می‌شود: تا ۵۰ میلیون تومان فروش در ماه ۸٪، تا ۱۵۰ میلیون تومان ۵٪ و بیشتر از آن ۳٪. جزئیات کامل همیشه در «نرخ‌ها و کارمزدها» قابل مشاهده است.",
  },
  {
    topic: "fees",
    q: "هزینهٔ ارسال را چه کسی می‌پردازد؟",
    a: "هزینهٔ ارسال جداگانه از خریدار دریافت می‌شود و به مبلغ کالای تو اضافه نمی‌شود؛ تسویهٔ تو روی قیمت ثابت کالا حساب می‌شود.",
  },
  {
    topic: "escrow",
    q: "پول فروشم کی تسویه می‌شود؟",
    a: "مبلغ هر خرید نزد LiveShop امانت می‌ماند. بعد از اینکه خریدار «تحویل گرفتم» را بزند یا ۳ روز از تحویل بگذرد، مبلغ به کیف پول فروشندگی‌ات آزاد می‌شود.",
  },
  {
    topic: "shipping",
    q: "مهلت ارسال سفارش چقدر است؟",
    a: "بعد از خرید، سفارش را ظرف ۲۴ ساعت آماده و ارسال کن و کد رهگیری را ثبت کن. در غیر این صورت خریدار می‌تواند سفارش را لغو کند و مبلغ کامل به او برگردد.",
  },
  {
    topic: "disputes",
    q: "اگر خریدار اختلاف ثبت کند چه می‌شود؟",
    a: "پرونده توسط تیم پشتیبانی بررسی می‌شود و نتیجه (بازپرداخت به خریدار یا آزادسازی مبلغ به تو) در تایم‌لاین سفارش ثبت می‌شود. در پروندهٔ اصالت کالا، بار اثبات با فروشنده است.",
  },
];

const TOPIC_TITLES: Record<Topic, string> = {
  start: "شروع فروشندگی",
  fees: "کارمزد",
  escrow: "تسویه امانی",
  shipping: "ارسال",
  disputes: "اختلاف",
};

const TOPIC_ORDER: Topic[] = [
  "start",
  "fees",
  "escrow",
  "shipping",
  "disputes",
];

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
          className={cn(
            "h-4 w-4 shrink-0 text-white/40 transition-transform",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open && (
        <p className="px-4 pb-4 text-xs leading-6 text-white/60">{a}</p>
      )}
    </div>
  );
}

export default function SellerFaqView() {
  const back = useAppStore((s) => s.back);
  return (
    <div className="flex flex-1 flex-col" aria-label="سؤالات متداول فروشنده">
      <PageHeader
        title="سؤالات متداول فروشنده"
        onBack={back}
        trailing={<DraftBadge />}
      />
      <div className="px-4 py-4 space-y-5">
        {TOPIC_ORDER.map((topic) => (
          <section
            key={topic}
            className="space-y-2"
            aria-label={TOPIC_TITLES[topic]}
          >
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
