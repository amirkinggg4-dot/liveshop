"use client";

/* ═══════════════════════════════════════════════════════════════════════════
   LiveView — اتاق لایو (بازطراحی v1.3.1 بر اساس مرجع Whatnot)
   ─ ویدیو تمام‌صفحه (fixed inset-0) و پس‌زمینهٔ کل اتاق — عکس واقعی، بدون ایموجی بزرگ
   ─ چت روی ویدیو، سمت چپ-پایین، متن سفید + گرادیان تیرهٔ خوانایی + محو شدن پیام‌های قدیمی (حداکثر ~۴ پیام)
   ─ کارت پایین واحد: عکس گرد ۶۴px کالا + نام + موجودی + شرایط/ارسال | قیمت درشت + تایمر (قرمز و پالس‌دار زیر ۱۰ ثانیه)
   ─ دکمهٔ بید تمام‌عرض بلند + «خرید فوری» ثانویه — شیت بید از پایین روی ویدیو باز می‌شود
   ─ ریل کناری کوچک (۴۴px) با برچسب فارسی: بی‌صدا / اشتراک / کیف پول / فروشگاه (+ لایک، گیواوی، آمار فقط برای صاحب شو)
   ─ هدر: پیل فروشنده با آواتار واقعی + امتیاز ستاره‌دار (راست) | پیل قرمز بیننده + کوچک‌کردن (چپ)
   ─ پیل «برندهٔ فعلی» کوچک، دقیقاً بالای کارت پایین — تگ‌ها داخل کارت
   ─ دسکتاپ: ستون موبایلیِ ~۴۲۰px در مرکز + لیست شوهای دیگر در دو طرف
   قواعد طلایی: هیچ قابلیتی حذف نشده — موتور مزایده، Max Bid، گیواوی، تب Shop، چت خریدمحور،
   داشبورد فروشنده و Raid/کو-هاست همگی سرجشان‌اند و فقط چیده‌ماند تازه گرفته‌اند.
   ═══════════════════════════════════════════════════════════════════════════ */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Heart,
  Volume2,
  VolumeX,
  Share2,
  Clock,
  Send,
  Store,
  Gift,
  BarChart3,
  Wallet as WalletIcon,
  ChevronDown,
  ChevronsLeft,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toFa, faNum, toman, faClock } from "@/lib/format";
import { AUCTION_ENABLED } from "@/lib/config";
import { useAppStore } from "@/store/app-store";
import { useLiveStore, bidderLabel, BOTS } from "@/store/live-store";
import { getShow, getSeller, LIVE_SHOWS, UPCOMING_SHOWS } from "@/lib/data/shows";
import { stockLabelFa } from "@/lib/data/items";
import { SHOW_VIDEO, ITEM_PHOTO, SELLER_PHOTO } from "@/lib/data/media";
import type { ChatMessage, Show } from "@/lib/data/types";
import {
  GradientCover,
  Avatar,
  LiveBadge,
  Price,
  StatusChip,
  SoonBadge,
} from "@/components/liveshop/shared";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import BidSheet from "@/components/liveshop/bid-sheet";
import ShopTab from "@/components/liveshop/shop-tab";
import GiveawayModal from "@/components/liveshop/giveaway-modal";
import Confetti from "@/components/liveshop/confetti";
import QuickCheckoutSheet from "@/components/liveshop/quick-checkout-sheet";
import SellerLiveDashboard from "@/components/liveshop/seller-live-dashboard";

/** فروشندهٔ «من» در دمو — دکمهٔ آمار در ریل فقط برای صاحب شو نمایش داده می‌شود */
const MY_SELLER_ID = "s1";

/* ═══════════════════════ LiveVideoLayer — ویدیوی تمام‌صفحهٔ اتاق ═══════════════════════ */

function LiveVideoLayer({ show }: { show: Show }) {
  const src = SHOW_VIDEO[show.id];
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          priority
          sizes="(max-width: 1023px) 100vw, 420px"
          className="animate-ls-kenburns object-cover"
        />
      ) : (
        /* fallback — گرادیان برند با جاروی نور (بدون ایموجی بزرگ) */
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(150deg, ${show.cover.from} 0%, ${show.cover.to} 100%)`,
          }}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(255,255,255,.3) 0%, transparent 45%), radial-gradient(circle at 75% 80%, rgba(0,0,0,.45) 0%, transparent 55%)",
            }}
          />
          <div className="absolute inset-y-0 w-1/2 animate-[ls-shine_4.5s_ease-in-out_infinite] bg-gradient-to-l from-transparent via-white/10 to-transparent" />
        </div>
      )}

      {/* گرادیان‌های خوانایی — بالا برای هدر، پایین برای چت و کارت */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/75 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
    </div>
  );
}

/* ═══════════════════════ LiveHeader — راست: پیل فروشنده | چپ: بیننده + کوچک‌کردن ═══════════════════════ */

function LiveHeader({ show, onBack }: { show: Show; onBack: () => void }) {
  const seller = getSeller(show.sellerId);
  const photo = SELLER_PHOTO[seller.id];
  return (
    <div className="relative z-30 flex items-start justify-between gap-2 px-3 pt-[max(env(safe-area-inset-top),12px)]">
      {/* پیل فروشنده — آواتار واقعی + نام + امتیاز ستاره‌دار */}
      <div className="flex min-w-0 items-center gap-2 rounded-full border border-white/10 bg-black/50 py-1 pl-2.5 pr-1.5 backdrop-blur-md">
        {photo ? (
          <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-white/25">
            <Image
              src={photo}
              alt={`آواتار فروشنده ${seller.name}`}
              fill
              sizes="28px"
              className="object-cover"
            />
          </span>
        ) : (
          <Avatar emoji={seller.emoji} color={seller.color} size="sm" className="h-7 w-7" />
        )}
        <span className="max-w-[110px] truncate text-xs font-bold text-white">
          {seller.name}
        </span>
        <span
          className="flex items-center gap-0.5 text-[11px] font-bold text-amber-300"
          aria-label={`امتیاز فروشنده ${toFa(seller.rating)} از ۵`}
        >
          <Star className="h-3 w-3 fill-amber-300 text-amber-300" aria-hidden />
          {toFa(seller.rating)}
        </span>
        {seller.verified && (
          <span
            className="text-xs font-black text-ls-purple-soft"
            title="فروشندهٔ تأییدشده"
            aria-label="فروشندهٔ تأییدشده"
          >
            ✓
          </span>
        )}
      </div>

      {/* پیل قرمز تعداد بیننده + دکمهٔ کوچک‌کردن */}
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className="flex items-center gap-1.5 rounded-full bg-[#FF3B5C] px-2.5 py-1.5 text-[11px] font-extrabold text-white shadow-lg"
          aria-label={`${faNum(show.viewers)} بینندهٔ زنده`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-ls-pulse" aria-hidden />
          {faNum(show.viewers)}
        </span>
        <button
          onClick={onBack}
          aria-label="کوچک‌کردن اتاق لایو و بازگشت"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/90 backdrop-blur-md hover:bg-black/70 active:scale-95 transition-all"
        >
          <ChevronDown className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════ LiveRail — ستون کناری کوچک با برچسب فارسی ═══════════════════════ */

function RailButton({
  label,
  onClick,
  ariaLabel,
  children,
}: {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        aria-label={ariaLabel ?? label}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-md hover:bg-black/65 active:scale-95 transition-all"
      >
        {children}
      </button>
      <span className="text-[9px] font-bold leading-none text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,.9)]">
        {label}
      </span>
    </div>
  );
}

function LiveRail({
  show,
  onOpenShop,
  onGiveaway,
  onSellerDash,
}: {
  show: Show;
  onOpenShop: () => void;
  onGiveaway: () => void;
  onSellerDash: () => void;
}) {
  const push = useAppStore((s) => s.push);
  const [likes, setLikes] = useState(1240);
  const [liked, setLiked] = useState(false);
  const [muted, setMuted] = useState(false);
  const isOwner = show.sellerId === MY_SELLER_ID;

  const handleLike = () => {
    setLikes((n) => n + 1);
    setLiked(true);
  };
  const handleShare = () => toast("لینک شو کپی شد (دمو)");

  return (
    <div className="flex flex-col items-center gap-1.5">
      {/* لایک — برچسب = تعداد */}
      <div className="flex flex-col items-center gap-1">
        <button
          onClick={handleLike}
          aria-label="لایک شو"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/45 backdrop-blur-md hover:bg-black/65 active:scale-95 transition-all"
        >
          <Heart className={cn("h-5 w-5 text-ls-pink", liked && "fill-ls-pink")} aria-hidden />
        </button>
        <span
          className="text-[9px] font-bold leading-none text-white/85 tabular-nums [text-shadow:0_1px_2px_rgba(0,0,0,.9)]"
          aria-live="polite"
        >
          {faNum(likes)}
        </span>
      </div>

      <RailButton label="گیواوی" onClick={onGiveaway} ariaLabel="شروع گیواوی زنده">
        <Gift className="h-5 w-5 text-ls-pink" aria-hidden />
      </RailButton>

      {/* آمار — فقط برای صاحب شو */}
      {isOwner && (
        <RailButton label="آمار" onClick={onSellerDash} ariaLabel="داشبورد فروشنده — پشت دوربین">
          <BarChart3 className="h-5 w-5 text-ls-green" aria-hidden />
        </RailButton>
      )}

      <RailButton
        label="بی‌صدا"
        onClick={() => setMuted((m) => !m)}
        ariaLabel={muted ? "پخش صدا" : "قطع صدا"}
      >
        {muted ? (
          <VolumeX className="h-5 w-5" aria-hidden />
        ) : (
          <Volume2 className="h-5 w-5" aria-hidden />
        )}
      </RailButton>

      <RailButton label="اشتراک" onClick={handleShare} ariaLabel="اشتراک‌گذاری شو">
        <Share2 className="h-5 w-5" aria-hidden />
      </RailButton>

      <RailButton label="کیف پول" onClick={() => push("wallet")} ariaLabel="رفتن به کیف پول">
        <WalletIcon className="h-5 w-5 text-ls-green" aria-hidden />
      </RailButton>

      <RailButton label="فروشگاه" onClick={onOpenShop} ariaLabel="مشاهدهٔ Shop این شو">
        <Store className="h-5 w-5 text-ls-purple-soft" aria-hidden />
      </RailButton>
    </div>
  );
}

/* ═══════════════════════ LiveChatOverlay — چت روی ویدیو، چپ-پایین، پیام‌های محوشونده ═══════════════════════ */

const CHAT_TTL_NORMAL = 6000; // پیام‌های معمولی بعد از ~۶ ثانیه محو می‌شوند
const CHAT_TTL_SPECIAL = 9500; // سیستم/برنده/گیواوی کمی longer می‌مانند
const CHAT_FADE_MS = 400; // v1.3.2 — همهٔ انیمیشن‌ها زیر ۴۰۰ms
const CHAT_MAX_VISIBLE = 4;

/* v1.3.2 — چیپ کوچک نوع پیام (جای کادرهای بزرگ) */
function ChipTag({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "green" | "purple" | "pink";
}) {
  const tones = {
    neutral: "bg-white/15 text-white/75",
    green: "bg-ls-green/20 text-ls-green",
    purple: "bg-ls-purple/30 text-ls-purple-soft",
    pink: "bg-ls-pink/25 text-ls-pink",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-1.5 py-px align-middle text-[9px] font-bold leading-[14px]",
        tones[tone]
      )}
    >
      {children}
    </span>
  );
}

function ChatLine({ m, fading }: { m: ChatMessage; fading: boolean }) {
  const fadeCls = cn(
    "transition-all duration-[400ms] ease-out",
    fading ? "opacity-0 translate-y-1" : "opacity-100"
  );

  if (m.kind === "system" || m.kind === "winner" || m.kind === "giveaway") {
    /* v1.3.2 — بدون کادر: متن سادهٔ سفید با سایهٔ ملایم + چیپ کوچک نوع پیام.
       خط ثبت بید (کاربر X پیشنهاد داد) زرد برجسته می‌شود */
    const isBidLine =
      m.text.includes("ثبت کرد") || m.text.includes("Max Bid");
    const label =
      m.kind === "winner" ? "برنده" : m.kind === "giveaway" ? "گیواوی" : null;
    const tone = m.kind === "winner" ? "purple" : "pink";
    return (
      <p
        className={cn(
          "px-1 text-[12px] leading-[18px] [text-shadow:0_1px_3px_rgba(0,0,0,.95)]",
          fadeCls
        )}
      >
        {label && (
          <span className="me-1 inline-flex translate-y-px">
            <ChipTag tone={tone}>{label}</ChipTag>
          </span>
        )}
        <span className="font-black" style={{ color: m.color }}>
          {m.author}
        </span>
        <span
          className={cn(
            "text-white/95",
            isBidLine && "font-bold text-amber-300"
          )}
        >
          {" "}
          {m.text}
        </span>
      </p>
    );
  }

  if (m.kind === "purchase") {
    /* v1.3.2 — کادر سبز حذف شد: متن سفید ساده + چیپ کوچک نوع سؤال کنار نام کاربر */
    return (
      <p
        className={cn(
          "px-1 text-[12px] leading-[18px] [text-shadow:0_1px_3px_rgba(0,0,0,.95)]",
          fadeCls
        )}
      >
        <span className="me-1 inline-flex translate-y-px">
          <ChipTag tone="green">{m.tag ?? "سؤال"}</ChipTag>
        </span>
        <span className="font-black" style={{ color: m.color }}>
          {m.author}
        </span>
        <span className="text-white/95"> {m.text}</span>
      </p>
    );
  }

  const isMod = m.kind === "mod";
  return (
    <p
      className={cn(
        "px-1 text-[12px] leading-[18px] [text-shadow:0_1px_3px_rgba(0,0,0,.95)]",
        fadeCls
      )}
    >
      <span
        className={cn("font-black", isMod && "text-ls-purple-soft")}
        style={isMod ? undefined : { color: m.color }}
      >
        {m.author}
      </span>
      <span className="text-white/95"> {m.text}</span>
    </p>
  );
}

function LiveChatOverlay({ className }: { className?: string }) {
  const messages = useLiveStore((s) => s.chat);
  const pushChat = useLiveStore((s) => s.pushChat);
  const [text, setText] = useState("");
  const [, tickNow] = useState(0);
  const seenRef = useRef<Map<string, number>>(new Map());

  /* نبض زمان برای محو شدن پیام‌های قدیمی */
  useEffect(() => {
    const iv = setInterval(() => tickNow((n) => n + 1), 400);
    return () => clearInterval(iv);
  }, []);

  const send = () => {
    const t = text.trim();
    if (!t) return;
    pushChat({
      author: "علی",
      emoji: "🧑‍💻",
      color: "#6C5CFF",
      text: t,
      kind: "normal",
    });
    setText("");
  };

  const now = Date.now();
  if (seenRef.current.size > 300) {
    for (const [id, t0] of seenRef.current) {
      if (now - t0 > 30000) seenRef.current.delete(id);
    }
  }

  const visible = messages
    .map((m) => {
      let t0 = seenRef.current.get(m.id);
      if (t0 == null) {
        t0 = now;
        seenRef.current.set(m.id, t0);
      }
      const ttl =
        m.kind === "normal" || m.kind === "mod" || m.kind === "purchase"
          ? CHAT_TTL_NORMAL
          : CHAT_TTL_SPECIAL;
      return { m, age: now - t0, ttl };
    })
    .filter((x) => x.age < x.ttl + CHAT_FADE_MS)
    .slice(-CHAT_MAX_VISIBLE);

  return (
    <div
      className={cn(
        "pointer-events-none flex flex-col justify-end gap-2 rounded-2xl p-2",
        /* v1.3.2 — گرادیان تیرهٔ ملایم پشت چت برای خوانایی */
        "bg-[linear-gradient(to_top,rgba(0,0,0,.5),rgba(0,0,0,.2)_60%,transparent)]",
        className
      )}
    >
      {/* پیام‌ها — متن سفید روی تصویر، حداکثر ~۴ پیام، قدیمی‌ها محو */}
      <div
        role="log"
        aria-label="پیام‌های چت زنده"
        className="flex max-h-[190px] flex-col justify-end gap-[7px] overflow-hidden"
      >
        {visible.map(({ m, age, ttl }) => (
          <ChatLine key={m.id} m={m} fading={age > ttl} />
        ))}
      </div>

      {/* ورودی نیمه‌شفاف و گرد */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="pointer-events-auto flex h-10 items-center gap-2 rounded-full border border-white/15 bg-black/50 py-1 pl-1.5 pr-3.5 backdrop-blur-md"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="پیام بنویس…"
          aria-label="متن پیام"
          className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-white/55 focus:outline-none"
        />
        <button
          type="submit"
          aria-label="ارسال پیام"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ls-purple text-white shadow-[0_0_10px_rgba(108,92,255,.5)] hover:bg-ls-purple-deep active:scale-95 transition-all"
        >
          <Send className="h-3.5 w-3.5 -scale-x-100" aria-hidden />
        </button>
      </form>
    </div>
  );
}

/* ═══════════════════════ WinnerBanner — پیل کوچک بالای کارت پایین ═══════════════════════ */

function WinnerBanner({ winnerId }: { winnerId: string }) {
  if (winnerId === "me") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-xs font-extrabold text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #00C896, #009a74)" }}
        aria-live="polite"
      >
        <Avatar
          emoji="🧑‍💻"
          color="#00C896"
          size="sm"
          className="h-5 w-5 text-[10px]"
        />
        تو پیشتی! 🔥
      </span>
    );
  }

  if (winnerId) {
    const bot = BOTS.find((b) => b.id === winnerId);
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full py-1 pl-3 pr-1.5 text-xs font-extrabold text-white shadow-lg"
        style={{ background: "linear-gradient(135deg, #6C5CFF, #8b5cf6)" }}
        aria-live="polite"
      >
        <Avatar
          emoji={bot?.emoji ?? "👤"}
          color={bot?.color ?? "#6C5CFF"}
          size="sm"
          className="h-5 w-5 text-[10px]"
        />
        برندهٔ فعلی: {bidderLabel(winnerId)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-bold text-white/85 backdrop-blur-sm">
      اولین بید را تو بزن!
    </span>
  );
}

/* ═══════════════════════ ProductDock — کارت پایین واحد (v1.4: قیمت ثابت) ═══════════════════════
   AUCTION_ENABLED=false → کارت قیمت ثابت: عکس/نام/موجودی/قیمت درشت/دکمهٔ «خرید …»
   AUCTION_ENABLED=true  → همان کارت مزایدهٔ قبلی (ثبت بید + خرید فوری + تایمر) */

function ProductDock({ showId, show }: { showId: string; show: Show }) {
  const openItem = useAppStore((s) => s.openItem);
  const push = useAppStore((s) => s.push);

  const items = useLiveStore((s) => s.items);
  const pinnedItemId = useLiveStore((s) => s.pinnedItemId);
  const pinnedAt = useLiveStore((s) => s.pinnedAt);
  const activeItemId = useLiveStore((s) => s.activeItemId);
  const currentBid = useLiveStore((s) => s.currentBid);
  const timerSec = useLiveStore((s) => s.timerSec);
  const phase = useLiveStore((s) => s.phase);
  const lastExtendAt = useLiveStore((s) => s.lastExtendAt);

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [bidOpen, setBidOpen] = useState(false);
  const [bidNonce, setBidNonce] = useState(0);

  /* v1.3.2 — پالس قیمت هنگام تغییر بید (فقط حالت مزایده) */
  const [bidPulse, setBidPulse] = useState(0);
  const prevBidRef = useRef(currentBid);
  useEffect(() => {
    if (currentBid !== prevBidRef.current) {
      prevBidRef.current = currentBid;
      setBidPulse((k) => k + 1);
    }
  }, [currentBid]);

  /* v1.4 — کارت پایین همیشه «کالای در حال نمایش» (پین‌شده) را نشان می‌دهد */
  const item =
    items.find((i) => i.id === pinnedItemId) ??
    items.find((i) => i.id === activeItemId) ??
    null;

  const openBidSheet = () => {
    setBidNonce((n) => n + 1); // remount → استپر با currentBid تازه مقداردهی می‌شود
    setBidOpen(true);
  };

  /* فلش «+۱۰ ثانیه تمدید شد» — با تغییر lastExtendAt حدود ۱.۵ ثانیه */
  const extendFlash = lastExtendAt != null && Date.now() - lastExtendAt < 1500;

  const goToProduct = () => openItem(showId, item?.id ?? "");
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const cardCls =
    "rounded-2xl border border-white/10 bg-black/60 p-3 shadow-2xl backdrop-blur-xl";

  /* حالت خاص — در انتظار کالای بعدی */
  if (phase === "awaiting_next" || !item) {
    return (
      <div className={cn(cardCls, "py-4 text-center")}>
        <p className="text-sm font-bold text-white/60">در انتظار کالای بعدی ⏳</p>
        <p className="mt-1 text-xs text-white/40">فروشنده به‌زودی کالای بعدی را پین می‌کند</p>
      </div>
    );
  }

  const photo = ITEM_PHOTO[item.id];
  /* v1.3.2 — خط ریز واحد: برند · سایز · هزینهٔ ارسال */
  const meta = [item.brand, item.size ? `سایز ${item.size}` : null]
    .filter(Boolean)
    .join(" · ");

  /* ═════════ حالت مزایده (AUCTION_ENABLED=true) — کد حفظ‌شدهٔ فاز ۱/۳ ═════════ */
  if (AUCTION_ENABLED) {
    const stockLabel =
      item.status === "sold"
        ? "فروخته شد"
        : item.status === "up_next"
          ? "به‌زودی"
          : `${faNum(1)} موجود`;

    return (
      <div className={cardCls}>
        {/* ردیف ۱ — عکس گرد ۶۴px (با نشان کوچک تگ گوشهٔ عکس) + نام/موجودی/شرح | قیمت درشت + تایمر */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <button
              onClick={goToProduct}
              aria-label={`مشاهدهٔ محصول: ${item.title}`}
              className="relative block h-16 w-16 overflow-hidden rounded-full ring-2 ring-white/20 hover:ring-ls-purple/60 transition-all"
            >
              {photo ? (
                <Image
                  src={photo}
                  alt={`تصویر کالا: ${item.title}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <GradientCover
                  cover={item.cover}
                  className="h-full w-full"
                  emojiClassName="text-2xl"
                />
              )}
            </button>
            {show.tags[0] && (
              <span
                className="absolute -bottom-1 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-ls-purple px-1.5 py-px text-[8px] font-black text-white shadow-md"
                aria-hidden
              >
                {show.tags[0]}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold text-white">{item.title}</p>
            <span
              className={cn(
                "mt-1 inline-block text-[11px] font-bold",
                item.status === "sold" ? "text-white/55" : "text-ls-green"
              )}
            >
              {stockLabel}
            </span>
            <p className="mt-1 truncate text-[10px] text-white/60">
              {meta} · ارسال {toman(item.shippingPrice)}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end">
            <span className="text-[9px] font-bold text-white/55">
              {item.status === "auction" ? "بید فعلی" : "قیمت"}
            </span>
            <Price
              key={item.status === "auction" ? bidPulse : "static"}
              amount={
                item.status === "auction"
                  ? currentBid
                  : item.buyNowPrice ?? item.soldPrice ?? item.startPrice
              }
              className={cn(
                "text-[19px] leading-6 text-ls-purple-soft",
                item.status === "auction" &&
                  "inline-block origin-bottom-right animate-ls-bid-pop"
              )}
            />
            {item.status === "auction" && (
              <span
                className={cn(
                  "mt-1 inline-flex items-center gap-1 font-black leading-none tabular-nums transition-all",
                  timerSec <= 10
                    ? cn(
                        "text-[#FF3B5C] animate-ls-timer-alert",
                        timerSec <= 5 ? "text-[21px]" : "text-[18px]"
                      )
                    : "text-[18px] text-white/85"
                )}
                aria-label={`زمان باقی‌ماندهٔ مزایده: ${faClock(timerSec)}`}
              >
                <Clock className="h-4 w-4" aria-hidden />
                {faClock(timerSec)}
              </span>
            )}
          </div>
        </div>

        {/* فلش تمدید تایمر — ضدکلاهبرداری زمانی */}
        {item.status === "auction" && extendFlash && (
          <div key={lastExtendAt} className="animate-ls-fade-up mt-2 flex justify-end">
            <span className="rounded-full border border-ls-pink/40 bg-ls-pink/15 px-2.5 py-0.5 text-[10px] font-bold text-ls-pink">
              +۱۰ ثانیه تمدید شد ⏱
            </span>
          </div>
        )}

        {/* ردیف ۲ — بر اساس وضعیت آیتم */}
        {item.status === "auction" && (
          <div className="mt-2.5 flex items-stretch gap-2">
            <button
              onClick={(e) => {
                stop(e);
                openBidSheet();
              }}
              className="flex h-12 min-w-0 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-ls-purple text-[15px] font-black text-white shadow-[0_0_18px_rgba(108,92,255,.45)] hover:bg-ls-purple-deep active:scale-[.98] transition-all"
              aria-label={`ثبت بید به مبلغ ${toman(currentBid + item.step)}`}
            >
              <span className="truncate">ثبت بید {toman(currentBid + item.step)}</span>
              <ChevronsLeft className="h-5 w-5" aria-hidden />
            </button>
            {item.buyNowPrice != null && (
              <button
                onClick={(e) => {
                  stop(e);
                  push("checkout", item.id);
                }}
                className="h-12 shrink-0 whitespace-nowrap rounded-xl border border-ls-green/60 bg-ls-green/10 px-3 text-[11px] font-extrabold text-ls-green hover:bg-ls-green/20 active:scale-[.98] transition-all"
                aria-label="خرید فوری"
              >
                خرید فوری
              </button>
            )}
          </div>
        )}

        {item.status === "buy_now" && (
          <div className="mt-2.5">
            <button
              onClick={(e) => {
                stop(e);
                push("checkout", item.id);
              }}
              className="h-12 w-full rounded-xl bg-ls-green text-sm font-black text-[#04281e] shadow-[0_0_16px_rgba(0,200,150,.3)] hover:brightness-110 active:scale-[.99] transition-all"
              aria-label="خرید فوری"
            >
              خرید فوری — {toman(item.buyNowPrice ?? item.startPrice)}
            </button>
          </div>
        )}

        {item.status === "sold" && (
          <div className="mt-2.5">
            <button
              disabled
              className="h-12 w-full rounded-xl bg-white/10 text-sm font-bold text-white/45 cursor-not-allowed"
              aria-label="فروخته شد"
            >
              فروخته شد — {toman(item.soldPrice ?? item.startPrice)}
            </button>
          </div>
        )}

        {item.status === "up_next" && (
          <div className="mt-2.5 flex items-center gap-2">
            <StatusChip status="up_next" />
            <button
              onClick={(e) => {
                stop(e);
                toast("یادآوری فعال شد");
              }}
              className="ms-auto rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white/80 hover:bg-white/5 active:scale-[.98] transition-all"
              aria-label="یادآوری آیتم بعدی"
            >
              یادآوری
            </button>
          </div>
        )}

        {/* شیت مزایده — از پایین روی ویدیو باز می‌شود */}
        <BidSheet key={bidNonce} open={bidOpen} onOpenChange={setBidOpen} />
      </div>
    );
  }

  /* ═════════ v1.4 — حالت قیمت ثابت: عکس · نام · موجودی · قیمت درشت · دکمهٔ خرید ═════════ */
  const soldOut = item.stock <= 0;
  const lowStock = item.stock > 0 && item.stock < 3;
  /* برچسب موجودی — گزینه‌دار: جمع موجودی سایزها؛ ساده: موجودی کل */
  const stockTotal = item.variants?.length
    ? item.variants.reduce((s, v) => s + v.stock, 0)
    : item.stock;
  const sizeRange =
    item.variants && item.variants.length > 0
      ? `سایز ${item.variants[0].label} تا ${item.variants[item.variants.length - 1].label}`
      : item.size
        ? `سایز ${item.size}`
        : null;

  return (
    <div className={cardCls}>
      {/* v1.4 — پیل «کالای در حال نمایش» + انیمیشن کوتاه تعویض کالا
          v1.4.1 — چیپ تگ شو (که برای این شوها «قیمت ثابت» است) از کارت پایین حذف شد تا
          برچسب «قیمت ثابت» فقط روی کارت‌های شیت Shop دیده شود */}
      <div className="mb-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-ls-purple/25 px-2.5 py-1 text-[10px] font-extrabold text-ls-purple-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-ls-purple-soft animate-ls-pulse" aria-hidden />
          کالای در حال نمایش
        </span>
      </div>

      <div key={`${item.id}-${pinnedAt}`} className="animate-ls-fade-up">
        {/* ردیف ۱ — عکس ۶۴px + نام/موجودی/خط ریز | قیمت ثابت درشت */}
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <button
              onClick={goToProduct}
              aria-label={`مشاهدهٔ محصول: ${item.title}`}
              className="relative block h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-white/20 hover:ring-ls-green/60 transition-all"
            >
              {photo ? (
                <Image
                  src={photo}
                  alt={`تصویر کالا: ${item.title}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <GradientCover
                  cover={item.cover}
                  className="h-full w-full"
                  emojiClassName="text-2xl"
                />
              )}
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-extrabold text-white">{item.title}</p>
            {/* v1.4 — موجودی: «۳ عدد مانده» — زیر ۳ عدد رنگ هشدار، صفر = تمام شد */}
            <span
              className={cn(
                "mt-1 inline-block text-[11px] font-bold",
                soldOut ? "text-white/45" : lowStock ? "text-amber-300" : "text-ls-green"
              )}
              aria-live="polite"
            >
              {stockLabelFa(stockTotal)}
            </span>
            <p className="mt-1 truncate text-[10px] text-white/60">
              {[sizeRange, `ارسال ${toman(item.shippingPrice)}`].filter(Boolean).join(" · ")}
            </p>
          </div>

          {/* v1.4.1 — برچسب «قیمت ثابت» فقط روی کارت‌های شیت Shop است؛ اینجا فقط قیمت */}
          <div className="flex shrink-0 flex-col items-end">
            <Price amount={item.price} className="text-[19px] leading-6 text-ls-green" />
          </div>
        </div>

        {/* ردیف ۲ — دکمهٔ بزرگ «خرید …» / «تمام شد» */}
        <div className="mt-2.5">
          {soldOut ? (
            <button
              disabled
              className="h-12 w-full cursor-not-allowed rounded-xl bg-white/10 text-sm font-bold text-white/45"
              aria-label="کالا تمام شد"
            >
              تمام شد
            </button>
          ) : (
            <button
              onClick={(e) => {
                stop(e);
                setCheckoutOpen(true);
              }}
              className="flex h-12 w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-ls-green text-[15px] font-black text-[#04281e] shadow-[0_0_18px_rgba(0,200,150,.4)] hover:brightness-110 active:scale-[.98] transition-all"
              aria-label={`خرید ${item.title} به قیمت ${toman(item.price)}`}
            >
              <span>خرید {toman(item.price)}</span>
              <ChevronsLeft className="h-5 w-5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {/* v1.4 — شیت خرید سریع (سایز/تعداد/آدرس/ارسال/پرداخت امانی) */}
      <QuickCheckoutSheet
        item={item}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
      />
    </div>
  );
}

/* ═══════════════════════ DesktopSidePanels — دسکتاپ: شوهای دیگر دو طرف ستون ═══════════════════════ */

function DesktopSidePanels({ currentShowId }: { currentShowId: string }) {
  const openShow = useAppStore((s) => s.openShow);
  const otherLive = LIVE_SHOWS.filter((s) => s.id !== currentShowId);

  return (
    <>
      {/* راست — شوهای زندهٔ دیگر */}
      <aside
        className="absolute right-8 top-1/2 z-10 hidden w-64 -translate-y-1/2 flex-col gap-2.5 lg:flex"
        aria-label="شوهای زندهٔ دیگر"
      >
        <h2 className="flex items-center gap-2 px-1 text-sm font-extrabold text-white/85">
          <span className="h-2 w-2 rounded-full bg-[#FF3B5C] animate-ls-pulse" aria-hidden />
          شوهای زندهٔ دیگر
        </h2>
        <div className="flex max-h-[68vh] flex-col gap-2 overflow-y-auto scroll-thin pl-1">
          {otherLive.map((s) => {
            const seller = getSeller(s.sellerId);
            return (
              <button
                key={s.id}
                onClick={() => openShow(s.id)}
                aria-label={`ورود به شو: ${s.title}`}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-2 text-right backdrop-blur-sm hover:border-ls-purple/50 hover:bg-white/[.08] transition-all"
              >
                <GradientCover
                  cover={s.cover}
                  className="h-12 w-12 shrink-0 rounded-xl"
                  emojiClassName="text-xl"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-white">
                    {s.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-white/50">
                    {seller.name}
                  </span>
                </span>
                <LiveBadge viewers={s.viewers} className="shrink-0 scale-90" />
              </button>
            );
          })}
        </div>
      </aside>

      {/* چپ — شوهای به‌زودی */}
      <aside
        className="absolute left-8 top-1/2 z-10 hidden w-64 -translate-y-1/2 flex-col gap-2.5 lg:flex"
        aria-label="شوهای به‌زودی"
      >
        <h2 className="flex items-center gap-2 px-1 text-sm font-extrabold text-white/85">
          <span aria-hidden>🕒</span> به‌زودی
        </h2>
        <div className="flex max-h-[68vh] flex-col gap-2 overflow-y-auto scroll-thin pl-1">
          {UPCOMING_SHOWS.slice(0, 4).map((s) => {
            const seller = getSeller(s.sellerId);
            return (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.03] p-2"
              >
                <GradientCover
                  cover={s.cover}
                  className="h-12 w-12 shrink-0 rounded-xl"
                  emojiClassName="text-xl"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-white">
                    {s.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[10px] text-white/50">
                    {seller.name}
                  </span>
                </span>
                <SoonBadge label={s.startsAtLabel} />
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
}

/* ═══════════════════════ شمارش معکوس «آیتم بعدی» — پایان مزایده با برد ربات ═══════════════════════ */

function AutoNextCountdown() {
  const dismissFinished = useLiveStore((s) => s.dismissFinished);
  const startNextItem = useLiveStore((s) => s.startNextItem);
  const [leftMs, setLeftMs] = useState(3500);
  const firedRef = useRef(false);

  useEffect(() => {
    const t0 = Date.now();
    const iv = setInterval(() => {
      setLeftMs(Math.max(0, 3500 - (Date.now() - t0)));
    }, 200);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    if (leftMs <= 0 && !firedRef.current) {
      firedRef.current = true;
      dismissFinished();
      startNextItem();
    }
  }, [leftMs, dismissFinished, startNextItem]);

  const sec = Math.min(3, Math.ceil(leftMs / 1000));
  return (
    <span className="text-[11px] font-bold text-white/45 tabular-nums">
      ⏳ آیتم بعدی تا {toFa(sec)} ثانیهٔ دیگر…
    </span>
  );
}

/* ═══════════════════════ FinishedModal — مودال پایان مزایده ═══════════════════════ */

function FinishedModal() {
  const finishedItem = useLiveStore((s) => s.finishedItem);
  const dismissFinished = useLiveStore((s) => s.dismissFinished);
  const push = useAppStore((s) => s.push);

  return (
    <Dialog open={!!finishedItem}>
      <DialogContent
        className="bg-ls-card border border-ls-purple/30 rounded-2xl sm:max-w-sm"
        showCloseButton={false}
      >
        {finishedItem?.iWon ? (
          <div className="flex flex-col items-center gap-3 text-center">
            <Confetti />
            <span className="text-5xl animate-ls-float" aria-hidden>
              🎉
            </span>
            <DialogTitle className="text-lg font-extrabold text-ls-green">
              شما برنده شدید! 🎉
            </DialogTitle>
            <DialogDescription className="sr-only">
              مزایده با برد شما تمام شد و سفارش ساخته شد
            </DialogDescription>
            <p className="text-sm leading-6 text-white/75">
              «{finishedItem.title}» با{" "}
              <span className="font-extrabold text-ls-purple-soft tabular-nums">
                {toman(finishedItem.price)}
              </span>
            </p>
            <button
              onClick={() => {
                push("win");
                dismissFinished();
              }}
              className="mt-1 w-full rounded-xl bg-ls-purple py-2.5 text-sm font-bold text-white shadow-[0_0_14px_rgba(108,92,255,.35)] hover:bg-ls-purple-deep active:scale-[.98] transition-all"
              aria-label="مشاهدهٔ سفارش برد مزایده"
            >
              مشاهدهٔ سفارش
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2.5 text-center">
            <span className="text-4xl" aria-hidden>
              🔨
            </span>
            <DialogTitle className="text-base font-extrabold">
              مزایده تمام شد
            </DialogTitle>
            <DialogDescription className="sr-only">
              پایان مزایده این آیتم
            </DialogDescription>
            {finishedItem && (
              <>
                <p className="text-sm text-white/75">
                  برنده:{" "}
                  <span className="font-extrabold text-ls-purple-soft">
                    {finishedItem.winnerLabel}
                  </span>
                </p>
                <p className="text-xs text-white/50">
                  «{finishedItem.title}» —{" "}
                  <span className="tabular-nums">{toman(finishedItem.price)}</span>
                </p>
                <AutoNextCountdown key={finishedItem.title} />
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════ LiveView — اتاق لایو تمام‌صفحه (بازطراحی v1.3.1) ═══════════════════════ */

export default function LiveView() {
  const currentShowId = useAppStore((s) => s.currentShowId);
  const back = useAppStore((s) => s.back);
  const showId = currentShowId ?? "sh1";
  const show = getShow(showId);

  const phase = useLiveStore((s) => s.phase);
  const giveawayPhase = useLiveStore((s) => s.giveaway.phase);
  const currentWinnerId = useLiveStore((s) => s.currentWinnerId);
  const startShow = useLiveStore((s) => s.startShow);
  const stopShow = useLiveStore((s) => s.stopShow);
  const tick = useLiveStore((s) => s.tick);
  const startGiveaway = useLiveStore((s) => s.startGiveaway);

  const [shopOpen, setShopOpen] = useState(false);
  const [sellerDashOpen, setSellerDashOpen] = useState(false);
  const [givDismissed, setGivDismissed] = useState(false);

  /* mount: روشن‌کردن شو + seed چت — unmount: خاموش‌کردن */
  useEffect(() => {
    startShow(showId);
    return () => {
      stopShow();
    };
  }, [showId, startShow, stopShow]);

  /* تیک موتور — هر ثانیه در حین مزایده یا شمارش معکوس گیواوی */
  useEffect(() => {
    if (phase !== "running" && giveawayPhase !== "countdown") return;
    const iv = setInterval(() => tick(), 1000);
    return () => clearInterval(iv);
  }, [phase, giveawayPhase, tick]);

  const handleGiveaway = () => {
    setGivDismissed(false);
    startGiveaway();
  };

  return (
    <div
      className="fixed inset-0 z-40 overflow-hidden bg-[#08060f]"
      role="dialog"
      aria-label="اتاق لایو"
    >
      {/* درخشش پس‌زمینهٔ دسکتاپ */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(60% 50% at 50% 40%, rgba(108,92,255,.16) 0%, transparent 70%), radial-gradient(40% 40% at 85% 80%, rgba(255,59,139,.10) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* دسکتاپ — لیست شوهای دیگر دو طرف */}
      <DesktopSidePanels currentShowId={showId} />

      {/* ستون موبایلیِ وسط — ویدیو تمام‌صفحهٔ همین ستون */}
      <div className="relative mx-auto flex h-full w-full max-w-[420px] flex-col overflow-hidden bg-black lg:my-5 lg:h-[calc(100%-2.5rem)] lg:rounded-[2rem] lg:border lg:border-white/10 lg:shadow-[0_0_90px_rgba(108,92,255,.22)]">
        <LiveVideoLayer show={show} />

        <div className="relative z-10 flex h-full min-h-0 flex-col">
          <LiveHeader show={show} onBack={back} />

          {/* ناحیهٔ میانی — ریل راست + چت چپ-پایین */}
          <div className="relative min-h-0 flex-1">
            <div className="absolute bottom-2 right-3 z-20">
              <LiveRail
                show={show}
                onOpenShop={() => setShopOpen(true)}
                onGiveaway={handleGiveaway}
                onSellerDash={() => setSellerDashOpen(true)}
              />
            </div>
            <LiveChatOverlay className="absolute bottom-1 left-1.5 z-10 w-[min(300px,76%)]" />
          </div>

          {/* پیل برندهٔ فعلی + کارت پایین واحد — با رعایت safe-area */}
          <div className="relative z-20 shrink-0 px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          {/* پیل برندهٔ فعلی — فقط در حالت مزایده (AUCTION_ENABLED) */}
            {AUCTION_ENABLED && (phase === "running" || phase === "sold") && (
              <div className="mb-2 flex justify-center">
                <WinnerBanner winnerId={currentWinnerId} />
              </div>
            )}
            <ProductDock showId={showId} show={show} />
          </div>
        </div>

        {/* اورلی Shop — تمام ستون لایو */}
        <ShopTab open={shopOpen} onClose={() => setShopOpen(false)} />
      </div>

      {/* فاز ۲ — داشبورد زندهٔ فروشنده (شیت از پایین) */}
      <SellerLiveDashboard
        open={sellerDashOpen}
        onClose={() => setSellerDashOpen(false)}
      />

      {/* گیواوی — بستن فقط UI؛ store تا گیواوی بعدی در 'won' می‌ماند */}
      <GiveawayModal
        dismissed={givDismissed}
        onDismiss={() => setGivDismissed(true)}
      />

      {/* مودال پایان مزایده (برد من / برد ربات) — فقط در حالت مزایده */}
      {AUCTION_ENABLED && <FinishedModal />}
    </div>
  );
}
