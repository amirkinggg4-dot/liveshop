"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — تماس با پشتیبانی (فرم ساده mock) + کانال‌های تماس
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { toast } from "sonner";
import { Clock, Headset, Mail, MessageCircleMore, Send } from "lucide-react";
import { PageHeader } from "@/components/liveshop/shared";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

const CHANNELS: Array<{ icon: typeof Mail; title: string; value: string; note: string }> = [
  { icon: MessageCircleMore, title: "چت پشتیبانی", value: "داخل اپ، هر روز", note: "پاسخ در چند دقیقه" },
  { icon: Mail, title: "ایمیل", value: "support@liveshop.example", note: "پاسخ حداکثر ۲۴ ساعت" },
  { icon: Clock, title: "ساعات پاسخ‌گویی", value: "۹ صبح تا ۹ شب", note: "همهٔ روزها" },
];

export default function SupportView() {
  const back = useAppStore((s) => s.back);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<{ subject?: string; body?: string }>({});
  const [sent, setSent] = useState(false);

  const onSubmit = () => {
    const next: { subject?: string; body?: string } = {};
    if (!subject.trim()) next.subject = "موضوع را وارد کن";
    if (body.trim().length < 10) next.body = "توضیح حداقل ۱۰ کاراکتر باشد";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSent(true);
    toast.success("پیامت ثبت شد — کارشناس پشتیبانی جواب می‌دهد (دمو)");
  };

  return (
    <div className="flex flex-1 flex-col" aria-label="پشتیبانی">
      <PageHeader title="تماس با پشتیبانی" onBack={back} />

      <div className="px-4 py-4 space-y-5">
        {/* ── کانال‌ها ── */}
        <section className="grid grid-cols-1 gap-2" aria-label="کانال‌های تماس">
          {CHANNELS.map((c) => (
            <div key={c.title} className="flex items-center gap-3 bg-ls-card border border-white/5 rounded-2xl p-3.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ls-card-2 text-ls-purple-soft">
                <c.icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold">{c.title}</p>
                <p className="mt-0.5 text-[11px] text-white/55" dir={c.title === "ایمیل" ? "ltr" : undefined}>
                  {c.value}
                </p>
              </div>
              <span className="shrink-0 text-[10px] text-white/35">{c.note}</span>
            </div>
          ))}
        </section>

        {/* ── فرم ── */}
        <section className="bg-ls-card border border-white/5 rounded-2xl p-4 space-y-3" aria-label="فرم درخواست پشتیبانی">
          <p className="flex items-center gap-1.5 text-sm font-extrabold">
            <Headset className="h-4 w-4 text-ls-purple-soft" aria-hidden />
            درخواست پشتیبانی
          </p>

          <div className="space-y-1.5">
            <label htmlFor="sp-subject" className="text-xs font-bold text-white/70">
              موضوع
            </label>
            <input
              id="sp-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              aria-invalid={!!errors.subject}
              placeholder="مثلاً: سفارشم ارسال نشده"
              className={cn(
                "h-12 w-full rounded-xl border bg-ls-card-2 px-3 text-sm outline-none transition-colors",
                errors.subject ? "border-red-400/60" : "border-white/10 focus:border-ls-purple/70"
              )}
            />
            {errors.subject && (
              <p role="alert" className="text-[11px] font-bold text-red-400">
                {errors.subject}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="sp-body" className="text-xs font-bold text-white/70">
              توضیح
            </label>
            <textarea
              id="sp-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              aria-invalid={!!errors.body}
              placeholder="چه اتفاقی افتاده؟ شمارهٔ سفارش را هم بنویس…"
              className={cn(
                "w-full rounded-xl border bg-ls-card-2 p-3 text-sm leading-6 outline-none transition-colors",
                errors.body ? "border-red-400/60" : "border-white/10 focus:border-ls-purple/70"
              )}
            />
            {errors.body && (
              <p role="alert" className="text-[11px] font-bold text-red-400">
                {errors.body}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onSubmit}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ls-purple text-sm font-black text-white transition-all hover:bg-ls-purple/90 active:scale-[.98]"
            aria-label="ارسال درخواست پشتیبانی"
          >
            <Send className="h-4 w-4 -scale-x-100" aria-hidden />
            {sent ? "ارسال شد" : "ارسال درخواست"}
          </button>

          {sent && (
            <p className="rounded-xl border border-ls-green/30 bg-ls-green/10 px-3 py-2 text-center text-[11px] font-bold text-ls-green">
              رسید درخواست: SP-{new Date().getFullYear()}۸۳۴۲ — پیگیری در همین صفحه (دمو)
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
