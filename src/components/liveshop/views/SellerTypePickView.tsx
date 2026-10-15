"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight, Info, X } from "lucide-react";
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
import {
  SELLER_TYPE_REQUIRED_MESSAGE,
  type SellerTypeDraft,
} from "@/lib/seller-type-pick";
import {
  SELLER_TYPE_LABEL,
  identityChangeWarningMessage,
  type SellerType,
} from "@/lib/seller-identity";
import { profileChangeWarningMessage } from "@/lib/seller-profile-pick";
import { SELLER_ONBOARDING_TOTAL_STEPS } from "@/lib/seller-onboarding-steps";
import { useAppStore } from "@/store/app-store";
import {
  useSellerOnboardingStore,
} from "@/store/seller-onboarding-store";

/* ─────────────────────────────────────────────────────────────
   v2.0.4 — مرحلهٔ ۳ ثبت‌نام فروشنده: انتخاب نوع فروشنده (تمام‌صفحه)
   پس از «بعدی» مرحلهٔ زیرمجموعه می‌آید و با «بعدی» به مرحلهٔ ۴
   (ویژگی‌های فروش) می‌رود.
   ─ انتخاب تک‌گزینه‌ای (radio) بین «شخص حقیقی» و «شخص حقوقی
     (کسب‌وکار ثبت‌شده)»؛ دایرهٔ انتخاب در سمت راست (RTL) — کارت
     انتخاب‌شده حاشیهٔ بنفش می‌گیرد و دایره‌اش توپُر می‌شود.
   ─ یادداشت کوچک زیر کارت‌ها با برچسب «پیش‌نویس — نیاز به بازبینی
     حقوقی»: مدارک لازم در مرحلهٔ هویت بسته به انتخاب فرق دارد.
   ─ پایین ثابت: نوار پیشرفت «مرحله ۳ از ۶» + «بعدی» که تا انتخاب
     غیرفعال به‌نظر می‌رسد ولی لمس‌پذیر است تا هر دو کارت با حاشیهٔ
     قرمز و پیام «یکی را انتخاب کن» علامت بخورند (aria-disabled برای
     صفحه‌خوان — هم‌الگوی مرحلهٔ زیرمجموعه).
   ─ حفظ حالت: sellerTypeDraft ("individual" | "business" | null) در
     استور seller-onboarding با sessionStorage مثل مراحل قبل. تغییر
     نوع بعد از پر شدن فیلدهای مرحلهٔ ۵، فیلدهای ناسازگار را پاک
     می‌کند (هشدار toast با برچسب فیلدهای پاک‌شده).
   ─ بالا: فلش برگشت (به انتخاب زیرمجموعه با حفظ انتخاب‌ها؛ وقتی از
     کارت خلاصهٔ فرم باز شده، به خود فرم) و ✕ با همان دیالوگ تأیید
     خروج مراحل قبلی.
   متن و ارقام فارسی، RTL، بدون ایموجی؛ هدف لمسی ≥۴۴px؛ ARIA
   radiogroup/radio.
   ───────────────────────────────────────────────────────────── */

/* v2.0.4 — کل مراحل wizard از تک‌منبع مشترک (مرحلهٔ این صفحه = ۳ نوع) */
const WIZARD_TOTAL_STEPS = SELLER_ONBOARDING_TOTAL_STEPS;
const WIZARD_STEP = 3;

/** گزینه‌های این صفحه — ترتیب نمایش: حقیقی اول */
const SELLER_TYPE_OPTIONS: readonly SellerType[] = ["individual", "business"];

export default function SellerTypePickView() {
  const back = useAppStore((s) => s.back);
  const setRoot = useAppStore((s) => s.setRoot);
  const push = useAppStore((s) => s.push);
  /* v2.0.4 — این صفحه دو مسیر ورود دارد: «بعدی» مرحلهٔ زیرمجموعه
     (برگشت ← زیرمجموعه) یا لمس کارت «نوع فروشنده» در فرم «شروع فروش»
     (برگشت ← همان فرم). برچسب برگشت با مقصد واقعی پشته تطبیق داده می‌شود. */
  const prevView = useAppStore((s) => s.stack[s.stack.length - 2]?.view);
  const backLabel =
    prevView === "sellerOnboarding"
      ? "بازگشت به فرم شروع فروش"
      : "بازگشت به انتخاب زیرمجموعه‌ها";
  const storedDraft = useSellerOnboardingStore((s) => s.sellerTypeDraft);
  const setSellerTypeDraft = useSellerOnboardingStore(
    (s) => s.setSellerTypeDraft
  );

  /* پیشرفت قبلی — از استور (بقا بعد از بستن و برگشتن) */
  const [draft, setDraft] = useState<SellerTypeDraft>(() => storedDraft);
  const [showErrors, setShowErrors] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const selected = draft !== null;
  /* حاشیهٔ قرمز کارت‌ها فقط وقتی معنا دارد که هنوز هیچ انتخابی نیست */
  const noSelectionError = showErrors && draft === null;

  const onSelect = (type: SellerType) => {
    setDraft(type);
    /* تغییر نوع بعد از پر شدن فیلدهای مرحلهٔ ۵ → پاک‌شدن فیلدهای
       ناسازگار + پاک‌شدن draft ویژگی‌های فروش نسخهٔ دیگر (v2.0.5) —
       یک هشدار کوتاه فقط اگر داده‌ای پاک شده باشد */
    const r = setSellerTypeDraft(type);
    const warnings: string[] = [];
    if (r.clearedFields.length > 0) {
      warnings.push(identityChangeWarningMessage(r.clearedFields));
    }
    if (r.clearedProfileLabels.length > 0) {
      warnings.push(profileChangeWarningMessage(r.clearedProfileLabels));
    }
    if (warnings.length > 0) {
      toast.warning(warnings.join(" — "));
    }
  };

  /* «بعدی» — بدون انتخاب: علامت‌گذاری کارت‌ها (بدون رفتن)؛ با انتخاب:
     مرحلهٔ ۴ «ویژگی‌های فروش» (v2.0.5) */
  const onNext = () => {
    if (draft === null) {
      setShowErrors(true);
      return;
    }
    push("sellerProfilePick");
  };

  /* خروج با تأیید — پیشرفت در استور مانده است */
  const onExit = () => {
    setExitOpen(false);
    setRoot("home");
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-label="انتخاب نوع فروشنده"
    >
      {/* ── سربرگ: برگشت به زیرمجموعه + خروج با تأیید ── */}
      <div className="flex items-center justify-between px-3 pt-3">
        <button
          type="button"
          onClick={back}
          aria-label={backLabel}
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

      {/* ── عنوان ── */}
      <div className="px-4 pt-1">
        <h1 className="text-lg font-black leading-7">
          کدام گزینه بهتر تو را توصیف می‌کند؟
        </h1>
      </div>

      {/* ── دو کارت انتخاب تک‌گزینه‌ای (radio) ── */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 [scrollbar-width:thin]"
        aria-label="فهرست گزینه‌های نوع فروشنده"
      >
        <div
          role="radiogroup"
          aria-label="انتخاب نوع فروشنده"
          className="space-y-3"
        >
          {SELLER_TYPE_OPTIONS.map((type) => {
            const isSel = draft === type;
            return (
              <button
                key={type}
                type="button"
                role="radio"
                aria-checked={isSel}
                aria-label={SELLER_TYPE_LABEL[type]}
                onClick={() => onSelect(type)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-right transition-all active:scale-[.99]",
                  isSel
                    ? "border-ls-purple bg-ls-purple/10"
                    : noSelectionError
                      ? "border-ls-pink/70 bg-ls-card/60"
                      : "border-white/10 bg-ls-card/60 hover:border-white/25"
                )}
              >
                {/* دایرهٔ انتخاب — سمت راست (اولین فرزند در RTL) */}
                <span
                  aria-hidden
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSel
                      ? "border-ls-purple bg-ls-purple"
                      : "border-white/30 bg-transparent"
                  )}
                >
                  {isSel && (
                    <span className="h-2.5 w-2.5 rounded-full bg-white shadow-sm" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      "block text-sm font-black",
                      isSel ? "text-white" : "text-white/85"
                    )}
                  >
                    {SELLER_TYPE_LABEL[type]}
                  </span>
                  <span className="mt-1 block text-[11px] leading-5 text-white/55">
                    {type === "individual"
                      ? "به نام خودم می‌فروشم، نه به‌عنوان شرکت یا کسب‌وکار ثبت‌شده."
                      : "مالک یا کارمند یک شرکت یا کسب‌وکار رسمی ثبت‌شده‌ام."}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/* یادداشت پیش‌نویس — نیاز به بازبینی حقوقی */}
        <div
          className="mt-4 flex items-start gap-2 rounded-2xl border border-white/10 bg-ls-card/40 p-3"
          aria-label="یادداشت پیش‌نویس — نیاز به بازبینی حقوقی"
        >
          <span
            className="mt-0.5 shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-black leading-4 text-white/70"
            aria-hidden
          >
            پیش‌نویس — نیاز به بازبینی حقوقی
          </span>
          <p className="text-[11px] leading-5 text-white/55">
            <Info className="mb-0.5 me-1 inline h-3 w-3" aria-hidden />
            مدارک لازم در مرحله‌ی هویت بسته به انتخابت فرق دارد.
          </p>
        </div>

        {/* پیام خطای «انتخاب نشده» — بعد از لمس «بعدی» خالی */}
        {noSelectionError && (
          <p
            role="alert"
            className="mt-3 text-center text-[11px] font-bold text-ls-pink"
          >
            {SELLER_TYPE_REQUIRED_MESSAGE}
          </p>
        )}
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
        {/* بدون انتخاب: غیرفعال به‌نظر می‌رسد ولی لمس‌پذیر است تا کارت‌ها
            علامت بخورند — aria-disabled وضعیت را برای صفحه‌خوان می‌گوید */}
        <button
          type="button"
          onClick={onNext}
          aria-disabled={!selected}
          aria-label={
            selected
              ? "بعدی — رفتن به ویژگی‌های فروش"
              : "بعدی — برای ادامه یک گزینه انتخاب کن"
          }
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all active:scale-[.99]",
            selected
              ? "bg-ls-pink text-white shadow-lg shadow-ls-pink/30 hover:bg-ls-pink/90"
              : "cursor-not-allowed bg-ls-card-2 text-white/40"
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          بعدی
        </button>
      </div>

      {/* ── خروج با تأیید (همان دیالوگ مراحل قبلی) ── */}
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
