import type { Cover } from "./types";

/* ─────────────────────────────────────────────────────────────
   LiveShop — داده‌های سمت خریدار (فاز ۳ — P1 · Whatnot-Atlas)
   تصویر ۱۹ (فعالیت‌ها و بیدها)، تصویر ۲۰ (صندوق ورودی) و
   تصویر ۱۴ (جستجوهای ذخیره‌شده).
   نام فروشنده‌ها و شوها از داده‌های واقعی shows.ts استفاده شده است.
   همهٔ مبالغ به «تومان» هستند و اعداد در UI فارسی نمایش داده می‌شوند.
   ───────────────────────────────────────────────────────────── */

/* ── بیدهای من ── */
export type BidStatus = "leading" | "outbid" | "won" | "lost";

export interface MyBidEntry {
  id: string;
  itemTitle: string;
  itemEmoji: string;
  cover: Cover;
  showTitle: string;
  sellerName: string;
  /** آخرین بید ثبت‌شده در مزایده */
  currentBid: number;
  /** بید من */
  myBid: number;
  /** پلهٔ مزایده */
  step: number;
  shippingPrice: number;
  status: BidStatus;
  placedAtLabel: string;
  /** ثانیهٔ باقی‌ماندهٔ تایمر نمایشی (فقط برای بیدهای فعال) */
  endsInSec: number;
}

/* ── پیشنهادهای فروشنده به من ── */
export type OfferStatus = "pending" | "accepted" | "declined" | "expired";

export interface MyOfferEntry {
  id: string;
  sellerName: string;
  sellerEmoji: string;
  sellerColor: string;
  itemTitle: string;
  itemEmoji: string;
  cover: Cover;
  amount: number;
  expiresLabel: string;
  message: string;
  status: OfferStatus;
}

/* ── جستجوهای ذخیره‌شده ── */
export interface SavedSearch {
  id: string;
  query: string;
  filterLabel: string;
  matchCount: number;
  alertOn: boolean;
}

/* ── اعلان‌های صندوق ورودی ── */
export type InboxKind =
  | "bid"
  | "win"
  | "payment"
  | "shipping"
  | "follow"
  | "tip"
  | "system";

export interface InboxNotification {
  id: string;
  kind: InboxKind;
  title: string;
  body: string;
  atLabel: string;
  unread: boolean;
  emoji: string;
  color: string;
}

/* ─────────────────────────── seed بیدهای من ─────────────────────────── */
export const MY_BIDS: MyBidEntry[] = [
  {
    id: "bid-1",
    itemTitle: "نایک دَنک لو «پاندا» سایز ۴۲",
    itemEmoji: "👟",
    cover: { from: "#FF3B8B", to: "#6C5CFF", emoji: "👟" },
    showTitle: "شب کتونی‌های کمیاب 🔥",
    sellerName: "کفش‌خانهٔ سینا",
    currentBid: 4_300_000,
    myBid: 4_300_000,
    step: 100_000,
    shippingPrice: 65_000,
    status: "leading",
    placedAtLabel: "امشب ۲۱:۴۲",
    endsInSec: 183,
  },
  {
    id: "bid-2",
    itemTitle: "هدفون سونی WH-1000XM5 بازنشده",
    itemEmoji: "🎧",
    cover: { from: "#FFB454", to: "#7c2d12", emoji: "🎧" },
    showTitle: "گجت‌های بازنشده با قیمت کارخانه",
    sellerName: "گجت‌بازار",
    currentBid: 5_600_000,
    myBid: 5_500_000,
    step: 100_000,
    shippingPrice: 45_000,
    status: "outbid",
    placedAtLabel: "امشب ۲۱:۱۰",
    endsInSec: 142,
  },
  {
    id: "bid-3",
    itemTitle: "ساعت مچی کاسیو ادیس طلایی",
    itemEmoji: "⌚",
    cover: { from: "#B45CFF", to: "#FF3B8B", emoji: "⌚" },
    showTitle: "زیورآلات و عطر دست‌ساز",
    sellerName: "عطر و نگین",
    currentBid: 2_400_000,
    myBid: 2_400_000,
    step: 50_000,
    shippingPrice: 40_000,
    status: "won",
    placedAtLabel: "دیروز ۲۲:۳۰",
    endsInSec: 0,
  },
  {
    id: "bid-4",
    itemTitle: "پوکمون کارت اولترا رِیر BGS 9.5",
    itemEmoji: "🃏",
    cover: { from: "#6C5CFF", to: "#3b2a86", emoji: "🃏" },
    showTitle: "مزایدهٔ کارت‌های کلکسیونی",
    sellerName: "کلکسیون‌یار تهران",
    currentBid: 8_900_000,
    myBid: 8_400_000,
    step: 250_000,
    shippingPrice: 55_000,
    status: "lost",
    placedAtLabel: "جمعه ۲۰:۱۵",
    endsInSec: 0,
  },
];

/* ─────────────────────────── seed پیشنهادها ─────────────────────────── */
export const MY_OFFERS: MyOfferEntry[] = [
  {
    id: "offer-1",
    sellerName: "عطر و نگین",
    sellerEmoji: "💎",
    sellerColor: "#B45CFF",
    itemTitle: "عطر دیور ساواج ۱۰۰ میل اورجینال",
    itemEmoji: "🧴",
    cover: { from: "#B45CFF", to: "#3b1f66", emoji: "🧴" },
    amount: 3_200_000,
    expiresLabel: "۱۲ ساعت مانده",
    message: "قیمت فوری رو قبول می‌کنم، اگه همین امروز تأیید کنی همین امشب ارسالش می‌کنم.",
    status: "pending",
  },
  {
    id: "offer-2",
    sellerName: "گلخانهٔ مینا",
    sellerEmoji: "🪴",
    sellerColor: "#00C896",
    itemTitle: "مونسترا آلبو واریگاته گلدانی",
    itemEmoji: "🌿",
    cover: { from: "#00C896", to: "#0b5f4a", emoji: "🌿" },
    amount: 6_500_000,
    expiresLabel: "۲ روز مانده",
    message: "برات نگهش داشتم — با بسته‌بندی ویژهٔ گیاه و گواهی سلامت ریشه.",
    status: "pending",
  },
  {
    id: "offer-3",
    sellerName: "گجت‌بازار",
    sellerEmoji: "🎧",
    sellerColor: "#FFB454",
    itemTitle: "پاوربانک انکر ۲۰٬۰۰۰ میلی‌آمپر",
    itemEmoji: "🔋",
    cover: { from: "#FFB454", to: "#7c2d12", emoji: "🔋" },
    amount: 890_000,
    expiresLabel: "منقضی‌شده",
    message: "قبل از پایان لایو، این قیمت ویژه فقط برای تو فعلاً بود.",
    status: "expired",
  },
];

/* ─────────────────────────── seed جستجوهای ذخیره‌شده ─────────────────────────── */
export const SAVED_SEARCHES: SavedSearch[] = [
  {
    id: "ss-1",
    query: "نایک اورجینال",
    filterLabel: "کتونی و کفش",
    matchCount: 12,
    alertOn: true,
  },
  {
    id: "ss-2",
    query: "ساعت مچی · لایو",
    filterLabel: "زیبایی و عطر",
    matchCount: 5,
    alertOn: true,
  },
  {
    id: "ss-3",
    query: "کارت‌های نایاب",
    filterLabel: "کارت و کلکسیون",
    matchCount: 23,
    alertOn: false,
  },
  {
    id: "ss-4",
    query: "هدفون بی‌سیم",
    filterLabel: "دیجیتال و گجت",
    matchCount: 8,
    alertOn: false,
  },
];

/* ─────────────────────────── seed اعلان‌ها ─────────────────────────── */
export const INBOX_NOTIFICATIONS: InboxNotification[] = [
  {
    id: "n1",
    kind: "bid",
    title: "بید بالاتر رفته! 🔔",
    body: "در «شب کتونی‌های کمیاب 🔥» روی نایک دَنک لو، بید ۴٬۴۰۰٬۰۰۰ تومانی ثبت شد — یک پله بالاتر برو!",
    atLabel: "۲ دقیقه پیش",
    unread: true,
    emoji: "🔔",
    color: "#FF3B8B",
  },
  {
    id: "n2",
    kind: "win",
    title: "مزایده را بردی! 🏆",
    body: "ساعت مچی کاسیو ادیس از «عطر و نگین» با ۲٬۴۰۰٬۰۰۰ تومان مال تو شد — پرداخت را از صفحهٔ سفارش کامل کن.",
    atLabel: "۱ ساعت پیش",
    unread: true,
    emoji: "🏆",
    color: "#6C5CFF",
  },
  {
    id: "n3",
    kind: "shipping",
    title: "سفارش ارسال شد 🚚",
    body: "نیوبالانس ۵۳۰ با کد رهگیری TPX-396359 از طریق تیپاکس در راه است — تحویل ۲ تا ۳ روز کاری.",
    atLabel: "۳ ساعت پیش",
    unread: true,
    emoji: "🚚",
    color: "#6C5CFF",
  },
  {
    id: "n4",
    kind: "payment",
    title: "کیف پول شارژ شد 💳",
    body: "مبلغ ۲٬۰۰۰٬۰۰۰ تومان از درگاه زرین‌پال به کیف پولت اضافه شد.",
    atLabel: "امروز ۱۲:۳۰",
    unread: false,
    emoji: "💳",
    color: "#00C896",
  },
  {
    id: "n5",
    kind: "bid",
    title: "پیشتازی حفظ شد 🥇",
    body: "بید ۴٬۳۰۰٬۰۰۰ تومانی‌ات روی نایک دَنک لو هنوز بالاترین است — تا پایان مزایده ۳ دقیقه مانده.",
    atLabel: "امروز ۲۱:۴۰",
    unread: false,
    emoji: "🥇",
    color: "#00C896",
  },
  {
    id: "n6",
    kind: "tip",
    title: "انعامت نمایش داده شد 💚",
    body: "انعام ۲۰۰٬۰۰۰ تومانی‌ات در «شب کتونی‌های کمیاب 🔥» با نامت در چت عمومی دیده شد — ممنون از لطفت!",
    atLabel: "دیروز ۲۲:۰۵",
    unread: false,
    emoji: "💚",
    color: "#00C896",
  },
  {
    id: "n7",
    kind: "follow",
    title: "فالوور جدید 👤",
    body: "«گلخانهٔ مینا» حالا تو را دنبال می‌کند — پروفایل و لایوهای بعدی‌اش را از دست نده.",
    atLabel: "دیروز ۱۹:۱۲",
    unread: false,
    emoji: "👤",
    color: "#00C896",
  },
  {
    id: "n8",
    kind: "system",
    title: "یادآور لایو 📣",
    body: "«شبِ کتاب: نایاب‌ها و امضادار» امشب ساعت ۲۳:۰۰ شروع می‌شود — یادآورت روشن است.",
    atLabel: "دیروز ۱۸:۰۰",
    unread: false,
    emoji: "📣",
    color: "#6C5CFF",
  },
  {
    id: "n9",
    kind: "system",
    title: "به‌روزرسانی قوانین مزایده 📢",
    body: "از این هفته پلهٔ مزایده‌های بالای ۵ میلیون تومان به ۲۵۰٬۰۰۰ تومان تغییر می‌کند — جزئیات در مرکز راهنما.",
    atLabel: "۲ روز پیش",
    unread: false,
    emoji: "📢",
    color: "#6C5CFF",
  },
];

/* ─────────────────────────── متادیتای دستهٔ اعلان ─────────────────────────── */
export interface InboxKindMeta {
  label: string;
  color: string;
}

const INBOX_KIND_META: Record<InboxKind, InboxKindMeta> = {
  bid: { label: "مزایده", color: "#FF3B8B" },
  win: { label: "برنده", color: "#6C5CFF" },
  payment: { label: "پرداخت", color: "#00C896" },
  shipping: { label: "ارسال", color: "#6C5CFF" },
  follow: { label: "فالو", color: "#00C896" },
  tip: { label: "انعام", color: "#00C896" },
  system: { label: "سیستم", color: "#6C5CFF" },
};

/** برچسب و رنگ دستهٔ هر اعلان برای فیلترها و آیکون مربع رنگی */
export function getInboxKindMeta(kind: InboxKind): InboxKindMeta {
  return INBOX_KIND_META[kind];
}
