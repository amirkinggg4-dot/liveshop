/* ─────────────────────────────────────────────────────────────
   تست‌های واحد v2.0.5 — مرحلهٔ ۴ ثبت‌نام فروشنده (ویژگی‌های فروش)
   ۱) انحصاری‌بودن «هیچ‌جا؛ تازه شروع می‌کنم» (دوطرفه) در چندانتخابی حقیقی
   ۲) پاک‌شدن draft نسخهٔ دیگر هنگام تغییر نوع (clearIncompatibleSellerProfile)
   ۳) اعتبارسنجی هر دو نسخه (validateSellerProfilePick)
   ۴) مقادیر مجاز enum (SELL_CHANNEL_IDS / BUSINESS_KIND_IDS) و sanitizeهای نشست
   (seller-profile-pick.ts — توابع خالص)
   ───────────────────────────────────────────────────────────── */

import { describe, expect, test } from "bun:test";
import {
  BUSINESS_KIND_DESCRIPTION,
  BUSINESS_KIND_IDS,
  BUSINESS_KIND_LABEL,
  BUSINESS_KIND_REQUIRED_MESSAGE,
  JUST_STARTING_ID,
  SELL_CHANNEL_DESCRIPTION,
  SELL_CHANNEL_IDS,
  SELL_CHANNEL_LABEL,
  SELL_CHANNELS_REQUIRED_MESSAGE,
  clearIncompatibleSellerProfile,
  isSellChannelsComplete,
  profileChangeWarningMessage,
  sanitizeBusinessKind,
  sanitizeSellChannels,
  toggleSellChannel,
  validateSellerProfilePick,
  type BusinessKindId,
} from "./seller-profile-pick";

describe("SELL_CHANNEL_IDS / BUSINESS_KIND_IDS — مقادیر مجاز", () => {
  test("۵ کانال با idهای دقیق سرور (ستون sellChannels)", () => {
    expect([...SELL_CHANNEL_IDS]).toEqual([
      "website",
      "social",
      "physical_store",
      "other_platforms",
      "just_starting",
    ]);
  });

  test("۵ نوع کسب‌وکار با idهای دقیق enum سرور (BusinessKind)", () => {
    expect([...BUSINESS_KIND_IDS]).toEqual([
      "RESELLER",
      "LIQUIDATOR",
      "BRAND",
      "RETAILER",
      "CONSIGNMENT",
    ]);
  });

  test("هر کانال و هر نوع کسب‌وکار برچسب و توضیح فارسی دارد", () => {
    for (const id of SELL_CHANNEL_IDS) {
      expect(SELL_CHANNEL_LABEL[id].length).toBeGreaterThan(0);
      expect(SELL_CHANNEL_DESCRIPTION[id].length).toBeGreaterThan(0);
    }
    for (const id of BUSINESS_KIND_IDS) {
      expect(BUSINESS_KIND_LABEL[id].length).toBeGreaterThan(0);
      expect(BUSINESS_KIND_DESCRIPTION[id].length).toBeGreaterThan(0);
    }
  });

  test("پیام‌های خطا دقیقاً طبق مشخصات", () => {
    expect(SELL_CHANNELS_REQUIRED_MESSAGE).toBe("حداقل یک مورد انتخاب کن");
    expect(BUSINESS_KIND_REQUIRED_MESSAGE).toBe("یکی را انتخاب کن");
  });
});

describe("toggleSellChannel — انحصار دوطرفهٔ «تازه شروع می‌کنم»", () => {
  test("انتخاب عادی اضافه می‌شود و ترتیب لمس حفظ است", () => {
    expect(toggleSellChannel([], "website")).toEqual(["website"]);
    expect(toggleSellChannel(["website"], "social")).toEqual([
      "website",
      "social",
    ]);
  });

  test("لمس دوباره همان گزینه آن را حذف می‌کند", () => {
    expect(toggleSellChannel(["website", "social"], "website")).toEqual([
      "social",
    ]);
    expect(toggleSellChannel(["website"], "website")).toEqual([]);
  });

  test("انتخاب «تازه شروع می‌کنم» همهٔ بقیه را پاک می‌کند", () => {
    expect(
      toggleSellChannel(["website", "social", "physical_store"], JUST_STARTING_ID)
    ).toEqual(["just_starting"]);
  });

  test("انتخاب هر گزینهٔ دیگر، «تازه شروع می‌کنم» را پاک می‌کند", () => {
    expect(toggleSellChannel([JUST_STARTING_ID], "website")).toEqual([
      "website",
    ]);
    expect(
      toggleSellChannel([JUST_STARTING_ID], "other_platforms")
    ).toEqual(["other_platforms"]);
  });

  test("لمس دوبارهٔ «تازه شروع می‌کنم» فهرست را خالی می‌کند", () => {
    expect(toggleSellChannel([JUST_STARTING_ID], JUST_STARTING_ID)).toEqual([]);
  });

  test("id ناشناخته فهرست را تغییر نمی‌دهد (و idهای خراب فهرست را تمیز می‌کند)", () => {
    expect(toggleSellChannel(["website"], "instagram")).toEqual(["website"]);
    expect(toggleSellChannel(["website", "bogus"], "social")).toEqual([
      "website",
      "social",
    ]);
  });
});

describe("sanitizeSellChannels / sanitizeBusinessKind — پاک‌سازی نشست", () => {
  test("ورودی غیرآرایه → []", () => {
    expect(sanitizeSellChannels(null)).toEqual([]);
    expect(sanitizeSellChannels("website")).toEqual([]);
    expect(sanitizeSellChannels({ 0: "website" })).toEqual([]);
  });

  test("idهای نامعتبر دور ریخته و تکرار حذف می‌شود", () => {
    expect(sanitizeSellChannels(["website", "bogus", "website", 42])).toEqual([
      "website",
    ]);
    expect(sanitizeSellChannels(["social", "social"])).toEqual(["social"]);
  });

  test("«تازه شروع می‌کنم» هیچ‌وقت با بقیه ذخیره نمی‌ماند", () => {
    expect(sanitizeSellChannels(["just_starting", "website"])).toEqual([
      "just_starting",
    ]);
    expect(sanitizeSellChannels(["website", "just_starting"])).toEqual([
      "just_starting",
    ]);
  });

  test("نوع کسب‌وکار — فقط ۵ مقدار دقیق", () => {
    expect(sanitizeBusinessKind("RESELLER")).toBe<BusinessKindId>("RESELLER");
    expect(sanitizeBusinessKind("CONSIGNMENT")).toBe<BusinessKindId>("CONSIGNMENT");
    expect(sanitizeBusinessKind("reseller")).toBeNull();
    expect(sanitizeBusinessKind("AGENT")).toBeNull();
    expect(sanitizeBusinessKind(null)).toBeNull();
    expect(sanitizeBusinessKind(3)).toBeNull();
    expect(sanitizeBusinessKind(["BRAND"])).toBeNull();
  });
});

describe("validateSellerProfilePick — اعتبارسنجی هر دو نسخه", () => {
  test("حقیقی: بدون انتخاب نامعتبر با پیام دقیق؛ با انتخاب معتبر", () => {
    expect(
      validateSellerProfilePick({
        sellerType: "individual",
        sellChannels: [],
        businessKind: null,
      })
    ).toEqual({ ok: false, message: "حداقل یک مورد انتخاب کن" });
    expect(
      validateSellerProfilePick({
        sellerType: "individual",
        sellChannels: ["website"],
        businessKind: null,
      })
    ).toEqual({ ok: true });
    expect(
      validateSellerProfilePick({
        sellerType: "individual",
        sellChannels: [JUST_STARTING_ID],
        businessKind: null,
      })
    ).toEqual({ ok: true });
  });

  test("حقوقی: بدون انتخاب نامعتبر با پیام دقیق؛ با انتخاب معتبر", () => {
    expect(
      validateSellerProfilePick({
        sellerType: "business",
        sellChannels: [],
        businessKind: null,
      })
    ).toEqual({ ok: false, message: "یکی را انتخاب کن" });
    expect(
      validateSellerProfilePick({
        sellerType: "business",
        sellChannels: [],
        businessKind: "BRAND",
      })
    ).toEqual({ ok: true });
    expect(
      validateSellerProfilePick({
        sellerType: "business",
        sellChannels: [],
        businessKind: "bogus" as string | null,
      })
    ).toEqual({ ok: false, message: "یکی را انتخاب کن" });
  });

  test("حقیقی: نوع کسب‌وکار انتخاب‌شده هم نسخهٔ حقیقی را معتبر نمی‌کند", () => {
    expect(
      validateSellerProfilePick({
        sellerType: "individual",
        sellChannels: [],
        businessKind: "RETAILER",
      })
    ).toEqual({ ok: false, message: "حداقل یک مورد انتخاب کن" });
  });
});

describe("isSellChannelsComplete", () => {
  test("[] ناقص؛ هر انتخابی کامل", () => {
    expect(isSellChannelsComplete([])).toBe(false);
    expect(isSellChannelsComplete(["social"])).toBe(true);
  });
});

describe("clearIncompatibleSellerProfile — پاک‌شدن draft با تغییر نوع", () => {
  test("حقیقی → حقوقی: کانال‌ها پاک و برچسب هشدار فقط اگر داده‌ای بود؛ نوع کسب‌وکار حفظ", () => {
    const r = clearIncompatibleSellerProfile(
      { sellChannels: ["website", "social"], businessKind: null },
      "business"
    );
    expect(r.nextSellChannels).toEqual([]);
    expect(r.nextBusinessKind).toBeNull();
    expect(r.clearedLabels).toEqual(["محل‌های فروش فعلی"]);
  });

  test("حقیقی خالی → حقوقی: بدون هشدار", () => {
    const r = clearIncompatibleSellerProfile(
      { sellChannels: [], businessKind: null },
      "business"
    );
    expect(r.clearedLabels).toEqual([]);
  });

  test("حقوقی → حقیقی: نوع کسب‌وکار پاک و برچسب هشدار فقط اگر داده‌ای بود؛ کانال‌ها حفظ", () => {
    const r = clearIncompatibleSellerProfile(
      { sellChannels: ["social"], businessKind: "LIQUIDATOR" },
      "individual"
    );
    expect(r.nextSellChannels).toEqual(["social"]);
    expect(r.nextBusinessKind).toBeNull();
    expect(r.clearedLabels).toEqual(["نوع کسب‌وکار"]);
  });

  test("حقوقی خالی → حقیقی: بدون هشدار", () => {
    const r = clearIncompatibleSellerProfile(
      { sellChannels: [], businessKind: null },
      "individual"
    );
    expect(r.clearedLabels).toEqual([]);
  });

  test("هم‌نوع → بدون پاک‌شدن و بدون هشدار", () => {
    const r = clearIncompatibleSellerProfile(
      { sellChannels: ["website"], businessKind: null },
      "individual"
    );
    expect(r.nextSellChannels).toEqual(["website"]);
    expect(r.clearedLabels).toEqual([]);
  });

  test("پیام هشدار کوتاه با برچسب پاک‌شده", () => {
    expect(profileChangeWarningMessage(["نوع کسب‌وکار"])).toBe(
      "با تغییر نوع فروشنده، این انتخاب‌های مرحلهٔ ویژگی‌های فروش پاک شد: نوع کسب‌وکار"
    );
  });
});
