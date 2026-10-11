import type { Cover } from "./types";

/* ═══════════════════════ Raid و کو-هاست — فاز ۳ (اطلس تصویر ۳۲) ═══════════════════════
   دیتای استاتیک ابزارهای رشد پخش در داشبورد زندهٔ فروشنده:
   - RAID_TARGETS: شوهای زندهٔ واقعی به‌عنوان مقصد Raid (کپی ایستا از shows.ts — کاور deep-copy)
   - COHOST_CANDIDATES: فروشنده‌های واقعی به‌عنوان داوطلب پخش مشترک */

/** شؤ مقصد Raid — مقادیر از شوهای زندهٔ real shows.ts کپی ایستا شده‌اند */
export interface RaidTarget {
  showId: string;
  title: string;
  sellerName: string;
  sellerEmoji: string;
  sellerColor: string;
  category: string;
  viewers: number;
  cover: Cover;
}

export type CohostStatus = "idle" | "invited";

/** داوطلب پخش مشترک — از SELLERS واقعی (s2/s3/s4/s6) */
export interface CohostCandidate {
  sellerId: string;
  name: string;
  handle: string;
  emoji: string;
  color: string;
  followers: number;
  categoryLabel: string;
  status: CohostStatus;
}

/* ── مقاصد Raid — از شوهای زندهٔ sh1/sh2/sh3/sh5 (کپی ایستا، کاور مستقل) ── */
export const RAID_TARGETS: RaidTarget[] = [
  {
    showId: "sh1",
    title: "شب کتونی‌های کمیاب",
    sellerName: "کفش‌خانهٔ سینا",
    sellerEmoji: "👟",
    sellerColor: "#FF3B8B",
    category: "کتونی و کفش",
    viewers: 248,
    cover: { from: "#FF3B8B", to: "#6C5CFF", emoji: "👟" },
  },
  {
    showId: "sh2",
    title: "گلخانهٔ زنده — تک‌گیاه‌های نادر",
    sellerName: "گلخانهٔ مینا",
    sellerEmoji: "🪴",
    sellerColor: "#00C896",
    category: "گیاه و گلخانه",
    viewers: 139,
    cover: { from: "#00C896", to: "#0b5f4a", emoji: "🪴" },
  },
  {
    showId: "sh3",
    /* v1.7.1 — هماهنگ با عنوان واقعی sh3 در shows.ts (حالت قیمت ثابت) */
    title: "شو کارت‌های کلکسیونی — قیمت ثابت",
    sellerName: "کلکسیون‌یار تهران",
    sellerEmoji: "🃏",
    sellerColor: "#6C5CFF",
    category: "کارت و کلکسیون",
    viewers: 312,
    cover: { from: "#6C5CFF", to: "#3b2a86", emoji: "🃏" },
  },
  {
    showId: "sh5",
    title: "زیورآلات و عطر دست‌ساز",
    sellerName: "عطر و نگین",
    sellerEmoji: "💎",
    sellerColor: "#B45CFF",
    category: "زیبایی و عطر",
    viewers: 174,
    cover: { from: "#B45CFF", to: "#FF3B8B", emoji: "💎" },
  },
];

/* ── داوطلب‌های کو-هاست — s3 با seed «invited» برای دموی چیپ «ارسال شد ✓» ── */
export const COHOST_CANDIDATES: CohostCandidate[] = [
  {
    sellerId: "s2",
    name: "گلخانهٔ مینا",
    handle: "mina_plants",
    emoji: "🪴",
    color: "#00C896",
    followers: 8200,
    categoryLabel: "گیاه و گلخانه",
    status: "idle",
  },
  {
    sellerId: "s3",
    name: "کلکسیون‌یار تهران",
    handle: "teh_collector",
    emoji: "🃏",
    color: "#6C5CFF",
    followers: 5900,
    categoryLabel: "کارت و کلکسیون",
    status: "invited",
  },
  {
    sellerId: "s4",
    name: "گجت‌بازار",
    handle: "gadget_bazaar",
    emoji: "🎧",
    color: "#FFB454",
    followers: 3100,
    categoryLabel: "دیجیتال و گجت",
    status: "idle",
  },
  {
    sellerId: "s6",
    name: "شبِ کتاب",
    handle: "shabe_ketab",
    emoji: "📚",
    color: "#00C896",
    followers: 1900,
    categoryLabel: "کتاب و کامیک",
    status: "idle",
  },
];
