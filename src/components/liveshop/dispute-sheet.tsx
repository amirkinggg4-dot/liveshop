"use client";

import { useState } from "react";
import { Check, Send, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toFa, toman } from "@/lib/format";
import { PROTECTION_REASONS } from "@/lib/data/rewards-p1";
import { useProtectionStore } from "@/store/protection-store";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/* ═══════════ DisputeSheet — ضمانت خریدار و ثبت اختلاف (Atlas تصویر ۰۵) ═══════════ */

const CASE_STATUS: Record<string, { label: string; cls: string }> = {
  submitted: {
    label: "ثبت شد",
    cls: "bg-ls-purple text-white",
  },
  in_review: {
    label: "در بررسی",
    cls: "bg-ls-pink/15 text-ls-pink border border-ls-pink/40",
  },
  resolved: {
    label: "حل شد",
    cls: "bg-ls-green/15 text-ls-green border border-ls-green/40",
  },
};

export default function DisputeSheet({
  orderId,
  itemTitle,
  amount,
  open,
  onOpenChange,
}: {
  orderId: string;
  itemTitle: string;
  amount: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const cases = useProtectionStore((s) => s.cases);
  const openCase = useProtectionStore((s) => s.openCase);
  const addMessage = useProtectionStore((s) => s.addMessage);

  const [reason, setReason] = useState<string | null>(null);
  const [desc, setDesc] = useState("");
  const [msgDrafts, setMsgDrafts] = useState<Record<string, string>>({});

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      setReason(null);
      setDesc("");
    }
    onOpenChange(v);
  };

  const submit = () => {
    if (!reason) {
      toast.error("دلیل اختلاف را انتخاب کن");
      return;
    }
    if (desc.trim().length < 10) {
      toast.error("توضیح را کامل بنویس (حداقل ۱۰ کاراکتر)");
      return;
    }
    openCase({ orderId, itemTitle, amount, reason, desc: desc.trim() });
    toast.success("اختلاف ثبت شد — کارشناس تا ۲۴ ساعت بررسی می‌کند");
    handleOpenChange(false);
  };

  const setMessageDraft = (caseId: string, text: string) =>
    setMsgDrafts((p) => ({ ...p, [caseId]: text }));

  const sendMessage = (caseId: string) => {
    const text = (msgDrafts[caseId] ?? "").trim();
    if (!text) return;
    addMessage(caseId, text);
    setMsgDrafts((p) => {
      const n = { ...p };
      delete n[caseId];
      return n;
    });
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="bg-ls-card border-t border-ls-green/30 rounded-t-3xl max-h-[85vh]">
        <DrawerHeader className="text-right pb-1">
          <DrawerTitle className="text-base font-extrabold">
            ضمانت خریدار و اختلافات
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            ثبت اختلاف سفارش و پیگیری پرونده‌ها
          </DrawerDescription>

          {/* هدر سبز — سپر ضمانت */}
          <div
            className="mt-2 rounded-2xl border border-ls-green/30 bg-ls-green/10 p-3.5 flex items-start gap-3 text-right"
            aria-label="ضمانت خریدار LiveShop"
          >
            <span className="shrink-0 w-10 h-10 rounded-full bg-ls-green/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-ls-green" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-extrabold text-ls-green">
                ضمانت خریدار LiveShop
              </p>
              <p className="mt-1 text-[11px] leading-5 text-white/70">
                مبلغ محفوظ این سفارش:{" "}
                <span
                  className="font-extrabold text-white tabular-nums"
                  aria-label={`مبلغ محفوظ: ${toman(amount)}`}
                >
                  {toman(amount)}
                </span>
              </p>
            </div>
          </div>

          {/* خلاصهٔ سفارش */}
          <p
            className="mt-2 text-[11px] text-white/55 text-right"
            aria-label={`سفارش ${toFa(orderId)} — ${itemTitle}`}
          >
            سفارش <span className="font-bold text-white/80">#{toFa(orderId)}</span>{" "}
            — {itemTitle}
          </p>
        </DrawerHeader>

        <div className="px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1 space-y-3 overflow-y-auto scroll-thin">
          {/* ── مرحله ۱: دلیل اختلاف ── */}
          <div className="space-y-2">
            <p className="text-xs font-extrabold text-white/85">
              <span className="text-ls-purple-soft">۱.</span> دلیل اختلاف را
              انتخاب کن
            </p>
            <div
              className="space-y-1.5"
              role="radiogroup"
              aria-label="دلایل اختلاف"
            >
              {PROTECTION_REASONS.map((r) => {
                const selected = reason === r;
                return (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    role="radio"
                    aria-checked={selected}
                    aria-label={`انتخاب دلیل: ${r}`}
                    className={cn(
                      "w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs font-bold transition-colors text-right",
                      selected
                        ? "border-ls-green bg-ls-green/10 text-ls-green"
                        : "border-white/10 bg-ls-card-2 text-white/70 hover:border-white/20"
                    )}
                  >
                    <span>{r}</span>
                    {selected && <Check className="w-4 h-4" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── مرحله ۲: توضیح ── */}
          <div className="space-y-1.5">
            <p className="text-xs font-extrabold text-white/85">
              <span className="text-ls-purple-soft">۲.</span> توضیح بده چه
              اتفاقی افتاد
            </p>
            <Textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="توضیح بده چه اتفاقی افتاد…"
              aria-label="توضیح اختلاف"
              rows={3}
              className="rounded-xl bg-ls-card-2/70 border-white/10 text-sm min-h-20 text-right"
            />
            <p className="text-[10px] text-white/40" aria-live="polite">
              {faLength(desc)} — حداقل ۱۰ کاراکتر لازم است
            </p>
          </div>

          {/* دکمهٔ ثبت اختلاف */}
          <button
            onClick={submit}
            aria-label="ثبت اختلاف و درخواست بررسی"
            className="w-full rounded-xl bg-ls-purple py-3 text-sm font-extrabold text-white shadow-[0_0_16px_rgba(108,92,255,.4)] hover:bg-ls-purple-deep active:scale-[.99] transition-all"
          >
            ثبت اختلاف و درخواست بررسی
          </button>

          {/* ── پرونده‌های من ── */}
          <div className="h-px bg-white/10" />
          <p
            className="text-sm font-extrabold flex items-center gap-2"
            aria-label="پرونده‌های من"
          >
            ⚖️ پرونده‌های من
          </p>

          {cases.map((c) => {
            const status = CASE_STATUS[c.status] ?? CASE_STATUS.submitted;
            return (
              <div
                key={c.id}
                className="rounded-2xl bg-ls-card border border-white/5 p-3.5 space-y-2.5"
                aria-label={`پروندهٔ ${c.id} برای سفارش ${toFa(c.orderId)}`}
              >
                <div className="flex items-center gap-2">
                  <p className="text-xs font-extrabold text-white/90">
                    سفارش #{toFa(c.orderId)}
                  </p>
                  <span className="text-[10px] text-white/45 truncate">
                    {c.reason}
                  </span>
                  <span
                    className={cn(
                      "ms-auto shrink-0 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold",
                      status.cls
                    )}
                    aria-label={`وضعیت پرونده: ${status.label}`}
                  >
                    {status.label}
                  </span>
                </div>

                <p className="text-[11px] text-white/60 truncate">
                  {c.itemTitle} ·{" "}
                  <span className="font-extrabold text-white/80 tabular-nums">
                    {toman(c.amount)}
                  </span>
                </p>

                {/* نقاط مراحل پرونده */}
                <div className="flex items-center gap-3" aria-label={`${toFa(c.steps.filter((s) => s.done).length)} از ${toFa(c.steps.length)} مرحله انجام شده`}>
                  {c.steps.map((st, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5"
                      title={`${st.label}${st.done ? " ✓" : ""}`}
                      aria-label={`مرحله ${st.label}${st.done ? " — انجام شده" : " — در انتظار"}`}
                    >
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          st.done ? "bg-ls-green" : "bg-white/15"
                        )}
                        aria-hidden
                      />
                      <span
                        className={cn(
                          "text-[9px] leading-3",
                          st.done ? "text-white/70" : "text-white/35"
                        )}
                      >
                        {st.label}
                      </span>
                    </span>
                  ))}
                </div>

                {/* پیام‌ها */}
                <div
                  className="space-y-2 max-h-40 overflow-y-auto scroll-thin"
                  aria-label={`پیام‌های پروندهٔ ${c.id}`}
                >
                  {c.messages.map((m, i) => (
                    <div
                      key={i}
                      className={cn(
                        "rounded-xl px-3 py-2 border",
                        m.from === "buyer"
                          ? "bg-ls-purple/15 border-ls-purple/25"
                          : "bg-ls-green/10 border-ls-green/25"
                      )}
                      aria-label={`${m.from === "buyer" ? "پیام تو" : "پاسخ پشتیبانی"}: ${m.text}`}
                    >
                      <p
                        className={cn(
                          "text-xs leading-5",
                          m.from === "buyer" ? "text-white/85" : "text-ls-green"
                        )}
                      >
                        {m.text}
                      </p>
                      <p className="mt-1 text-[9px] text-white/40">
                        {m.from === "buyer" ? "تو" : "پشتیبانی LiveShop"} ·{" "}
                        {m.atLabel}
                      </p>
                    </div>
                  ))}
                </div>

                {/* ارسال پیام به کارشناس */}
                <div className="flex items-center gap-2">
                  <Input
                    value={msgDrafts[c.id] ?? ""}
                    onChange={(e) => setMessageDraft(c.id, e.target.value)}
                    placeholder="پیام به کارشناس…"
                    aria-label={`پیام به کارشناس برای پروندهٔ ${c.id}`}
                    className="h-9 rounded-xl bg-ls-bg/60 border-white/10 text-xs text-right"
                  />
                  <button
                    onClick={() => sendMessage(c.id)}
                    disabled={!(msgDrafts[c.id] ?? "").trim()}
                    aria-label="ارسال پیام به کارشناس"
                    className="w-9 h-9 shrink-0 rounded-xl bg-ls-purple text-white flex items-center justify-center disabled:opacity-40 hover:bg-ls-purple-deep active:scale-95 transition-all"
                  >
                    <span
                      title="ارسال پیام"
                      aria-hidden
                      className="flex items-center justify-center"
                    >
                      <Send className="w-4 h-4 rotate-180" aria-hidden />
                    </span>
                  </button>
                </div>
              </div>
            );
          })}

          <p className="text-center text-[10px] text-white/35">
            تا حل اختلاف، مبلغ سفارش نزد LiveShop امانت می‌ماند 🛡
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/** طول رشته با ارقام فارسی */
function faLength(s: string): string {
  return toFa(String(s.trim().length));
}
