/* ─────────────────────────────────────────────────────────────
   تست‌های واحد v2.0.6 — مرحلهٔ ۵ ثبت‌نام فروشنده (حضور آنلاین)
   ۱) نرمال‌سازی URL و رد scheme خطرناک (javascript:/data:/file:)
   ۲) handleهای معتبر و نامعتبر (اینستاگرام/تلگرام طبق مشخصات) و
      ساخت لینک نمایشی از handle (نه رشتهٔ خام کاربر)
   ۳) پرش مرحله برای «هیچ‌جا؛ تازه شروع می‌کنم» (shouldSkipPresence)
   ۴) پاک‌شدن داده با حذف کانال (clearChannelPresence + hadData)
   ۵) اعتبارسنجی هر دو نسخه (حداقل یک ردیف معتبر برای حقیقی؛
      اختیاریِ اعتبارسنجی‌شده برای حقوقی) + آدرس فیزیکی + تلفن
   (seller-presence.ts — توابع خالص)
   ───────────────────────────────────────────────────────────── */

import { describe, expect, test } from "bun:test";
import {
  OTHER_PLATFORM_LABEL,
  PRESENCE_KIND_LABEL,
  SOCIAL_PLATFORM_IDS,
  SOCIAL_ROWS_MAX,
  buildSocialUrl,
  canonicalPresenceLinks,
  canonicalizeOtherPlatform,
  canonicalizeSocial,
  clearChannelPresence,
  displayDomain,
  emptyPresenceDraft,
  isCityOfProvince,
  isProvinceName,
  isValidIranPhone,
  newPresenceRowId,
  normalizeUrl,
  presenceChannelClearedMessage,
  presenceHasAnyData,
  presenceSectionsFor,
  prunePresenceDraft,
  sanitizePresenceDraft,
  shouldSkipPresence,
  validatePresenceDraft,
  type SellerPresenceDraft,
} from "./seller-presence";

/* سازندهٔ draft برای تست‌ها — فقط فیلدهای داده‌شده پر می‌شوند */
function makeDraft(
  patch: Partial<SellerPresenceDraft> = {}
): SellerPresenceDraft {
  return { ...emptyPresenceDraft(), ...patch };
}

describe("normalizeUrl — نرمال‌سازی و امنیت URL", () => {
  test("بدون scheme → https:// اضافه می‌شود و href یکدست برمی‌گردد", () => {
    expect(normalizeUrl("example.com")).toEqual({
      ok: true,
      url: "https://example.com/",
    });
    expect(normalizeUrl("  https://Example.com/Path?q=1  ")).toEqual({
      ok: true,
      url: "https://example.com/Path?q=1",
    });
    expect(normalizeUrl("http://shop.example.ir/list")).toEqual({
      ok: true,
      url: "http://shop.example.ir/list",
    });
  });

  test("طرح‌های خطرناک رد می‌شوند: javascript: / data: / file: / ftp:", () => {
    expect(normalizeUrl("javascript:alert(1)").ok).toBeFalse();
    expect(normalizeUrl("data:text/html;base64,PHNjcmlwdD4=").ok).toBeFalse();
    expect(normalizeUrl("file:///etc/passwd").ok).toBeFalse();
    expect(normalizeUrl("ftp://example.com/x").ok).toBeFalse();
  });

  test("خالی / خیلی بلند / دامنهٔ نامعتبر / credential رد می‌شود", () => {
    expect(normalizeUrl("").ok).toBeFalse();
    expect(normalizeUrl("   ").ok).toBeFalse();
    expect(
      normalizeUrl(`https://example.com/${"a".repeat(220)}`).ok
    ).toBeFalse();
    expect(normalizeUrl("https://localhost").ok).toBeFalse(); // بدون نقطه
    expect(normalizeUrl("https://bad_domain.com").ok).toBeFalse(); // زیرخط
    expect(normalizeUrl("https://user:pass@example.com").ok).toBeFalse();
    expect(normalizeUrl("https://").ok).toBeFalse();
  });

  test("دامنهٔ مقصد برای نمایش ادمین (بدون www.)", () => {
    expect(displayDomain("https://www.instagram.com/sina.kicks/")).toBe(
      "instagram.com"
    );
    expect(displayDomain("https://t.me/sinakicks")).toBe("t.me");
  });
});

describe("canonicalizeSocial — لینک یا @نام‌کاربری → canonical {platform, handle}", () => {
  test("اینستاگرام: حروف/ارقام/نقطه/زیرخط تا ۳۰ کاراکتر", () => {
    expect(canonicalizeSocial("instagram", "@sina.kicks_1")).toEqual({
      ok: true,
      platform: "instagram",
      handle: "sina.kicks_1",
      url: "https://instagram.com/sina.kicks_1",
    });
    expect(canonicalizeSocial("instagram", "a".repeat(30)).ok).toBeTrue();
    expect(canonicalizeSocial("instagram", "a".repeat(31)).ok).toBeFalse();
    expect(canonicalizeSocial("instagram", "bad handle!").ok).toBeFalse();
    expect(canonicalizeSocial("instagram", "").ok).toBeFalse();
  });

  test("تلگرام: ۵ تا ۳۲ کاراکتر (حروف/ارقام/زیرخط)", () => {
    expect(canonicalizeSocial("telegram", "@shop_ir")).toEqual({
      ok: true,
      platform: "telegram",
      handle: "shop_ir",
      url: "https://t.me/shop_ir",
    });
    expect(canonicalizeSocial("telegram", "abcd").ok).toBeFalse(); // ۴ حرف
    expect(canonicalizeSocial("telegram", "a".repeat(32)).ok).toBeTrue();
    expect(canonicalizeSocial("telegram", "a".repeat(33)).ok).toBeFalse();
  });

  test("لینک کامل دامنهٔ خود پلتفرم → handle بیرون کشیده می‌شود", () => {
    expect(canonicalizeSocial("instagram", "https://www.instagram.com/mina.garden/?hl=fa")).toEqual({
      ok: true,
      platform: "instagram",
      handle: "mina.garden",
      url: "https://instagram.com/mina.garden",
    });
    expect(canonicalizeSocial("telegram", "https://telegram.me/someone")).toEqual({
      ok: true,
      platform: "telegram",
      handle: "someone",
      url: "https://t.me/someone",
    });
    expect(canonicalizeSocial("youtube", "https://www.youtube.com/@channel.name")).toEqual({
      ok: true,
      platform: "youtube",
      handle: "channel.name",
      url: "https://youtube.com/@channel.name",
    });
    expect(canonicalizeSocial("linkedin", "https://linkedin.com/in/ali-ahmadi")).toEqual({
      ok: true,
      platform: "linkedin",
      handle: "in/ali-ahmadi",
      url: "https://linkedin.com/in/ali-ahmadi",
    });
  });

  test("لینک با دامنهٔ اشتباه رد می‌شود (پیام مشخص)", () => {
    const r = canonicalizeSocial("instagram", "https://t.me/whatever");
    expect(r.ok).toBeFalse();
    if (!r.ok) expect(r.message).toBe("لینک باید به instagram.com باشد");
  });

  test("«دیگر» فقط لینک کامل می‌پذیرد و handle خام رد می‌شود", () => {
    expect(canonicalizeSocial("other", "https://example.com/me")).toEqual({
      ok: true,
      platform: "other",
      handle: "",
      url: "https://example.com/me",
    });
    expect(canonicalizeSocial("other", "@someone").ok).toBeFalse();
    expect(canonicalizeSocial("other", "someone").ok).toBeFalse();
  });

  test("لینک نمایشی همیشه از handle ساخته می‌شود — نه رشتهٔ خام کاربر", () => {
    const raw = "https://www.instagram.com/sina.kicks/?hl=fa&utm=x";
    const c = canonicalizeSocial("instagram", raw);
    expect(c.ok).toBeTrue();
    if (c.ok) {
      expect(c.url).toBe("https://instagram.com/sina.kicks");
      expect(c.url).toBe(buildSocialUrl("instagram", c.handle));
      expect(c.url).not.toContain("hl=fa");
    }
    expect(buildSocialUrl("youtube", "chan")).toBe("https://youtube.com/@chan");
    expect(buildSocialUrl("rubika", "chan")).toBe("https://rubika.ir/chan");
    expect(buildSocialUrl("bale", "chan")).toBe("https://ble.ir/chan");
  });
});

describe("canonicalizeOtherPlatform — لینک بازارهای آنلاین", () => {
  test("دیوار/باسلام/دیجی‌کالا: فقط دامنهٔ خودشان", () => {
    expect(canonicalizeOtherPlatform("divar", "https://divar.ir/seller/x").ok).toBeTrue();
    expect(canonicalizeOtherPlatform("basalam", "https://basalam.com/shop").ok).toBeTrue();
    expect(
      canonicalizeOtherPlatform("digikala", "https://www.digikala.com/seller/gadgetbazaar").ok
    ).toBeTrue();
    const bad = canonicalizeOtherPlatform("divar", "https://basalam.com/shop");
    expect(bad.ok).toBeFalse();
    if (!bad.ok) expect(bad.message).toBe("لینک باید به divar.ir باشد");
  });

  test("«دیگر» هر https معتبری می‌پذیرد؛ URL خراب رد می‌شود", () => {
    expect(canonicalizeOtherPlatform("other", "anything.com/shop").ok).toBeTrue();
    expect(canonicalizeOtherPlatform("other", "javascript:alert(1)").ok).toBeFalse();
  });

  test("برچسب‌های پلتفرم‌ها تک‌منبع‌اند", () => {
    expect(OTHER_PLATFORM_LABEL.divar).toBe("دیوار");
    expect(OTHER_PLATFORM_LABEL.digikala).toBe("دیجی‌کالا");
    expect(SOCIAL_PLATFORM_IDS).toContain("bale");
    expect(PRESENCE_KIND_LABEL.SOCIAL.length).toBeGreaterThan(0);
  });
});

describe("آدرس فیزیکی — استان/شهر/تلفن", () => {
  test("استان و شهر با normalizeFa یکی می‌شوند", () => {
    expect(isProvinceName("تهران")).toBeTrue();
    expect(isProvinceName("چهارمحال و بختیاری")).toBeTrue();
    expect(isProvinceName("  تهران  ")).toBeTrue(); // فاصلهٔ اضافه بی‌اثر
    expect(isProvinceName("بی‌خال")).toBeFalse();
    expect(isCityOfProvince("البرز", "کرج")).toBeTrue();
    expect(isCityOfProvince("البرز", "تهران")).toBeFalse();
  });

  test("تلفن: ۱۱ رقم با ۰ — ارقام فارسی هم پذیرفته می‌شود", () => {
    expect(isValidIranPhone("02112345678")).toBeTrue();
    expect(isValidIranPhone("09121234567")).toBeTrue();
    expect(isValidIranPhone("۰۲۱۱۲۳۴۵۶۷۸")).toBeTrue();
    expect(isValidIranPhone("021-1234 5678")).toBeTrue();
    expect(isValidIranPhone("12345678")).toBeFalse();
    expect(isValidIranPhone("0211234567")).toBeFalse();
  });
});

describe("پرش مرحلهٔ ۵ برای «تازه شروع می‌کنم»", () => {
  test("فقط [just_starting] پرش می‌شود؛ بقیه نه", () => {
    expect(shouldSkipPresence(["just_starting"])).toBeTrue();
    expect(shouldSkipPresence([])).toBeFalse();
    expect(shouldSkipPresence(["website"])).toBeFalse();
    expect(shouldSkipPresence(["just_starting", "website"])).toBeFalse();
  });

  test("بخش‌های نمایش‌داده‌شده: حقیقی = کانال‌های انتخابی؛ حقوقی = هر ۴", () => {
    expect(presenceSectionsFor("individual", ["website", "social"])).toEqual([
      "website",
      "social",
    ]);
    expect(
      presenceSectionsFor("individual", ["social", "just_starting"])
    ).toEqual(["social"]);
    expect(presenceSectionsFor("business", [])).toEqual([
      "website",
      "social",
      "physical_store",
      "other_platforms",
    ]);
  });
});

describe("clearChannelPresence — حذف کانال دادهٔ همان کانال را پاک می‌کند", () => {
  test("وب‌سایت: hadData فقط اگر URL داشت", () => {
    const withData = clearChannelPresence(
      makeDraft({ websiteUrl: "https://example.com" }),
      "website"
    );
    expect(withData.hadData).toBeTrue();
    expect(withData.next.websiteUrl).toBe("");
    const empty = clearChannelPresence(makeDraft(), "website");
    expect(empty.hadData).toBeFalse();
  });

  test("شبکهٔ اجتماعی: ردیف‌های دارای محتوا → hadData", () => {
    const d = makeDraft({
      social: [{ id: "r1", platform: "instagram", handle: "@a" }],
    });
    const r = clearChannelPresence(d, "social");
    expect(r.hadData).toBeTrue();
    expect(r.next.social).toEqual([]);
    const onlyEmpty = clearChannelPresence(
      makeDraft({
        social: [{ id: "r1", platform: "instagram", handle: "" }],
      }),
      "social"
    );
    expect(onlyEmpty.hadData).toBeFalse();
  });

  test("فروشگاه فیزیکی: هر فیلد پر ← hadData؛ همهٔ فیلدها پاک می‌شوند", () => {
    const d = makeDraft({
      store: { province: "تهران", city: "تهران", address: "", phone: "" },
    });
    const r = clearChannelPresence(d, "physical_store");
    expect(r.hadData).toBeTrue();
    expect(r.next.store).toEqual(emptyPresenceDraft().store);
  });

  test("بازارهای آنلاین و کانال ناشناخته", () => {
    const r = clearChannelPresence(
      makeDraft({
        otherPlatforms: [{ id: "o1", platform: "divar", url: "https://divar.ir/x" }],
      }),
      "other_platforms"
    );
    expect(r.hadData).toBeTrue();
    expect(r.next.otherPlatforms).toEqual([]);
    expect(clearChannelPresence(makeDraft({ websiteUrl: "x" }), "bogus").hadData).toBeFalse();
  });

  test("پیام هشدار کوتاه — تکی و چندتایی", () => {
    expect(presenceChannelClearedMessage(["وب‌سایت"])).toBe(
      "اطلاعات حضور آنلاین «وب‌سایت» با حذف این انتخاب پاک شد"
    );
    expect(presenceChannelClearedMessage(["وب‌سایت", "شبکه‌های اجتماعی"])).toContain(
      "وب‌سایت، شبکه‌های اجتماعی"
    );
  });
});

describe("validatePresenceDraft — نسخهٔ حقیقی: هر بخش حداقل یک ردیف معتبر", () => {
  test("وب‌سایتِ خالی → خطای بخش؛ URL خراب → پیام فرمت", () => {
    const v = validatePresenceDraft(makeDraft(), {
      sellerType: "individual",
      channels: ["website"],
    });
    expect(v.ok).toBeFalse();
    expect(v.errors["website.url"]).toBe("آدرس وب‌سایت را وارد کن");
    expect(v.missingSections).toEqual(["website"]);

    const bad = validatePresenceDraft(
      makeDraft({ websiteUrl: "javascript:alert(1)" }),
      { sellerType: "individual", channels: ["website"] }
    );
    expect(bad.errors["website.url"]).toBe("فقط http و https مجاز است");
  });

  test("شبکهٔ اجتماعی: همهٔ ردیف‌ها خالی → پیام بخش؛ ردیف خراب → خطای ردیف", () => {
    const empty = validatePresenceDraft(
      makeDraft({
        social: [{ id: "r1", platform: "instagram", handle: "" }],
      }),
      { sellerType: "individual", channels: ["social"] }
    );
    expect(empty.ok).toBeFalse();
    expect(empty.errors["social.section"]).toBe(
      "حداقل یک شبکهٔ اجتماعی معتبر اضافه کن"
    );
    expect(empty.missingSections).toEqual(["social"]);

    const invalid = validatePresenceDraft(
      makeDraft({
        social: [
          { id: "r1", platform: "instagram", handle: "bad handle!" },
          { id: "r2", platform: "telegram", handle: "@good_one" },
        ],
      }),
      { sellerType: "individual", channels: ["social"] }
    );
    expect(invalid.ok).toBeFalse();
    expect(invalid.errors["social.r1.handle"]).toContain("اینستاگرام");
    expect(invalid.errors["social.section"]).toBeUndefined();
    expect(invalid.missingSections).toEqual([]);
  });

  test("فروشگاه فیزیکی: استان/شهر/نشانی الزامی؛ تلفن اختیاری اما اگر پر شد معتبر", () => {
    const base = {
      sellerType: "individual" as const,
      channels: ["physical_store"],
    };
    const empty = validatePresenceDraft(makeDraft(), base);
    expect(empty.errors["store.province"]).toBe("استان را انتخاب کن");
    expect(empty.errors["store.city"]).toBe("شهر را انتخاب کن");
    expect(empty.errors["store.address"]).toContain("حداقل ۱۰ حرف");

    const mismatch = validatePresenceDraft(
      makeDraft({
        store: {
          province: "البرز",
          city: "تهران",
          address: "خیابان ولیعصر، پلاک ۱۲",
          phone: "",
        },
      }),
      base
    );
    expect(mismatch.errors["store.city"]).toBe(
      "شهر با استان انتخاب‌شده هم‌خوانی ندارد"
    );

    const badPhone = validatePresenceDraft(
      makeDraft({
        store: {
          province: "البرز",
          city: "کرج",
          address: "خیابان ولیعصر، پلاک ۱۲",
          phone: "12345",
        },
      }),
      base
    );
    expect(badPhone.ok).toBeFalse();
    expect(badPhone.errors["store.phone"]).toContain("معتبر نیست");

    const good = validatePresenceDraft(
      makeDraft({
        store: {
          province: "البرز",
          city: "کرج",
          address: "خیابان ولیعصر، پلاک ۱۲",
          phone: "02612345678",
        },
      }),
      base
    );
    expect(good.ok).toBeTrue();
  });

  test("چهار کانال با دادهٔ معتبر → اوکی؛ «تازه شروع می‌کنم» همیشه اوکی", () => {
    const full = validatePresenceDraft(
      makeDraft({
        websiteUrl: "example.com",
        social: [{ id: "r1", platform: "instagram", handle: "@a.b" }],
        store: {
          province: "تهران",
          city: "تهران",
          address: "خیابان ولیعصر، پلاک ۱۲",
          phone: "",
        },
        otherPlatforms: [
          { id: "o1", platform: "divar", url: "https://divar.ir/seller/x" },
        ],
      }),
      {
        sellerType: "individual",
        channels: ["website", "social", "physical_store", "other_platforms"],
      }
    );
    expect(full.ok).toBeTrue();

    const skip = validatePresenceDraft(makeDraft(), {
      sellerType: "individual",
      channels: ["just_starting"],
    });
    expect(skip.ok).toBeTrue();
  });
});

describe("validatePresenceDraft — نسخهٔ حقوقی: همه اختیاری اما اعتبارسنجی‌شده", () => {
  test("همهٔ بخش‌ها خالی → اوکی (مستقیم بعدی می‌زند)", () => {
    const v = validatePresenceDraft(
      makeDraft({
        social: [{ id: "r1", platform: "instagram", handle: "" }],
        otherPlatforms: [{ id: "o1", platform: "divar", url: "" }],
      }),
      { sellerType: "business", channels: [] }
    );
    expect(v.ok).toBeTrue();
    expect(v.missingSections).toEqual([]);
  });

  test("مقدارِ پرشدهٔ خراب → خطا حتی برای حقوقی", () => {
    const v = validatePresenceDraft(
      makeDraft({
        websiteUrl: "not a url???",
        social: [{ id: "r1", platform: "telegram", handle: "abc" }],
      }),
      { sellerType: "business", channels: [] }
    );
    expect(v.ok).toBeFalse();
    expect(v.errors["website.url"]).toBeTruthy();
    expect(v.errors["social.r1.handle"]).toContain("تلگرام");
  });

  test("حقوقی با یک ردیف معتبر در بخش‌های دلخواه → اوکی", () => {
    const v = validatePresenceDraft(
      makeDraft({
        social: [{ id: "r1", platform: "instagram", handle: "gadget.bazaar" }],
      }),
      { sellerType: "business", channels: [] }
    );
    expect(v.ok).toBeTrue();
  });
});

describe("sanitizePresenceDraft / prune / helpers", () => {
  test("شکل خراب → پیش‌فرض تمیز", () => {
    expect(sanitizePresenceDraft(null)).toEqual(emptyPresenceDraft());
    expect(sanitizePresenceDraft("x")).toEqual(emptyPresenceDraft());
    const bad = sanitizePresenceDraft({
      websiteUrl: 42,
      social: "nope",
      store: "nope",
      otherPlatforms: [{ id: 5, platform: "bogus", url: 9 }],
      linksPublic: "yes",
    });
    expect(bad.websiteUrl).toBe("");
    expect(bad.social).toEqual([]);
    expect(bad.store).toEqual(emptyPresenceDraft().store);
    expect(bad.otherPlatforms[0].platform).toBe("divar"); // ناشناخته → گزینهٔ نخست
    expect(bad.otherPlatforms[0].url).toBe("");
    expect(bad.linksPublic).toBeFalse();
  });

  test("سقف ۵ ردیف و پلتفرم ناشناختهٔ اجتماعی → اینستاگرام", () => {
    const rows = Array.from({ length: 8 }, (_, i) => ({
      id: `r${i}`,
      platform: "bogus",
      handle: "h",
    }));
    const s = sanitizePresenceDraft({ social: rows });
    expect(s.social.length).toBe(SOCIAL_ROWS_MAX);
    expect(s.social[0].platform).toBe("instagram");
  });

  test("prunePresenceDraft ردیف‌های خالی را می‌حورد", () => {
    const p = prunePresenceDraft(
      makeDraft({
        social: [
          { id: "r1", platform: "instagram", handle: "" },
          { id: "r2", platform: "instagram", handle: "@a" },
        ],
        otherPlatforms: [{ id: "o1", platform: "divar", url: "  " }],
      })
    );
    expect(p.social.map((r) => r.id)).toEqual(["r2"]);
    expect(p.otherPlatforms).toEqual([]);
  });

  test("presenceHasAnyData و newPresenceRowId", () => {
    expect(presenceHasAnyData(makeDraft())).toBeFalse();
    expect(presenceHasAnyData(makeDraft({ websiteUrl: "x" }))).toBeTrue();
    expect(presenceHasAnyData(makeDraft({ linksPublic: true }))).toBeTrue();
    const id1 = newPresenceRowId("soc");
    const id2 = newPresenceRowId("soc");
    expect(id1).not.toBe(id2);
    expect(id1.startsWith("soc-")).toBeTrue();
  });

  test("canonicalPresenceLinks — فقط مقادیر معتبر، با kind/platform صحیح", () => {
    const links = canonicalPresenceLinks(
      makeDraft({
        websiteUrl: "example.com",
        social: [
          { id: "r1", platform: "instagram", handle: "@sina.kicks" },
          { id: "r2", platform: "instagram", handle: "bad handle!" },
          { id: "r3", platform: "instagram", handle: "" },
        ],
        otherPlatforms: [
          { id: "o1", platform: "digikala", url: "https://www.digikala.com/seller/gb" },
          { id: "o2", platform: "divar", url: "javascript:alert(1)" },
        ],
      })
    );
    expect(links).toEqual([
      { kind: "WEBSITE", platform: null, value: "https://example.com/" },
      { kind: "SOCIAL", platform: "instagram", value: "https://instagram.com/sina.kicks" },
      { kind: "OTHER_PLATFORM", platform: "digikala", value: "https://www.digikala.com/seller/gb" },
    ]);
    for (const l of links) {
      expect(Object.keys(PRESENCE_KIND_LABEL)).toContain(l.kind);
      expect(l.value.startsWith("https://")).toBeTrue();
    }
  });
});
