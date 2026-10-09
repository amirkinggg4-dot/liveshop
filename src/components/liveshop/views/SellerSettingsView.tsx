"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Lock, Trash2, Wallet } from "lucide-react";
import { DANGER, NOTIF_PREFS, SHEBA_MASKED } from "@/lib/data/seller-marketing";
import type { NotifPref } from "@/lib/data/seller-marketing";
import { useAppStore } from "@/store/app-store";
import { PageHeader, SectionTitle } from "@/components/liveshop/shared";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   تنظیمات فروشنده — فاز ۳
   تسویه (شبأ ماسک‌شده)، اعلان‌ها، روش ارسال پیش‌فرض،
   زبان و نمایش، و ناحیهٔ خطر (تعطیلی موقت / حذف حساب).
   ───────────────────────────────────────────────────────────── */

const SHIPPING_OPTIONS = [
  { id: "tipax", label: "تیپاکس", emoji: "🚚", desc: "ارسال ۲۴ ساعته — پوشش سراسری" },
  { id: "post", label: "پست پیشتاز", emoji: "📮", desc: "اقتصادی برای شهرستان‌ها" },
  { id: "peyk", label: "پیک شهری", emoji: "🛵", desc: "سریع، داخل همان شهر" },
] as const;

type ShippingOptionId = (typeof SHIPPING_OPTIONS)[number]["id"];

export default function SellerSettingsView() {
  const back = useAppStore((s) => s.back);

  /* اعلان‌ها — مقدار اولیه از دیتا (بدون setState در effect) */
  const [prefs, setPrefs] = useState<NotifPref[]>(() => NOTIF_PREFS.map((p) => ({ ...p })));
  const [shipping, setShipping] = useState<ShippingOptionId>("tipax");
  const [storeClosed, setStoreClosed] = useState(false);

  const togglePref = (id: string, on: boolean) =>
    setPrefs((arr) => arr.map((p) => (p.id === id ? { ...p, on } : p)));

  return (
    <div className="flex-1 flex flex-col" aria-label="تنظیمات فروشنده">
      <PageHeader
        title="تنظیمات فروشنده"
        subtitle="تسویه، اعلان‌ها و ارسال"
        onBack={back}
      />

      <div className="space-y-4 px-4 py-4">
        {/* ── تسویه ── */}
        <div>
          <SectionTitle title="تسویه" icon="🏦" />
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-ls-card p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ls-card-2">
              <Wallet className="h-5 w-5 text-ls-purple-soft" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-white/45">شبأ تسویه</p>
              <p
                dir="ltr"
                className="mt-0.5 truncate text-left font-mono text-sm font-bold text-white/85"
              >
                {SHEBA_MASKED}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast("ویرایش شبا (دمو)")}
              className="shrink-0 rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-bold text-white/70 transition-colors hover:bg-white/5"
              aria-label="ویرایش شبأ تسویه"
            >
              ویرایش شبا
            </button>
          </div>
        </div>

        {/* ── اعلان‌ها ── */}
        <div>
          <SectionTitle title="اعلان‌ها" icon="🔔" />
          <div className="rounded-2xl border border-white/5 bg-ls-card p-4">
            {prefs.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "flex items-center justify-between gap-3 py-2.5",
                  i > 0 && "border-t border-white/5"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{p.title}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-white/45">{p.desc}</p>
                </div>
                <Switch
                  checked={p.on}
                  onCheckedChange={(v) => togglePref(p.id, v)}
                  aria-label={`اعلان ${p.title}`}
                  className="data-[state=checked]:bg-ls-purple"
                />
              </div>
            ))}
          </div>
        </div>

        {/* ── ارسال پیش‌فرض ── */}
        <div>
          <SectionTitle title="ارسال پیش‌فرض" icon="📦" />
          <div className="space-y-2" role="radiogroup" aria-label="روش ارسال پیش‌فرض">
            {SHIPPING_OPTIONS.map((opt) => {
              const selected = shipping === opt.id;
              return (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setShipping(opt.id)}
                  role="radio"
                  aria-checked={selected}
                  aria-label={`روش ارسال ${opt.label}`}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right transition-colors",
                    selected
                      ? "border-ls-purple bg-ls-purple/10"
                      : "border-white/5 bg-ls-card hover:border-white/15"
                  )}
                >
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-ls-card-2 flex items-center justify-center text-lg" aria-hidden>
                    {opt.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{opt.label}</p>
                    <p className="mt-0.5 text-[11px] text-white/45">{opt.desc}</p>
                  </div>
                  {selected && (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ls-purple">
                      <Check className="h-3.5 w-3.5 text-white" aria-hidden />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── زبان و نمایش ── */}
        <div>
          <SectionTitle title="زبان و نمایش" icon="🌐" />
          <div className="rounded-2xl border border-white/5 bg-ls-card p-4">
            <div className="flex items-center justify-between gap-3 py-1">
              <p className="text-sm font-bold">فارسی — راست‌چین</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ls-card-2 px-2.5 py-1 text-[10px] font-bold text-white/55">
                <Lock className="h-3 w-3" aria-hidden />
                قفل
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-white/5 pt-2">
              <p className="text-sm font-bold">تم تیره</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-ls-purple/40 bg-ls-purple/15 px-2.5 py-1 text-[10px] font-bold text-ls-purple-soft">
                همیشه فعال
              </span>
            </div>
          </div>
        </div>

        {/* ── ناحیهٔ خطر ── */}
        <div>
          <SectionTitle title="ناحیهٔ خطر" icon="⚠️" />
          <div className="space-y-4 rounded-2xl border border-ls-pink/30 bg-ls-pink/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">{DANGER.storeCloseTitle}</p>
                <p className="mt-0.5 text-[11px] leading-5 text-white/45">
                  {DANGER.storeCloseDesc}
                </p>
              </div>
              <Switch
                checked={storeClosed}
                onCheckedChange={(v) => {
                  setStoreClosed(v);
                  toast(v ? "فروشگاه موقتاً تعطیل شد (دمو)" : "فروشگاه دوباره باز شد");
                }}
                aria-label="تعطیلی موقت فروشگاه"
                className="data-[state=checked]:bg-[#FF3B5C]"
              />
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FF3B5C] text-sm font-extrabold text-white transition-transform active:scale-[.98]"
                  aria-label="حذف حساب فروشندگی"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                  حذف حساب
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent
                className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
                aria-label="تأیید حذف حساب"
              >
                <AlertDialogHeader className="text-right sm:text-right">
                  <AlertDialogTitle>{DANGER.deleteAccountTitle}</AlertDialogTitle>
                  <AlertDialogDescription className="text-xs leading-6">
                    {DANGER.deleteAccountDesc} — {DANGER.deleteAccountHint}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-row-reverse gap-2 sm:flex-row-reverse">
                  <AlertDialogAction
                    className="flex-1 bg-[#FF3B5C] text-white hover:bg-[#FF3B5C]/90"
                    onClick={() => toast("دمو — حسابی حذف نشد 😌")}
                  >
                    {DANGER.confirmLabel}
                  </AlertDialogAction>
                  <AlertDialogCancel className="flex-1">
                    {DANGER.cancelLabel}
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
