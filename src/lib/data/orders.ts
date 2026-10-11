import type { Order, ShippingMethod, ShippingMethodId } from "./types";
import { SHIPPING_PRICES } from "@/lib/config/fees";

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

/* ── v1.4 — تایم‌لاین امانی (escrow) سفارش‌های لایو شاپ ──
   پول خریدار به‌صورت «امانی» نزد لحظه نگه داشته می‌شود و بعد از تحویل آزاد می‌شود. */
export function escrowTimeline(doneCount = 1): Order["timeline"] {
  const steps = [
    "پرداخت امانی",
    "آماده‌ی ارسال",
    "ارسال‌شده",
    "تحویل",
    "آزادسازی پول",
  ] as const;
  return steps.map((label, i) => ({
    label,
    done: i < doneCount,
    ...(i === 0 ? { atLabel: "همین حالا" } : {}),
  }));
}

/* ── سفارش‌های اولیه (Mock) ── */
export const SEED_ORDERS: Order[] = [
  {
    id: "۱۰۲۳۴",
    itemTitle: "آسیکس جی‌تی-۲۰۰۰ رانینگ",
    itemBrand: "آسیکس",
    itemEmoji: "👟",
    cover: { from: "#6C5CFF", to: "#0b5f4a", emoji: "🏃" },
    sellerName: "کفش‌خانهٔ سینا",
    sellerEmoji: "👟",
    sellerColor: "#FF3B8B",
    itemPrice: 4_600_000,
    qty: 1,
    variantLabel: "سایز ۴۲",
    shippingPrice: 45_000,
    shippingMethod: "tipax",
    total: 4_645_000,
    address: DEFAULT_ADDRESS,
    createdAtLabel: "دیشب ۲۳:۴۰",
    timeline: [
      { label: "پرداخت امانی", done: true, atLabel: "دیشب ۲۳:۴۰" },
      { label: "آماده‌ی ارسال", done: true, atLabel: "امروز ۱۰:۱۵" },
      { label: "ارسال‌شده", done: true, atLabel: "امروز ۱۶:۳۰" },
      { label: "تحویل", done: false },
      { label: "آزادسازی پول", done: false },
    ],
    trackingCode: "TPX-8839",
    escrow: true,
  },
  {
    id: "۱۰۲۲۹",
    itemTitle: "فانکو پاپ ۱۰ اینچی — نسخهٔ گلو",
    itemBrand: "فانکو",
    itemEmoji: "🧸",
    cover: { from: "#B45CFF", to: "#FF3B8B", emoji: "🧸" },
    sellerName: "کلکسیون‌یار تهران",
    sellerEmoji: "🃏",
    sellerColor: "#6C5CFF",
    itemPrice: 4_000_000,
    qty: 1,
    shippingPrice: 30_000,
    shippingMethod: "post",
    total: 4_030_000,
    address: DEFAULT_ADDRESS,
    createdAtLabel: "۲ روز پیش",
    timeline: [
      { label: "پرداخت امانی", done: true, atLabel: "۲ روز پیش" },
      { label: "آماده‌ی ارسال", done: true, atLabel: "دیروز ۱۴:۰۰" },
      { label: "ارسال‌شده", done: false },
      { label: "تحویل", done: false },
      { label: "آزادسازی پول", done: false },
    ],
    escrow: true,
  },
];
