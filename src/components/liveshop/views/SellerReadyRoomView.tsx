"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Layers,
  MapPin,
  Mic,
  MicOff,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { faNum, toman } from "@/lib/format";
import { getShow } from "@/lib/data/shows";
import { getShowItems } from "@/lib/data/items";
import { READY_ROOM } from "@/lib/data/seller";
import type { Cover } from "@/lib/data/types";
import { PageHeader, GradientCover } from "@/components/liveshop/shared";

/* ─────────────────────────────────────────────────────────────
   اتاق آماده‌به‌پخش — فاز ۲ (اطلس تصویر ۲۵)
   پیش‌نمایش دوربین، وضعیت میکروفون، صف شو با جابه‌جایی آیتم‌ها،
   آمار یادآوری‌ها و دکمهٔ بزرگ شروع پخش زنده.
   ───────────────────────────────────────────────────────────── */

interface QueueRow {
  id: string;
  title: string;
  fmt: string;
  price: number;
  cover: Cover;
}

export default function SellerReadyRoomView() {
  const back = useAppStore((s) => s.back);
  const openShow = useAppStore((s) => s.openShow);

  const show = getShow("sh1");

  const [micOn, setMicOn] = useState(true);
  const [queue, setQueue] = useState<QueueRow[]>(() =>
    getShowItems("sh1")
      .slice(0, 4)
      .map((it) => ({
        id: it.id,
        title: it.title,
        fmt: `مزایده · شروع ${toman(it.startPrice, false)}`,
        price: it.startPrice,
        cover: it.cover,
      }))
  );

  /* جابه‌جایی آیتم در صف (بالا/پایین) */
  const move = (idx: number, dir: -1 | 1) => {
    setQueue((q) => {
      const next = [...q];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return q;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const goLive = () => {
    toast.success("پخش زنده شروع شد 🔴");
    openShow("sh1");
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="اتاق آماده‌به‌پخش"
        subtitle="آخرین بازرسی قبل از شروع"
        onBack={back}
      />

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* پیش‌نمایش دوربین */}
        <section aria-label="پیش‌نمایش دوربین" className="relative">
          <GradientCover
            cover={show.cover}
            className="h-64 rounded-3xl"
            emojiClassName="hidden"
          >
            {/* اورلی تیره */}
            <div className="absolute inset-0 bg-black/45" aria-hidden />

            {/* محتوای مرکزی */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none">
              <span
                className="text-6xl animate-ls-float drop-shadow-lg"
                aria-hidden
              >
                {show.cover.emoji}
              </span>
              <span className="text-xs text-white/70">
                پیش‌نمایش دوربین (دمو)
              </span>
            </div>

            {/* چیپ وضعیت اتصال */}
            <span className="absolute top-3 right-3 flex items-center gap-1.5 bg-ls-green/15 border border-ls-green/40 text-ls-green text-[11px] font-bold rounded-full px-2.5 py-1">
              <span
                className="w-1.5 h-1.5 rounded-full bg-ls-green animate-ls-pulse"
                aria-hidden
              />
              اتصال: {READY_ROOM.connectionLabel} · {faNum(READY_ROOM.latencyMs)}
              ms
            </span>

            {/* چیپ‌های پایین */}
            <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-1.5rem)]">
              <button
                onClick={() => setMicOn((v) => !v)}
                aria-pressed={micOn}
                aria-label="تغییر وضعیت میکروفون"
                className={`flex items-center gap-1 bg-black/50 backdrop-blur text-[11px] rounded-full px-2.5 py-1 border transition-colors active:scale-[.98] ${
                  micOn
                    ? "border-ls-green/40 text-ls-green"
                    : "border-ls-pink/40 text-ls-pink"
                }`}
              >
                {micOn ? (
                  <Mic className="w-3.5 h-3.5" aria-hidden />
                ) : (
                  <MicOff className="w-3.5 h-3.5" aria-hidden />
                )}
                میکروفون: {micOn ? "روشن" : "خاموش"}
              </button>
              <span className="flex items-center gap-1 bg-black/50 backdrop-blur text-[11px] rounded-full px-2.5 py-1 border border-white/10 text-white/70">
                <MapPin className="w-3.5 h-3.5" aria-hidden />
                موقعیت: خاموش
              </span>
              <button
                onClick={() => toast("انتخاب اورلی — در فاز ۳ (دمو)")}
                aria-label="انتخاب اورلی‌ها"
                className="flex items-center gap-1 bg-black/50 backdrop-blur text-[11px] rounded-full px-2.5 py-1 border border-white/10 text-white/70 hover:text-white transition-colors active:scale-[.98]"
              >
                <Layers className="w-3.5 h-3.5" aria-hidden />
                اورلی‌ها
              </button>
            </div>
          </GradientCover>
        </section>

        {/* صف شو */}
        <section
          aria-label="صف شو"
          className="bg-ls-card border border-white/5 rounded-2xl p-4"
        >
          <div className="flex items-center gap-2">
            <PlayCircle
              className="w-5 h-5 text-ls-purple-soft shrink-0"
              aria-hidden
            />
            <p className="font-bold text-sm min-w-0 flex-1 truncate">
              صف شو: {READY_ROOM.queueShowTitle}
            </p>
            <span className="shrink-0 rounded-full bg-ls-purple/15 text-ls-purple-soft text-[11px] font-bold px-2.5 py-1">
              {faNum(24)} آیتم
            </span>
          </div>

          <div
            className="mt-3 space-y-2.5 max-h-96 overflow-y-auto scroll-thin pl-1"
            aria-label="صف آیتم‌های شو"
          >
            {queue.map((row, idx) => (
              <div
                key={row.id}
                className="flex items-center gap-2.5 bg-ls-card-2/60 border border-white/5 rounded-xl p-2.5"
              >
                <GradientCover
                  cover={row.cover}
                  className="w-10 h-10 rounded-lg shrink-0"
                  emojiClassName="text-base"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold truncate min-w-0">
                      {row.title}
                    </p>
                    {idx === 0 && (
                      <span className="shrink-0 text-[9px] font-black rounded px-1.5 py-0.5 bg-amber-300/15 text-amber-300 border border-amber-300/30">
                        بعدی (UP NEXT)
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/45 truncate mt-0.5">
                    {row.fmt}
                  </p>
                </div>
                <div className="shrink-0 flex flex-col gap-1">
                  <button
                    onClick={() => move(idx, -1)}
                    disabled={idx === 0}
                    aria-label="جابه‌جایی به بالا"
                    className="w-7 h-7 rounded-full bg-ls-card-2 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" aria-hidden />
                  </button>
                  <button
                    onClick={() => move(idx, 1)}
                    disabled={idx === queue.length - 1}
                    aria-label="جابه‌جایی به پایین"
                    className="w-7 h-7 rounded-full bg-ls-card-2 flex items-center justify-center text-white/70 hover:text-white disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" aria-hidden />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* آمار یادآوری‌ها */}
        <section aria-label="آمار یادآوری‌ها" className="grid grid-cols-2 gap-3">
          <div className="bg-ls-card border border-white/5 rounded-2xl p-3 text-center">
            <p className="text-lg font-extrabold text-ls-purple-soft tabular-nums">
              {faNum(READY_ROOM.remindersSent)}
            </p>
            <p className="text-[11px] text-white/55 mt-0.5">
              🔔 یادآوری ارسال شد
            </p>
          </div>
          <div className="bg-ls-card border border-white/5 rounded-2xl p-3 text-center">
            <p className="text-lg font-extrabold text-ls-purple-soft tabular-nums">
              {faNum(READY_ROOM.followersNotified)}
            </p>
            <p className="text-[11px] text-white/55 mt-0.5">
              👁 فالوور مطلع شد
            </p>
          </div>
        </section>

        {/* شروع پخش زنده */}
        <div className="space-y-2">
          <button
            onClick={goLive}
            aria-label="شروع پخش زنده"
            className="w-full rounded-2xl bg-ls-pink text-white py-4 font-black text-base shadow-lg shadow-ls-pink/30 flex items-center justify-center gap-2 hover:bg-ls-pink/90 transition-colors active:scale-[.99]"
          >
            ● شروع پخش زنده
          </button>
          <p className="text-center text-[10px] text-white/40 leading-4">
            با شروع پخش، قوانین فروشندهٔ LiveShop را می‌پذیرید — پخش منصفانه،
            ارسال به‌موقع
          </p>
        </div>
      </div>
    </div>
  );
}
