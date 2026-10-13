"use client";

import { useState } from "react";
import { ArrowLeft, Check, ChevronRight, X } from "lucide-react";
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
import { categoryById } from "@/lib/data/categories";
import {
  SUBCATEGORY_REQUIRED_MESSAGE,
  missingSubcategories,
  syncSubcategoryDraft,
  toggleSubcategoryInDraft,
  type SubcategoryDraft,
} from "@/lib/seller-subcategory-pick";
import { SELLER_ONBOARDING_TOTAL_STEPS } from "@/lib/seller-onboarding-steps";
import { useAppStore } from "@/store/app-store";
import {
  useSellerOnboardingStore,
} from "@/store/seller-onboarding-store";

/* ─────────────────────────────────────────────────────────────
   v2.0.3 — مرحلهٔ ۲ ثبت‌نام فروشنده: انتخاب زیرمجموعه (تمام‌صفحه)
   پس از «بعدی» در مرحلهٔ انتخاب دسته می‌آید و با «بعدی» به فرم
   «شروع فروش» می‌رود.
   ─ برای هر دستهٔ انتخاب‌شده (اصلی اول — ترتیب مرحلهٔ قبل) یک بخش:
     نام دسته تیتر است و زیرش چیپ‌های گرد قابل انتخاب با چینش wrap
     و RTL؛ انتخاب چندتایی بدون سقف؛ چیپ انتخاب‌شده رنگی با تیک.
   ─ پایین ثابت: نوار پیشرفت «مرحله ۲ از ۵» + «بعدی» که تا هر دسته
     حداقل یک زیرمجموعه نداشته باشد غیرفعال است؛ لمس دکمهٔ غیرفعال،
     بخش‌های ناقص را با حاشیهٔ قرمز و پیام «حداقل یک مورد انتخاب کن»
     علامت می‌زند (دکمه با aria-disabled قابل‌خواندن برای صفحه‌خوان
     می‌ماند و برای نمایش خطا لمس‌پذیر است).
   ─ حفظ حالت: subcategoryDraft ({categoryId: string[]}) در استور
     seller-onboarding با sessionStorage مثل مرحلهٔ قبل؛ اگر در مرحلهٔ ۱
     دسته‌ای حذف شود زیرمجموعه‌هایش پاک می‌شود و دستهٔ تازه خالی می‌آید.
   ─ بالا: فلش برگشت (به انتخاب دسته، با حفظ انتخاب‌ها) و ✕ با همان
     دیالوگ تأیید خروج مرحلهٔ دسته.
   متن و ارقام فارسی، RTL، بدون ایموجی؛ هدف لمسی ≥۴۴px؛ ARIA گروه
   چک‌باکسِ هر دسته با برچسب.
   ───────────────────────────────────────────────────────────── */

/* v2.0.3 — کل مراحل wizard از تک‌منبع مشترک (مرحلهٔ این صفحه = ۲ زیرمجموعه) */
const WIZARD_TOTAL_STEPS = SELLER_ONBOARDING_TOTAL_STEPS;
const WIZARD_STEP = 2;

export default function SellerSubcategoryPickView() {
  const back = useAppStore((s) => s.back);
  const setRoot = useAppStore((s) => s.setRoot);
  const push = useAppStore((s) => s.push);
  /* v2.0.3 — این صفحه دو مسیر ورود دارد: «بعدی» مرحلهٔ دسته (برگشت ←
     انتخاب دسته) یا لمس کارت خلاصهٔ فرم «شروع فروش» (برگشت ← همان فرم).
     برچسب برگشت با مقصد واقعی پشته تطبیق داده می‌شود. */
  const prevView = useAppStore((s) => s.stack[s.stack.length - 2]?.view);
  const backLabel =
    prevView === "sellerOnboarding"
      ? "بازگشت به فرم شروع فروش"
      : "بازگشت به انتخاب دسته‌ها";
  /* دسته‌های انتخاب‌شدهٔ مرحلهٔ ۱ — ترتیب حفظ شده (عضو اول = اصلی) */
  const selected = useSellerOnboardingStore((s) => s.categoryDraft) ?? [];
  const storedDraft = useSellerOnboardingStore((s) => s.subcategoryDraft);
  const setSubcategoryDraft = useSellerOnboardingStore(
    (s) => s.setSubcategoryDraft
  );

  /* پیشرفت قبلی — از استور (بقا بعد از بستن و برگشتن)؛ همیشه همگام با دسته‌ها */
  const [draft, setDraft] = useState<SubcategoryDraft>(() =>
    syncSubcategoryDraft(storedDraft ?? {}, selected)
  );
  const [showErrors, setShowErrors] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const missing = missingSubcategories(draft, selected);
  const complete = missing.length === 0;

  const onToggle = (catId: string, subId: string) => {
    const next = toggleSubcategoryInDraft(draft, catId, subId);
    setDraft(next);
    setSubcategoryDraft(next); /* ذخیرهٔ زندهٔ پیشرفت */
  };

  /* «بعدی» — ناقص: علامت‌گذاری بخش‌های ناقص (بدون رفتن)؛ کامل: فرم شروع فروش */
  const onNext = () => {
    if (!complete) {
      setShowErrors(true);
      return;
    }
    push("sellerOnboarding");
  };

  /* خروج با تأیید — پیشرفت در استور مانده است */
  const onExit = () => {
    setExitOpen(false);
    setRoot("home");
  };

  return (
    <div
      className="flex min-h-0 flex-1 flex-col"
      aria-label="انتخاب زیرمجموعهٔ فروش"
    >
      {/* ── سربرگ: برگشت به انتخاب دسته + خروج با تأیید ── */}
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

      {/* ── عنوان و زیرعنوان ── */}
      <div className="px-4 pt-1">
        <h1 className="text-lg font-black leading-7">
          کدام زیرمجموعه را بیشتر می‌فروشی؟
        </h1>
        <p className="mt-1 text-xs leading-5 text-white/55">
          هر وقت خواستی بیشتر اضافه کن
        </p>
      </div>

      {/* ── بخش هر دستهٔ انتخاب‌شده (اصلی اول) با چیپ‌های گرد wrap ── */}
      <div
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4 pt-4 [scrollbar-width:thin]"
        aria-label="فهرست زیرمجموعه‌ها"
      >
        {selected.length === 0 && (
          <p className="rounded-2xl border border-white/10 bg-ls-card/60 p-4 text-center text-xs leading-5 text-white/55">
            هنوز دسته‌ای انتخاب نشده — اول از مرحلهٔ قبل یک دسته انتخاب کن.
          </p>
        )}
        {selected.map((catId) => {
          const c = categoryById(catId);
          if (!c) return null;
          const name = c.nameFa ?? c.label;
          const subs = c.subcategories ?? [];
          const picked = draft[catId] ?? [];
          const sectionInvalid = showErrors && picked.length < 1;
          return (
            <section
              key={catId}
              aria-label={`زیرمجموعه‌های دستهٔ ${name}`}
              className={cn(
                "rounded-2xl border p-3 transition-colors",
                sectionInvalid
                  ? "border-ls-pink/70 bg-ls-pink/5"
                  : "border-white/10 bg-ls-card/60"
              )}
            >
              <h2 className="text-sm font-black text-white/90">{name}</h2>
              <div
                role="group"
                aria-label={`انتخاب زیرمجموعه‌های دستهٔ ${name}`}
                className="mt-2.5 flex flex-wrap gap-1.5"
              >
                {subs.map((s) => {
                  const isSel = picked.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="checkbox"
                      aria-checked={isSel}
                      aria-label={`${s.nameFa} — دستهٔ ${name}`}
                      onClick={() => onToggle(catId, s.id)}
                      className={cn(
                        "inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition-all active:scale-[.97]",
                        isSel
                          ? "border-ls-purple bg-ls-purple text-white shadow-md shadow-ls-purple/30"
                          : "border-white/10 bg-ls-card-2 text-white/70 hover:border-white/30 hover:text-white"
                      )}
                    >
                      {isSel && <Check className="h-3.5 w-3.5" aria-hidden />}
                      {s.nameFa}
                    </button>
                  );
                })}
              </div>
              {sectionInvalid && (
                <p
                  role="alert"
                  className="mt-2 text-[11px] font-bold text-ls-pink"
                >
                  {SUBCATEGORY_REQUIRED_MESSAGE}
                </p>
              )}
            </section>
          );
        })}
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
        {/* ناقص: غیرفعال به‌نظر می‌رسد ولی لمس‌پذیر است تا بخش‌های ناقص
            علامت بخورند — aria-disabled وضعیت را برای صفحه‌خوان می‌گوید */}
        <button
          type="button"
          onClick={onNext}
          aria-disabled={!complete}
          aria-label={
            complete
              ? "بعدی — رفتن به فرم شروع فروش"
              : "بعدی — برای هر دستهٔ انتخابی حداقل یک زیرمجموعه لازم است"
          }
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all active:scale-[.99]",
            complete
              ? "bg-ls-pink text-white shadow-lg shadow-ls-pink/30 hover:bg-ls-pink/90"
              : "cursor-not-allowed bg-ls-card-2 text-white/40"
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          بعدی
        </button>
      </div>

      {/* ── خروج با تأیید (همان دیالوگ مرحلهٔ دسته) ── */}
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
