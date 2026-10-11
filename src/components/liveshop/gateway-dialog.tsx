"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum, toman } from "@/lib/format";
import { WALLET_CHARGE } from "@/lib/config/fees";
import type { PaymentGateway, WalletTx } from "@/lib/data/types";
import { useWalletStore } from "@/store/wallet-store";
import { Chip } from "@/components/liveshop/shared";
import { StepTime } from "@/components/liveshop/order-ui";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─────────────────────────────────────────────────────────────
   دیالوگ شارژ کیف پول — درگاه شبیه‌سازی‌شده
   مرحلهٔ ۱: انتخاب درگاه (زرین‌پال / آیدی‌پی)
   مرحلهٔ ۲: مبلغ — کف و سقف از config (WALLET_CHARGE) با پیام فارسی
   مرحلهٔ ۳: پردازش (۱.۲ ثانیه) → مرحلهٔ ۴: رسید موفق با شناسهٔ مرجع
   ───────────────────────────────────────────────────────────── */

const CHARGE_PRESETS = [500_000, 1_000_000, 2_000_000, 5_000_000] as const;

type Step = "gateway" | "amount" | "processing" | "success";

/** تبدیل ورودی کاربر به عدد (ارقام فارسی + حذف جداکننده‌ها) */
function parseAmountInput(s: string): number {
  const latin = s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const digits = latin.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
}

/** اعتبارسنجی مبلغ شارژ — پیام فارسی برای هر حالت */
function validateChargeAmount(amount: number): string | null {
  if (amount <= 0) return "مبلغ شارژ را وارد کن";
  if (amount < WALLET_CHARGE.minToman) {
    return `حداقل مبلغ شارژ ${toman(WALLET_CHARGE.minToman)} است`;
  }
  if (amount > WALLET_CHARGE.maxToman) {
    return `حداکثر مبلغ شارژ ${toman(WALLET_CHARGE.maxToman)} است`;
  }
  return null;
}

const GATEWAYS: Array<{ id: PaymentGateway; title: string; desc: string }> = [
  {
    id: "زرین‌پال",
    title: "زرین‌پال",
    desc: "درگاه پرداخت زرین‌پال (شبیه‌سازی‌شده)",
  },
  {
    id: "آیدی‌پی",
    title: "آیدی‌پی",
    desc: "درگاه آیدی‌پی (شبیه‌سازی‌شده)",
  },
];

/** نشان دایرهٔ درگاه — زرین‌پال: گرادیان بنفش با حرف Z / آیدی‌پی: دایرهٔ سبز با ShieldCheck */
function GatewayBadge({ id }: { id: PaymentGateway }) {
  if (id === "زرین‌پال") {
    return (
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-black text-white shadow-[0_6px_18px_rgba(108,92,255,.4)]"
        style={{ background: "linear-gradient(135deg,#6C5CFF,#4a3dd6)" }}
        aria-hidden
      >
        Z
      </span>
    );
  }
  return (
    <span
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-[0_6px_18px_rgba(0,200,150,.35)]"
      style={{ background: "linear-gradient(135deg,#00C896,#047857)" }}
      aria-hidden
    >
      <ShieldCheck className="h-5 w-5" aria-hidden />
    </span>
  );
}

export default function GatewayDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const charge = useWalletStore((s) => s.charge);

  const [step, setStep] = useState<Step>("gateway");
  const [gateway, setGateway] = useState<PaymentGateway>("زرین‌پال");
  const [amountInput, setAmountInput] = useState("");
  /** رسید موفق — خروجی charge() با شناسهٔ مرجع */
  const [receipt, setReceipt] = useState<WalletTx | null>(null);

  const parsedAmount = parseAmountInput(amountInput);
  const amountError = useMemo(
    () => validateChargeAmount(parsedAmount),
    [parsedAmount]
  );

  /* تایمر پردازش — در بستن دیالوگ یا unmount لغو می‌شود */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const reset = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setStep("gateway");
    setGateway("زرین‌پال");
    setAmountInput("");
    setReceipt(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const startPayment = () => {
    const err = validateChargeAmount(parsedAmount);
    if (err) {
      toast.error(err);
      return;
    }
    setStep("processing");
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const tx = charge(parsedAmount, gateway);
      setReceipt(tx);
      toast.success("کیف پول شارژ شد");
      setStep("success");
    }, 1200);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm"
        aria-label="شارژ کیف پول از درگاه پرداخت"
      >
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle>شارژ کیف پول</DialogTitle>
          <DialogDescription className="text-xs leading-6">
            {step === "gateway" &&
              "درگاه پرداخت را انتخاب کن (پرداخت شبیه‌سازی‌شده است)."}
            {step === "amount" &&
              `مبلغ بین ${toman(WALLET_CHARGE.minToman)} تا ${toman(WALLET_CHARGE.maxToman)} — یکی از پیشنهادی‌ها را انتخاب کن یا مبلغ دلخواه بنویس.`}
            {step === "processing" && "لطفاً چند لحظه صبر کن…"}
            {step === "success" && "رسید شارژ"}
          </DialogDescription>
        </DialogHeader>

        {/* ── مرحلهٔ ۱: انتخاب درگاه ── */}
        {step === "gateway" && (
          <div className="space-y-3">
            <div
              role="radiogroup"
              aria-label="انتخاب درگاه پرداخت"
              className="space-y-2.5"
            >
              {GATEWAYS.map((g) => {
                const selected = gateway === g.id;
                return (
                  <button
                    key={g.id}
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setGateway(g.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border p-3.5 text-right transition-colors",
                      selected
                        ? "border-ls-purple/70 bg-ls-purple/10"
                        : "border-white/10 bg-ls-card-2 hover:border-white/20"
                    )}
                    aria-label={`انتخاب درگاه ${g.title}`}
                  >
                    <GatewayBadge id={g.id} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-extrabold">
                        {g.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-white/45">
                        {g.desc}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        selected
                          ? "border-ls-purple bg-ls-purple"
                          : "border-white/25"
                      )}
                      aria-hidden
                    >
                      {selected && (
                        <span className="h-2 w-2 rounded-full bg-white" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setStep("amount")}
              className="h-11 w-full rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
              aria-label="ادامه به مرحلهٔ وارد کردن مبلغ"
            >
              ادامه
            </button>
          </div>
        )}

        {/* ── مرحلهٔ ۲: مبلغ با اعتبارسنجی کف/سقف ── */}
        {step === "amount" && (
          <div className="space-y-3">
            <button
              onClick={() => setStep("gateway")}
              className="flex w-full items-center gap-2.5 rounded-xl border border-white/10 bg-ls-card-2 p-2.5 text-right transition-colors hover:border-white/20"
              aria-label={`تغییر درگاه — درگاه فعلی: ${gateway}`}
            >
              <GatewayBadge id={gateway} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-bold">{gateway}</span>
                <span className="block text-[10px] text-white/40">
                  برای تغییر درگاه کلیک کن
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
            </button>

            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="مبالغ پیشنهادی"
            >
              {CHARGE_PRESETS.map((p) => (
                <Chip
                  key={p}
                  active={parsedAmount === p}
                  onClick={() => setAmountInput(faNum(p))}
                  className="tabular-nums"
                >
                  {faNum(p)}
                </Chip>
              ))}
            </div>

            <input
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              inputMode="numeric"
              placeholder="مبلغ دلخواه به تومان"
              aria-label="مبلغ شارژ به تومان"
              aria-invalid={Boolean(amountError && parsedAmount > 0)}
              className={cn(
                "h-11 w-full rounded-xl border bg-ls-card-2 px-3 text-center text-sm font-bold tabular-nums outline-none placeholder:text-white/35",
                amountError && parsedAmount > 0
                  ? "border-ls-pink/60"
                  : "border-white/10 focus:border-ls-purple/60"
              )}
            />

            {/* پیام اعتبارسنجی فارسی */}
            {amountError ? (
              <p
                className="text-center text-[11px] font-bold text-ls-pink"
                role="alert"
                aria-live="polite"
              >
                {parsedAmount > 0
                  ? amountError
                  : "مبلغ شارژ را وارد کن"}
              </p>
            ) : (
              parsedAmount > 0 && (
                <p className="text-center text-[11px] text-white/45">
                  معادل: {toman(parsedAmount)}
                </p>
              )
            )}

            <button
              onClick={startPayment}
              disabled={Boolean(amountError)}
              className="h-11 w-full rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={`پرداخت مبلغ ${toman(parsedAmount)} از طریق درگاه ${gateway}`}
            >
              پرداخت از طریق {gateway}
            </button>
          </div>
        )}

        {/* ── مرحلهٔ ۳: پردازش ── */}
        {step === "processing" && (
          <div
            className="flex flex-col items-center gap-3 py-6 text-center"
            role="status"
            aria-live="polite"
          >
            <Loader2
              className="h-9 w-9 animate-spin text-ls-purple"
              aria-hidden
            />
            <p className="text-sm font-extrabold">
              در حال اتصال به درگاه {gateway}…
            </p>
            <p className="text-[11px] leading-5 text-white/45">
              این یک درگاه شبیه‌سازی‌شده برای دمو است
            </p>
          </div>
        )}

        {/* ── مرحلهٔ ۴: رسید موفق (شناسهٔ مرجع + زمان) ── */}
        {step === "success" && receipt && (
          <div className="flex flex-col items-center gap-2 py-2 text-center">
            <CheckCircle2 className="h-12 w-12 text-ls-green" aria-hidden />
            <p className="text-lg font-black">پرداخت موفق!</p>
            <p
              className="text-xl font-extrabold tabular-nums text-ls-green"
              aria-label={`مبلغ شارژ ${toman(parsedAmount)}`}
            >
              <bdi>+‎{toman(parsedAmount)}</bdi>
            </p>

            {/* کاغذ رسید */}
            <div
              className="mt-2 w-full space-y-2.5 rounded-2xl border border-white/10 bg-ls-card-2 p-4 text-right"
              aria-label="رسید شارژ کیف پول"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/50">شناسهٔ مرجع</span>
                <span
                  className="rounded-lg bg-ls-bg/60 px-2 py-0.5 font-mono text-[11px] text-white/85"
                  dir="ltr"
                >
                  {receipt.refId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/50">درگاه</span>
                <span className="text-[11px] font-bold text-ls-purple-soft">
                  {gateway}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-white/50">زمان</span>
                <StepTime ms={receipt.atMs} className="text-[11px] font-bold text-white/85" />
              </div>
              <div className="flex items-center justify-between border-t border-dashed border-white/10 pt-2.5">
                <span className="text-[11px] text-white/50">وضعیت</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-ls-green/15 border border-ls-green/40 px-2 py-0.5 text-[10px] font-bold text-ls-green">
                  <BadgeCheck className="h-3 w-3" aria-hidden />
                  موفق
                </span>
              </div>
              <p className="pt-1 text-center text-[10px] text-white/40 tabular-nums">
                موجودی جدید: {faNum(useWalletStore.getState().balance)} تومان
              </p>
            </div>

            <button
              onClick={() => handleOpenChange(false)}
              className="mt-2 h-11 w-full rounded-xl bg-ls-purple text-sm font-extrabold text-white transition-transform active:scale-[.98]"
              aria-label="بازگشت به کیف پول"
            >
              بازگشت به کیف پول
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
