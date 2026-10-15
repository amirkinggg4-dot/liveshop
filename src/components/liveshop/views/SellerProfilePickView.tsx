"use client";

import { useState } from "react";
import { ArrowLeft, ChevronRight, Check, X } from "lucide-react";
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
  BUSINESS_KIND_DESCRIPTION,
  BUSINESS_KIND_IDS,
  BUSINESS_KIND_LABEL,
  BUSINESS_KIND_REQUIRED_MESSAGE,
  SELL_CHANNEL_DESCRIPTION,
  SELL_CHANNEL_IDS,
  SELL_CHANNEL_LABEL,
  SELL_CHANNELS_REQUIRED_MESSAGE,
  toggleSellChannel,
  validateSellerProfilePick,
  type BusinessKindId,
  type SellChannelId,
} from "@/lib/seller-profile-pick";
import { SELLER_ONBOARDING_TOTAL_STEPS } from "@/lib/seller-onboarding-steps";
import type { SellerType } from "@/lib/seller-identity";
import { useAppStore } from "@/store/app-store";
import {
  useSellerOnboardingStore,
} from "@/store/seller-onboarding-store";

/* ─────────────────────────────────────────────────────────────
   v2.0.5 — مرحلهٔ ۴ ثبت‌نام فروشنده: «ویژگی‌های فروش» (تمام‌صفحه)
   پس از «بعدی» مرحلهٔ نوع فروشنده می‌آید و با «بعدی» به فرم «شروع
   فروش» می‌رود. دو نسخه بر اساس نوع انتخابی مرحلهٔ ۳:
   ─ حقیقی (individual): «امروز کالایت را کجا می‌فروشی یا معرفی
     می‌کنی؟» — چندانتخابی با چک‌باکس مربع در سمت راست (RTL) و
     گزینهٔ انحصاری «هیچ‌جا؛ تازه شروع می‌کنم» (انتخابش بقیه را پاک
     می‌کند و انتخاب بقیه آن را پاک می‌کند).
   ─ حقوقی (business): «کسب‌وکارت را بهتر چه چیزی توصیف می‌کند؟» —
     تک‌انتخابی (radio) با دایرهٔ انتخاب در سمت راست.
   پایین ثابت: نوار پیشرفت «مرحله ۴ از ۷» + «بعدی» که تا اعتبار
   انتخاب شبیه غیرفعال است ولی لمس‌پذیر می‌ماند تا کارت‌ها حاشیهٔ
   قرمز و پیام خطا بگیرند (aria-disabled — هم‌الگوی مراحل قبل):
   حقیقی «حداقل یک مورد انتخاب کن»، حقوقی «یکی را انتخاب کن».
   حفظ حالت: sellChannelsDraft / businessKindDraft در استور
   seller-onboarding با sessionStorage؛ فلش برگشت به مرحلهٔ نوع
   با حفظ انتخاب‌ها (وقتی از کارت خلاصهٔ فرم باز شده، به خود فرم).
   متن و ارقام فارسی، RTL، بدون ایموجی؛ هدف لمسی ≥۴۴px؛ ARIA
   گروه چک‌باکس (role=group) برای حقیقی و radiogroup برای حقوقی.
   ───────────────────────────────────────────────────────────── */

/* v2.0.5 — کل مراحل wizard از تک‌منبع مشترک (مرحلهٔ این صفحه = ۴ ویژگی‌ها) */
const WIZARD_TOTAL_STEPS = SELLER_ONBOARDING_TOTAL_STEPS;
const WIZARD_STEP = 4;

export default function SellerProfilePickView() {
  const back = useAppStore((s) => s.back);
  const setRoot = useAppStore((s) => s.setRoot);
  const push = useAppStore((s) => s.push);
  /* این صفحه دو مسیر ورود دارد: «بعدی» مرحلهٔ نوع فروشنده (برگشت ←
     همان مرحله) یا لمس کارت «ویژگی‌های فروش» در فرم «شروع فروش»
     (برگشت ← خود فرم). برچسب برگشت با مقصد واقعی پشته تطبیق داده می‌شود. */
  const prevView = useAppStore((s) => s.stack[s.stack.length - 2]?.view);
  const backLabel =
    prevView === "sellerOnboarding"
      ? "بازگشت به فرم شروع فروش"
      : "بازگشت به انتخاب نوع فروشنده";

  const sellerTypeDraft = useSellerOnboardingStore((s) => s.sellerTypeDraft);
  const storedChannels = useSellerOnboardingStore((s) => s.sellChannelsDraft);
  const storedKind = useSellerOnboardingStore((s) => s.businessKindDraft);
  const setSellChannelsDraft = useSellerOnboardingStore(
    (s) => s.setSellChannelsDraft
  );
  const setBusinessKindDraft = useSellerOnboardingStore(
    (s) => s.setBusinessKindDraft
  );

  /* نسخهٔ فعال بسته به نوع مرحلهٔ ۳ — در جریان واقعی null ممکن نیست
     (هر دو مسیر ورود نوع را تضمین می‌کنند)؛ گارد دفاعی: حقیقی */
  const variant: SellerType = sellerTypeDraft ?? "individual";

  /* پیشرفت قبلی — از استور (بقا بعد از بستن و برگشتن) */
  const [channels, setChannels] = useState<SellChannelId[]>(
    () => storedChannels
  );
  const [kind, setKind] = useState<BusinessKindId | null>(() => storedKind);
  const [showErrors, setShowErrors] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const selected = variant === "individual" ? channels.length > 0 : kind !== null;
  /* حاشیهٔ قرمز کارت‌ها فقط وقتی معنا دارد که هنوز انتخاب معتبری نیست */
  const noSelectionError =
    showErrors && !validateSellerProfilePick({ sellerType: variant, sellChannels: channels, businessKind: kind }).ok;

  const onToggleChannel = (id: string) => {
    /* از getState استفاده می‌کنیم نه state محلی — دو لمس سریع (حتی در
       یک دستهٔ به‌روزرسانی React) هرگز همدیگر را بازنویسی نمی‌کنند */
    const next = toggleSellChannel(
      useSellerOnboardingStore.getState().sellChannelsDraft,
      id
    );
    setChannels(next);
    setSellChannelsDraft(next);
  };

  const onPickKind = (id: BusinessKindId) => {
    setKind(id);
    setBusinessKindDraft(id);
  };

  /* «بعدی» — ناعتبر: علامت‌گذاری کارت‌ها (بدون رفتن)؛ معتبر: فرم */
  const onNext = () => {
    const v = validateSellerProfilePick({
      sellerType: variant,
      sellChannels: channels,
      businessKind: kind,
    });
    if (!v.ok) {
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
      aria-label="ویژگی‌های فروش"
    >
      {/* ── سربرگ: برگشت به مرحلهٔ نوع + خروج با تأیید ── */}
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

      {/* ── عنوان و زیرعنوان (بسته به نسخه) ── */}
      <div className="px-4 pt-1">
        <h1 className="text-lg font-black leading-7">
          {variant === "individual"
            ? "امروز کالایت را کجا می‌فروشی یا معرفی می‌کنی؟"
            : "کسب‌وکارت را بهتر چه چیزی توصیف می‌کند؟"}
        </h1>
        <p className="mt-1.5 text-xs leading-5 text-white/55">
          {variant === "individual"
            ? "ابزارها و مزایا را با اندازه‌ی کسب‌وکارت هماهنگ می‌کنیم. هر چند مورد که صدق می‌کند را انتخاب کن."
            : "بر اساس نوع کسب‌وکارت بهترین ابزارها و راهکارها را پیشنهاد می‌دهیم."}
        </p>
      </div>

      {/* ── کارت‌های انتخاب (دو نسخه) ── */}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-4 [scrollbar-width:thin]"
        aria-label="فهرست گزینه‌های ویژگی‌های فروش"
      >
        {variant === "individual" ? (
          /* نسخهٔ حقیقی — گروه چک‌باکس چندانتخابی */
          <div
            role="group"
            aria-label="انتخاب محل‌های فروش فعلی"
            className="space-y-3"
          >
            {SELL_CHANNEL_IDS.map((id) => {
              const isSel = channels.includes(id);
              return (
                <button
                  key={id}
                  type="button"
                  role="checkbox"
                  aria-checked={isSel}
                  aria-label={`${SELL_CHANNEL_LABEL[id]} — ${SELL_CHANNEL_DESCRIPTION[id]}`}
                  onClick={() => onToggleChannel(id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-2xl border-2 p-4 text-right transition-all active:scale-[.99]",
                    isSel
                      ? "border-ls-purple bg-ls-purple/10"
                      : noSelectionError
                        ? "border-ls-pink/70 bg-ls-card/60"
                        : "border-white/10 bg-ls-card/60 hover:border-white/25"
                  )}
                >
                  {/* چک‌باکس مربع — سمت راست (اولین فرزند در RTL) */}
                  <span
                    aria-hidden
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
                      isSel
                        ? "border-ls-purple bg-ls-purple"
                        : "border-white/30 bg-transparent"
                    )}
                  >
                    {isSel && <Check className="h-4 w-4 text-white" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-black",
                        isSel ? "text-white" : "text-white/85"
                      )}
                    >
                      {SELL_CHANNEL_LABEL[id]}
                    </span>
                    <span className="mt-1 block text-[11px] leading-5 text-white/55">
                      {SELL_CHANNEL_DESCRIPTION[id]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* نسخهٔ حقوقی — radiogroup تک‌انتخابی */
          <div
            role="radiogroup"
            aria-label="انتخاب نوع کسب‌وکار"
            className="space-y-3"
          >
            {BUSINESS_KIND_IDS.map((id) => {
              const isSel = kind === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={isSel}
                  aria-label={`${BUSINESS_KIND_LABEL[id]} — ${BUSINESS_KIND_DESCRIPTION[id]}`}
                  onClick={() => onPickKind(id)}
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
                      {BUSINESS_KIND_LABEL[id]}
                    </span>
                    <span className="mt-1 block text-[11px] leading-5 text-white/55">
                      {BUSINESS_KIND_DESCRIPTION[id]}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* پیام خطای «انتخاب نشده» — بعد از لمس «بعدی»ی ناعتبر */}
        {noSelectionError && (
          <p
            role="alert"
            className="mt-3 text-center text-[11px] font-bold text-ls-pink"
          >
            {variant === "individual"
              ? SELL_CHANNELS_REQUIRED_MESSAGE
              : BUSINESS_KIND_REQUIRED_MESSAGE}
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
        {/* بدون انتخاب معتبر: غیرفعال به‌نظر می‌رسد ولی لمس‌پذیر است تا
            کارت‌ها علامت بخورند — aria-disabled وضعیت را برای صفحه‌خوان می‌گوید */}
        <button
          type="button"
          onClick={onNext}
          aria-disabled={!selected}
          aria-label={
            selected
              ? "بعدی — رفتن به فرم شروع فروش"
              : variant === "individual"
                ? "بعدی — حداقل یک مورد انتخاب کن"
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
