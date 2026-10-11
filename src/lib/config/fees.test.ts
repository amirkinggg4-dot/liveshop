/* ─────────────────────────────────────────────────────────────
   v1.7.1 — تست واحد ماشین‌حساب خالص درآمد (lib/config/fees.ts)
   اجرا: bun test src/lib/config/fees.test.ts
   ───────────────────────────────────────────────────────────── */

import { describe, expect, it } from "bun:test";
import {
  calcNetIncome,
  calcOrderTotal,
  commissionPctFor,
  COMMISSION_TIERS,
  GATEWAY_FEE,
  SHIPPING_PRICES,
  SCAN_DEADLINE,
  SHIPPING_DEADLINE_HOURS,
  WITHDRAWAL_DEPOSIT_HOURS,
  WALLET_CHARGE,
  ESCROW_AUTO_RELEASE_DAYS,
  DISPUTE_WINDOW_HOURS,
} from "./fees";

describe("commissionPctFor — پلکان کمیسیون بر اساس فروش ماهانه", () => {
  it("زیر ۵۰ میلیون → ۸٪", () => {
    expect(commissionPctFor(0)).toBe(8);
    expect(commissionPctFor(42_500_000)).toBe(8);
    expect(commissionPctFor(49_999_999)).toBe(8);
  });

  it("۵۰ تا ۱۵۰ میلیون → ۵٪", () => {
    expect(commissionPctFor(50_000_000)).toBe(5);
    expect(commissionPctFor(120_000_000)).toBe(5);
    expect(commissionPctFor(149_999_999)).toBe(5);
  });

  it("بالای ۱۵۰ میلیون → ۳٪", () => {
    expect(commissionPctFor(150_000_000)).toBe(3);
    expect(commissionPctFor(900_000_000)).toBe(3);
  });

  it("پلکان‌ها صعودی و کامل‌اند (آخر بدون سقف)", () => {
    expect(COMMISSION_TIERS[COMMISSION_TIERS.length - 1].upTo).toBeNull();
    for (let i = 1; i < COMMISSION_TIERS.length; i++) {
      expect(COMMISSION_TIERS[i].pct).toBeLessThan(COMMISSION_TIERS[i - 1].pct);
    }
  });
});

describe("calcNetIncome — ماشین‌حساب خالص درآمد", () => {
  it("نمونهٔ مرجع ۲٬۵۰۰٬۰۰۰ با فروش ماهانهٔ ۴۲.۵ میلیون (۸٪)", () => {
    const r = calcNetIncome(2_500_000, 42_500_000);
    expect(r.commissionPct).toBe(8);
    expect(r.commission).toBe(200_000); // ۲٬۵۰۰٬۰۰۰ × ۸٪
    expect(r.processing).toBe(102_500); // ۲٬۵۰۰٬۰۰۰ × ۲٫۹٪ + ۳۰٬۰۰۰
    expect(r.net).toBe(2_500_000 - 200_000 - 102_500);
  });

  it("فرمول خالص: price − commission − processing", () => {
    const price = 7_300_000;
    const r = calcNetIncome(price, 60_000_000);
    expect(r.commissionPct).toBe(5);
    expect(r.commission).toBe(Math.round((price * 5) / 100));
    expect(r.processing).toBe(
      Math.round((price * GATEWAY_FEE.pct) / 100) + GATEWAY_FEE.flatToman
    );
    expect(r.net).toBe(price - r.commission - r.processing);
  });

  it("پردازش درگاه = درصد + مبلغ ثابت (fees.ts)", () => {
    const r = calcNetIncome(1_000_000, 42_500_000);
    expect(r.processing).toBe(
      Math.round((1_000_000 * GATEWAY_FEE.pct) / 100) + GATEWAY_FEE.flatToman
    );
  });

  it("ورودی نامعتبر → صفر و خالص منفیِ صفر", () => {
    const r = calcNetIncome(0, 42_500_000);
    expect(r.price).toBe(0);
    expect(r.commission).toBe(0);
    expect(r.net).toBe(0 - 0 - GATEWAY_FEE.flatToman);
    const r2 = calcNetIncome(-5_000, 42_500_000);
    expect(r2.price).toBe(0);
    const r3 = calcNetIncome(Number.NaN, 42_500_000);
    expect(r3.price).toBe(0);
  });

  it("مبلغ اعشاری به کف صحیح گرد می‌شود", () => {
    const r = calcNetIncome(2_500_000.9, 42_500_000);
    expect(r.price).toBe(2_500_000);
  });

  it("هم‌خوانی با تفکیک آخرین شو (seller.ts): ۲۱٫۵ میلیون → خالص ۱۹٬۱۲۶٬۵۰۰", () => {
    const r = calcNetIncome(21_500_000, 42_500_000);
    expect(r.commissionPct).toBe(8);
    expect(r.commission).toBe(1_720_000);
    expect(r.processing).toBe(653_500);
    expect(r.net).toBe(19_126_500);
  });
});

describe("تنظیمات مهلت‌ها و ارسال (fees.ts)", () => {
  it("مهلت اسکن و ارسال و واریز مطابق قوانین دمو", () => {
    expect(SCAN_DEADLINE.deadlineHours).toBe(24);
    expect(SCAN_DEADLINE.warnHours).toBe(6);
    expect(SHIPPING_DEADLINE_HOURS).toBe(24);
    expect(WITHDRAWAL_DEPOSIT_HOURS).toBe(24);
  });

  it("قیمت‌های ارسال مثبت و منطقی (تیپاکس > پست > پیک)", () => {
    expect(SHIPPING_PRICES.tipax).toBeGreaterThan(SHIPPING_PRICES.post);
    expect(SHIPPING_PRICES.post).toBeGreaterThan(SHIPPING_PRICES.peyk);
    expect(SHIPPING_PRICES.peyk).toBeGreaterThan(0);
  });
});

/* ───────── v1.8.0 — محاسبهٔ واحد جمع سفارش (calcOrderTotal) ─────────
   تک منطق مشترک تسویه/خرید سریع/موتور خرید */
describe("calcOrderTotal — منطق مشترک قیمت + ارسال", () => {
  it("جمع ساده: قیمت واحد × ۱ + ارسال", () => {
    const r = calcOrderTotal({ unitPrice: 4_600_000, qty: 1, shippingFee: 45_000 });
    expect(r.itemsTotal).toBe(4_600_000);
    expect(r.shippingFee).toBe(45_000);
    expect(r.total).toBe(4_645_000);
    expect(r.qty).toBe(1);
  });

  it("تعداد بیش از ۱ به‌درستی ضرب می‌شود", () => {
    const r = calcOrderTotal({ unitPrice: 690_000, qty: 3, shippingFee: 25_000 });
    expect(r.itemsTotal).toBe(2_070_000);
    expect(r.total).toBe(2_095_000);
  });

  it("تعداد حذف‌شده = ۱ و اعشاری به پایین گرد می‌شود", () => {
    expect(calcOrderTotal({ unitPrice: 100, shippingFee: 10 }).qty).toBe(1);
    expect(calcOrderTotal({ unitPrice: 100, qty: 2.9, shippingFee: 10 }).qty).toBe(2);
    expect(calcOrderTotal({ unitPrice: 100, qty: 0, shippingFee: 10 }).qty).toBe(1);
    expect(calcOrderTotal({ unitPrice: 100, qty: -5, shippingFee: 10 }).qty).toBe(1);
  });

  it("ورودی نامعتبر (NaN/منفی) ایمن خنثی می‌شود", () => {
    const r = calcOrderTotal({
      unitPrice: Number.NaN,
      shippingFee: Number.NaN,
    });
    expect(r.total).toBe(0);
    const r2 = calcOrderTotal({ unitPrice: -100, shippingFee: -20 });
    expect(r2.itemsTotal).toBe(0);
    expect(r2.shippingFee).toBe(0);
    expect(r2.total).toBe(0);
  });

  it("مبلغ اعشاری قیمت/ارسال به صحیح تبدیل می‌شود", () => {
    const r = calcOrderTotal({ unitPrice: 99.9, qty: 2, shippingFee: 9.4 });
    expect(r.itemsTotal).toBe(198);
    expect(r.total).toBe(207);
  });

  it("هم‌خوانی با محدودیت شارژ کیف پول (کف/سقف تعریف‌شده و منطقی)", () => {
    expect(WALLET_CHARGE.minToman).toBeGreaterThan(0);
    expect(WALLET_CHARGE.maxToman).toBeGreaterThan(WALLET_CHARGE.minToman);
  });

  it("ثابت‌های امانی v1.8.0 (از fees — تک منبع)", () => {
    expect(ESCROW_AUTO_RELEASE_DAYS).toBeGreaterThan(0);
    expect(DISPUTE_WINDOW_HOURS).toBe(72);
  });
});
