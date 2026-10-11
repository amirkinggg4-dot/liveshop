"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronRight,
  ChevronLeft,
  Clock,
  ImagePlus,
  Info,
  ListOrdered,
  Pin,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAppStore } from "@/store/app-store";
import { useSellerStore } from "@/store/seller-store";
import { useSellerInventoryStore, isLowStock } from "@/store/seller-inventory-store";
import { faNum, toman } from "@/lib/format";
import { CATEGORIES } from "@/lib/data/categories";
import type { Cover } from "@/lib/data/types";
import type { SellerScheduledShow } from "@/lib/data/seller";
import {
  buildMonthGrid,
  buildTimeSlots,
  formatJalaliDateTime,
  jalaliMonthLabel,
  nextJalaliMonth,
  toJalali,
  todayJalali,
  validateSchedule,
  WEEKDAY_SHORT,
  type JalaliDate,
} from "@/lib/jalali";
import { useMounted } from "@/lib/forced-state";
import {
  PageHeader,
  GradientCover,
  SectionTitle,
  CategoryIcon,
} from "@/components/liveshop/shared";
import { AUCTION_ENABLED } from "@/lib/config";
import { ITEM_PHOTO } from "@/lib/data/media";
import { LOW_STOCK_THRESHOLD } from "@/lib/config";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   زمان‌بندی شو — v1.7.0 (بخش ۶ قرارداد API: CRUD /seller/shows)
   ─ تقویم شمسی (این ماه و ماه بعد) + ساعت با گام ۱۵ دقیقه
   ─ انتخاب چندتایی کالاها از انبار (با عکس اصلی و موجودی) + ترتیب
   ─ توضیح کوتاه شو
   ─ اعتبارسنجی: زمان در گذشته نباشد + حداقل یک کالا
   ─ ویرایش/لغو شوهای زمان‌بندی‌شده با دیالوگ تأیید؛ بعد از لغو،
     پیام به فالوورها (mock → صندوق ورودی از استور).
   ───────────────────────────────────────────────────────────── */

/* کاورهای پیش‌فرض — با هر کلیک یکی جلو می‌رود */
const COVER_PRESETS: Cover[] = [
  { from: "#FF3B8B", to: "#6C5CFF", emoji: "👟" },
  { from: "#6C5CFF", to: "#1b1729", emoji: "👟" },
  { from: "#00C896", to: "#0b5f4a", emoji: "🧦" },
];

/* چیپ تک‌انتخابی (دسته‌بندی) */
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

/* ── تقویم شمسی یک ماه ── */
function JalaliCalendar({
  jy,
  jm,
  today,
  selectedKey,
  onSelect,
}: {
  jy: number;
  jm: number;
  today: JalaliDate;
  selectedKey: string | null;
  onSelect: (cellKey: string, date: Date) => void;
}) {
  const cells = useMemo(() => buildMonthGrid(jy, jm, today), [jy, jm, today]);
  return (
    <div aria-label={`تقویم ${jalaliMonthLabel(jy, jm)}`}>
      <p className="mb-2 text-center text-xs font-black text-white/80">
        {jalaliMonthLabel(jy, jm)}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center" role="row" aria-label="روزهای هفته">
        {WEEKDAY_SHORT.map((w) => (
          <span key={w} className="py-1 text-[10px] font-bold text-white/35">
            {w}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" role="grid">
        {cells.map((cell) => {
          const selected = cell.key === selectedKey;
          return (
            <button
              key={cell.key}
              type="button"
              disabled={cell.disabled}
              onClick={() => onSelect(cell.key, cell.date)}
              aria-pressed={selected}
              aria-label={`${faNum(cell.jd)} ${cell.inMonth ? "قابل انتخاب" : "خارج از ماه"}`}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-xs font-bold tabular-nums transition-colors",
                !cell.inMonth && "opacity-25",
                cell.disabled && "cursor-not-allowed text-white/25",
                !cell.disabled && !selected && "bg-ls-card-2 text-white/70 hover:bg-ls-purple/20",
                selected && "bg-ls-purple text-white shadow-lg shadow-ls-purple/40"
              )}
            >
              {faNum(cell.jd)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SellerScheduleView() {
  const back = useAppStore((s) => s.back);
  const push = useAppStore((s) => s.push);
  const scheduledShows = useSellerStore((s) => s.scheduledShows);
  const addScheduledShow = useSellerStore((s) => s.addScheduledShow);
  const updateScheduledShow = useSellerStore((s) => s.updateScheduledShow);
  const cancelScheduledShow = useSellerStore((s) => s.cancelScheduledShow);
  const inventoryItems = useSellerInventoryStore((s) => s.items);

  const mounted = useMounted();

  /* ── حالت ویرایش ── */
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editConfirmFor, setEditConfirmFor] = useState<string | null>(null);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [cancelConfirmFor, setCancelConfirmFor] = useState<string | null>(null);

  /* ── فرم ── */
  const [coverIdx, setCoverIdx] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("کتونی و کفش");

  /* تقویم — این ماه و ماه بعد */
  const [today, setToday] = useState<JalaliDate | null>(null);
  const [monthOffset, setMonthOffset] = useState<0 | 1>(0);
  const [selectedDay, setSelectedDay] = useState<{ key: string; date: Date } | null>(null);
  const [slotDate, setSlotDate] = useState<Date | null>(null);

  /* بعد از mount تقویم ساخته می‌شود (بدون mismatch سرور/کلاینت) */
  useEffect(() => {
    setToday(todayJalali());
  }, []);

  const month = useMemo(() => {
    if (!today) return null;
    return monthOffset === 0
      ? { jy: today.jy, jm: today.jm }
      : nextJalaliMonth(today.jy, today.jm);
  }, [today, monthOffset]);

  /* ساعت‌های گام ۱۵ دقیقه برای روز انتخابی */
  const slots = useMemo(
    () => (selectedDay ? buildTimeSlots(selectedDay.date) : []),
    [selectedDay]
  );

  /* ── کالاهای شو ── */
  const [itemOrder, setItemOrder] = useState<string[]>([]);
  const selectableItems = useMemo(
    () => inventoryItems.filter((i) => i.status !== "sold"),
    [inventoryItems]
  );

  const toggleItem = (id: string) => {
    setSlotCheckTouched(true);
    setItemOrder((order) =>
      order.includes(id) ? order.filter((x) => x !== id) : [...order, id]
    );
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    setItemOrder((order) => {
      const next = [...order];
      const target = idx + dir;
      if (target < 0 || target >= next.length) return order;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  /* ── گزینه‌های شو ── */
  const [prebid, setPrebid] = useState(true);
  const [giveaway, setGiveaway] = useState(false);
  const [cohost, setCohost] = useState(false);
  const [pinComment, setPinComment] = useState(false);

  /* ── اعتبارسنجی زنده ── */
  const [touchedSubmit, setTouchedSubmit] = useState(false);
  const [, setSlotCheckTouched] = useState(false);
  const draft = useMemo(
    () => ({ scheduledAt: slotDate, itemIds: itemOrder }),
    [slotDate, itemOrder]
  );
  const validation = useMemo(() => validateSchedule(draft), [draft]);
  const pastSlot = (d: Date) => d.getTime() <= Date.now();

  const selectedCover = coverIdx == null ? null : COVER_PRESETS[coverIdx];
  const cycleCover = () =>
    setCoverIdx((prev) => (prev == null ? 0 : (prev + 1) % COVER_PRESETS.length));

  /* ── ویرایش: بارگذاری شو در فرم ── */
  const startEdit = (show: SellerScheduledShow) => {
    setEditingId(show.id);
    setTitle(show.title);
    setDescription(show.description ?? "");
    setCategory(show.category);
    setItemOrder(show.itemIds && show.itemIds.length > 0 ? [...show.itemIds] : []);
    setPrebid(show.prebid);
    setGiveaway(show.giveaway);
    setCohost(show.cohost);
    setPinComment(show.pinComment);
    if (show.scheduledAt) {
      const d = new Date(show.scheduledAt);
      if (!Number.isNaN(d.getTime())) {
        const j = toJalali(d);
        const dayDate = new Date(d);
        dayDate.setHours(12, 0, 0, 0);
        setSelectedDay({ key: `${j.jy}-${j.jm}-${j.jd}`, date: dayDate });
        /* ماه تقویم به ماه خود شو می‌رود */
        const cur = todayJalali();
        setMonthOffset(
          j.jy === cur.jy && j.jm === cur.jm ? 0 : 1
        );
        setSlotDate(d);
      }
    } else {
      setSelectedDay(null);
      setSlotDate(null);
    }
    setCoverIdx(null);
    setTouchedSubmit(false);
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setCategory("کتونی و کفش");
    setItemOrder([]);
    setSelectedDay(null);
    setSlotDate(null);
    setPrebid(true);
    setGiveaway(false);
    setCohost(false);
    setPinComment(false);
    setTouchedSubmit(false);
  };

  /* ── ثبت (ساخت یا ذخیرهٔ ویرایش) ── */
  const submit = () => {
    setTouchedSubmit(true);
    if (!title.trim()) {
      toast.error("عنوان شو را وارد کن");
      return;
    }
    if (!validation.ok) {
      toast.error(validation.errors[0]);
      return;
    }
    if (editingId) {
      /* ویرایش — با دیالوگ تأیید */
      setSaveConfirmOpen(true);
      return;
    }
    const when = slotDate as Date;
    const show: SellerScheduledShow = {
      id: `sch-${Date.now()}`,
      title: title.trim(),
      category,
      whenLabel: formatJalaliDateTime(when),
      itemsCount: itemOrder.length,
      prebid,
      giveaway,
      cohost,
      pinComment,
      cover: selectedCover ?? COVER_PRESETS[0],
      scheduledAt: when.toISOString(),
      itemIds: [...itemOrder],
      description: description.trim(),
      status: "scheduled",
    };
    addScheduledShow(show);
    toast.success("شو زمان‌بندی شد — فالوورها خبر می‌شوند");
    resetForm();
  };

  const confirmSaveEdit = () => {
    if (!editingId) return;
    const when = slotDate as Date;
    updateScheduledShow(editingId, {
      title: title.trim(),
      category,
      whenLabel: formatJalaliDateTime(when),
      itemsCount: itemOrder.length,
      prebid,
      giveaway,
      cohost,
      pinComment,
      cover: selectedCover ?? COVER_PRESETS[0],
      scheduledAt: when.toISOString(),
      itemIds: [...itemOrder],
      description: description.trim(),
      status: "scheduled",
    });
    toast.success("تغییرات شو ذخیره شد");
    setSaveConfirmOpen(false);
    resetForm();
  };

  const confirmCancelShow = () => {
    if (!cancelConfirmFor) return;
    const ok = cancelScheduledShow(cancelConfirmFor);
    setCancelConfirmFor(null);
    if (ok) {
      toast.success("شو لغو شد — پیام به فالوورها رفت");
    }
  };

  const editingShow = editingId
    ? scheduledShows.find((s) => s.id === editingId)
    : null;

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        title="زمان‌بندی شو"
        subtitle="قرار قبلی با فالوورها"
        onBack={back}
      />

      <div className="px-4 pt-4 pb-8 space-y-4">
        {/* بنر حالت ویرایش */}
        {editingShow && (
          <div
            className="flex items-center gap-2.5 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-3"
            aria-label="حالت ویرایش شو"
          >
            <Info className="h-4 w-4 shrink-0 text-amber-300" aria-hidden />
            <p className="min-w-0 flex-1 text-xs font-bold text-amber-300">
              ویرایش شو «{editingShow.title}» — پس از ذخیره، تأیید می‌گیریم
            </p>
            <button
              type="button"
              onClick={resetForm}
              aria-label="لغو حالت ویرایش"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ls-card-2 text-white/70 hover:text-white"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        )}

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

        {/* توضیح کوتاه شو — v1.7.0 */}
        <div className="space-y-1.5">
          <label
            htmlFor="show-desc"
            className="block text-xs font-bold text-white/70"
          >
            توضیح کوتاه شو
          </label>
          <Textarea
            id="show-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="یک خط برای فالوورها — مثلاً شروع فصل جدید با تخفیف‌های لحظه‌ای"
            aria-label="توضیح کوتاه شو"
            className="bg-ls-card border-white/10 rounded-xl text-sm leading-5 placeholder:text-white/35 resize-none"
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
                <CategoryIcon id={c.id} className="h-3.5 w-3.5" />
                {c.label}
              </PickChip>
            ))}
          </div>
        </div>

        {/* ═══ v1.7.0 — تقویم شمسی + ساعت گام ۱۵ دقیقه ═══ */}
        <section
          aria-label="انتخاب تاریخ و ساعت پخش"
          className="bg-ls-card border border-white/5 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4.5 w-4.5 text-ls-purple-soft" aria-hidden />
            <p className="text-sm font-extrabold">تاریخ و ساعت</p>
            <span className="ms-auto text-[10px] text-white/40">
              همین ماه و ماه بعد
            </span>
          </div>

          {!mounted || !month ? (
            <div className="h-64 animate-pulse rounded-xl bg-ls-card-2" aria-label="در حال بارگذاری تقویم" />
          ) : (
            <>
              {/* ناوبری ماه */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setMonthOffset(1)}
                  disabled={monthOffset === 1}
                  aria-label="ماه بعد"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-ls-card-2 text-white/70 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </button>
                <p className="text-[11px] text-white/50">
                  {monthOffset === 0 ? "این ماه" : "ماه بعد"}
                </p>
                <button
                  type="button"
                  onClick={() => setMonthOffset(0)}
                  disabled={monthOffset === 0}
                  aria-label="ماه قبل"
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-ls-card-2 text-white/70 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </button>
              </div>

              <JalaliCalendar
                jy={month.jy}
                jm={month.jm}
                today={today ?? todayJalali()}
                selectedKey={selectedDay?.key ?? null}
                onSelect={(key, date) => {
                  setSelectedDay({ key, date });
                  /* ساعت انتخاب‌شده اگر بود به روز جدید منتقل می‌شود (بدون mutation) */
                  setSlotDate((prev) => {
                    if (!prev) return null;
                    const nd = new Date(date);
                    nd.setHours(prev.getHours(), prev.getMinutes(), 0, 0);
                    return nd;
                  });
                }}
              />

              {/* ساعت‌ها — گام ۱۵ دقیقه */}
              <div className="space-y-1.5 pt-1">
                <p className="flex items-center gap-1.5 text-xs font-bold text-white/70">
                  <Clock className="h-3.5 w-3.5 text-ls-pink" aria-hidden />
                  ساعت شروع <span className="text-white/35">(گام ۱۵ دقیقه)</span>
                </p>
                {!selectedDay ? (
                  <p className="py-2 text-[11px] text-white/40">
                    اول روز پخش را از تقویم انتخاب کن
                  </p>
                ) : (
                  <div
                    className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1"
                    aria-label="ساعت‌های شروع با گام پانزده دقیقه"
                  >
                    {slots.map((slot) => {
                      const disabled = pastSlot(slot.date);
                      const active =
                        slotDate != null &&
                        slotDate.getHours() === slot.hour &&
                        slotDate.getMinutes() === slot.minute &&
                        slotDate.toDateString() === slot.date.toDateString();
                      return (
                        <button
                          key={`${slot.hour}-${slot.minute}`}
                          type="button"
                          disabled={disabled}
                          onClick={() => setSlotDate(slot.date)}
                          aria-pressed={active}
                          aria-label={`ساعت ${slot.label}`}
                          className={cn(
                            "shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-bold tabular-nums transition-colors",
                            disabled
                              ? "cursor-not-allowed bg-ls-card-2 text-white/25"
                              : active
                                ? "bg-ls-purple text-white"
                                : "bg-ls-card-2 text-white/70 hover:bg-ls-purple/20"
                          )}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* خلاصهٔ زمان انتخابی */}
              {slotDate && (
                <p
                  className="rounded-xl bg-ls-purple/10 border border-ls-purple/30 px-3 py-2 text-center text-xs font-bold text-ls-purple-soft tabular-nums"
                  aria-live="polite"
                >
                  شروع: {formatJalaliDateTime(slotDate)}
                </p>
              )}
              {touchedSubmit && !validation.ok && (
                <ul className="space-y-1" role="alert" aria-label="خطاهای اعتبارسنجی زمان‌بندی">
                  {validation.errors.map((err) => (
                    <li key={err} className="text-[11px] font-bold text-ls-pink">
                      • {err}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>

        {/* ═══ v1.7.0 — انتخاب کالاهای شو از انبار (چندتایی + عکس + موجودی) ═══ */}
        <section
          aria-label="انتخاب کالاهای شو"
          className="bg-ls-card border border-white/5 rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <ListOrdered className="h-4.5 w-4.5 text-ls-green" aria-hidden />
            <p className="text-sm font-extrabold">کالاهای شو</p>
            <span
              className="ms-auto rounded-full bg-ls-green/15 text-ls-green text-[11px] font-black px-2.5 py-1 tabular-nums"
              aria-label={`تعداد کالاهای انتخاب‌شده: ${faNum(itemOrder.length)}`}
            >
              {faNum(itemOrder.length)} انتخاب
            </span>
          </div>

          <div
            className="max-h-72 space-y-2 overflow-y-auto scroll-thin pl-1"
            aria-label="فهرست کالاهای انبار برای انتخاب"
          >
            {selectableItems.map((item) => {
              const picked = itemOrder.includes(item.id);
              const low = isLowStock(item);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  aria-pressed={picked}
                  aria-label={`${picked ? "حذف" : "افزودن"} ${item.title} به شو`}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-right transition-colors active:scale-[.99]",
                    picked
                      ? "border-ls-green/50 bg-ls-green/5"
                      : "border-white/5 bg-ls-card-2 hover:border-ls-purple/40"
                  )}
                >
                  <GradientCover
                    cover={item.cover}
                    className="h-10 w-10 shrink-0 rounded-lg"
                    emojiClassName="text-base"
                    photo={ITEM_PHOTO[item.id]}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold">
                      {item.title}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[10px] tabular-nums",
                        low ? "font-bold text-amber-300" : "text-white/45"
                      )}
                    >
                      {toman(item.price, false)} ·{" "}
                      {item.stock <= 0
                        ? "تمام شد"
                        : `موجودی ${faNum(item.stock)}${low ? " — کم" : ""}`}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                      picked
                        ? "border-ls-green bg-ls-green text-[#04281e]"
                        : "border-white/20 text-transparent"
                    )}
                    aria-hidden
                  >
                    <Check className="h-3.5 w-3.5" />
                  </span>
                </button>
              );
            })}
          </div>

          {/* ترتیب کالاهای انتخاب‌شده — اولی پین می‌شود */}
          {itemOrder.length > 0 && (
            <div className="space-y-2 border-t border-white/5 pt-3">
              <p className="text-xs font-bold text-white/70">
                ترتیب نمایش در شو — کالای اول «در حال نمایش» می‌شود
              </p>
              <ol className="space-y-1.5" aria-label="ترتیب کالاهای شو">
                {itemOrder.map((id, idx) => {
                  const item = selectableItems.find((i) => i.id === id);
                  if (!item) return null;
                  return (
                    <li
                      key={id}
                      className={cn(
                        "flex items-center gap-2.5 rounded-xl border p-2",
                        idx === 0
                          ? "border-ls-green/50 bg-ls-green/5"
                          : "border-white/5 bg-ls-card-2"
                      )}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-ls-card text-[10px] font-black text-white/70 tabular-nums">
                        {faNum(idx + 1)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-bold">
                        {item.title}
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
            </div>
          )}

          {itemOrder.length === 0 && (
            <p className="text-[11px] text-white/40">
              حداقل یک کالا برای شو انتخاب کن.
            </p>
          )}
        </section>

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

        {/* ثبت */}
        <button
          onClick={submit}
          aria-label={editingId ? "ذخیرهٔ تغییرات شو" : "ثبت زمان‌بندی شو"}
          className={cn(
            "w-full text-white rounded-xl py-3.5 text-sm font-extrabold shadow-lg transition-colors active:scale-[.99]",
            editingId
              ? "bg-amber-300 text-[#3a2c00] shadow-amber-300/30 hover:bg-amber-300/90"
              : "bg-ls-purple shadow-ls-purple/30 hover:bg-ls-purple-deep"
          )}
        >
          {editingId ? "ذخیرهٔ تغییرات شو" : "زمان‌بندی شو"}
        </button>

        {/* شوهای زمان‌بندی‌شده */}
        <div>
          <SectionTitle title="شوهای زمان‌بندی‌شده" />
          <div
            className="space-y-2.5 max-h-96 overflow-y-auto scroll-thin pl-1"
            aria-label="لیست شوهای زمان‌بندی‌شده"
          >
            {scheduledShows.map((s) => {
              const cancelled = s.status === "cancelled";
              return (
                <div
                  key={s.id}
                  className={cn(
                    "bg-ls-card border rounded-2xl p-3 flex items-center gap-3",
                    cancelled ? "border-white/5 opacity-55" : "border-white/5"
                  )}
                >
                  <GradientCover
                    cover={s.cover}
                    className="w-12 h-12 rounded-xl shrink-0"
                    emojiClassName="text-xl"
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-bold text-sm truncate">
                      {s.title}
                      {cancelled && (
                        <span className="ms-1.5 rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-black text-white/50">
                          لغو شد
                        </span>
                      )}
                    </p>
                    <p className="flex items-center gap-1 text-[11px] text-white/60">
                      <Clock
                        className="w-3.5 h-3.5 text-ls-pink shrink-0"
                        aria-hidden
                      />
                      {s.whenLabel}
                    </p>
                    <p className="text-[11px] text-white/45 tabular-nums">
                      {faNum(s.itemIds?.length ?? s.itemsCount)} آیتم
                      {s.description ? ` · ${s.description}` : ""}
                    </p>
                    {AUCTION_ENABLED && s.prebid && !cancelled && (
                      <span className="inline-flex rounded-full bg-ls-purple/10 px-2 py-0.5 text-[10px] font-bold text-ls-purple-soft">
                        پیش‌بید فعال
                      </span>
                    )}
                  </div>
                  {!cancelled && (
                    <div className="shrink-0 flex flex-col gap-1.5">
                      <button
                        onClick={() => setEditConfirmFor(s.id)}
                        aria-label={`ویرایش شو ${s.title} — با تأیید`}
                        className="rounded-lg border border-ls-pink/40 text-ls-pink px-2.5 py-1 text-[11px] font-bold hover:bg-ls-pink/10 transition-colors active:scale-[.98]"
                      >
                        ویرایش
                      </button>
                      <button
                        onClick={() => setCancelConfirmFor(s.id)}
                        aria-label={`لغو شو ${s.title} — با تأیید`}
                        className="rounded-lg border border-white/20 text-white/70 px-2.5 py-1 text-[11px] font-bold hover:bg-white/5 transition-colors active:scale-[.98]"
                      >
                        لغو شو
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ دیالوگ تأیید ورود به ویرایش ═══ */}
      <AlertDialog
        open={editConfirmFor != null}
        onOpenChange={(v) => !v && setEditConfirmFor(null)}
      >
        <AlertDialogContent className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>ویرایش شو؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-5">
              زمان، کالاها و توضیحات شو قابل تغییر است. تغییرات فقط بعد از
              «ذخیرهٔ تغییرات» و تأیید نهایی اعمال می‌شود.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <AlertDialogAction
              onClick={() => {
                const show = scheduledShows.find((x) => x.id === editConfirmFor);
                setEditConfirmFor(null);
                if (show) startEdit(show);
              }}
              className="bg-ls-purple text-white hover:bg-ls-purple-deep"
              aria-label="ورود به حالت ویرایش شو"
            >
              ویرایش شو
            </AlertDialogAction>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white/70">
              انصراف
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ دیالوگ تأیید ذخیرهٔ ویرایش ═══ */}
      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>ذخیرهٔ تغییرات شو؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-5">
              {slotDate
                ? `زمان جدید: ${formatJalaliDateTime(slotDate)}`
                : ""}
              {" "}فالوورها با زمان به‌روزرسانی‌شده خبر می‌شوند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <AlertDialogAction
              onClick={confirmSaveEdit}
              className="bg-amber-300 text-[#3a2c00] hover:bg-amber-300/90"
              aria-label="تأیید و ذخیرهٔ تغییرات شو"
            >
              ذخیرهٔ تغییرات
            </AlertDialogAction>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white/70">
              انصراف
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══ دیالوگ تأیید لغو شو ═══ */}
      <AlertDialog
        open={cancelConfirmFor != null}
        onOpenChange={(v) => !v && setCancelConfirmFor(null)}
      >
        <AlertDialogContent className="rounded-2xl border-white/10 bg-ls-card sm:max-w-sm">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle>لغو شو زمان‌بندی‌شده؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-5">
              این شو برای همه لغو می‌شود و پیامی به فالوورها می‌رود. این کار
              برگشت‌پذیر نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2 sm:justify-start">
            <AlertDialogAction
              onClick={confirmCancelShow}
              className="bg-[#FF3B5C] text-white hover:bg-[#FF3B5C]/90"
              aria-label="تأیید لغو شو"
            >
              بله، شو لغو شود
            </AlertDialogAction>
            <AlertDialogCancel className="border-white/15 bg-transparent text-white/70">
              انصراف
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
