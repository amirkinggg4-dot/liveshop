"use client";

/* ─────────────────────────────────────────────────────────────
   v1.7.0 — تقویم شمسی برای زمان‌بندی شو (بخش ۶ قرارداد API)
   ─ تبدیل میلادی↔شمسی با jalaali-js (کتابخانهٔ مرجع)
   ─ گرید ماه جاری و ماه بعد (شروع هفته از شنبه)
   ─ ساعت‌ها با گام ۱۵ دقیقه
   ─ اعتبارسنجی زمان‌بندی: زمان در گذشته نباشد + حداقل یک کالا
   همهٔ نمایش‌ها با ارقام فارسی است.
   ───────────────────────────────────────────────────────────── */

import jalaali from "jalaali-js";
import { toFa } from "@/lib/format";

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
] as const;

/* شنبه اول هفتهٔ ایرانی — برچسب کوتاه روزها */
export const WEEKDAY_SHORT = ["ش", "ی", "د", "س", "چ", "پ", "ج"] as const;

export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export function toJalali(date: Date): JalaliDate {
  return jalaali.toJalaali(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function jalaliToDate(j: JalaliDate): Date {
  const g = jalaali.toGregorian(j.jy, j.jm, j.jd);
  return new Date(g.gy, g.gm - 1, g.gd);
}

/** امروز شمسی */
export function todayJalali(): JalaliDate {
  return toJalali(new Date());
}

export function jalaliMonthLabel(jy: number, jm: number): string {
  return `${JALALI_MONTHS[jm - 1]} ${toFa(String(jy))}`;
}

/** ماه بعد — سال و ماه شمسی */
export function nextJalaliMonth(jy: number, jm: number): { jy: number; jm: number } {
  return jm === 12 ? { jy: jy + 1, jm: 1 } : { jy, jm: jm + 1 };
}

export interface CalendarCell {
  jd: number;
  inMonth: boolean;
  /** شناسهٔ پایدار روز مثل 1404-07-12 (پرشین) برای انتخاب */
  key: string;
  /** Date نیم‌روز آن روز (مبنای ترکیب با ساعت) */
  date: Date;
  disabled: boolean;
}

/**
 * گرید تقویم یک ماه شمسی — هفته‌ها از شنبه، خونه‌های ماه‌های همسایه با
 * inMonth=false (در UI محو می‌شوند؛ این ماه و ماه بعد فقط قابل‌کلیک‌اند
 * و روزهای گذشته غیرفعال).
 */
export function buildMonthGrid(jy: number, jm: number, today: JalaliDate): CalendarCell[] {
  const length = jalaali.jalaaliMonthLength(jy, jm);
  const first = jalaliToDate({ jy, jm, jd: 1 });
  /* شنبه → ستون ۰ : (getDay ۶=شنبه) offset=(getDay+1)%7 */
  const offset = (first.getDay() + 1) % 7;

  const cells: CalendarCell[] = [];
  const prev = jm === 1 ? { jy: jy - 1, jm: 12 } : { jy, jm: jm - 1 };
  const prevLen = jalaali.jalaaliMonthLength(prev.jy, prev.jm);

  for (let i = 0; i < offset; i++) {
    const jd = prevLen - offset + 1 + i;
    const date = jalaliToDate({ jy: prev.jy, jm: prev.jm, jd });
    cells.push({
      jd,
      inMonth: false,
      key: `${prev.jy}-${prev.jm}-${jd}`,
      date,
      disabled: true,
    });
  }
  for (let jd = 1; jd <= length; jd++) {
    const date = jalaliToDate({ jy, jm, jd });
    const isPast =
      jy < today.jy ||
      (jy === today.jy && jm < today.jm) ||
      (jy === today.jy && jm === today.jm && jd < today.jd);
    cells.push({
      jd,
      inMonth: true,
      key: `${jy}-${jm}-${jd}`,
      date,
      disabled: isPast,
    });
  }
  while (cells.length % 7 !== 0) {
    const next = jm === 12 ? { jy: jy + 1, jm: 1 } : { jy, jm: jm + 1 };
    const jd = cells.length - offset - length + 1;
    const date = jalaliToDate({ jy: next.jy, jm: next.jm, jd });
    cells.push({
      jd,
      inMonth: false,
      key: `${next.jy}-${next.jm}-${jd}`,
      date,
      disabled: true,
    });
  }
  return cells;
}

/* ── ساعت با گام ۱۵ دقیقه — ۰۹:۰۰ تا ۲۳:۴۵ ── */
export interface TimeSlot {
  hour: number;
  minute: number;
  label: string;
  date: Date;
}

export function buildTimeSlots(day: Date, minHour = 9, maxHour = 23): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (let h = minHour; h <= maxHour; h++) {
    for (let m = 0; m < 60; m += 15) {
      const date = new Date(day);
      date.setHours(h, m, 0, 0);
      slots.push({
        hour: h,
        minute: m,
        label: `${toFa(String(h).padStart(2, "0"))}:${toFa(String(m).padStart(2, "0"))}`,
        date,
      });
    }
  }
  return slots;
}

/* ── برچسب فارسی تاریخ + ساعت ── */
const WEEKDAY_FA = [
  "یک‌شنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
  "شنبه",
] as const;

export function formatJalaliDateTime(date: Date): string {
  const j = toJalali(date);
  const wd = WEEKDAY_FA[date.getDay()];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${wd} ${toFa(String(j.jd))} ${JALALI_MONTHS[j.jm - 1]} · ${toFa(hh)}:${toFa(mm)}`;
}

export function formatJalaliDate(date: Date): string {
  const j = toJalali(date);
  return `${toFa(String(j.jd))} ${JALALI_MONTHS[j.jm - 1]} ${toFa(String(j.jy))}`;
}

/* ── اعتبارسنجی زمان‌بندی شو (بخش ۶ — create/schedule) ── */
export interface ScheduleDraft {
  scheduledAt: Date | null;
  itemIds: string[];
}

export function validateSchedule(draft: ScheduleDraft): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!draft.scheduledAt) {
    errors.push("تاریخ و ساعت شو را انتخاب کن");
  } else if (draft.scheduledAt.getTime() <= Date.now()) {
    errors.push("زمان شو نمی‌تواند در گذشته باشد");
  }
  if (draft.itemIds.length === 0) {
    errors.push("حداقل یک کالا برای شو انتخاب کن");
  }
  return { ok: errors.length === 0, errors };
}
