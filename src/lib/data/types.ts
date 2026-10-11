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
  /* ── v1.6.3 — شو «داغ» (نشان lucide Flame روی کارت، جای ایموجی داخل عنوان) ── */
  hot?: boolean;
  /* ── v1.6.3 — شروع واقعی شو به‌زودی از API (ISO) — شمارش معکوس نسبی
     در حالت API از همین فیلد خوانده می‌شود؛ mock از upcoming.ts ── */
  startsAt?: string | null;
  /* ── v1.6.1 — فیلدهای اختیاریِ حالت API واقعی (همه fallback دارند) ──
     در حالت mock تنظیم نمی‌شوند و UI همان مسیر قبلی (getSeller/SHOW_PHOTO/…)
     را می‌رود؛ در حالت NEXT_PUBLIC_USE_API=true از پاسخ /shows پر می‌شوند. */
  /** نام نمایشی فروشنده از API — اگر نبود getSeller(sellerId).name */
  sellerName?: string;
  /** آواتار فروشنده از API — اگر نبود SellerAvatar mock */
  sellerAvatar?: string | null;
  sellerVerified?: boolean;
  /** قیمت ثابت کالای پین‌شده از API (کارت لایو) — اگر نبود getPinnedItem */
  pinnedPrice?: number | null;
  /** موجودی کالای پین‌شده از API — اگر نبود از variants حساب می‌شود */
  pinnedStock?: number | null;
  /** URL کاور از API — اگر نبود SHOW_PHOTO/show.id */
  photoUrl?: string | null;
}

export type ItemStatus = "auction" | "up_next" | "buy_now" | "sold";

export type ItemCondition = "نو با جعبه" | "نو بدون جعبه" | "در حد نو" | "کارکرده";

/** v1.4 — گزینهٔ سایز/رنگ با موجودی جدا (چند گزینه روی یک لیستینگ) */
export interface VariantOption {
  /** مثلاً «۴۲» برای سایز یا «مشکی» برای رنگ */
  label: string;
  stock: number;
}

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
  /* ── v1.4 — فروش با قیمت ثابت (لایو شاپ) ── */
  /** قیمت ثابت فروش (تومان) — در حالت قیمت ثابت کارت پایین لایو این را نشان می‌دهد */
  price: number;
  /** موجودی کل — قبل از کاهش با purchaseItem چک می‌شود (جلوگیری از فروش دوبارهٔ آخرین عدد) */
  stock: number;
  /** سایزها/رنگ‌ها با موجودی جداگانه — اختیاری */
  variants?: VariantOption[];
  /** وزن بسته (گرم) — برای محاسبهٔ ارسال */
  weightGrams?: number;
  /** ابعاد بسته مثل «۳۰×۲۰×۱۲» */
  dims?: string;
  /* ── فیلدهای حراج — پشت AUCTION_ENABLED نگه داشته می‌شوند (کد پاک نشده) ── */
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
  /** v1.4 — تعداد خریداری‌شده */
  qty?: number;
  /** v1.4 — سایز/رنگ انتخاب‌شده */
  variantLabel?: string;
  shippingPrice: number;
  shippingMethod: ShippingMethodId;
  total: number;
  address: string;
  createdAtLabel: string;
  timeline: OrderStep[];
  trackingCode?: string;
  rated?: boolean;
  /** v1.4 — پرداخت به‌صورت امانی (escrow) نگه داشته شده است */
  escrow?: boolean;
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
