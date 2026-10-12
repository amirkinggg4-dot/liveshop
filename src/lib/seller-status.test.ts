/* ─────────────────────────────────────────────────────────────
   تست‌های واحد v1.9.1 — ماشین وضعیت فروشنده (src/lib/seller-status.ts)
   ─ قواعد گذار: فقط گذارهای مصوب؛ پیمایش کامل ۵×۵ جفت
   ─ دلیل رد/تعلیق خالی نباشد
   ─ resolveSellerAccess: هر ۵ وضعیت + مهمان
   ─ رفتار استور onboarding با گاردها + پاک شدن با خروج (auth-store)
   ───────────────────────────────────────────────────────────── */

import { describe, expect, test, beforeEach } from "bun:test";
import {
  SELLER_STATUSES,
  SELLER_TRANSITIONS,
  canTransition,
  resolveSellerAccess,
  validateRejectReason,
  validateSuspendReason,
  type SellerStatus,
} from "./seller-status";

/* ── ۱) قواعد گذار — پیمایش کامل ۵×۵ ── */

describe("SELLER_TRANSITIONS — قواعد گذار وضعیت فروشنده", () => {
  test("گذارهای مجاز دقیقاً همین‌ها هستند", () => {
    const allowed: [SellerStatus, SellerStatus][] = [
      ["none", "pending"], // ثبت درخواست
      ["pending", "approved"], // تأیید ادمین
      ["pending", "rejected"], // رد ادمین
      ["approved", "suspended"], // تعلیق ادمین
      ["rejected", "pending"], // ارسال دوباره
      ["rejected", "none"], // ویرایش و ارسال دوباره (فرم)
      ["suspended", "approved"], // رفع تعلیق
    ];
    for (const [from, to] of allowed) {
      expect(canTransition(from, to)).toBe(true);
    }
  });

  test("هر جفت دیگر از ۵×۵ ممنوع است (شامل گذار به خود و پرش‌ها)", () => {
    const allowed = new Set([
      "none>pending",
      "pending>approved",
      "pending>rejected",
      "approved>suspended",
      "rejected>pending",
      "rejected>none",
      "suspended>approved",
    ]);
    for (const from of SELLER_STATUSES) {
      for (const to of SELLER_STATUSES) {
        const key = `${from}>${to}`;
        if (allowed.has(key)) continue;
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  test("نقشهٔ SELLER_TRANSITIONS همهٔ وضعیت‌ها را پوشش می‌دهد", () => {
    for (const s of SELLER_STATUSES) {
      expect(Array.isArray(SELLER_TRANSITIONS[s])).toBe(true);
    }
  });

  test("پرش‌های خطرناک صریحاً ممنوع‌اند", () => {
    /* هیچ‌کس بدون رد شدن از pending تأیید نمی‌شود */
    expect(canTransition("none", "approved")).toBe(false);
    expect(canTransition("rejected", "approved")).toBe(false);
    expect(canTransition("suspended", "rejected")).toBe(false);
    /* تعلیق فقط از approved */
    expect(canTransition("pending", "suspended")).toBe(false);
    expect(canTransition("none", "suspended")).toBe(false);
    /* گذار به خود بی‌معناست */
    expect(canTransition("approved", "approved")).toBe(false);
    expect(canTransition("pending", "pending")).toBe(false);
  });
});

/* ── ۲) دلیل رد/تعلیق خالی نباشد ── */

describe("دلیل رد و تعلیق — اجباری", () => {
  test("رشتهٔ خالی رد می‌شود", () => {
    expect(validateRejectReason("").ok).toBe(false);
  });

  test("فقط فاصله/تب رد می‌شود", () => {
    expect(validateRejectReason("   ").ok).toBe(false);
    expect(validateRejectReason("\t\n").ok).toBe(false);
  });

  test("دلیل خیلی کوتاه رد می‌شود", () => {
    expect(validateRejectReason("ک").ok).toBe(false);
  });

  test("دلیل معتبر trim و پذیرفته می‌شود", () => {
    const r = validateRejectReason("  عکس مدرک ناخوانا بود  ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("عکس مدرک ناخوانا بود");
  });

  test("علت تعلیق هم همین قاعده را دارد", () => {
    expect(validateSuspendReason("").ok).toBe(false);
    expect(validateSuspendReason("  ").ok).toBe(false);
    const r = validateSuspendReason(" تخلف قوانین ارسال ");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe("تخلف قوانین ارسال");
  });
});

/* ── ۳) resolveSellerAccess — هر ۵ وضعیت + مهمان ── */

describe("resolveSellerAccess — ۵ وضعیت + مهمان", () => {
  test("مهمان همیشه guest است — حتی اگر استور وضعیتی داشته باشد", () => {
    for (const s of SELLER_STATUSES) {
      expect(resolveSellerAccess(false, s)).toBe("guest");
    }
  });

  test("کاربر لاگین‌شده با none → start (شروع فروش)", () => {
    expect(resolveSellerAccess(true, "none")).toBe("start");
  });

  test("کاربر لاگین‌شده با pending → pending", () => {
    expect(resolveSellerAccess(true, "pending")).toBe("pending");
  });

  test("کاربر لاگین‌شده با rejected → rejected", () => {
    expect(resolveSellerAccess(true, "rejected")).toBe("rejected");
  });

  test("کاربر لاگین‌شده با suspended → suspended", () => {
    expect(resolveSellerAccess(true, "suspended")).toBe("suspended");
  });

  test("کاربر لاگین‌شده با approved → panel", () => {
    expect(resolveSellerAccess(true, "approved")).toBe("panel");
  });
});

/* ── ۴) استور onboarding — گاردها و اتصال به خروج ──
   zustand در محیط node کار می‌کند؛ فایل‌ها use client دارند ولی
   فقط یک directive رشته‌ای‌اند. */

import { useSellerOnboardingStore } from "@/store/seller-onboarding-store";
import { useAuthStore } from "@/store/auth-store";

const validApp = {
  storeName: "کفش‌خانهٔ سینا",
  slug: "sina-kicks",
  mainCategoryLabel: "کتونی و کفش",
  nationalId: "0010515526",
  sheba: "IR580540105180021273113007",
  idPhotoAccepted: true,
  termsAccepted: true,
  submittedAtLabel: "همین حالا",
};

describe("استور onboarding — گاردهای گذار", () => {
  beforeEach(() => {
    useSellerOnboardingStore.getState().hardReset();
  });

  test("وضعیت پیش‌فرض کاربر عادی none است (نه approved)", () => {
    expect(useSellerOnboardingStore.getState().status).toBe("none");
    expect(useSellerOnboardingStore.getState().application).toBeNull();
  });

  test("submit از none → pending", () => {
    useSellerOnboardingStore.getState().submit(validApp);
    expect(useSellerOnboardingStore.getState().status).toBe("pending");
  });

  test("approve فقط از pending — از none بی‌اثر است", () => {
    useSellerOnboardingStore.getState().approve();
    expect(useSellerOnboardingStore.getState().status).toBe("none");
    useSellerOnboardingStore.getState().submit(validApp);
    useSellerOnboardingStore.getState().approve();
    expect(useSellerOnboardingStore.getState().status).toBe("approved");
  });

  test("reject با دلیل خالی رد می‌شود و وضعیت عوض نمی‌شود", () => {
    useSellerOnboardingStore.getState().submit(validApp);
    const r = useSellerOnboardingStore.getState().reject("   ");
    expect(r.ok).toBe(false);
    expect(useSellerOnboardingStore.getState().status).toBe("pending");
  });

  test("reject با دلیل معتبر → rejected + دلیل ذخیره می‌شود", () => {
    useSellerOnboardingStore.getState().submit(validApp);
    const r = useSellerOnboardingStore.getState().reject("مدارک ناخوانا بود");
    expect(r.ok).toBe(true);
    expect(useSellerOnboardingStore.getState().status).toBe("rejected");
    expect(useSellerOnboardingStore.getState().application?.rejectionReason).toBe(
      "مدارک ناخوانا بود"
    );
  });

  test("suspend فقط از approved — با علت اجباری", () => {
    useSellerOnboardingStore.getState().submit(validApp);
    const bad = useSellerOnboardingStore.getState().suspend("");
    expect(bad.ok).toBe(false);
    expect(useSellerOnboardingStore.getState().status).toBe("pending");
    useSellerOnboardingStore.getState().approve();
    const ok = useSellerOnboardingStore.getState().suspend("تخلف قوانین");
    expect(ok.ok).toBe(true);
    expect(useSellerOnboardingStore.getState().status).toBe("suspended");
  });

  test("unsuspend فقط از suspended → approved", () => {
    const r = useSellerOnboardingStore.getState().unsuspend();
    expect(r.ok).toBe(false); // از none بی‌اثر
    useSellerOnboardingStore.getState().submit(validApp);
    useSellerOnboardingStore.getState().approve();
    useSellerOnboardingStore.getState().suspend("تخلف");
    useSellerOnboardingStore.getState().unsuspend();
    expect(useSellerOnboardingStore.getState().status).toBe("approved");
  });

  test("ارسال دوباره: rejected → reopenForm (none) → submit → pending", () => {
    useSellerOnboardingStore.getState().submit(validApp);
    useSellerOnboardingStore.getState().reject("نام فروشگاه نامناسب");
    useSellerOnboardingStore.getState().reopenForm();
    expect(useSellerOnboardingStore.getState().status).toBe("none");
    useSellerOnboardingStore.getState().submit(validApp);
    expect(useSellerOnboardingStore.getState().status).toBe("pending");
  });
});

describe("اتصال وضعیت فروشنده به ورود (useAuth)", () => {
  beforeEach(() => {
    useSellerOnboardingStore.getState().hardReset();
    useAuthStore.getState().logout();
    /* برگشت به کاربر دموی لاگین‌شده برای تست‌های بعدی */
  });

  test("خروج از حساب وضعیت فروشنده را پاک می‌کند (→ none)", () => {
    useSellerOnboardingStore.getState().submit(validApp);
    useSellerOnboardingStore.getState().approve();
    expect(useSellerOnboardingStore.getState().status).toBe("approved");

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useSellerOnboardingStore.getState().status).toBe("none");
    expect(useSellerOnboardingStore.getState().application).toBeNull();
  });

  test("حذف حساب هم وضعیت فروشنده را پاک می‌کند", () => {
    useSellerOnboardingStore.getState().submit(validApp);
    useAuthStore.getState().deleteAccount();
    expect(useSellerOnboardingStore.getState().status).toBe("none");
  });

  test("ورود دوباره: وضعیت none می‌ماند تا درخواست تازه ثبت شود", () => {
    useSellerOnboardingStore.getState().submit(validApp);
    useAuthStore.getState().logout();
    /* بعد از خروج هیچ وضعیت فروشنده‌ای باقی نمی‌ماند؛ ورود بعدی
       (مهم یا کاربر تازه) از none شروع می‌کند: */
    expect(useSellerOnboardingStore.getState().status).toBe("none");
    expect(resolveSellerAccess(false, "none")).toBe("guest");
  });
});
