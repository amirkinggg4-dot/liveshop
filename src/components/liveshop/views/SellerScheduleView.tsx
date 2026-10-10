"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Clock, ImagePlus, Info, Pin } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/app-store";
import { useSellerStore } from "@/store/seller-store";
import { faNum, toman } from "@/lib/format";
import { CATEGORIES } from "@/lib/data/categories";
import { ITEMS_SH1, stockLabelFa } from "@/lib/data/items";
import type { Cover } from "@/lib/data/types";
import type { SellerScheduledShow } from "@/lib/data/seller";
import {
  PageHeader,
  GradientCover,
  SectionTitle,
  CategoryIcon,
} from "@/components/liveshop/shared";
import { AUCTION_ENABLED } from "@/lib/config";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   زمان‌بندی شو — فاز ۲ (اطلس تصویر ۲۴)
   فرم ساخت شو: کاور، عنوان، دسته‌بندی، روز/ساعت، گزینه‌ها
   + لیست شوهای زمان‌بندی‌شده از استور فروشنده.
   ───────────────────────────────────────────────────────────── */

/* کاورهای پیش‌فرض — با هر کلیک یکی جلو می‌رود */
const COVER_PRESETS: Cover[] = [
  { from: "#FF3B8B", to: "#6C5CFF", emoji: "👟" },
  { from: "#6C5CFF", to: "#1b1729", emoji: "👟" },
  { from: "#00C896", to: "#0b5f4a", emoji: "🧦" },
];

const DAY_OPTIONS = ["امشب", "فردا", "پنج‌شنبه", "جمعه"] as const;
const HOUR_OPTIONS = ["۱۸:۰۰", "۲۰:۰۰", "۲۱:۰۰", "۲۲:۰۰", "۲۳:۰۰"] as const;

/* چیپ تک‌انتخابی (روز / ساعت / دسته‌بندی) */
function PickChip({
  children,
  active,
  onClick,
  ariaLabel,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
  ariaLabel: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors active:scale-[.98] ${
        active ? "bg-ls-purple text-white" : "bg-ls-card-2 text-white/60 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function SellerScheduleView() {
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const scheduledShows = useSellerStore((s) => s.scheduledShows);
  const addScheduledShow = useSellerStore((s) => s.addScheduledShow);

  const [coverIdx, setCoverIdx] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("کتونی و کفش");
  const [day, setDay] = useState<string>("پنج‌شنبه");
  const [hour, setHour] = useState<string>("۲۱:۰۰");
  const [prebid, setPrebid] = useState(true);
  const [giveaway, setGiveaway] = useState(false);
  const [cohost, setCohost] = useState(false);
  const [pinComment, setPinComment] = useState(false);

  /* ── v1.4 — ترتیب کالاها در شو: کالای اول به‌صورت خودکار پین‌شده است ── */
  const [itemOrder, setItemOrder] = useState<string[]>(() =>
    ITEMS_SH1.filter((i) => i.status !== "sold").map((i) => i.id)
  );

  const moveItem = (idx: number, dir: -1 | 1) => {
    setItemOrder((order) => {
      const next = [...order];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return order;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const selectedCover = coverIdx == null ? null : COVER_PRESETS[coverIdx];

  const cycleCover = () =>
    setCoverIdx((prev) =>
      prev == null ? 0 : (prev + 1) % COVER_PRESETS.length
    );

  const submit = () => {
    if (!title.trim()) {
      toast.error("عنوان شو را وارد کن");
      return;
    }
    const show: SellerScheduledShow = {
      id: `sch-${Date.now()}`,
      title: title.trim(),
      category,
      whenLabel: `${day} ${hour}`,
      itemsCount: 24,
      prebid,
      giveaway,
      cohost,
      pinComment,
      cover: selectedCover ?? COVER_PRESETS[0],
    };
    addScheduledShow(show);
    toast.success("شو زمان‌بندی شد — فالوورها خبر می‌شوند ✅");
    back();
  };

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="زمان‌بندی شو"
        subtitle="قرار قبلی با فالوورها"
        onBack={back}
      />

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* کاور شو */}
        <button
          onClick={cycleCover}
          aria-label="انتخاب کاور شو"
          className="relative w-full h-36 rounded-2xl border-2 border-dashed border-ls-purple/40 bg-ls-card/60 flex flex-col items-center justify-center gap-1.5 overflow-hidden hover:border-ls-purple/70 transition-colors active:scale-[.99]"
        >
          {selectedCover ? (
            <GradientCover
              cover={selectedCover}
              className="absolute inset-0"
              emojiClassName="text-5xl"
            />
          ) : (
            <>
              <ImagePlus className="w-7 h-7 text-ls-purple-soft" aria-hidden />
              <span className="text-sm font-bold">انتخاب کاور شو</span>
              <span className="text-[10px] text-white/40">
                سایز توصیه‌شده: ۱۰۸۰×۱۹۲۰
              </span>
            </>
          )}
        </button>

        {/* عنوان */}
        <div className="space-y-1.5">
          <label
            htmlFor="show-title"
            className="block text-xs font-bold text-white/70"
          >
            عنوان
          </label>
          <Input
            id="show-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="عنوان شو — مثلاً شب کتونی ۳"
            aria-label="عنوان شو"
            className="bg-ls-card border-white/10 rounded-xl h-11 text-sm placeholder:text-white/35"
          />
        </div>

        {/* دسته‌بندی */}
        <div className="space-y-1.5">
          <p className="text-xs font-bold text-white/70">دسته‌بندی</p>
          <div
            className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
            aria-label="انتخاب دسته‌بندی شو"
          >
            {CATEGORIES.map((c) => (
              <PickChip
                key={c.id}
                active={category === c.label}
                onClick={() => setCategory(c.label)}
                ariaLabel={`دستهٔ ${c.label}`}
              >
                {/* v1.4.1 — آیکون خطی یکدست به‌جای ایموجی */}
                <CategoryIcon id={c.id} className="h-3.5 w-3.5" />
                {c.label}
              </PickChip>
            ))}
          </div>
        </div>

        {/* روز و ساعت */}
        <div className="space-y-2.5">
          <div
            className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
            aria-label="انتخاب روز پخش"
          >
            {DAY_OPTIONS.map((d) => (
              <PickChip
                key={d}
                active={day === d}
                onClick={() => setDay(d)}
                ariaLabel={`روز ${d}`}
              >
                {d}
              </PickChip>
            ))}
          </div>
          <div
            className="flex gap-2 overflow-x-auto no-scrollbar pb-1"
            aria-label="انتخاب ساعت پخش"
          >
            {HOUR_OPTIONS.map((h) => (
              <PickChip
                key={h}
                active={hour === h}
                onClick={() => setHour(h)}
                ariaLabel={`ساعت ${h}`}
              >
                {h}
              </PickChip>
            ))}
          </div>
        </div>

        {/* گزینه‌های شو */}
        <section
          aria-label="تنظیمات شو"
          className="bg-ls-card border border-white/5 rounded-2xl p-4 space-y-3.5"
        >
          {AUCTION_ENABLED && (
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">پیش‌بید</p>
                <p className="text-[11px] text-white/45 mt-0.5 leading-4">
                  فالوورها قبل از شروع روی آیتم‌ها بید ثبت می‌کنند
                </p>
              </div>
              <Switch
                checked={prebid}
                onCheckedChange={setPrebid}
                aria-label="فعال‌بودن پیش‌بید"
              />
            </div>
          )}
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">گیواوی در شروع</p>
              <p className="text-[11px] text-white/45 mt-0.5 leading-4">
                قرعه‌کشی زنده در دقیقهٔ اول پخش
              </p>
            </div>
            <Switch
              checked={giveaway}
              onCheckedChange={setGiveaway}
              aria-label="فعال‌بودن گیواوی در شروع"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">هم‌میزبانی</p>
              <p className="text-[11px] text-white/45 mt-0.5 leading-4">
                اجازهٔ دعوت از فروشندهٔ دیگر به صحنه
              </p>
            </div>
            <Switch
              checked={cohost}
              onCheckedChange={setCohost}
              aria-label="فعال‌بودن هم‌میزبانی"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">پین کامنت</p>
              <p className="text-[11px] text-white/45 mt-0.5 leading-4">
                ثابت‌ماندن پیام بالای چت
              </p>
            </div>
            <Switch
              checked={pinComment}
              onCheckedChange={setPinComment}
              aria-label="فعال‌بودن پین کامنت"
            />
          </div>
        </section>

        {/* راهنما */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-ls-purple/30 bg-ls-purple/10 p-3.5 text-xs leading-5 text-white/80">
          <Info
            className="w-4 h-4 text-ls-purple-soft shrink-0 mt-0.5"
            aria-hidden
          />
          <p>
            فالوورها ۳۰ دقیقه قبل یادآوری می‌گیرند؛ شوهای زمان‌بندی‌شده روی
            پروفایل شما نمایش داده می‌شوند
            {AUCTION_ENABLED ? " و پیش‌بید می‌پذیرند." : " و همهٔ کالاها با قیمت ثابت فروخته می‌شوند."}
          </p>
        </div>

        {/* ═══ v1.4 — ترتیب کالاها در شو: کالای اول پین‌شده می‌شود ═══ */}
        <section
          aria-label="ترتیب کالاها در شو"
          className="bg-ls-card border border-white/5 rounded-2xl p-4 space-y-3"
        >
          <div>
            <p className="text-sm font-extrabold">ترتیب کالاها در شو</p>
            <p className="text-[11px] text-white/45 mt-0.5 leading-4">
              کالای اول لیست، لحظهٔ شروع لایو به‌صورت خودکار «در حال نمایش» پین
              می‌شود. با فلش‌ها جابه‌جا کن.
            </p>
          </div>
          <ol className="space-y-2" aria-label="ترتیب کالاهای شو">
            {itemOrder.map((id, idx) => {
              const item = ITEMS_SH1.find((i) => i.id === id);
              if (!item) return null;
              return (
                <li
                  key={id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl border p-2.5",
                    idx === 0
                      ? "border-ls-green/50 bg-ls-green/5"
                      : "border-white/5 bg-ls-card-2"
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ls-card text-[10px] font-black text-white/70 tabular-nums">
                    {faNum(idx + 1)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold">
                      {item.emoji} {item.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-white/45 tabular-nums">
                      {toman(item.price, false)} · {stockLabelFa(item.stock)}
                    </span>
                  </span>
                  {idx === 0 ? (
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-lg bg-ls-green px-2 py-1 text-[10px] font-black text-[#04281e]">
                      <Pin className="h-3 w-3" aria-hidden />
                      پین‌شده
                    </span>
                  ) : (
                    <span className="flex shrink-0 flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveItem(idx, -1)}
                        aria-label={`انتقال ${item.title} به بالا`}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 text-white/70 hover:bg-white/5 transition-colors"
                      >
                        <ArrowUp className="h-3 w-3" aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveItem(idx, 1)}
                        aria-label={`انتقال ${item.title} به پایین`}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-white/15 text-white/70 hover:bg-white/5 transition-colors"
                      >
                        <ArrowDown className="h-3 w-3" aria-hidden />
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        {/* ثبت */}
        <button
          onClick={submit}
          aria-label="ثبت زمان‌بندی شو"
          className="w-full bg-ls-purple text-white rounded-xl py-3.5 text-sm font-extrabold shadow-lg shadow-ls-purple/30 hover:bg-ls-purple-deep transition-colors active:scale-[.99]"
        >
          زمان‌بندی شو
        </button>

        {/* شوهای زمان‌بندی‌شده */}
        <div>
          <SectionTitle title="شوهای زمان‌بندی‌شده" />
          <div
            className="space-y-2.5 max-h-96 overflow-y-auto scroll-thin pl-1"
            aria-label="لیست شوهای زمان‌بندی‌شده"
          >
            {scheduledShows.map((s) => (
              <div
                key={s.id}
                className="bg-ls-card border border-white/5 rounded-2xl p-3 flex items-center gap-3"
              >
                <GradientCover
                  cover={s.cover}
                  className="w-12 h-12 rounded-xl shrink-0"
                  emojiClassName="text-xl"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="font-bold text-sm truncate">{s.title}</p>
                  <p className="flex items-center gap-1 text-[11px] text-white/60">
                    <Clock
                      className="w-3.5 h-3.5 text-ls-pink shrink-0"
                      aria-hidden
                    />
                    {s.whenLabel}
                  </p>
                  <p className="text-[11px] text-white/45">
                    {faNum(s.itemsCount)} آیتم
                  </p>
                  {AUCTION_ENABLED && s.prebid && (
                    <span className="inline-flex rounded-full bg-ls-purple/10 px-2 py-0.5 text-[10px] font-bold text-ls-purple-soft">
                      پیش‌بید فعال
                    </span>
                  )}
                </div>
                <div className="shrink-0 flex flex-col gap-1.5">
                  <button
                    onClick={() =>
                      toast("ویرایش شو — تا قبل از شروع آزاد است (دمو)")
                    }
                    aria-label={`ویرایش شو ${s.title}`}
                    className="rounded-lg border border-ls-pink/40 text-ls-pink px-2.5 py-1 text-[11px] font-bold hover:bg-ls-pink/10 transition-colors active:scale-[.98]"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => push("sellerReadyRoom")}
                    aria-label={`اتاق آماده‌باش برای شو ${s.title}`}
                    className="rounded-lg border border-ls-purple/40 text-ls-purple-soft px-2.5 py-1 text-[11px] font-bold hover:bg-ls-purple/10 transition-colors active:scale-[.98]"
                  >
                    اتاق آماده‌باش
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
