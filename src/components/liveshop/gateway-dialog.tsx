"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronRight,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum, toman } from "@/lib/format";
import type { PaymentGateway } from "@/lib/data/types";
import { useWalletStore } from "@/store/wallet-store";
import { Chip, Price } from "@/components/liveshop/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/* ─────────────────────────────────────────────────────────────
   دیالوگ شارژ کیف پول — درگاه شبیه‌سازی‌شده (فاز ۱)
   مرحلهٔ ۱: انتخاب درگاه (زرین‌پال / آیدی‌پی)
   مرحلهٔ ۲: مبلغ (چیپ‌های پیشنهادی + ورودی دلخواه)
   مرحلهٔ ۳: پردازش (اسپینر ۱.۲ ثانیه) → رسید موفق
   ───────────────────────────────────────────────────────────── */

const CHARGE_PRESETS = [500_000, 1_000_000, 2_000_000] as const;

type Step = "gateway" | "amount" | "processing" | "success";

/** تبدیل ورودی کاربر به عدد (ارقام فارسی + حذف جداکننده‌ها) */
function parseAmountInput(s: string): number {
  const latin = s.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));
  const digits = latin.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
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

  const parsedAmount = parseAmountInput(amountInput);

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
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const startPayment = () => {
    if (parsedAmount <= 0) return;
    setStep("processing");
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      charge(parsedAmount, gateway);
      toast.success("کیف پول شارژ شد ✅");
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
              "یکی از مبالغ پیشنهادی را انتخاب کن یا مبلغ دلخواه را وارد کن (تومان)."}
            {step === "processing" && "لطفاً چند لحظه صبر کن…"}
            {step === "success" && "رسید پرداخت"}
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

        {/* ── مرحلهٔ ۲: مبلغ ── */}
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
              className="h-11 w-full rounded-xl border border-white/10 bg-ls-card-2 px-3 text-center text-sm font-bold tabular-nums outline-none placeholder:text-white/35 focus:border-ls-purple/60"
            />

            {parsedAmount > 0 && (
              <p className="text-center text-[11px] text-white/45">
                معادل: {toman(parsedAmount)}
              </p>
            )}

            <button
              onClick={startPayment}
              disabled={parsedAmount <= 0}
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

        {/* ── مرحلهٔ ۴: رسید موفق ── */}
        {step === "success" && (
          <div className="flex flex-col items-center gap-2.5 py-3 text-center">
            <CheckCircle2 className="h-14 w-14 text-ls-green" aria-hidden />
            <p className="text-lg font-black">پرداخت موفق!</p>
            <Price amount={parsedAmount} className="text-xl text-ls-green" />
            <p className="text-[11px] text-white/45">از طریق {gateway}</p>
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
