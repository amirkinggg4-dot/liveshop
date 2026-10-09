/* ─────────────────────────────────────────────────────────────
   LiveShop — تایپ‌های دادهٔ آزمایشی (Mock)
   همهٔ مبالغ به «تومان» هستند و اعداد در UI فارسی نمایش داده می‌شوند.
   ───────────────────────────────────────────────────────────── */

export interface Cover {
  from: string;
  to: string;
  emoji: string;
}

export interface Seller {
  id: string;
  name: string;
  handle: string;
  emoji: string;
  color: string;
  rating: number;
  ratingsCount: number;
  followers: number;
  verified: boolean;
  bio: string;
  scheduleLabel: string;
}

export type ShowStatus = "live" | "upcoming" | "ended";

export interface Show {
  id: string;
  title: string;
  sellerId: string;
  category: string;
  status: ShowStatus;
  viewers: number;
  cover: Cover;
  /** برای شوهای آینده: «امشب ۲۱:۰۰» */
  startsAtLabel?: string;
  itemsTotal: number;
  itemsSold: number;
  isFollowing: boolean;
  tags: string[];
}

export type ItemStatus = "auction" | "up_next" | "buy_now" | "sold";

export type ItemCondition = "نو با جعبه" | "نو بدون جعبه" | "در حد نو" | "کارکرده";

export interface ShopItem {
  id: string;
  showId: string;
  title: string;
  brand: string;
  emoji: string;
  cover: Cover;
  condition: ItemCondition;
  size?: string;
  sku: string;
  status: ItemStatus;
  startPrice: number;
  currentBid?: number;
  /** پلهٔ مزایده */
  step: number;
  /** ثانیهٔ باقی‌ماندهٔ تایمر نمایشی */
  timerSec?: number;
  buyNowPrice?: number;
  soldPrice?: number;
  soldTo?: string;
  shippingPrice: number;
  description: string;
}

export type ChatKind = "normal" | "purchase" | "system" | "winner" | "giveaway" | "mod";

export interface ChatMessage {
  id: string;
  author: string;
  emoji: string;
  color: string;
  text: string;
  kind: ChatKind;
  /** برچسب پیام خریدمحور مثل «سؤال سایز» */
  tag?: string;
  time: string;
}

export type ShippingMethodId = "tipax" | "post" | "peyk";

export interface ShippingMethod {
  id: ShippingMethodId;
  label: string;
  price: number;
  eta: string;
}

export interface OrderStep {
  label: string;
  done: boolean;
  atLabel?: string;
}

export interface Order {
  id: string;
  itemTitle: string;
  itemEmoji: string;
  itemBrand?: string;
  cover: Cover;
  sellerName: string;
  sellerEmoji: string;
  sellerColor: string;
  itemPrice: number;
  shippingPrice: number;
  shippingMethod: ShippingMethodId;
  total: number;
  address: string;
  createdAtLabel: string;
  timeline: OrderStep[];
  trackingCode?: string;
  rated?: boolean;
}

export type WalletTxKind = "charge" | "purchase" | "win" | "refund";

export type PaymentGateway = "زرین‌پال" | "آیدی‌پی";

export interface WalletTx {
  id: string;
  kind: WalletTxKind;
  title: string;
  /** مثبت = واریز، منفی = برداشت */
  amount: number;
  gateway?: PaymentGateway;
  atLabel: string;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  liveCount: number;
}
