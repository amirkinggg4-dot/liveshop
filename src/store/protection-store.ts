"use client";

import { create } from "zustand";
import type { ProtectionCase, ProtectionStep } from "@/lib/data/rewards-p1";
import { PROTECTION_CASES } from "@/lib/data/rewards-p1";

/* ─────────────────────────────────────────────────────────────
   استور ضمانت خریدار و اختلافات — فاز ۳ (P1)
   پرونده‌های اختلاف: باز کردن پروندهٔ جدید (۳ مرحلهٔ تازه)،
   پیام خریدار + پاسخ خودکار پشتیبانی.
   ───────────────────────────────────────────────────────────── */

export interface OpenCaseInput {
  orderId: string;
  itemTitle: string;
  amount: number;
  reason: string;
  desc: string;
}

interface ProtectionState {
  cases: ProtectionCase[];
  /** پروندهٔ جدید با وضعیت submitted می‌سازد و شناسهٔ آن را برمی‌گرداند */
  openCase: (input: OpenCaseInput) => string;
  /** پیام خریدار + پاسخ خودکار پشتیبانی را به پرونده اضافه می‌کند */
  addMessage: (caseId: string, text: string) => void;
}

/* شمارندهٔ شناسهٔ پرونده — ادامه از روی seedها */
let caseCounter = 1;

/** برچسب زمان فارسی HH:MM (کپی الگوی nowLabel در seller-store) */
function nowLabel(): string {
  const d = new Date();
  const fa = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  const two = (n: number) => `${fa[Math.floor(n / 10)]}${fa[n % 10]}`;
  return `${two(d.getHours())}:${two(d.getMinutes())}`;
}

function freshSteps(): ProtectionStep[] {
  return [
    { label: "ثبت شد", done: true, atLabel: nowLabel() },
    { label: "بررسی توسط کارشناس LiveShop", done: false },
    { label: "نتیجه و بازگشت وجه", done: false },
  ];
}

/* کپی عمیق seed تا دیتای static دست‌نخورده بماند (الگوی seller-store) */
const SEED_CASES: ProtectionCase[] = PROTECTION_CASES.map((c) => ({
  ...c,
  steps: c.steps.map((s) => ({ ...s })),
  messages: c.messages.map((m) => ({ ...m })),
}));

const SUPPORT_AUTO_REPLY =
  "پذیرفته شد — کارشناس تا ۲۴ ساعت آینده بررسی می‌کند ✅";

export const useProtectionStore = create<ProtectionState>((set, get) => ({
  cases: SEED_CASES,

  openCase: (input) => {
    const id = `case-${++caseCounter}`;
    const newCase: ProtectionCase = {
      id,
      orderId: input.orderId,
      itemTitle: input.itemTitle,
      amount: input.amount,
      reason: input.reason,
      desc: input.desc,
      status: "submitted",
      steps: freshSteps(),
      messages: [{ from: "buyer", text: input.desc, atLabel: nowLabel() }],
    };
    set((s) => ({ cases: [newCase, ...s.cases] }));
    return id;
  },

  addMessage: (caseId, text) => {
    const exists = get().cases.some((c) => c.id === caseId);
    if (!exists || !text.trim()) return;
    set((s) => ({
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              messages: [
                ...c.messages,
                { from: "buyer" as const, text, atLabel: nowLabel() },
                {
                  from: "support" as const,
                  text: SUPPORT_AUTO_REPLY,
                  atLabel: nowLabel(),
                },
              ],
            }
          : c
      ),
    }));
  },
}));
