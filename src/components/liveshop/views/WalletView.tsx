"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Trophy,
  Undo2,
  Wallet as WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { faNum, signedToman } from "@/lib/format";
import type { WalletTx } from "@/lib/data/types";
import { useAppStore } from "@/store/app-store";
import { useWalletStore } from "@/store/wallet-store";
import {
  PageHeader,
  SectionTitle,
  EmptyState,
} from "@/components/liveshop/shared";
import { StepTime } from "@/components/liveshop/order-ui";
import GatewayDialog from "@/components/liveshop/gateway-dialog";
import WalletTxSheet from "@/components/liveshop/wallet-tx-sheet";

/* ═══════════════════════════════════════════════════════════════════════════
   v1.8.0 — کیف پول (نمای خریدار)
   ─ علامت مبلغ درست در RTL (‎LRM داخل signedToman + <bdi>) با رنگ سبز/قرمز
   ─ عنوان تراکنش تا ۲ خط (بدون «…»)
   ─ فیلتر تاریخچه: همه / شارژ / خرید / بازگشت وجه
   ─ لمس هر تراکنش → شیت جزئیات (شناسهٔ مرجع، وضعیت، زمان، لینک سفارش)
   ═══════════════════════════════════════════════════════════════════════════ */

type TxFilters = "all" | "charge" | "purchase" | "refund";

const TX_FILTERS: { id: TxFilters; label: string }[] = [
  { id: "all", label: "همه" },
  { id: "charge", label: "شارژ" },
  { id: "purchase", label: "خرید" },
  { id: "refund", label: "بازگشت وجه" },
];

const TX_ICON: Record<
  WalletTx["kind"],
  { Icon: typeof ArrowDownCircle; cls: string }
> = {
  charge: { Icon: ArrowDownCircle, cls: "text-ls-green bg-ls-green/15" },
  purchase: { Icon: ArrowUpCircle, cls: "text-ls-pink bg-ls-pink/15" },
  win: { Icon: Trophy, cls: "text-amber-300 bg-amber-300/15" },
  refund: { Icon: Undo2, cls: "text-ls-green bg-ls-green/10" },
};

export default function WalletView() {
  const back = useAppStore((s) => s.back);
  const balance = useWalletStore((s) => s.balance);
  const txs = useWalletStore((s) => s.txs);

  const [chargeOpen, setChargeOpen] = useState(false);
  const [filter, setFilter] = useState<TxFilters>("all");
  const [selected, setSelected] = useState<WalletTx | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return txs;
    if (filter === "purchase") {
      return txs.filter((t) => t.kind === "purchase" || t.kind === "win");
    }
    return txs.filter((t) => t.kind === filter);
  }, [txs, filter]);

  const counts = useMemo(
    () => ({
      all: txs.length,
      charge: txs.filter((t) => t.kind === "charge").length,
      purchase: txs.filter((t) => t.kind === "purchase" || t.kind === "win").length,
      refund: txs.filter((t) => t.kind === "refund").length,
    }),
    [txs]
  );

  /* جمع تراکنش‌های seed (شارژها و خریدهای این ماه) */
  const monthCharge = txs
    .filter((t) => t.kind === "charge")
    .reduce((a, t) => a + t.amount, 0);
  const monthPurchase = Math.abs(
    txs
      .filter((t) => t.kind === "purchase")
      .reduce((a, t) => a + t.amount, 0)
  );

  const openTx = (t: WalletTx) => {
    setSelected(t);
    setSheetOpen(true);
  };

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
          <p
            className="mt-1.5 text-3xl font-extrabold tabular-nums text-white"
            aria-label={`موجودی ${balance} تومان`}
          >
            {faNum(balance)}
            <span className="ms-1.5 text-sm font-bold text-white/75">تومان</span>
          </p>
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
            <p
              className="mt-1 text-sm font-extrabold tabular-nums text-ls-green"
              aria-label={`شارژ این ماه ${monthCharge} تومان`}
            >
              <bdi>{signedToman(monthCharge)}</bdi>
            </p>
          </div>
          <div className="rounded-2xl bg-ls-card border border-white/5 p-3.5">
            <p className="text-[11px] text-white/50">خرید این ماه</p>
            <p
              className="mt-1 text-sm font-extrabold tabular-nums text-white/90"
              aria-label={`خرید این ماه ${monthPurchase} تومان`}
            >
              <bdi>−‎{faNum(monthPurchase)} تومان</bdi>
            </p>
          </div>
        </div>

        {/* ── تاریخچهٔ تراکنش‌ها ── */}
        <div>
          <SectionTitle
            title="تاریخچهٔ تراکنش‌ها"
            action={
              <span className="rounded-full bg-ls-card-2 px-2.5 py-1 text-[11px] font-bold text-white/60 tabular-nums">
                {faNum(filtered.length)} تراکنش
              </span>
            }
          />

          {/* فیلترها */}
          <div
            className="mb-3 flex items-center gap-2"
            role="tablist"
            aria-label="فیلتر تراکنش‌ها"
          >
            {TX_FILTERS.map((f) => (
              <button
                key={f.id}
                role="tab"
                aria-selected={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-ls-purple text-white"
                    : "bg-ls-card-2 text-white/70 hover:text-white hover:bg-ls-line"
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-[10px] font-bold tabular-nums",
                    filter === f.id ? "bg-white/20" : "bg-white/10 text-white/50"
                  )}
                >
                  {faNum(counts[f.id])}
                </span>
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              lucide={WalletIcon}
              title="تراکنشی در این دسته نیست"
              desc="با شارژ کیف پول یا خرید در لایو، تراکنش‌هایت اینجا ثبت می‌شود."
            />
          ) : (
            <ul
              className="max-h-96 space-y-2 overflow-y-auto scroll-thin pl-1"
              aria-label="فهرست تراکنش‌های کیف پول"
            >
              {filtered.map((t) => {
                const { Icon, cls } = TX_ICON[t.kind];
                const positive = t.amount >= 0;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => openTx(t)}
                      className="flex w-full items-center gap-3 rounded-2xl bg-ls-card border border-white/5 p-3 text-right transition-colors hover:border-ls-purple/40 active:scale-[.99]"
                      aria-label={`جزئیات تراکنش ${t.title} — ${signedToman(t.amount)}`}
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
                        {/* عنوان تا ۲ خط — بدون «…» */}
                        <p className="max-h-10 overflow-hidden break-words text-sm font-bold leading-5">
                          {t.title}
                        </p>
                        {t.gateway && (
                          <p className="mt-0.5 text-[10px] text-ls-purple-soft">
                            از طریق {t.gateway}
                          </p>
                        )}
                        <p className="mt-0.5 text-[11px] text-white/45">
                          <StepTime ms={t.atMs} />
                        </p>
                      </div>
                      {/* علامت مبلغ امن در RTL — سبز/قرمز */}
                      <span
                        className={cn(
                          "shrink-0 text-sm font-extrabold tabular-nums",
                          positive ? "text-ls-green" : "text-ls-pink"
                        )}
                      >
                        <bdi>{signedToman(t.amount)}</bdi>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* ── دیالوگ شارژ — درگاه + مبلغ (کف/سقف config) + رسید ── */}
      <GatewayDialog open={chargeOpen} onOpenChange={setChargeOpen} />

      {/* ── شیت جزئیات تراکنش ── */}
      <WalletTxSheet
        tx={selected}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
