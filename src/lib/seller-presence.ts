/* ─────────────────────────────────────────────────────────────
   v2.0.6 — منطق خالص مرحلهٔ ۵ ثبت‌نام فروشنده: «حضور آنلاین»
   (صفحهٔ SellerPresencePickView و پنل ادمین این توابع را مصرف
   می‌کنند؛ همین توابع تست واحد دارند — seller-presence.test.ts)

   فقط بخش‌های مربوط به انتخاب مرحلهٔ ۴ نمایش داده می‌شود:
   ─ حقیقی: کانال‌های انتخابی مرحلهٔ ۴ (هر بخشِ نمایش‌داده‌شده
     حداقل یک ردیف معتبر لازم دارد)؛ «هیچ‌جا؛ تازه شروع می‌کنم»
     ← کل این مرحله پرش می‌شود (shouldSkipPresence).
   ─ حقوقی: هر ۴ بخش، همه اختیاری (فقط مقدارِ پرشده اعتبارسنجی
     می‌شود).

   امنیت (SECURITY.md):
   ─ فقط http/https؛ طرح‌های خطرناک (javascript:، data:، file:)
     رد می‌شوند؛ بدون scheme پیش‌فرض https:// اضافه می‌شود.
   ─ لینک نمایشی شبکهٔ اجتماعی همیشه از handle ساخته می‌شود
     (buildSocialUrl) — نه از رشتهٔ خام کاربر.
   ─ هیچ درخواست سمت سرور به این آدرس‌ها زده نمی‌شود (بدون
     پیش‌نمایش/بررسی خودکار) تا مسیر SSRF باز نشود.
   همهٔ توابع خالص‌اند (بدون استور/React/DOM).
   ───────────────────────────────────────────────────────────── */

import { normalizeFa } from "./normalize";
import { PROVINCES, citiesOf } from "./data/provinces";
import { JUST_STARTING_ID } from "./seller-profile-pick";
import type { SellerType } from "./seller-identity";

/* ── سقف‌ها ── */

export const URL_MAX_LENGTH = 200;
export const SOCIAL_ROWS_MAX = 5;
export const OTHER_ROWS_MAX = 5;
export const STORE_ADDRESS_MIN = 10;
export const STORE_ADDRESS_MAX = 300;

/* ── پیام‌های خطا (فارسی، دقیقاً طبق مشخصات) ── */

export const PRESENCE_URL_EMPTY_MESSAGE = "آدرس را وارد کن";
export const PRESENCE_URL_INVALID_MESSAGE =
  "آدرس معتبر نیست — مثل https://example.com";
export const PRESENCE_URL_TOO_LONG_MESSAGE =
  "آدرس حداکثر ۲۰۰ کاراکتر است";
export const PRESENCE_URL_SCHEME_MESSAGE = "فقط http و https مجاز است";
export const PRESENCE_HANDLE_EMPTY_MESSAGE = "نام کاربری یا لینک را وارد کن";
export const PRESENCE_OTHER_NEEDS_URL_MESSAGE =
  "برای گزینهٔ «دیگر» لینک کامل با https:// وارد کن";
export const PRESENCE_WEBSITE_REQUIRED_MESSAGE = "آدرس وب‌سایت را وارد کن";
export const PRESENCE_SOCIAL_SECTION_MESSAGE =
  "حداقل یک شبکهٔ اجتماعی معتبر اضافه کن";
export const PRESENCE_OTHER_SECTION_MESSAGE =
  "حداقل یک لینک بازار معتبر اضافه کن";
export const STORE_PROVINCE_REQUIRED_MESSAGE = "استان را انتخاب کن";
export const STORE_CITY_REQUIRED_MESSAGE = "شهر را انتخاب کن";
export const STORE_CITY_MISMATCH_MESSAGE = "شهر با استان انتخاب‌شده هم‌خوانی ندارد";
export const STORE_ADDRESS_REQUIRED_MESSAGE =
  "نشانی را کامل بنویس (حداقل ۱۰ حرف)";
export const STORE_PHONE_INVALID_MESSAGE =
  "شمارهٔ تلفن معتبر نیست — مثل ۰۲۱۱۲۳۴۵۶۷۸";

export function presenceHandleInvalidMessage(platformLabel: string): string {
  return `نام کاربری یا لینک ${platformLabel} معتبر نیست`;
}
export function presenceDomainMismatchMessage(domain: string): string {
  return `لینک باید به ${domain} باشد`;
}

/* ── پلتفرم‌های شبکهٔ اجتماعی (Select مرحلهٔ ۵) ── */

export const SOCIAL_PLATFORM_IDS = [
  "instagram",
  "telegram",
  "youtube",
  "aparat",
  "eitaa",
  "rubika",
  "bale",
  "linkedin",
  "other",
] as const;

export type SocialPlatformId = (typeof SOCIAL_PLATFORM_IDS)[number];

export const SOCIAL_PLATFORM_LABEL: Readonly<Record<SocialPlatformId, string>> = {
  instagram: "اینستاگرام",
  telegram: "تلگرام",
  youtube: "یوتیوب",
  aparat: "آپارات",
  eitaa: "ایتا",
  rubika: "روبیکا",
  bale: "بله",
  linkedin: "لینکدین",
  other: "دیگر",
};

/** دامنهٔ canonical هر پلتفرم — لینک نمایشی از همین ساخته می‌شود */
const SOCIAL_DOMAIN: Readonly<
  Record<Exclude<SocialPlatformId, "other">, string>
> = {
  instagram: "instagram.com",
  telegram: "t.me",
  youtube: "youtube.com",
  aparat: "aparat.com",
  eitaa: "eitaa.com",
  rubika: "rubika.ir",
  bale: "ble.ir",
  linkedin: "linkedin.com",
};

/** دامنه‌های دیگرِ همان سرویس — لینکِ این‌ها هم پذیرفته می‌شود */
const SOCIAL_ALT_DOMAINS: Readonly<
  Partial<Record<Exclude<SocialPlatformId, "other">, readonly string[]>>
> = {
  telegram: ["telegram.me"],
  eitaa: ["eitaa.me"],
  bale: ["bale.ai"],
};

/**
 * الگوی نام کاربری هر پلتفرم — طبق مشخصات:
 * اینستاگرام حروف/ارقام/نقطه/زیرخط تا ۳۰؛ تلگرام ۵ تا ۳۲؛
 * بقیه الگوی عملی همان سرویس.
 */
const SOCIAL_HANDLE_PATTERN: Readonly<
  Record<Exclude<SocialPlatformId, "other">, RegExp>
> = {
  instagram: /^[A-Za-z0-9._]{1,30}$/,
  telegram: /^[A-Za-z0-9_]{5,32}$/,
  youtube: /^[A-Za-z0-9._-]{3,30}$/,
  aparat: /^[A-Za-z0-9._-]{3,64}$/,
  eitaa: /^[A-Za-z0-9._-]{3,64}$/,
  rubika: /^[A-Za-z0-9._-]{3,64}$/,
  bale: /^[A-Za-z0-9._-]{3,64}$/,
  linkedin: /^[A-Za-z0-9._-]{2,64}$/,
};

/* ── بازارهای آنلاین دیگر (Select مرحلهٔ ۵) ── */

export const OTHER_PLATFORM_IDS = ["divar", "basalam", "digikala", "other"] as const;

export type OtherPlatformId = (typeof OTHER_PLATFORM_IDS)[number];

export const OTHER_PLATFORM_LABEL: Readonly<Record<OtherPlatformId, string>> = {
  divar: "دیوار",
  basalam: "باسلام",
  digikala: "دیجی‌کالا",
  other: "دیگر",
};

const OTHER_PLATFORM_DOMAIN: Readonly<
  Record<Exclude<OtherPlatformId, "other">, string>
> = {
  divar: "divar.ir",
  basalam: "basalam.com",
  digikala: "digikala.com",
};

/* ── دادهٔ draft مرحلهٔ ۵ (استور + sessionStorage) ── */

export interface SocialRow {
  id: string;
  platform: SocialPlatformId;
  /** ورودی خام کاربر (لینک یا @نام‌کاربری) — canonical در لحظهٔ ذخیره/نمایش */
  handle: string;
}

export interface OtherPlatformRow {
  id: string;
  platform: OtherPlatformId;
  url: string;
}

export interface StoreAddressDraft {
  province: string;
  city: string;
  address: string;
  /** اختیاری */
  phone: string;
}

export interface SellerPresenceDraft {
  websiteUrl: string;
  social: SocialRow[];
  store: StoreAddressDraft;
  otherPlatforms: OtherPlatformRow[];
  /** سوئیچ «نمایش لینک‌ها در پروفایل فروشگاه» — پیش‌فرض خاموش */
  linksPublic: boolean;
}

export function emptyPresenceDraft(): SellerPresenceDraft {
  return {
    websiteUrl: "",
    social: [],
    store: { province: "", city: "", address: "", phone: "" },
    otherPlatforms: [],
    linksPublic: false,
  };
}

/** id یکتا برای ردیف‌های قابل افزودن/حذف (فقط سمت کلاینت، با لمس کاربر) */
export function newPresenceRowId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/* ── پاک‌سازی نشست ── */

function sanitizeString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * پاک‌سازی مقدار ذخیره‌شدهٔ مرحلهٔ ۵ (sessionStorage):
 * شکل خراب → پیش‌فرض؛ ردیف‌های اضافه دور ریخته (سقف ۵)؛ پلتفرم
 * ناشناخته → گزینهٔ نخست Select؛ رشته‌های خراب → "".
 */
export function sanitizePresenceDraft(raw: unknown): SellerPresenceDraft {
  const base = emptyPresenceDraft();
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return base;
  const o = raw as Record<string, unknown>;

  const social: SocialRow[] = Array.isArray(o.social)
    ? o.social
        .slice(0, SOCIAL_ROWS_MAX)
        .map((r, i): SocialRow => {
          const row = (r ?? {}) as Record<string, unknown>;
          return {
            id:
              typeof row.id === "string" && row.id
                ? row.id
                : newPresenceRowId(`soc${i}`),
            platform: (SOCIAL_PLATFORM_IDS as readonly string[]).includes(
              row.platform as string
            )
              ? (row.platform as SocialPlatformId)
              : "instagram",
            handle: sanitizeString(row.handle),
          };
        })
    : [];

  const otherPlatforms: OtherPlatformRow[] = Array.isArray(o.otherPlatforms)
    ? o.otherPlatforms
        .slice(0, OTHER_ROWS_MAX)
        .map((r, i): OtherPlatformRow => {
          const row = (r ?? {}) as Record<string, unknown>;
          return {
            id:
              typeof row.id === "string" && row.id
                ? row.id
                : newPresenceRowId(`oth${i}`),
            platform: (OTHER_PLATFORM_IDS as readonly string[]).includes(
              row.platform as string
            )
              ? (row.platform as OtherPlatformId)
              : "divar",
            url: sanitizeString(row.url),
          };
        })
    : [];

  const storeRaw = (o.store ?? {}) as Record<string, unknown>;
  return {
    websiteUrl: sanitizeString(o.websiteUrl),
    social,
    store: {
      province: sanitizeString(storeRaw.province),
      city: sanitizeString(storeRaw.city),
      address: sanitizeString(storeRaw.address),
      phone: sanitizeString(storeRaw.phone),
    },
    otherPlatforms,
    linksPublic: o.linksPublic === true,
  };
}

/* ── URL — نرمال‌سازی و اعتبارسنجی ── */

export type UrlValidity = { ok: true; url: string } | { ok: false; message: string };

/** دامنهٔ معتبر: برچسب‌های حرف/رقم/خط تیره با حداقل یک نقطه (TLD الزامی) */
const HOST_PATTERN =
  /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i;

/**
 * اگر scheme نداشت https:// اضافه می‌شود؛ فقط http و https مجاز؛
 * هر چیز دیگر (javascript:، data:، file: و …) رد می‌شود؛ حداکثر
 * ۲۰۰ کاراکتر؛ دامنه باید معتبر باشد (حداقل یک نقطه، بدون زیرخط).
 * خروجی: href یکدست‌شدهٔ URL (scheme/host کوچک‌شده).
 */
export function normalizeUrl(rawInput: string): UrlValidity {
  const raw = rawInput.trim();
  if (!raw) return { ok: false, message: PRESENCE_URL_EMPTY_MESSAGE };
  if (raw.length > URL_MAX_LENGTH) {
    return { ok: false, message: PRESENCE_URL_TOO_LONG_MESSAGE };
  }
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw);
  const candidate = hasScheme ? raw : `https://${raw}`;
  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    return { ok: false, message: PRESENCE_URL_INVALID_MESSAGE };
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    return { ok: false, message: PRESENCE_URL_SCHEME_MESSAGE };
  }
  /* credential در URL مسیر پنهان‌کردن مقصد است — رد می‌شود */
  if (u.username || u.password) {
    return { ok: false, message: PRESENCE_URL_INVALID_MESSAGE };
  }
  if (!HOST_PATTERN.test(u.hostname)) {
    return { ok: false, message: PRESENCE_URL_INVALID_MESSAGE };
  }
  if (u.href.length > URL_MAX_LENGTH) {
    return { ok: false, message: PRESENCE_URL_TOO_LONG_MESSAGE };
  }
  return { ok: true, url: u.href };
}

/** دامنهٔ مقصد برای نمایش به ادمین (بدون www.) — متن escape نهایی با React */
export function displayDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url.slice(0, 40);
  }
}

function hostMatchesPlatform(
  hostname: string,
  domain: string,
  alts: readonly string[]
): boolean {
  const h = hostname.toLowerCase().replace(/^www\./, "");
  if (h === domain || h.endsWith(`.${domain}`)) return true;
  return alts.some((a) => h === a || h.endsWith(`.${a}`));
}

/* ── شبکه‌های اجتماعی — canonical {platform, handle} ── */

export type SocialCanonical =
  | { ok: true; platform: SocialPlatformId; handle: string; url: string }
  | { ok: false; message: string };

/** لینک نمایشی همیشه از handle ساخته می‌شود — نه از رشتهٔ خام کاربر */
export function buildSocialUrl(
  platform: SocialPlatformId,
  handle: string
): string {
  if (platform === "other") return handle; // «دیگر» فقط لینک کامل می‌پذیرد
  if (platform === "youtube") return `https://youtube.com/@${handle}`;
  return `https://${SOCIAL_DOMAIN[platform]}/${handle}`;
}

/**
 * «لینک کامل یا @نام‌کاربری» → canonical {platform, handle}:
 * ─ ورودی با scheme یا شامل «/» → URL؛ دامنه باید همان پلتفرم باشد
 *   (به‌جز «دیگر» که هر لینک معتبری می‌پذیرد) و handle از مسیر بیرون
 *   کشیده می‌شود.
 * ─ ورودی با @ یا خام → الگوی نام کاربری همان پلتفرم.
 * لینکدین: مسیر /in/{h} یا /company/{h} → هندل مسیری «in/{h}».
 */
export function canonicalizeSocial(
  platform: SocialPlatformId,
  rawInput: string
): SocialCanonical {
  const raw = rawInput.trim();
  if (!raw) return { ok: false, message: PRESENCE_HANDLE_EMPTY_MESSAGE };

  if (platform === "other") {
    if (raw.startsWith("@")) {
      return { ok: false, message: PRESENCE_OTHER_NEEDS_URL_MESSAGE };
    }
    const u = normalizeUrl(raw);
    if (!u.ok) {
      return {
        ok: false,
        message: raw.includes("/") || /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)
          ? PRESENCE_URL_INVALID_MESSAGE
          : PRESENCE_OTHER_NEEDS_URL_MESSAGE,
      };
    }
    return { ok: true, platform, handle: "", url: u.url };
  }

  const domain = SOCIAL_DOMAIN[platform];
  const alts = SOCIAL_ALT_DOMAINS[platform] ?? [];
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw);
  const looksLikeUrl = hasScheme || raw.includes("/");

  if (looksLikeUrl) {
    const u = normalizeUrl(raw);
    if (!u.ok) return { ok: false, message: u.message };
    const parsed = new URL(u.url);
    if (!hostMatchesPlatform(parsed.hostname, domain, alts)) {
      return { ok: false, message: presenceDomainMismatchMessage(domain) };
    }
    if (platform === "linkedin") {
      const m = parsed.pathname.match(/^\/(in|company)\/([^/]+)/);
      if (!m) {
        return {
          ok: false,
          message: presenceHandleInvalidMessage(SOCIAL_PLATFORM_LABEL[platform]),
        };
      }
      const handle = `${m[1]}/${decodeURIComponent(m[2])}`;
      return { ok: true, platform, handle, url: `https://linkedin.com/${handle}` };
    }
    let handle = parsed.pathname.split("/").filter(Boolean)[0] ?? "";
    try {
      handle = decodeURIComponent(handle);
    } catch {
      /* % خراب — همان خام می‌ماند و با الگو رد می‌شود */
    }
    if (platform === "youtube" && handle.startsWith("@")) handle = handle.slice(1);
    if (!handle || !SOCIAL_HANDLE_PATTERN[platform].test(handle)) {
      return {
        ok: false,
        message: presenceHandleInvalidMessage(SOCIAL_PLATFORM_LABEL[platform]),
      };
    }
    return { ok: true, platform, handle, url: buildSocialUrl(platform, handle) };
  }

  const handle = raw.startsWith("@") ? raw.slice(1) : raw;
  if (!SOCIAL_HANDLE_PATTERN[platform].test(handle)) {
    return {
      ok: false,
      message: presenceHandleInvalidMessage(SOCIAL_PLATFORM_LABEL[platform]),
    };
  }
  return { ok: true, platform, handle, url: buildSocialUrl(platform, handle) };
}

/* ── بازارهای آنلاین دیگر — لینک ── */

export type OtherPlatformCanonical =
  | { ok: true; url: string }
  | { ok: false; message: string };

export function canonicalizeOtherPlatform(
  platform: OtherPlatformId,
  raw: string
): OtherPlatformCanonical {
  const u = normalizeUrl(raw);
  if (!u.ok) return { ok: false, message: u.message };
  if (platform !== "other") {
    const host = new URL(u.url).hostname;
    if (!hostMatchesPlatform(host, OTHER_PLATFORM_DOMAIN[platform], [])) {
      return {
        ok: false,
        message: presenceDomainMismatchMessage(OTHER_PLATFORM_DOMAIN[platform]),
      };
    }
  }
  return { ok: true, url: u.url };
}

/* ── آدرس فیزیکی ── */

/** شمارهٔ تلفن ایران: ۱۱ رقم با ۰ ابتدا (موبایل یا ثابت) — ارقام فارسی اوکی */
export function isValidIranPhone(raw: string): boolean {
  const t = normalizeFa(raw).replace(/[\s\-()]/g, "");
  return /^0\d{10}$/.test(t);
}

export function isProvinceName(name: string): boolean {
  const key = normalizeFa(name);
  return key.length > 0 && PROVINCES.some((p) => normalizeFa(p.name) === key);
}

export function isCityOfProvince(province: string, city: string): boolean {
  if (!isProvinceName(province)) return false;
  const key = normalizeFa(city);
  return key.length > 0 && citiesOf(province).some((c) => normalizeFa(c) === key);
}

/* ── بخش‌های نمایش‌داده‌شده + پرش مرحله ── */

export const PRESENCE_SECTION_IDS = [
  "website",
  "social",
  "physical_store",
  "other_platforms",
] as const;

export type PresenceSectionId = (typeof PRESENCE_SECTION_IDS)[number];

/** حقیقی: فقط کانال‌های انتخابی مرحلهٔ ۴؛ حقوقی: هر ۴ بخش */
export function presenceSectionsFor(
  sellerType: SellerType,
  channels: readonly string[]
): PresenceSectionId[] {
  if (sellerType === "business") return [...PRESENCE_SECTION_IDS];
  return channels.filter(
    (c): c is PresenceSectionId =>
      (PRESENCE_SECTION_IDS as readonly string[]).includes(c)
  );
}

/** «هیچ‌جا؛ تازه شروع می‌کنم» → کل مرحلهٔ حضور آنلاین پرش می‌شود */
export function shouldSkipPresence(channels: readonly string[]): boolean {
  return channels.length === 1 && channels[0] === JUST_STARTING_ID;
}

/* ── اعتبارسنجی کل مرحلهٔ ۵ ── */

/**
 * کلیدهای خطا (برای حاشیهٔ قرمز + پیام زیر فیلد):
 * website.url — social.{rowId}.handle — social.section —
 * store.province / store.city / store.address / store.phone —
 * other.{rowId}.url — other.section
 */
export type PresenceFieldErrors = Record<string, string>;

export interface PresenceValidation {
  ok: boolean;
  errors: PresenceFieldErrors;
  /** بخش‌های بدون هیچ ردیف معتبر — فقط نسخهٔ حقیقی (الزام حداقل یک ردیف) */
  missingSections: PresenceSectionId[];
}

export function validatePresenceDraft(
  presence: SellerPresenceDraft,
  ctx: { sellerType: SellerType; channels: readonly string[] }
): PresenceValidation {
  const errors: PresenceFieldErrors = {};
  const missingSections: PresenceSectionId[] = [];
  const individual = ctx.sellerType === "individual";
  const sections = presenceSectionsFor(ctx.sellerType, ctx.channels);

  /* وب‌سایت — یک فیلد URL (برای حقوقی اختیاری است) */
  if (sections.includes("website")) {
    const rawUrl = presence.websiteUrl.trim();
    if (!rawUrl) {
      if (individual) {
        errors["website.url"] = PRESENCE_WEBSITE_REQUIRED_MESSAGE;
        missingSections.push("website");
      }
    } else {
      const u = normalizeUrl(rawUrl);
      if (!u.ok) errors["website.url"] = u.message;
    }
  }

  /* شبکه‌های اجتماعی — تا ۵ ردیف؛ حداقل یک ردیف معتبر برای حقیقی */
  if (sections.includes("social")) {
    let validSocial = 0;
    for (const row of presence.social) {
      if (!row.handle.trim()) continue; /* ردیف خالی نادیده گرفته می‌شود */
      const c = canonicalizeSocial(row.platform, row.handle);
      if (c.ok) validSocial += 1;
      else errors[`social.${row.id}.handle`] = c.message;
    }
    if (individual && validSocial === 0) {
      missingSections.push("social");
      errors["social.section"] = PRESENCE_SOCIAL_SECTION_MESSAGE;
    }
  }

  /* فروشگاه/انبار فیزیکی — استان/شهر/نشانی؛ تلفن اختیاری */
  if (sections.includes("physical_store")) {
    const s = presence.store;
    const filled =
      !!s.province.trim() || !!s.city.trim() || !!s.address.trim() || !!s.phone.trim();
    if (individual || filled) {
      if (!s.province.trim()) {
        errors["store.province"] = STORE_PROVINCE_REQUIRED_MESSAGE;
      } else if (!isProvinceName(s.province)) {
        errors["store.province"] = STORE_PROVINCE_REQUIRED_MESSAGE;
      }
      if (!s.city.trim()) {
        errors["store.city"] = STORE_CITY_REQUIRED_MESSAGE;
      } else if (!isProvinceName(s.province)) {
        errors["store.city"] = STORE_PROVINCE_REQUIRED_MESSAGE;
      } else if (!isCityOfProvince(s.province, s.city)) {
        errors["store.city"] = STORE_CITY_MISMATCH_MESSAGE;
      }
      const addr = s.address.trim();
      if (
        addr.length < STORE_ADDRESS_MIN ||
        addr.length > STORE_ADDRESS_MAX
      ) {
        errors["store.address"] = STORE_ADDRESS_REQUIRED_MESSAGE;
      }
      if (s.phone.trim() && !isValidIranPhone(s.phone)) {
        errors["store.phone"] = STORE_PHONE_INVALID_MESSAGE;
      }
      if (
        individual &&
        ["store.province", "store.city", "store.address", "store.phone"].some(
          (k) => k in errors
        )
      ) {
        missingSections.push("physical_store");
      }
    }
  }

  /* بازارهای آنلاین دیگر — تا ۵ ردیف لینک */
  if (sections.includes("other_platforms")) {
    let validOther = 0;
    for (const row of presence.otherPlatforms) {
      if (!row.url.trim()) continue;
      const c = canonicalizeOtherPlatform(row.platform, row.url);
      if (c.ok) validOther += 1;
      else errors[`other.${row.id}.url`] = c.message;
    }
    if (individual && validOther === 0) {
      missingSections.push("other_platforms");
      errors["other.section"] = PRESENCE_OTHER_SECTION_MESSAGE;
    }
  }

  return {
    ok: Object.keys(errors).length === 0 && missingSections.length === 0,
    errors,
    missingSections,
  };
}

/* ── حذف کانال در مرحلهٔ ۴ → پاک‌کردن دادهٔ همان کانال ── */

export interface ChannelClearResult {
  next: SellerPresenceDraft;
  /** آیا داده‌ای داشت؟ (برای هشدار کوتاه فقط اگر داده بود) */
  hadData: boolean;
}

export function clearChannelPresence(
  presence: SellerPresenceDraft,
  channel: string
): ChannelClearResult {
  switch (channel) {
    case "website":
      return {
        next: { ...presence, websiteUrl: "" },
        hadData: presence.websiteUrl.trim().length > 0,
      };
    case "social":
      return {
        next: { ...presence, social: [] },
        hadData: presence.social.some((r) => r.handle.trim().length > 0),
      };
    case "physical_store":
      return {
        next: { ...presence, store: emptyPresenceDraft().store },
        hadData:
          !!presence.store.province.trim() ||
          !!presence.store.city.trim() ||
          !!presence.store.address.trim() ||
          !!presence.store.phone.trim(),
      };
    case "other_platforms":
      return {
        next: { ...presence, otherPlatforms: [] },
        hadData: presence.otherPlatforms.some((r) => r.url.trim().length > 0),
      };
    default:
      return { next: presence, hadData: false };
  }
}

/** پیام هشدار کوتاه پاک‌شدن دادهٔ حضور آنلاین (فقط با برچسب بخش) */
export function presenceChannelClearedMessage(labels: readonly string[]): string {
  return labels.length === 1
    ? `اطلاعات حضور آنلاین «${labels[0]}» با حذف این انتخاب پاک شد`
    : `اطلاعات حضور آنلاین این بخش‌ها با حذفشان پاک شد: ${labels.join("، ")}`;
}

/* ── خلاصه برای کارت فرم و ادمین ── */

export function presenceHasAnyData(p: SellerPresenceDraft): boolean {
  return (
    p.websiteUrl.trim().length > 0 ||
    p.social.some((r) => r.handle.trim().length > 0) ||
    !!p.store.province.trim() ||
    !!p.store.city.trim() ||
    !!p.store.address.trim() ||
    !!p.store.phone.trim() ||
    p.otherPlatforms.some((r) => r.url.trim().length > 0) ||
    p.linksPublic
  );
}

/** ردیف‌های خالی دور ریخته می‌شوند (ذخیرهٔ تمیز در «بعدی») */
export function prunePresenceDraft(
  p: SellerPresenceDraft
): SellerPresenceDraft {
  return {
    ...p,
    social: p.social.filter((r) => r.handle.trim().length > 0),
    otherPlatforms: p.otherPlatforms.filter((r) => r.url.trim().length > 0),
  };
}

/* ── لینک‌های canonical برای ادمین/عموم ──
   هیچ درخواست سمت سرور به این مقصدها زده نمی‌شود (SSRF — SECURITY.md)؛
   نمایش: target=_blank + rel="noopener noreferrer nofollow ugc" + دامنهٔ مقصد. */

export type PresenceLinkKind = "WEBSITE" | "SOCIAL" | "STORE" | "OTHER_PLATFORM";

/** برچسب فارسی هر kind — تک‌منبع برای پنل ادمین و آیندهٔ عموم */
export const PRESENCE_KIND_LABEL: Readonly<Record<PresenceLinkKind, string>> = {
  WEBSITE: "وب‌سایت",
  SOCIAL: "شبکهٔ اجتماعی و پیام‌رسان",
  STORE: "فروشگاه فیزیکی",
  OTHER_PLATFORM: "بازار آنلاین دیگر",
};

export interface PresenceLinkValue {
  kind: PresenceLinkKind;
  platform: string | null;
  /** مقدار canonical — برای SOCIAL از handle ساخته‌شده، برای بقیه href */
  value: string;
}

export function canonicalPresenceLinks(
  p: SellerPresenceDraft
): PresenceLinkValue[] {
  const links: PresenceLinkValue[] = [];
  const w = p.websiteUrl.trim();
  if (w) {
    const u = normalizeUrl(w);
    if (u.ok) links.push({ kind: "WEBSITE", platform: null, value: u.url });
  }
  for (const r of p.social) {
    if (!r.handle.trim()) continue;
    const c = canonicalizeSocial(r.platform, r.handle);
    if (c.ok) links.push({ kind: "SOCIAL", platform: r.platform, value: c.url });
  }
  for (const r of p.otherPlatforms) {
    if (!r.url.trim()) continue;
    const c = canonicalizeOtherPlatform(r.platform, r.url);
    if (c.ok) {
      links.push({ kind: "OTHER_PLATFORM", platform: r.platform, value: c.url });
    }
  }
  return links;
}
