import type { Order, ShippingMethod, ShippingMethodId } from "./types";

/* ── روش‌های ارسال ایران (بومی‌سازی: تیپاکس، پست، پیک شهری) ── */
export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "tipax", label: "تیپاکس", price: 45_000, eta: "۲ تا ۳ روز کاری" },
  { id: "post", label: "پست پیشتاز", price: 30_000, eta: "۳ تا ۵ روز کاری" },
  { id: "peyk", label: "پیک شهری (تهران)", price: 25_000, eta: "همان روز" },
];

export function getShippingMethod(id: ShippingMethodId): ShippingMethod {
  return SHIPPING_METHODS.find((m) => m.id === id) ?? SHIPPING_METHODS[0];
}

export const DEFAULT_ADDRESS =
  "علی رضایی — تهران، خیابان ولیعصر، کوچهٔ یاس، پلاک ۶۴، واحد ۳\n۰۹۱۲ ۴۵۶ ۷۸۹۰";

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
    itemPrice: 5_200_000,
    shippingPrice: 45_000,
    shippingMethod: "tipax",
    total: 5_245_000,
    address: DEFAULT_ADDRESS,
    createdAtLabel: "دیشب ۲۳:۴۰",
    timeline: [
      { label: "پرداخت شد", done: true, atLabel: "دیشب ۲۳:۴۰" },
      { label: "در حال آماده‌سازی", done: true, atLabel: "امروز ۱۰:۱۵" },
      { label: "ارسال شد", done: true, atLabel: "امروز ۱۶:۳۰" },
    ],
    trackingCode: "TPX-8839",
  },
  {
    id: "۱۰۲۲۹",
    itemTitle: "فیگور ناروتو سِیج مود",
    itemBrand: "بانپرستو",
    itemEmoji: "🥷",
    cover: { from: "#FF3B8B", to: "#7a1030", emoji: "🥷" },
    sellerName: "کلکسیون‌یار تهران",
    sellerEmoji: "🃏",
    sellerColor: "#6C5CFF",
    itemPrice: 2_750_000,
    shippingPrice: 30_000,
    shippingMethod: "post",
    total: 2_780_000,
    address: DEFAULT_ADDRESS,
    createdAtLabel: "۲ روز پیش",
    timeline: [
      { label: "پرداخت شد", done: true, atLabel: "۲ روز پیش" },
      { label: "در حال آماده‌سازی", done: true, atLabel: "دیروز ۱۴:۰۰" },
      { label: "ارسال شد", done: false },
    ],
  },
];
