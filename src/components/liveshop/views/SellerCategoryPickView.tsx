"use client";

import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { faNum } from "@/lib/format";
import { CATEGORIES } from "@/lib/data/categories";
import {
  MAX_SELLER_CATEGORIES,
  primarySellerCategory,
  toggleSellerCategory,
} from "@/lib/seller-category-pick";
import { useAppStore } from "@/store/app-store";
import {
  useSellerOnboardingStore,
} from "@/store/seller-onboarding-store";
import { useSellerIntroStore } from "@/store/seller-intro-store";
import { SmartImg } from "@/components/liveshop/shared";
import { SELLER_ONBOARDING_TOTAL_STEPS } from "@/lib/seller-onboarding-steps";

/* ─────────────────────────────────────────────────────────────
   v2.0.2 — مرحلهٔ ۱ ثبت‌نام فروشنده: انتخاب دسته (صفحهٔ تمام‌صفحه)
   پس از «شروع» در شیت معرفی (و ورود در صورت مهمان) به اینجا می‌آید و
   با «بعدی» به مرحلهٔ ۲ (انتخاب زیرمجموعه) می‌رود — v2.0.3.
   ─ شبکهٔ ۳ ستونه از کاشی‌های مربع با عکس دسته‌های کاوش (منبع واحد:
     CATEGORIES در lib/data/categories — عکس فقط از public خود پروژه).
   ─ انتخاب چندتایی تا ۳: حاشیهٔ رنگی + تیک؛ اولین انتخاب نشان
     «اصلی» می‌گیرد؛ انتخاب چهارم → toast «حداکثر ۳ دسته»؛ لمس دوباره
     = حذف (حذف اصلی، اصلی را به بعدی جابه‌جا می‌کند).
   ─ پایین ثابت: نوار پیشرفت (مرحله ۱ از ۵ — v2.0.3: کل مراحل ۵ است)
     + «بعدی» تا حداقل ۱ انتخاب غیرفعال است.
   ─ پیشرفت در استور seller-onboarding (categoryDraft) ذخیره می‌شود تا
     با بستن و برگشتن از همین‌جا ادامه دهد؛ با حذف دسته، زیرمجموعه‌هایش
     هم از draft مرحلهٔ بعد پاک می‌شود.
   ─ بالا: فلش برگشت (به شیت معرفی) و ✕ (خروج با تأیید «پیشرفتت
     ذخیره می‌شود؟»).
   متن و ارقام فارسی، RTL، بدون ایموجی؛ هدف لمسی ≥۴۴px؛ ARIA گروه
   چک‌باکس‌ها.
   ───────────────────────────────────────────────────────────── */

/* v2.0.3 — کل مراحل wizard از تک‌منبع مشترک (مرحلهٔ این صفحه = ۱ دسته) */
const WIZARD_TOTAL_STEPS = SELLER_ONBOARDING_TOTAL_STEPS;
const WIZARD_STEP = 1;

export default function SellerCategoryPickView() {
  const back = useAppStore((s) => s.back);
  const setRoot = useAppStore((s) => s.setRoot);
  const push = useAppStore((s) => s.push);
  const openIntro = useSellerIntroStore((s) => s.openIntro);
  const categoryDraft = useSellerOnboardingStore((s) => s.categoryDraft);
  const setCategoryDraft = useSellerOnboardingStore(
    (s) => s.setCategoryDraft
  );

  /* بازگشت به شیت معرفی: یک پله پایین در پشته + باز کردن دوبارهٔ شیت */
  const onBackToSheet = () => {
    back();
    openIntro();
  };

  /* پیشرفت قبلی — از استور (بقا بعد از بستن و برگشتن) */
  const [selected, setSelected] = useState<string[]>(
    () => categoryDraft ?? []
  );
  const [exitOpen, setExitOpen] = useState(false);

  const onToggle = (id: string) => {
    const r = toggleSellerCategory(selected, id);
    setSelected(r.selected);
    setCategoryDraft(r.selected); /* ذخیرهٔ زندهٔ پیشرفت */
    if (!r.ok) toast.error(r.message);
  };

  /* «بعدی» — مرحلهٔ ۲: انتخاب زیرمجموعه (دسته‌ها همین لحظه در استورند) */
  const onNext = () => {
    push("sellerSubcategoryPick");
  };

  /* خروج با تأیید — پیشرفت در استور مانده است */
  const onExit = () => {
    setExitOpen(false);
    setRoot("home");
  };

  const primary = primarySellerCategory(selected);

  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-label="انتخاب دستهٔ فروش">
      {/* ── سربرگ: برگشت به شیت معرفی + خروج با تأیید ── */}
      <div className="flex items-center justify-between px-3 pt-3">
        <button
          type="button"
          onClick={onBackToSheet}
          aria-label="بازگشت به شیت معرفی فروشندگی"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setExitOpen(true)}
          aria-label="خروج از ثبت‌نام فروشندگی"
          className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>
      </div>

      {/* ── عنوان و زیرعنوان ── */}
      <div className="px-4 pt-1">
        <h1 className="text-lg font-black leading-7">
          کدام دسته را بیشتر می‌فروشی؟
        </h1>
        <p className="mt-1 text-xs leading-5 text-white/55">
          هر وقت خواستی دسته‌های بیشتری اضافه کن
        </p>
      </div>

      {/* ── شبکهٔ ۳ ستونهٔ کاشی‌های دسته — اسکرول عمودی روان ── */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 [scrollbar-width:thin]"
        aria-label="فهرست دسته‌ها"
      >
        <div
          role="group"
          aria-label={`انتخاب دسته‌ها — حداکثر ${faNum(MAX_SELLER_CATEGORIES)} دسته`}
          className="grid grid-cols-3 gap-2.5"
        >
          {CATEGORIES.map((c) => {
            const isSel = selected.includes(c.id);
            const isPrimary = isSel && primary === c.id;
            const name = c.nameFa ?? c.label;
            return (
              <button
                key={c.id}
                type="button"
                role="checkbox"
                aria-checked={isSel}
                aria-label={`دستهٔ ${name}${isPrimary ? " — اصلی" : isSel ? " — انتخاب‌شده" : ""}`}
                onClick={() => onToggle(c.id)}
                className={cn(
                  "relative flex flex-col rounded-2xl border-2 p-1.5 pb-1.5 text-center transition-all active:scale-[.97]",
                  isSel
                    ? "border-ls-purple bg-ls-purple/10"
                    : "border-white/10 bg-ls-card/60 hover:border-white/25"
                )}
              >
                {/* تیک انتخاب — گوشهٔ چپ (انتها در RTL) */}
                {isSel && (
                  <span
                    className="absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-ls-purple text-white shadow-md shadow-ls-purple/40"
                    aria-hidden
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                )}
                {/* نشان «اصلی» — فقط اولین انتخاب */}
                {isPrimary && (
                  <span className="absolute right-1 top-1 rounded-full bg-ls-pink px-1.5 py-0.5 text-[9px] font-black leading-3 text-white">
                    اصلی
                  </span>
                )}
                <span className="relative aspect-square w-full overflow-hidden rounded-xl ring-1 ring-white/10">
                  {c.image ? (
                    <SmartImg
                      src={c.image}
                      alt=""
                      sizes="(max-width: 768px) 33vw, 120px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-ls-card-2 text-lg" aria-hidden>
                      {c.emoji}
                    </span>
                  )}
                </span>
                <span className="mt-1.5 w-full break-words px-0.5 text-[11px] font-bold leading-4 text-white/90">
                  {name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── نوار پایین ثابت: پیشرفت + بعدی ── */}
      <div className="shrink-0 border-t border-white/5 bg-ls-bg/95 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-3 backdrop-blur-md">
        <div className="mb-3 flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={WIZARD_TOTAL_STEPS}
            aria-valuenow={WIZARD_STEP}
            aria-label={`مرحلهٔ ${faNum(WIZARD_STEP)} از ${faNum(WIZARD_TOTAL_STEPS)} ثبت‌نام فروشندگی`}
            className="flex flex-1 gap-1.5"
          >
            {Array.from({ length: WIZARD_TOTAL_STEPS }).map((_, i) => (
              <span
                key={i}
                aria-hidden
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i < WIZARD_STEP ? "bg-ls-purple" : "bg-white/10"
                )}
              />
            ))}
          </div>
          <span className="shrink-0 text-[11px] font-bold text-white/60">
            مرحله {faNum(WIZARD_STEP)} از {faNum(WIZARD_TOTAL_STEPS)}
          </span>
        </div>
        <button
          type="button"
          onClick={onNext}
          disabled={selected.length < 1}
          aria-label={
            selected.length < 1
              ? "بعدی — برای فعال شدن حداقل یک دسته انتخاب کن"
              : "بعدی — رفتن به انتخاب زیرمجموعه‌ها"
          }
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all active:scale-[.99]",
            selected.length >= 1
              ? "bg-ls-pink text-white shadow-lg shadow-ls-pink/30 hover:bg-ls-pink/90"
              : "cursor-not-allowed bg-ls-card-2 text-white/40"
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          بعدی
        </button>
      </div>

      {/* ── خروج با تأیید ── */}
      <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialogContent dir="rtl" className="max-w-sm rounded-2xl border-white/10 bg-ls-card text-right">
          <AlertDialogHeader className="space-y-2 text-right">
            <AlertDialogTitle className="text-base font-black">
              از ثبت‌نام فروشندگی خارج می‌شوی؟
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-5 text-white/65">
              پیشرفتت ذخیره می‌شود — انتخاب دسته‌هایت می‌ماند و با برگشتن از
              همین‌جا ادامه می‌دهی.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction
              onClick={onExit}
              aria-label="خروج از ثبت‌نام"
              className="flex-1 rounded-xl bg-ls-pink text-sm font-black text-white hover:bg-ls-pink/90"
            >
              خروج
            </AlertDialogAction>
            <AlertDialogCancel
              aria-label="ادامهٔ ثبت‌نام"
              className="flex-1 rounded-xl border-white/10 bg-ls-card-2 text-sm font-extrabold text-white/80 hover:text-white"
            >
              ادامه
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
