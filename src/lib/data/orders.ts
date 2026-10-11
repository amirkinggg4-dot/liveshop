import type { Order, ShippingMethod, ShippingMethodId } from "./types";
import { deriveTimeline, type TimelineDispute } from "@/lib/order-state";
import { SHIPPING_PRICES } from "@/lib/config/fees";
import { ITEM_PHOTO } from "@/lib/data/media";

/* ── روش‌های ارسال ایران (بومی‌سازی: تیپاکس، پست، پیک شهری) ──
   v1.7.1 — قیمت‌ها از lib/config/fees.ts (تک منبع عدد) */
export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "tipax", label: "تیپاکس", price: SHIPPING_PRICES.tipax, eta: "۲ تا ۳ روز کاری" },
  { id: "post", label: "پست پیشتاز", price: SHIPPING_PRICES.post, eta: "۳ تا ۵ روز کاری" },
  { id: "peyk", label: "پیک شهری (تهران)", price: SHIPPING_PRICES.peyk, eta: "همان روز" },
];

export function getShippingMethod(id: ShippingMethodId): ShippingMethod {
  return SHIPPING_METHODS.find((m) => m.id === id) ?? SHIPPING_METHODS[0];
}

export const DEFAULT_ADDRESS =
  "علی رضایی — تهران، خیابان ولیعصر، کوچهٔ یاس، پلاک ۶۴، واحد ۳\n۰۹۱۲ ۴۵۶ ۷۸۹۰";

/* ─────────────────────────────────────────────────────────────
   v1.8.0 — سفارش‌های اولیه (Mock) — پوشش همهٔ وضعیت‌های ماشین:
   PAID_HELD، READY_TO_SHIP، SHIPPED، DELIVERED، RELEASED،
   DISPUTED، REFUNDED، CANCELED
   زمان‌ها نسبت به لحظهٔ لود ماژول (ms واقعی) — نمایش شمسی در UI.
   ───────────────────────────────────────────────────────────── */

const H = 3_600_000;
const D = 24 * H;
const NOW = Date.now();

/** شمارهٔ سفارش با ارقام فارسی */
export function faOrderId(n: number): string {
  return String(n)
    .split("")
    .map((d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)])
    .join("");
}

interface SeedInput {
  id: number;
  status: Order["status"];
  itemId: string;
  sellerId: string;
  sellerName: string;
  sellerEmoji: string;
  sellerColor: string;
  variantLabel?: string;
  shippingMethod: ShippingMethodId;
  createdAtMs: number;
  readyAtMs?: number | null;
  shippedAtMs?: number | null;
  deliveredAtMs?: number | null;
  releasedAtMs?: number | null;
  canceledAtMs?: number | null;
  refundedAtMs?: number | null;
  trackingCode?: string;
  dispute?: TimelineDispute & { desc?: string };
  messages?: Order["messages"];
}

function mkOrder(input: SeedInput): Order {
  const { dispute, ...rest } = input;
  const disputeInfo: Order["dispute"] = dispute
    ? {
        reason: dispute.reason,
        desc: dispute.desc ?? "",
        filedAtMs: dispute.filedAtMs,
        status: dispute.outcome
          ? dispute.outcome === "REFUND"
            ? "RESOLVED_REFUND"
            : "RESOLVED_RELEASE"
          : "OPEN",
      }
    : undefined;
  const tlDispute: TimelineDispute | null = dispute ?? null;
  const order: Order = {
    id: faOrderId(input.id),
    status: input.status,
    itemId: input.itemId,
    itemTitle: SEED_ITEM_META[input.itemId].title,
    itemEmoji: SEED_ITEM_META[input.itemId].emoji,
    itemBrand: SEED_ITEM_META[input.itemId].brand,
    cover: SEED_ITEM_META[input.itemId].cover,
    photo: ITEM_PHOTO[input.itemId],
    sellerId: input.sellerId,
    sellerName: input.sellerName,
    sellerEmoji: input.sellerEmoji,
    sellerColor: input.sellerColor,
    itemPrice: SEED_ITEM_META[input.itemId].price,
    qty: 1,
    variantLabel: input.variantLabel,
    shippingPrice: getShippingMethod(input.shippingMethod).price,
    shippingMethod: input.shippingMethod,
    total:
      SEED_ITEM_META[input.itemId].price +
      getShippingMethod(input.shippingMethod).price,
    address: DEFAULT_ADDRESS,
    createdAtMs: input.createdAtMs,
    readyAtMs: input.readyAtMs ?? null,
    shippedAtMs: input.shippedAtMs ?? null,
    deliveredAtMs: input.deliveredAtMs ?? null,
    releasedAtMs: input.releasedAtMs ?? null,
    canceledAtMs: input.canceledAtMs ?? null,
    refundedAtMs: input.refundedAtMs ?? null,
    timeline: deriveTimeline(
      input.status,
      {
        createdAtMs: input.createdAtMs,
        readyAtMs: input.readyAtMs ?? null,
        shippedAtMs: input.shippedAtMs ?? null,
        deliveredAtMs: input.deliveredAtMs ?? null,
        releasedAtMs: input.releasedAtMs ?? null,
        canceledAtMs: input.canceledAtMs ?? null,
        refundedAtMs: input.refundedAtMs ?? null,
      },
      tlDispute
    ),
    trackingCode: input.trackingCode,
    escrow: true,
    dispute: disputeInfo,
    messages: input.messages ?? [],
  };
  return order;
}

/* متادیتای کالاهای seed — همان قیمت/کاور منبع items.ts */
const SEED_ITEM_META: Record<
  string,
  { title: string; brand: string; emoji: string; cover: Order["cover"]; price: number }
> = {
  it1: { title: "نایک دَنک لو «پاندا»", brand: "نایک", emoji: "👟", cover: { from: "#FF3B8B", to: "#6C5CFF", emoji: "👟" }, price: 6_500_000 },
  it2: { title: "ادیداس سامبا اورجینال", brand: "ادیداس", emoji: "👟", cover: { from: "#6C5CFF", to: "#1b1729", emoji: "👟" }, price: 5_200_000 },
  it3: { title: "جردن ۱ مید «شیکاگو»", brand: "جردن", emoji: "👟", cover: { from: "#FF3B8B", to: "#7a1030", emoji: "🧡" }, price: 8_900_000 },
  it4: { title: "نیوبالانس ۵۳۰ خاکستری", brand: "نیوبالانس", emoji: "👟", cover: { from: "#00C896", to: "#155e75", emoji: "👟" }, price: 3_900_000 },
  it5: { title: "هودی اورسایز استریت‌ویر", brand: "اَسِت استودیو", emoji: "🧥", cover: { from: "#B45CFF", to: "#FF3B8B", emoji: "🧥" }, price: 1_450_000 },
  it8: { title: "کولهٔ ورزشی ضدآب ۳۰ لیتری", brand: "ادون", emoji: "🎒", cover: { from: "#1b1729", to: "#6C5CFF", emoji: "🎒" }, price: 1_450_000 },
  ct1: { title: "پوکمون کارت اولترا رِیر BGS 9.5", brand: "پوکمون", emoji: "🃏", cover: { from: "#FFB454", to: "#FF3B8B", emoji: "🃏" }, price: 7_500_000 },
  ct2: { title: "فانکو پاپ ۱۰ اینچی — نسخهٔ گلو", brand: "فانکو", emoji: "🧸", cover: { from: "#B45CFF", to: "#FF3B8B", emoji: "🧸" }, price: 4_000_000 },
};

export const SEED_ORDERS: Order[] = [
  /* ── PAID_HELD — پرداخت امانی تازه، منتظر اسکن/آماده‌سازی فروشنده ── */
  mkOrder({
    id: 10241,
    status: "PAID_HELD",
    itemId: "it1",
    sellerId: "s1",
    sellerName: "کفش‌خانهٔ سینا",
    sellerEmoji: "👟",
    sellerColor: "#FF3B8B",
    variantLabel: "سایز ۴۲",
    shippingMethod: "tipax",
    createdAtMs: NOW - 2 * H,
    messages: [
      {
        id: "om-1",
        from: "buyer",
        text: "سلام، جعبهٔ سالم ارسال می‌شه؟",
        atMs: NOW - 100 * 60_000,
      },
      {
        id: "om-2",
        from: "seller",
        text: "سلام! بله، بسته‌بندی ضدضربه با کارتن مادر — خیالت راحت.",
        atMs: NOW - 92 * 60_000,
      },
    ],
  }),

  /* ── READY_TO_SHIP — اسکن شده، در انتظار ارسال ── */
  mkOrder({
    id: 10240,
    status: "READY_TO_SHIP",
    itemId: "it2",
    sellerId: "s1",
    sellerName: "کفش‌خانهٔ سینا",
    sellerEmoji: "👟",
    sellerColor: "#FF3B8B",
    variantLabel: "سایز ۴۳",
    shippingMethod: "tipax",
    createdAtMs: NOW - 26 * H,
    readyAtMs: NOW - 5 * H,
  }),

  /* ── SHIPPED — ارسال‌شده با کد رهگیری ── */
  mkOrder({
    id: 10239,
    status: "SHIPPED",
    itemId: "it5",
    sellerId: "s1",
    sellerName: "کفش‌خانهٔ سینا",
    sellerEmoji: "👟",
    sellerColor: "#FF3B8B",
    variantLabel: "مشکی",
    shippingMethod: "tipax",
    createdAtMs: NOW - 2 * D,
    readyAtMs: NOW - 36 * H,
    shippedAtMs: NOW - 5 * H,
    trackingCode: "TPX-8839",
  }),

  /* ── DELIVERED — تحویل‌شده ۸ ساعت پیش؛ پنجرهٔ اختلاف باز، آزادسازی خودکار در جریان ── */
  mkOrder({
    id: 10238,
    status: "DELIVERED",
    itemId: "it3",
    sellerId: "s1",
    sellerName: "کفش‌خانهٔ سینا",
    sellerEmoji: "👟",
    sellerColor: "#FF3B8B",
    variantLabel: "سایز ۴۱",
    shippingMethod: "tipax",
    createdAtMs: NOW - 3 * D,
    readyAtMs: NOW - 60 * H,
    shippedAtMs: NOW - 2 * D,
    deliveredAtMs: NOW - 8 * H,
    trackingCode: "TPX-8801",
  }),

  /* ── RELEASED — مبلغ به فروشنده آزاد شده (خودکار ۳ روز بعد از تحویل) ── */
  mkOrder({
    id: 10235,
    status: "RELEASED",
    itemId: "it4",
    sellerId: "s1",
    sellerName: "کفش‌خانهٔ سینا",
    sellerEmoji: "👟",
    sellerColor: "#FF3B8B",
    shippingMethod: "post",
    createdAtMs: NOW - 7 * D,
    readyAtMs: NOW - 6 * D,
    shippedAtMs: NOW - 6 * D + 6 * H,
    deliveredAtMs: NOW - 4 * D,
    releasedAtMs: NOW - 1 * D,
    trackingCode: "PST-4471",
  }),

  /* ── DISPUTED — اختلاف باز (کارشناس در حال بررسی) ── */
  mkOrder({
    id: 10237,
    status: "DISPUTED",
    itemId: "ct2",
    sellerId: "s3",
    sellerName: "کلکسیون‌یار تهران",
    sellerEmoji: "🃏",
    sellerColor: "#6C5CFF",
    shippingMethod: "post",
    createdAtMs: NOW - 4 * D,
    readyAtMs: NOW - 3 * D - 12 * H,
    shippedAtMs: NOW - 3 * D,
    deliveredAtMs: NOW - 2 * D,
    trackingCode: "PST-4418",
    dispute: {
      reason: "کالا با توضیحات مغایرت داشت",
      desc: "جعبهٔ فانکو شکستگی بود و شکل گوش فیس آسیب دیده؛ در لایو گفته شده بود جعبهٔ سالم.",
      filedAtMs: NOW - 30 * H,
      outcome: null,
    },
    messages: [
      {
        id: "om-3",
        from: "buyer",
        text: "جعبهٔ سفارش آسیب‌دیده بود، عکسش رو فرستادم به پشتیبانی.",
        atMs: NOW - 30 * H + 5 * 60_000,
      },
    ],
  }),

  /* ── REFUNDED — اختلاف به نفع خریدار حل شد و کل مبلغ مسترد شد ── */
  mkOrder({
    id: 10236,
    status: "REFUNDED",
    itemId: "ct1",
    sellerId: "s3",
    sellerName: "کلکسیون‌یار تهران",
    sellerEmoji: "🃏",
    sellerColor: "#6C5CFF",
    shippingMethod: "tipax",
    createdAtMs: NOW - 8 * D,
    readyAtMs: NOW - 7 * D - 6 * H,
    shippedAtMs: NOW - 7 * D,
    deliveredAtMs: NOW - 6 * D,
    trackingCode: "TPX-8764",
    dispute: {
      reason: "کالا نارسید یا گم شد",
      desc: "کد رهگیری ۵ روزه بدون به‌روزرسانی بود و بسته به دفتر پست برنگشت.",
      filedAtMs: NOW - 5 * D,
      outcome: "REFUND",
      resolvedAtMs: NOW - 4 * D,
    },
    refundedAtMs: NOW - 4 * D,
  }),

  /* ── CANCELED — خریدار قبل از ارسال لغو کرد؛ مبلغ به کیف پول برگشت ── */
  mkOrder({
    id: 10234,
    status: "CANCELED",
    itemId: "it8",
    sellerId: "s1",
    sellerName: "کفش‌خانهٔ سینا",
    sellerEmoji: "👟",
    sellerColor: "#FF3B8B",
    shippingMethod: "tipax",
    createdAtMs: NOW - 5 * D,
    readyAtMs: NOW - 4 * D - 12 * H,
    canceledAtMs: NOW - 4 * D - 10 * H,
  }),
];
