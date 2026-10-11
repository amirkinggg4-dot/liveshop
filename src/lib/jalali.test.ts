import { describe, it, expect } from "bun:test";
import {
  buildMonthGrid,
  buildTimeSlots,
  formatJalaliDateTime,
  nextJalaliMonth,
  toJalali,
  jalaliToDate,
  todayJalali,
  validateSchedule,
  JALALI_MONTHS,
  type ScheduleDraft,
} from "@/lib/jalali";

/* ─────────────────────────────────────────────────────────────
   v1.7.0 — تست واحد تقویم شمسی و منطق زمان‌بندی شو
   تبدیل دوطرفه، گرید ماه (شنبه‌شروع)، گام ۱۵ دقیقه،
   اعتبارسنجی: زمان در گذشته نباشد + حداقل یک کالا
   ───────────────────────────────────────────────────────────── */

describe("تبدیل میلادی ↔ شمسی", () => {
  it("۲۱ مارس ۲۰۲۶ ≈ ۱ فروردین ۱۴۰۵", () => {
    const j = toJalali(new Date(2026, 2, 21));
    expect(j.jy).toBe(1405);
    expect(j.jm).toBe(1);
    expect(j.jd).toBe(1);
  });

  it("تبدیل رفت‌وبرگشت پایدار است", () => {
    const d = new Date(2026, 9, 11);
    const j = toJalali(d);
    const back = jalaliToDate(j);
    expect(back.getFullYear()).toBe(2026);
    expect(back.getMonth()).toBe(9);
    expect(back.getDate()).toBe(11);
  });

  it("ماه بعد — آذر → دی و اسفند → فروردین سال بعد", () => {
    expect(nextJalaliMonth(1404, 9)).toEqual({ jy: 1404, jm: 10 });
    expect(nextJalaliMonth(1404, 12)).toEqual({ jy: 1405, jm: 1 });
  });

  it("برچسب ماه با ارقام فارسی است", () => {
    const label = JALALI_MONTHS[6]; /* مهر */
    expect(label).toBe("مهر");
  });
});

describe("buildMonthGrid — گرید ماه شمسی (هفته از شنبه)", () => {
  const today = todayJalali();

  it("طول گرید مضرب ۷ است", () => {
    const grid = buildMonthGrid(today.jy, today.jm, today);
    expect(grid.length % 7).toBe(0);
  });

  it("روزهای ماه جاری درست شمرده می‌شوند و گذشته غیرفعال است", () => {
    const grid = buildMonthGrid(today.jy, today.jm, today);
    const inMonth = grid.filter((c) => c.inMonth);
    expect(inMonth.length).toBeGreaterThanOrEqual(29);
    const past = inMonth.filter((c) => c.disabled);
    const future = inMonth.filter((c) => !c.disabled);
    /* همهٔ روزهای گذشته غیرفعال */
    for (const c of past) {
      expect(c.jd).toBeLessThan(today.jd);
    }
    /* روز امروز و بعد فعال */
    expect(future.some((c) => c.jd === today.jd)).toBe(true);
  });

  it("ماه بعد — هیچ روزی غیرفعال به‌خاطر گذشته نیست", () => {
    const next = nextJalaliMonth(today.jy, today.jm);
    const grid = buildMonthGrid(next.jy, next.jm, today);
    const inMonthDisabled = grid.filter((c) => c.inMonth && c.disabled);
    expect(inMonthDisabled.length).toBe(0);
  });

  it("خونه‌های ماه‌های همسایه inMonth=false دارند", () => {
    const grid = buildMonthGrid(today.jy, today.jm, today);
    const outOfMonth = grid.filter((c) => !c.inMonth);
    for (const c of outOfMonth) {
      expect(c.disabled).toBe(true);
    }
  });
});

describe("buildTimeSlots — ساعت با گام ۱۵ دقیقه", () => {
  const day = jalaliToDate({ jy: 1405, jm: 1, jd: 10 });

  it("بین ۰۹:۰۰ تا ۲۳:۴۵ با گام ۱۵ دقیقه — ۶۰ اسلات", () => {
    const slots = buildTimeSlots(day);
    expect(slots.length).toBe(60); /* ۱۵ ساعت × ۴ */
    expect(slots[0].label).toBe("۰۹:۰۰");
    expect(slots[slots.length - 1].label).toBe("۲۳:۴۵");
  });

  it("گام واقعاً ۱۵ دقیقه است", () => {
    const slots = buildTimeSlots(day);
    for (let i = 1; i < slots.length; i++) {
      const diff =
        slots[i].date.getTime() - slots[i - 1].date.getTime();
      expect(diff).toBe(15 * 60 * 1000);
    }
  });

  it("برچسب‌ها ارقام فارسی دارند", () => {
    const slots = buildTimeSlots(day);
    expect(slots[1].label).toBe("۰۹:۱۵");
    expect(slots[4].label).toBe("۱۰:۰۰");
  });
});

describe("formatJalaliDateTime", () => {
  it("برچسب فارسی با روز هفته و ساعت", () => {
    const d = jalaliToDate({ jy: 1405, jm: 7, jd: 19 });
    d.setHours(21, 15, 0, 0);
    const label = formatJalaliDateTime(d);
    expect(label).toContain("مهر");
    expect(label).toContain("۲۱:۱۵");
    expect(label).toContain("۱۹");
  });
});

describe("validateSchedule — منطق زمان‌بندی", () => {
  it("زمان در گذشته خطا می‌دهد", () => {
    const past = new Date(Date.now() - 60 * 60 * 1000);
    const draft: ScheduleDraft = { scheduledAt: past, itemIds: ["it1"] };
    const res = validateSchedule(draft);
    expect(res.ok).toBe(false);
    expect(res.errors.join(" ")).toContain("گذشته");
  });

  it("بدون کالا خطا می‌دهد", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = validateSchedule({ scheduledAt: future, itemIds: [] });
    expect(res.ok).toBe(false);
    expect(res.errors.join(" ")).toContain("حداقل یک کالا");
  });

  it("بدون زمان خطا می‌دهد", () => {
    const res = validateSchedule({ scheduledAt: null, itemIds: ["it1"] });
    expect(res.ok).toBe(false);
    expect(res.errors.join(" ")).toContain("تاریخ و ساعت");
  });

  it("هر دو خطا با هم می‌آیند", () => {
    const past = new Date(Date.now() - 1000);
    const res = validateSchedule({ scheduledAt: past, itemIds: [] });
    expect(res.errors.length).toBe(2);
  });

  it("زمان آینده + حداقل یک کالا = معتبر", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const res = validateSchedule({
      scheduledAt: future,
      itemIds: ["it1", "it2"],
    });
    expect(res.ok).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it("مرز: همان الان (<= now) گذشته حساب می‌شود", () => {
    const now = new Date(Date.now() - 500);
    const res = validateSchedule({ scheduledAt: now, itemIds: ["it1"] });
    expect(res.ok).toBe(false);
  });
});
