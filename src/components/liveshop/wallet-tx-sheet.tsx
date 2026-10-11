"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   v1.8.0 — شیت جزئیات تراکنش کیف پول
   شناسهٔ مرجع، وضعیت، زمان، درگاه و لینک به سفارش مربوط
   ═══════════════════════════════════════════════════════════════════════════ */

import { toast } from "sonner";
import { Copy, Package, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { signedToman } from "@/lib/format";
import type { WalletTx } from "@/lib/data/types";
import { useAppStore } from "@/store/app-store";
import { StepTime } from "@/components/liveshop/order-ui";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

export default function WalletTxSheet({
  tx,
  open,
  onOpenChange,
}: {
  tx: WalletTx | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const openOrder = useAppStore((s) => s.openOrder);

  if (!tx) return null;
  const positive = tx.amount >= 0;

  const goOrder = () => {
    if (!tx.orderId) return;
    onOpenChange(false);
    openOrder(tx.orderId);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="bg-ls-card border-t border-white/10 rounded-t-3xl">
        <DrawerHeader className="text-right pb-1">
          <DrawerTitle className="text-base font-black">جزئیات تراکنش</DrawerTitle>
          <DrawerDescription className="sr-only">
            شناسهٔ مرجع، وضعیت، زمان و سفارش مرتبط
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-3 px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1">
          {/* مبلغ اصلی */}
          <div className="rounded-2xl bg-ls-card-2 border border-white/5 p-4 text-center">
            <p
              className={cn(
                "text-2xl font-black tabular-nums",
                positive ? "text-ls-green" : "text-ls-pink"
              )}
              aria-label={`مبلغ تراکنش ${signedToman(tx.amount)}`}
            >
              <bdi>{signedToman(tx.amount)}</bdi>
            </p>
            <p className="mt-1.5 text-xs font-bold text-white/85 break-words leading-5">
              {tx.title}
            </p>
          </div>

          {/* ردیف‌های جزئیات */}
          <div className="rounded-2xl bg-ls-card-2 border border-white/5 divide-y divide-white/5">
            {/* شناسهٔ مرجع */}
            <div className="flex items-center justify-between gap-2 p-3.5">
              <span className="text-xs text-white/55">شناسهٔ مرجع</span>
              <button
                onClick={() => {
                  try {
                    void navigator.clipboard?.writeText(tx.refId);
                    toast("شناسهٔ مرجع کپی شد");
                  } catch {
                    toast(`شناسهٔ مرجع: ${tx.refId}`);
                  }
                }}
                className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-ls-bg/50 px-2 py-1 font-mono text-[11px] text-white/80 hover:border-ls-purple/50 transition-colors"
                aria-label={`کپی شناسهٔ مرجع ${tx.refId}`}
                dir="ltr"
              >
                {tx.refId}
                <Copy className="h-3 w-3" aria-hidden />
              </button>
            </div>
            {/* وضعیت */}
            <div className="flex items-center justify-between gap-2 p-3.5">
              <span className="text-xs text-white/55">وضعیت</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-ls-green/15 border border-ls-green/40 px-2.5 py-0.5 text-[10px] font-bold text-ls-green">
                <BadgeCheck className="h-3 w-3" aria-hidden />
                {tx.status ?? "موفق"}
              </span>
            </div>
            {/* زمان */}
            <div className="flex items-center justify-between gap-2 p-3.5">
              <span className="text-xs text-white/55">زمان</span>
              <StepTime ms={tx.atMs} className="text-xs font-bold text-white/85" />
            </div>
            {/* درگاه */}
            {tx.gateway && (
              <div className="flex items-center justify-between gap-2 p-3.5">
                <span className="text-xs text-white/55">درگاه پرداخت</span>
                <span className="text-xs font-bold text-ls-purple-soft">
                  {tx.gateway}
                </span>
              </div>
            )}
          </div>

          {/* لینک سفارش مرتبط */}
          {tx.orderId && (
            <button
              onClick={goOrder}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-ls-purple/50 bg-ls-purple/10 text-sm font-bold text-ls-purple-soft hover:bg-ls-purple/20 transition-colors"
              aria-label={`مشاهدهٔ سفارش ${tx.orderId}`}
            >
              <Package className="h-4 w-4" aria-hidden />
              مشاهدهٔ سفارش #{tx.orderId}
            </button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
