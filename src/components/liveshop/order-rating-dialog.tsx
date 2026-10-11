"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   v1.8.0 — دیالوگ امتیاز به فروشنده (بعد از RELEASED)
   ۵ ستاره + برچسب‌های آماده (بسته‌بندی عالی، اصل بود، سریع…) + متن اختیاری
   ═══════════════════════════════════════════════════════════════════════════ */

import { useState } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";
import { useOrdersStore } from "@/store/orders-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

/** برچسب‌های آمادهٔ امتیاز */
export const RATING_TAGS = [
  "بسته‌بندی عالی",
  "اصل بود",
  "ارسال سریع",
  "مطابق توضیحات",
  "پاسخگوی فروشنده",
] as const;

export default function OrderRatingDialog({
  orderId,
  sellerName,
  open,
  onOpenChange,
}: {
  orderId: string;
  sellerName: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const setRated = useOrdersStore((s) => s.setRated);
  const [stars, setStars] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState("");

  const toggleTag = (t: string) =>
    setTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

  const submit = () => {
    setRated(orderId, { stars, tags, ...(text.trim() ? { text: text.trim() } : {}) });
    toast.success("امتیاز تو ثبت شد — ممنون!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
        aria-label="ثبت امتیاز به فروشنده"
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>امتیاز به فروشنده</DialogTitle>
          <DialogDescription className="text-xs leading-6">
            تجربهٔ خریدت از {sellerName} چطور بود؟
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ستاره‌ها */}
          <div
            role="radiogroup"
            aria-label="امتیاز از ۵ ستاره"
            className="flex items-center justify-center gap-1.5 py-1"
          >
            {[1, 2, 3, 4, 5].map((i) => (
              <button
                key={i}
                role="radio"
                aria-checked={stars === i}
                aria-label={`${toFa(i)} ستاره`}
                onClick={() => setStars(i)}
                className="p-1 transition-transform hover:scale-110 active:scale-90"
              >
                <Star
                  className={cn(
                    "h-8 w-8 transition-colors",
                    i <= stars ? "fill-amber-300 text-amber-300" : "text-white/25"
                  )}
                  aria-hidden
                />
              </button>
            ))}
          </div>

          {/* برچسب‌های آماده */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="برچسب‌های آماده">
            {RATING_TAGS.map((t) => {
              const active = tags.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => toggleTag(t)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors",
                    active
                      ? "border-ls-green bg-ls-green/15 text-ls-green"
                      : "border-white/12 bg-ls-card-2 text-white/65 hover:border-white/25"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>

          {/* متن اختیاری */}
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="اگر دوست داری بنویس (اختیاری)…"
            aria-label="متن اختیاری نظر"
            rows={3}
            maxLength={300}
            className="rounded-xl bg-ls-card-2/70 border-white/10 text-sm min-h-20 text-right"
          />

          <button
            onClick={submit}
            className="h-11 w-full rounded-xl bg-ls-green text-sm font-black text-[#04281e] shadow-[0_8px_24px_rgba(0,200,150,.3)] transition-transform active:scale-[.98]"
            aria-label={`ثبت امتیاز ${toFa(stars)} ستاره`}
          >
            ثبت امتیاز
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
