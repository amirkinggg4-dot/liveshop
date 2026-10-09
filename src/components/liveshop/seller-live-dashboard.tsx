"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Package, Pin, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { faNum, toman } from "@/lib/format";
import { useLiveStore } from "@/store/live-store";
import { useSellerStore } from "@/store/seller-store";
import { WATCHING_VIEWERS, type WatchingViewer } from "@/lib/data/seller";
import { stockLabelFa } from "@/lib/data/items";
import { Avatar } from "@/components/liveshop/shared";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RaidSheet, CoHostSheet } from "@/components/liveshop/raid-cohost";
import { AUCTION_ENABLED } from "@/lib/config";

/* ═══════════════════════ SellerLiveDashboard — داشبورد زندهٔ فروشنده (فاز ۲ — اطلس تصویر ۰۴) ═══════════════════════
   کنترل‌پنل حین پخش — فروش زنده و سفارش‌ها از موتور live-store، انعام/پیشنهاد از seller-store.
   فروشنده بدون ترک صحنه همه‌چیز را پشت دوربین می‌بیند. */

type DashEventKind = "sale" | "giveaway" | "auction" | "other" | "tip" | "offer";

interface DashEvent {
  id: string;
  kind: DashEventKind;
  author: string;
  emoji: string;
  color: string;
  text: string;
  time: string;
  /** مبلغ انعام — فقط kind==="tip" (به‌صورت سبز و درشت رندر می‌شود) */
  tipAmount?: number;
}

/** بج نوع رویداد */
const KIND_BADGE: Record<Exclude<DashEventKind, "other">, { label: string; cls: string }> = {
  auction: { label: "مزایده", cls: "bg-ls-purple/15 text-ls-purple-soft" },
  sale: { label: "فروش", cls: "bg-ls-green/15 text-ls-green" },
  giveaway: { label: "گیواوی", cls: "bg-ls-pink/15 text-ls-pink" },
  tip: { label: "انعام", cls: "bg-ls-green/15 text-ls-green" },
  offer: { label: "پیشنهاد", cls: "bg-amber-300/15 text-amber-300" },
};

const EVENT_FILTERS = [
  ...(AUCTION_ENABLED ? [{ key: "auction", label: "مزایده" } as const] : []),
  { key: "all", label: "همه" },
  { key: "sale", label: "فروش" },
  { key: "giveaway", label: "گیواوی" },
  { key: "tip", label: "انعام" },
] as const;

/** رنگ بج بیننده‌ها */
const VIEWER_BADGE_CLS: Record<NonNullable<WatchingViewer["badge"]>, string> = {
  VIP: "bg-amber-300/15 text-amber-300",
  "خریدار ثابت": "bg-ls-purple/15 text-ls-purple-soft",
  "تازه‌وارد": "bg-ls-green/15 text-ls-green",
};

export default function SellerLiveDashboard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  /* آمار زنده از موتور — با هر فروش خودکار آپدیت می‌شود */
  const liveItems = useLiveStore((s) => s.items);
  const soldCount = useLiveStore((s) => s.soldCount);
  const chat = useLiveStore((s) => s.chat);
  /* v1.4 — پین «کالای در حال نمایش» از همین داشبورد */
  const pinnedItemId = useLiveStore((s) => s.pinnedItemId);
  const pinItem = useLiveStore((s) => s.pinItem);
  const tips = useSellerStore((s) => s.tips);
  const offers = useSellerStore((s) => s.offers);
  const addTip = useSellerStore((s) => s.addTip);

  const [filter, setFilter] = useState<"all" | "auction" | "sale" | "giveaway" | "tip">("all");
  /* v1.4 — در حالت قیمت ثابت، تب پیش‌فرض «کالاها»ست (پین کالای بعدی) */
  const [tab, setTab] = useState<"activity" | "watching" | "items">(
    AUCTION_ENABLED ? "activity" : "items"
  );

  /* ابزارهای رشد پخش — فاز ۳ (Raid / کو-هاست) */
  const [raidOpen, setRaidOpen] = useState(false);
  const [cohostOpen, setCohostOpen] = useState(false);

  const sales = liveItems
    .filter((i) => i.status === "sold")
    .reduce((sum, i) => sum + (i.soldPrice ?? 0), 0);

  /* شبیه‌سازی انعام زندهٔ بیننده‌ها */
  useEffect(() => {
    if (!open) return;
    const iv = setInterval(() => {
      const buyers = [
        ["reza_vault", "💎", "#00C896"],
        ["mina_k72", "🌸", "#B45CFF"],
        ["sole_hunter", "👟", "#FF3B8B"],
      ];
      const b = buyers[Math.floor(Math.random() * 3)];
      addTip(
        [200_000, 500_000, 1_000_000][Math.floor(Math.random() * 3)],
        b[0],
        b[1],
        b[2]
      );
    }, 15000);
    return () => clearInterval(iv);
  }, [open, addTip]);

  /* ساخت فهرست رویدادها از هر دو استور — ترتیب ادغام: چت → انعام → پیشنهاد */
  const events = useMemo<DashEvent[]>(() => {
    const fromChat: DashEvent[] = chat.map((m) => ({
      id: m.id,
      kind:
        m.kind === "winner"
          ? "sale"
          : m.kind === "giveaway"
            ? "giveaway"
            : m.author === "Max Bid" || m.text.startsWith("بید ")
              ? "auction"
              : "other",
      author: m.author,
      emoji: m.emoji,
      color: m.color,
      text: m.text,
      time: m.time,
    }));

    const fromTips: DashEvent[] = tips.map((t) => ({
      id: t.id,
      kind: "tip",
      author: t.from,
      emoji: t.emoji,
      color: t.color,
      text: `${t.amount} انعام از ${t.from}`,
      time: t.atLabel,
      tipAmount: t.amount,
    }));

    const fromOffers: DashEvent[] = offers.map((o) => ({
      id: o.id,
      kind: "offer",
      author: o.buyer,
      emoji: o.buyerEmoji,
      color: o.buyerColor,
      text: `${o.buyer} برای «${o.itemTitle}» پیشنهاد ${toman(o.amount)} داد`,
      time: o.atLabel,
    }));

    return [...fromChat, ...fromTips, ...fromOffers];
  }, [chat, tips, offers]);

  const filtered =
    filter === "all" ? events : events.filter((e) => e.kind === filter);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="bg-ls-card border-t border-ls-purple/30 rounded-t-3xl">
        <DrawerHeader className="text-right pb-2">
          <DrawerTitle className="flex items-center gap-2 text-base font-black">
            <BarChart3 className="w-5 h-5 text-ls-green" aria-hidden />
            <span>داشبورد فروشنده</span>
            <span className="text-[11px] font-medium text-white/45">
              پشت دوربین — بدون ترک صحنه
            </span>
            <button
              onClick={onClose}
              aria-label="بستن داشبورد فروشنده"
              className="ms-auto w-8 h-8 shrink-0 rounded-full bg-ls-card-2 flex items-center justify-center text-white/80 hover:bg-ls-line active:scale-95 transition-all"
            >
              <X className="w-4 h-4" aria-hidden />
            </button>
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            کنترل‌پنل حین پخش — فروش زنده، سفارش‌ها، رویدادها و بیننده‌های حاضر
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col max-h-[75vh] px-4 pb-[max(env(safe-area-inset-bottom),16px)] pt-1">
          {/* دو کارت آمار بزرگ — زنده از موتور */}
          <div className="grid grid-cols-2 gap-3 mt-1">
            <div className="rounded-xl bg-ls-card-2 p-3" aria-label="فروش زندهٔ این شو">
              <p className="text-[10px] text-white/45">فروش زنده</p>
              <p
                className="text-xl font-black text-ls-green tabular-nums leading-tight"
                aria-live="polite"
              >
                {toman(sales)}
              </p>
            </div>
            <div className="rounded-xl bg-ls-card-2 p-3" aria-label="تعداد سفارش‌های این شو">
              <p className="text-[10px] text-white/45">سفارش‌ها</p>
              <p
                className="text-xl font-black text-white tabular-nums leading-tight"
                aria-live="polite"
              >
                {faNum(soldCount)}
              </p>
            </div>
          </div>

          {/* چیپ‌های فیلتر رویدادها */}
          <div
            className="flex gap-2 mt-3 overflow-x-auto no-scrollbar"
            aria-label="فیلتر رویدادها"
          >
            {EVENT_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                aria-pressed={filter === f.key}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors",
                  filter === f.key
                    ? "bg-ls-purple text-white"
                    : "bg-ls-card-2 text-white/60 hover:text-white"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* تب‌های داشبورد */}
          <div
            className="flex gap-1 mt-3 rounded-xl bg-ls-bg/60 p-1"
            role="tablist"
            aria-label="تب داشبورد فروشنده"
          >
            {AUCTION_ENABLED && (
              <button
                role="tab"
                aria-selected={tab === "activity"}
                onClick={() => setTab("activity")}
                className={cn(
                  "flex-1 rounded-xl py-2 text-xs font-bold transition-colors",
                  tab === "activity" ? "bg-ls-card-2 text-white" : "text-white/45"
                )}
              >
                رویدادها
              </button>
            )}
            {!AUCTION_ENABLED && (
              <button
                role="tab"
                aria-selected={tab === "items"}
                onClick={() => setTab("items")}
                className={cn(
                  "flex-1 rounded-xl py-2 text-xs font-bold transition-colors",
                  tab === "items" ? "bg-ls-card-2 text-white" : "text-white/45"
                )}
              >
                کالاها
              </button>
            )}
            <button
              role="tab"
              aria-selected={tab === "watching"}
              onClick={() => setTab("watching")}
              className={cn(
                "flex-1 rounded-xl py-2 text-xs font-bold transition-colors",
                tab === "watching" ? "bg-ls-card-2 text-white" : "text-white/45"
              )}
            >
              بیننده‌ها
            </button>
          </div>

          {tab === "activity" ? (
            <div className="flex flex-col flex-1 min-h-0 mt-3">
              {/* فهرست رویدادها — چت موتور + انعام + پیشنهاد خصوصی */}
              <div
                className="flex-1 min-h-0 space-y-2 max-h-72 overflow-y-auto scroll-thin"
                role="log"
                aria-label="رویدادهای زندهٔ شو"
              >
                {filtered.map((ev) => {
                  const badge = ev.kind === "other" ? null : KIND_BADGE[ev.kind];
                  return (
                    <div
                      key={ev.id}
                      className="bg-ls-card border border-white/5 rounded-xl p-2.5 flex items-center gap-2.5"
                    >
                      <Avatar emoji={ev.emoji} color={ev.color} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white/90 truncate">
                            {ev.author}
                          </span>
                          {badge && (
                            <span
                              className={cn(
                                "rounded px-1.5 text-[9px] font-black whitespace-nowrap",
                                badge.cls
                              )}
                            >
                              {badge.label}
                            </span>
                          )}
                          <span className="ms-auto text-[9px] text-white/35 whitespace-nowrap">
                            {ev.time}
                          </span>
                        </div>
                        <p className="text-[11px] text-white/65 truncate">
                          {ev.kind === "tip" ? (
                            <>
                              <span className="font-bold text-ls-green tabular-nums">
                                {faNum(ev.tipAmount ?? 0)}
                              </span>{" "}
                              انعام از {ev.author}
                            </>
                          ) : (
                            ev.text
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <p className="py-8 text-center text-xs text-white/40">
                    رویدادی در این فیلتر نیست
                  </p>
                )}
              </div>

              {/* ثبت انعام دستی (دمو) */}
              <button
                onClick={() => {
                  addTip(500_000, "بینندهٔ مهمان");
                  toast("انعام ثبت شد و در چت نمایش داده شد 💚");
                }}
                className="mt-3 w-full py-2 rounded-xl border border-ls-green/40 text-ls-green text-xs font-bold hover:bg-ls-green/10 active:scale-[.99] transition-all"
                aria-label="ثبت انعام نمایشی"
              >
                ثبت انعام (دمو) 💚
              </button>
            </div>
          ) : tab === "items" ? (
            /* ═══ v1.4 — تب کالاها: پین‌کردن «کالای در حال نمایش» بعدی ═══ */
            <div className="mt-3">
              <p className="text-[11px] leading-5 text-white/55">
                کالایی که پین می‌کنی، همین لحظه کارت پایین اتاقِ همهٔ بیننده‌ها را عوض
                می‌کند و پیام «کالای جدید: …» در چت می‌رود.
              </p>
              <div
                className="mt-2 space-y-2 max-h-72 overflow-y-auto scroll-thin"
                aria-label="کالاهای شو — پین کالای در حال نمایش"
              >
                {[
                  ...liveItems.filter((i) => i.id === pinnedItemId),
                  ...liveItems.filter((i) => i.id !== pinnedItemId),
                ].map((item) => {
                  const isPinned = item.id === pinnedItemId;
                  const out = item.stock <= 0;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "rounded-xl border p-2.5 flex items-center gap-2.5",
                        isPinned
                          ? "border-ls-green/50 bg-ls-green/5"
                          : "border-white/5 bg-ls-card"
                      )}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ls-card-2 text-base"
                        aria-hidden
                      >
                        {item.emoji}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-white/90">
                          {item.title}
                        </p>
                        <p className="mt-0.5 text-[10px] tabular-nums">
                          <span className={cn("font-bold", out ? "text-white/40" : "text-ls-green")}>
                            {toman(item.price, false)}
                          </span>
                          <span
                            className={cn(
                              out
                                ? "text-white/40"
                                : item.stock < 3
                                  ? "text-amber-300"
                                  : "text-white/45"
                            )}
                          >
                            {" · "}
                            {stockLabelFa(item.stock)}
                          </span>
                        </p>
                      </div>
                      {isPinned ? (
                        <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-ls-green px-2.5 py-1.5 text-[10px] font-black text-[#04281e]">
                          <Pin className="h-3 w-3" aria-hidden />
                          در حال نمایش
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (out) {
                              toast.error("کالای تمام‌شده پین نمی‌شود");
                              return;
                            }
                            pinItem(item.id);
                            toast.success(`«${item.title}» برای همه پین شد`);
                          }}
                          disabled={out}
                          aria-label={`پین‌کردن ${item.title} به‌عنوان کالای در حال نمایش`}
                          className={cn(
                            "shrink-0 rounded-lg px-2.5 py-1.5 text-[10px] font-bold transition-all active:scale-95",
                            out
                              ? "cursor-not-allowed border border-white/10 text-white/30"
                              : "border border-ls-purple/50 text-ls-purple-soft hover:bg-ls-purple/10"
                          )}
                        >
                          پین
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mt-3">
              <p className="text-[11px] text-white/50">
                {faNum(WATCHING_VIEWERS.length)} نفر در حال تماشا — با اسم صدا کن تا
                تعامل بیشتر شود
              </p>

              {/* بیننده‌های حاضر — هماهنگ با BOTS موتور */}
              <div
                className="mt-2 space-y-2 max-h-72 overflow-y-auto scroll-thin"
                aria-label="بیننده‌های حاضر در لایو"
              >
                {WATCHING_VIEWERS.map((v) => (
                  <div
                    key={v.name}
                    className="bg-ls-card rounded-xl p-2.5 flex items-center gap-2.5"
                  >
                    <Avatar emoji={v.emoji} color={v.color} size="sm" />
                    <span dir="ltr" className="text-xs font-bold text-white/90">
                      {v.name}
                    </span>
                    {v.badge && (
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[9px] font-black",
                          VIEWER_BADGE_CLS[v.badge]
                        )}
                      >
                        {v.badge}
                      </span>
                    )}
                    <span className="ms-auto text-[10px] text-white/45 whitespace-nowrap">
                      {faNum(v.purchases)} خرید قبلی
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── ابزارهای رشد پخش — فاز ۳: Raid و کو-هاست ── */}
          <div className="mt-3 border-t border-white/5 pt-3">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRaidOpen(true)}
                aria-label="انتقال بیننده‌ها با Raid"
                className="rounded-xl border border-ls-purple/40 bg-ls-purple/10 px-3 py-2 text-xs font-bold text-ls-purple-soft hover:bg-ls-purple/20 active:scale-[.99] transition-all"
              >
                🚀 Raid
              </button>
              <button
                onClick={() => setCohostOpen(true)}
                aria-label="دعوت به پخش مشترک"
                className="rounded-xl border border-ls-green/40 bg-ls-green/10 px-3 py-2 text-xs font-bold text-ls-green hover:bg-ls-green/20 active:scale-[.99] transition-all"
              >
                🤝 کو-هاست
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-white/40">
              ابزارهای رشد پخش — فاز ۳
            </p>
          </div>
        </div>

        {/* شیت‌های Raid و کو-هاست (فاز ۳) — پورتال مستقل، بعد از محتوای اسکرولی */}
        <RaidSheet open={raidOpen} onOpenChange={setRaidOpen} />
        <CoHostSheet open={cohostOpen} onOpenChange={setCohostOpen} />
      </DrawerContent>
    </Drawer>
  );
}
