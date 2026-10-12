/* ─────────────────────────────────────────────────────────────
   LiveShop v1.9.1 — ماشین وضعیت فروشنده (ماژول خالص — بدون React/استور)
   ─ وضعیت‌ها: none | pending | approved | rejected | suspended
   ─ قواعد گذار (تست‌شده جامع در seller-status.test.ts — فقط این‌ها مجاز):
       none      → pending    (ثبت درخواست فروشندگی)
       pending   → approved   (تأیید ادمین)
       pending   → rejected   (رد ادمین — با دلیل اجباری)
       approved  → suspended  (تعلیق ادمین — با دلیل)
       rejected  → pending    (ارسال دوبارهٔ درخواست توسط فروشنده)
       rejected  → none       (باز شدن فرم برای «ویرایش و ارسال دوباره»)
       suspended → approved   (رفع تعلیق ادمین)
     هر جفت دیگر ممنوع است (مثلاً none→approved، rejected→approved،
     pending→suspended، suspended→rejected و …).
   ─ دلیل رد/تعلیق خالی (یا فقط فاصله) رد می‌شود — به فروشنده نشان
     داده می‌شود پس باید معنادار باشد.
   ─ resolveSellerAccess: نقشهٔ «چه چیزی برای چه کسی نمایش داده شود» —
     مهمان ← گیت ورود؛ none ← شروع فروش؛ pending/rejected/suspended ←
     کارت وضعیت؛ approved ← پنل فروشنده.
   ───────────────────────────────────────────────────────────── */

export type SellerStatus =
  | "none"
  | "pending"
  | "approved"
  | "rejected"
  | "suspended";

export const SELLER_STATUSES: readonly SellerStatus[] = [
  "none",
  "pending",
  "approved",
  "rejected",
  "suspended",
];

/** گذارهای مجاز — تک منبع حقیقت؛ استور و پنل ادمین موظف‌اند از همین
    تابع (canTransition) رد شوند. */
export const SELLER_TRANSITIONS: Record<SellerStatus, readonly SellerStatus[]> = {
  none: ["pending"],
  pending: ["approved", "rejected"],
  approved: ["suspended"],
  rejected: ["pending", "none"],
  suspended: ["approved"],
};

/** آیا گذار از وضعیت فعلی به وضعیت هدف مجاز است؟ (ورودی نامعتبر → false) */
export function canTransition(
  from: SellerStatus,
  to: SellerStatus
): boolean {
  const allowed = SELLER_TRANSITIONS[from];
  if (!allowed) return false;
  return allowed.includes(to);
}

/* ── دلیل رد/تعلیق — اجباری و معنادار ── */

export type ReasonValidation =
  | { ok: true; value: string }
  | { ok: false; message: string };

/** دلیل رد باید غیرخالی باشد (فقط فاصله هم خالی است) — حداقل ۳ حرف
    تا «به فروشنده نشان دادنِ» آن معنا داشته باشد. */
export function validateRejectReason(reason: string): ReasonValidation {
  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, message: "دلیل رد را وارد کن — این دلیل به فروشنده نمایش داده می‌شود" };
  }
  if (trimmed.length < 3) {
    return { ok: false, message: "دلیل رد خیلی کوتاه است — کمی توضیح بده" };
  }
  return { ok: true, value: trimmed };
}

/** دلیل تعلیق — همان قاعده با برچسب خودش */
export function validateSuspendReason(reason: string): ReasonValidation {
  const trimmed = reason.trim();
  if (!trimmed) {
    return { ok: false, message: "علت تعلیق را وارد کن — این علت به فروشنده نمایش داده می‌شود" };
  }
  if (trimmed.length < 3) {
    return { ok: false, message: "علت تعلیق خیلی کوتاه است — کمی توضیح بده" };
  }
  return { ok: true, value: trimmed };
}

/* ── نقشهٔ دسترسی نمای فروشنده (۵ وضعیت + مهمان) ── */

export type SellerAccessKind =
  | "guest" /** مهمان — شیت ورود باز شود */
  | "start" /** لاگین + none — «شروع فروش» */
  | "pending" /** صفحهٔ در انتظار تأیید */
  | "rejected" /** دلیل رد + ویرایش و ارسال دوباره */
  | "suspended" /** پیام تعلیق */
  | "panel"; /** پنل فروشنده */

/** چه نمای دیدنی است؟ — مهمان همیشه «guest» (صرف‌نظر از وضعیت استور)؛
    کاربر لاگین‌شده بر اساس وضعیت فروشندگی‌اش مسیر می‌گیرد. */
export function resolveSellerAccess(
  isAuthenticated: boolean,
  status: SellerStatus
): SellerAccessKind {
  if (!isAuthenticated) return "guest";
  switch (status) {
    case "none":
      return "start";
    case "pending":
      return "pending";
    case "rejected":
      return "rejected";
    case "suspended":
      return "suspended";
    case "approved":
      return "panel";
  }
}
