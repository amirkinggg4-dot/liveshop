/* ─────────────────────────────────────────────────────────────
   v2.0.5 — منطق خالص مرحلهٔ ۴ ثبت‌نام فروشنده: «ویژگی‌های فروش»
   (صفحهٔ SellerProfilePickView این توابع را مصرف می‌کند؛ همین
   توابع تست واحد دارند — seller-profile-pick.test.ts)

   بسته به نوع فروشندهٔ مرحلهٔ ۳ دو نسخهٔ متفاوت:
   ─ حقیقی (individual): «امروز کالایت را کجا می‌فروشی یا معرفی
     می‌کنی؟» — چندانتخابی با یک گزینهٔ انحصاری «هیچ‌جا؛ تازه
     شروع می‌کنم» (انتخابش بقیه را پاک می‌کند و انتخاب بقیه
     آن را پاک می‌کند).
   ─ حقوقی (business): «کسب‌وکارت را بهتر چه چیزی توصیف
     می‌کند؟» — تک‌انتخابی (radio) با ۵ نوع کسب‌وکار.

   idهای کانال‌ها هم‌ارز مقادیر مجاز ستون sellChannels سمت سرور
   هستند و idهای نوع کسب‌وکار هم‌ارز enum BusinessKind (RESELLER،
   LIQUIDATOR، BRAND، RETAILER، CONSIGNMENT).
   همهٔ توابع خالص‌اند (بدون استور/React).
   ───────────────────────────────────────────────────────────── */

import type { SellerType } from "./seller-identity";

/* ── پیام‌های خطا ── */

/** نسخهٔ حقیقی (چندانتخابی) — هم‌الگوی مرحلهٔ زیرمجموعه */
export const SELL_CHANNELS_REQUIRED_MESSAGE = "حداقل یک مورد انتخاب کن";
/** نسخهٔ حقوقی (تک‌انتخابی) — دقیقاً طبق مشخصات */
export const BUSINESS_KIND_REQUIRED_MESSAGE = "یکی را انتخاب کن";

/* ── نسخهٔ حقیقی: کانال‌های فروش فعلی ── */

export const SELL_CHANNEL_IDS = [
  "website",
  "social",
  "physical_store",
  "other_platforms",
  "just_starting",
] as const;

export type SellChannelId = (typeof SELL_CHANNEL_IDS)[number];

/** گزینهٔ انحصاری — با بقیه جمع نمی‌شود (دو طرفه) */
export const JUST_STARTING_ID: SellChannelId = "just_starting";

export const SELL_CHANNEL_LABEL: Readonly<Record<SellChannelId, string>> = {
  website: "وب‌سایت",
  social: "شبکه‌های اجتماعی و پیام‌رسان‌ها",
  physical_store: "فروشگاه یا انبار فیزیکی",
  other_platforms: "بازارهای آنلاین دیگر",
  just_starting: "هیچ‌جا؛ تازه شروع می‌کنم",
};

export const SELL_CHANNEL_DESCRIPTION: Readonly<Record<SellChannelId, string>> = {
  website: "وب‌سایت شخصی یا شرکتی",
  social: "اینستاگرام، تلگرام، یوتیوب و ...",
  physical_store: "یک مکان حضوری",
  other_platforms: "مثل دیوار، باسلام، دیجی‌کالا و ...",
  just_starting: "عالی است! کمکت می‌کنیم.",
};

/**
 * toggle چندانتخابی با انحصار دوطرفهٔ «تازه شروع می‌کنم»:
 * ─ لمس گزینهٔ انحصاری → فقط همان (بقیه پاک می‌شوند)؛ لمس دوباره‌اش → خالی.
 * ─ لمس هر گزینهٔ دیگر → آن گزینه اضافه/حذف و «تازه شروع می‌کنم» پاک می‌شود.
 * ─ id ناشناخته (هم به‌عنوان لمس، هم داخل فهرست) بی‌اثر است — فهرست
 *   خروجی همیشه فقط از مقادیر مجاز است.
 */
export function toggleSellChannel(
  current: readonly string[],
  id: string
): SellChannelId[] {
  /* همیشه روی فهرست تمیز کار می‌کنیم — id ناشناختهٔ موجود هم دور ریخته می‌شود */
  const base = current.filter((c): c is SellChannelId =>
    (SELL_CHANNEL_IDS as readonly string[]).includes(c)
  );
  if (!(SELL_CHANNEL_IDS as readonly string[]).includes(id)) {
    return base;
  }
  if (id === JUST_STARTING_ID) {
    return base.includes(id) ? [] : [JUST_STARTING_ID];
  }
  const withoutExclusive = base.filter((c) => c !== JUST_STARTING_ID);
  const typed = id as SellChannelId;
  return withoutExclusive.includes(typed)
    ? withoutExclusive.filter((c) => c !== typed)
    : [...withoutExclusive, typed];
}

/**
 * پاک‌سازی مقدار ذخیره‌شدهٔ کانال‌ها (sessionStorage):
 * فقط idهای معتبر، بدون تکرار؛ وجود «تازه شروع می‌کنم» با هر چیز
 * دیگری ناسازگار است → فقط خودش می‌ماند. ورودی غیرآرایه → [].
 */
export function sanitizeSellChannels(raw: unknown): SellChannelId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<SellChannelId>();
  for (const v of raw) {
    if (
      typeof v === "string" &&
      (SELL_CHANNEL_IDS as readonly string[]).includes(v)
    ) {
      seen.add(v as SellChannelId);
    }
  }
  if (seen.has(JUST_STARTING_ID)) return [JUST_STARTING_ID];
  return [...seen];
}

export function isSellChannelsComplete(channels: readonly string[]): boolean {
  return channels.length > 0;
}

/* ── نسخهٔ حقوقی: نوع کسب‌وکار ── */

export const BUSINESS_KIND_IDS = [
  "RESELLER",
  "LIQUIDATOR",
  "BRAND",
  "RETAILER",
  "CONSIGNMENT",
] as const;

export type BusinessKindId = (typeof BUSINESS_KIND_IDS)[number];

export const BUSINESS_KIND_LABEL: Readonly<Record<BusinessKindId, string>> = {
  RESELLER: "فروش مجدد (واسطه‌فروش)",
  LIQUIDATOR: "عمده‌فروش و کالای مازاد (استوک)",
  BRAND: "برند و تولیدکننده",
  RETAILER: "خرده‌فروش",
  CONSIGNMENT: "امانت‌فروشی (کمیسیونی)",
};

export const BUSINESS_KIND_DESCRIPTION: Readonly<Record<BusinessKindId, string>> = {
  RESELLER:
    "کالایی را که خودمان تولید نکرده‌ایم می‌خریم و دوباره می‌فروشیم، از جمله کلکسیونی و دست‌دوم.",
  LIQUIDATOR: "مرجوعی‌ها، مازاد انبار، پالت یا موجودی عمده را می‌فروشیم.",
  BRAND:
    "محصول خودمان را تولید می‌کنیم و با نام برند خودمان آنلاین یا حضوری می‌فروشیم.",
  RETAILER: "کالا را مستقیم از برند یا عمده‌فروش می‌خریم و نو می‌فروشیم.",
  CONSIGNMENT: "کالای دیگران را به‌صورت امانی می‌فروشیم.",
};

/** پاک‌سازی مقدار ذخیره‌شدهٔ نوع کسب‌وکار — فقط ۵ مقدار دقیق معتبرند */
export function sanitizeBusinessKind(raw: unknown): BusinessKindId | null {
  return typeof raw === "string" &&
    (BUSINESS_KIND_IDS as readonly string[]).includes(raw)
    ? (raw as BusinessKindId)
    : null;
}

/* ── اعتبارسنجی کل مرحله بر اساس نوع فروشنده ── */

export type SellerProfilePickInput = {
  sellerType: SellerType;
  sellChannels: readonly string[];
  businessKind: string | null;
};

export type SellerProfilePickValidity =
  | { ok: true }
  | { ok: false; message: string };

export function validateSellerProfilePick(
  input: SellerProfilePickInput
): SellerProfilePickValidity {
  if (input.sellerType === "individual") {
    return isSellChannelsComplete(input.sellChannels)
      ? { ok: true }
      : { ok: false, message: SELL_CHANNELS_REQUIRED_MESSAGE };
  }
  return input.businessKind !== null &&
    (BUSINESS_KIND_IDS as readonly string[]).includes(input.businessKind)
    ? { ok: true }
    : { ok: false, message: BUSINESS_KIND_REQUIRED_MESSAGE };
}

/* ── تغییر نوع فروشنده → پاک‌کردن draft نسخهٔ دیگر ──
   دو نسخه دادهٔ مشترک ندارند؛ با تغییر نوع (در صفحهٔ مرحلهٔ ۳) draft
   نسخهٔ قبلی بی‌معناست و پاک می‌شود — فقط اگر داده‌ای داشت، برچسبش
   برای هشدار کوتاه برمی‌گردد. */

export const SELL_CHANNELS_FIELD_LABEL = "محل‌های فروش فعلی";
export const BUSINESS_KIND_FIELD_LABEL = "نوع کسب‌وکار";

export interface SellerProfileDraft {
  sellChannels: SellChannelId[];
  businessKind: BusinessKindId | null;
}

export interface ProfileTypeChangeResult {
  nextSellChannels: SellChannelId[];
  nextBusinessKind: BusinessKindId | null;
  /** برچسب فارسی انتخاب‌های پاک‌شده‌شده (فقط اگر داده‌ای داشت) */
  clearedLabels: string[];
}

export function clearIncompatibleSellerProfile(
  current: SellerProfileDraft,
  nextType: SellerType
): ProfileTypeChangeResult {
  const hasChannels = current.sellChannels.length > 0;
  const hasKind = current.businessKind !== null;
  if (nextType === "business") {
    return {
      nextSellChannels: [],
      nextBusinessKind: current.businessKind,
      clearedLabels: hasChannels ? [SELL_CHANNELS_FIELD_LABEL] : [],
    };
  }
  return {
    nextSellChannels: current.sellChannels,
    nextBusinessKind: null,
    clearedLabels: hasKind ? [BUSINESS_KIND_FIELD_LABEL] : [],
  };
}

/** پیام هشدار کوتاه پاک‌شدن draft ویژگی‌های فروش */
export function profileChangeWarningMessage(
  clearedLabels: readonly string[]
): string {
  return `با تغییر نوع فروشنده، این انتخاب‌های مرحلهٔ ویژگی‌های فروش پاک شد: ${clearedLabels.join("، ")}`;
}
