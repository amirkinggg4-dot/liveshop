"use client";

import { useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Trophy,
  Undo2,
  Wallet as WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum, toman } from "@/lib/format";
import type { WalletTx } from "@/lib/data/types";
import { useAppStore } from "@/store/app-store";
import { useWalletStore } from "@/store/wallet-store";
import {
  Price,
  PageHeader,
  SectionTitle,
} from "@/components/liveshop/shared";
import GatewayDialog from "@/components/liveshop/gateway-dialog";

const TX_ICON: Record<
  WalletTx["kind"],
  { Icon: typeof ArrowDownCircle; cls: string }
> = {
  charge: { Icon: ArrowDownCircle, cls: "text-ls-green bg-ls-green/15" },
  purchase: { Icon: ArrowUpCircle, cls: "text-ls-pink bg-ls-pink/15" },
  win: { Icon: Trophy, cls: "text-amber-300 bg-amber-300/15" },
  refund: { Icon: Undo2, cls: "text-white/60 bg-white/10" },
};

export default function WalletView() {
  const back = useAppStore((s) => s.back);
  const balance = useWalletStore((s) => s.balance);
  const txs = useWalletStore((s) => s.txs);

  const [chargeOpen, setChargeOpen] = useState(false);

  /* جمع تراکنش‌های seed (شارژها و خریدهای این ماه) */
  const monthCharge = txs
    .filter((t) => t.kind === "charge")
    .reduce((a, t) => a + t.amount, 0);
  const monthPurchase = Math.abs(
    txs
      .filter((t) => t.kind === "purchase")
      .reduce((a, t) => a + t.amount, 0)
  );

  return (
    <div className="flex-1 flex flex-col" aria-label="کیف پول">
      <PageHeader title="کیف پول" onBack={back} />

      <div className="px-4 py-4 space-y-4">
        {/* ── کارت موجودی ── */}
        <div
          className="rounded-2xl p-5 shadow-[0_14px_36px_rgba(108,92,255,.3)]"
          style={{ background: "linear-gradient(135deg,#6C5CFF,#4a3dd6)" }}
        >
          <p className="text-xs font-bold text-white/80">موجودی قابل استفاده</p>
          <Price amount={balance} className="mt-1.5 block text-3xl text-white" />
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-white/80">
            <WalletIcon className="h-3.5 w-3.5" aria-hidden />
            پرداخت در لایو با یک کلیک، بدون دردسر
          </p>
        </div>

        {/* ── شارژ ── */}
        <button
          onClick={() => setChargeOpen(true)}
          className="w-full h-12 rounded-xl bg-ls-green text-sm font-black text-[#04281e] shadow-[0_8px_24px_rgba(0,200,150,.3)] transition-transform active:scale-[.98]"
          aria-label="شارژ کیف پول"
        >
          + شارژ کیف پول
        </button>

        {/* ── کارت‌های ماهانه ── */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-ls-card border border-white/5 p-3.5">
            <p className="text-[11px] text-white/50">شارژ این ماه</p>
            <Price amount={monthCharge} className="mt-1 text-sm text-ls-green" />
          </div>
          <div className="rounded-2xl bg-ls-card border border-white/5 p-3.5">
            <p className="text-[11px] text-white/50">خرید این ماه</p>
            <Price amount={monthPurchase} className="mt-1 text-sm text-white/90" />
          </div>
        </div>

        {/* ── تاریخچهٔ تراکنش‌ها ── */}
        <div>
          <SectionTitle
            title="تاریخچهٔ تراکنش‌ها"
            action={
              <span className="rounded-full bg-ls-card-2 px-2.5 py-1 text-[11px] font-bold text-white/60 tabular-nums">
                {faNum(txs.length)} تراکنش
              </span>
            }
          />
          <ul
            className="max-h-96 space-y-2 overflow-y-auto scroll-thin pl-1"
            aria-label="فهرست تراکنش‌های کیف پول"
          >
            {txs.map((t) => {
              const { Icon, cls } = TX_ICON[t.kind];
              const positive = t.amount >= 0;
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-2xl bg-ls-card border border-white/5 p-3"
                >
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                      cls
                    )}
                    aria-hidden
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{t.title}</p>
                    {t.gateway && (
                      <p className="mt-0.5 text-[10px] text-ls-purple-soft">
                        از طریق {t.gateway}
                      </p>
                    )}
                    <p className="mt-0.5 text-[11px] text-white/45">{t.atLabel}</p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-sm font-extrabold tabular-nums",
                      positive ? "text-ls-green" : "text-white/90"
                    )}
                  >
                    {positive ? "+" : "−"}
                    {toman(Math.abs(t.amount))}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* ── دیالوگ شارژ — فاز ۱: انتخاب درگاه (زرین‌پال/آیدی‌پی) + پردازش + رسید ── */}
      <GatewayDialog open={chargeOpen} onOpenChange={setChargeOpen} />
    </div>
  );
}
