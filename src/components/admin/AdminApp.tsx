"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Eye,
  EyeOff,
  FileText,
  Gavel,
  ImageOff,
  Radio,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toFa } from "@/lib/format";
import { LIVE_SHOWS } from "@/lib/data/shows";
import { CATEGORIES } from "@/lib/data/categories";
import {
  validateRejectReason,
  validateSuspendReason,
} from "@/lib/seller-status";
import {
  ADMIN_ACTION_LABEL,
  ADMIN_ACTOR,
  DEMO_SELLER_REQUEST_ID,
  maskedNidOf,
  maskedShebaOf,
  useAdminRole,
  useAdminStore,
  type AdminActionKind,
  type AdminRequestStatus,
  type AdminSellerRequest,
} from "@/store/admin-store";
import { useSellerOnboardingStore } from "@/store/seller-onboarding-store";
import { buildDemoRequest } from "@/store/admin-store";
import { SELLER_TYPE_LABEL } from "@/lib/seller-identity";
import {
  BUSINESS_KIND_LABEL,
  SELL_CHANNEL_LABEL,
} from "@/lib/seller-profile-pick";
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

/* ─────────────────────────────────────────────────────────────
   v1.9.1 — پنل ادمین (UI با دادهٔ mock — ساختار مطابق api-spec §7)
   ─ چیدمان دسکتاپ‌محور: جدول درخواست‌ها + پنل جزئیات؛ نه موبایل.
   ─ دسترسی: فقط با کلید دموی ‎?role=admin‎ — برای کاربر عادی ۴۰۳.
   ─ عملیات با دیالوگ تأیید + ثبت در «گزارش فعالیت ادمین»؛ تصمیم روی
     درخواست کاربر دمو همان لحظه در نمای فروشنده اعمال و اعلانش به
     صندوق ورودی او می‌رود (mock مشترک).
   ─ تب‌های «اختلاف‌ها»، «گزارش‌ها»، «شوهای زنده (بستن اجباری)» فقط
     ساختار با برچسب «به‌زودی».
   ───────────────────────────────────────────────────────────── */

const STATUS_META: Record<
  AdminRequestStatus,
  { label: string; cls: string }
> = {
  pending: {
    label: "در انتظار",
    cls: "bg-amber-300/15 text-amber-300 border border-amber-300/40",
  },
  approved: {
    label: "تأییدشده",
    cls: "bg-ls-green/15 text-ls-green border border-ls-green/40",
  },
  rejected: {
    label: "ردشده",
    cls: "bg-ls-pink/15 text-ls-pink border border-ls-pink/40",
  },
  suspended: {
    label: "تعلیق",
    cls: "bg-[#FF3B5C]/15 text-[#FF3B5C] border border-[#FF3B5C]/40",
  },
};

function StatusBadge({ status }: { status: AdminRequestStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-black",
        meta.cls
      )}
      role="status"
      aria-label={`وضعیت: ${meta.label}`}
    >
      {meta.label}
    </span>
  );
}

/* ── ۴۰۳ برای کاربر بدون نقش ادمین ── */
function Forbidden403() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-6"
      aria-label="خطای دسترسی ۴۰۳"
    >
      <div className="w-full max-w-md rounded-3xl border border-[#FF3B5C]/30 bg-[#12101c] p-8 text-center shadow-2xl">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FF3B5C]/15">
          <ShieldAlert className="h-8 w-8 text-[#FF3B5C]" aria-hidden />
        </span>
        <p className="mt-4 text-4xl font-black tabular-nums text-[#FF3B5C]">
          {toFa(403)}
        </p>
        <p className="mt-2 text-base font-extrabold">دسترسی نداری</p>
        <p className="mt-2 text-xs leading-6 text-white/60">
          این بخش فقط برای مدیرهای LiveShop است. اگر فکر می‌کنی اشتباهی
          شده، با پشتیبانی در تماس باش.
        </p>
        <a
          href="/"
          className="mt-5 inline-flex h-11 items-center justify-center rounded-xl bg-ls-purple px-6 text-sm font-extrabold text-white hover:bg-ls-purple-deep transition-colors"
          aria-label="بازگشت به فروشگاه"
        >
          <ShoppingBag className="ml-2 h-4 w-4" aria-hidden />
          بازگشت به فروشگاه
        </a>
        <p className="mt-4 text-[10px] text-white/35" dir="ltr">
          demo: /admin?role=admin
        </p>
      </div>
    </div>
  );
}

/* ── فیلد حساس ماسک‌شده با دکمهٔ «نمایش» که در لاگ ثبت می‌شود ── */
function SecretField({
  label,
  masked,
  full,
  target,
  onReveal,
}: {
  label: string;
  masked: string;
  full: string;
  target: string;
  onReveal: (detail: string) => void;
}) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold text-white/60">{label}</p>
        <button
          type="button"
          onClick={() => {
            if (revealed) {
              setRevealed(false);
              return;
            }
            setRevealed(true);
            onReveal(label);
          }}
          aria-label={
            revealed ? `پنهان‌کردن ${label}` : `نمایش ${label} — ثبت در گزارش فعالیت`
          }
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-ls-purple/40 bg-ls-purple/10 px-2.5 text-[11px] font-bold text-ls-purple-soft hover:bg-ls-purple/20 transition-colors"
        >
          {revealed ? (
            <>
              <EyeOff className="h-3.5 w-3.5" aria-hidden />
              پنهان
            </>
          ) : (
            <>
              <Eye className="h-3.5 w-3.5" aria-hidden />
              نمایش
            </>
          )}
        </button>
      </div>
      <p
        dir="ltr"
        className={cn(
          "mt-1.5 text-sm tabular-nums",
          revealed ? "text-white font-extrabold" : "text-white/80"
        )}
      >
        {revealed ? full : masked}
      </p>
      <p className="mt-1 text-[10px] text-white/35">
        {revealed
          ? "نمایش در گزارش فعالیت ادمین ثبت شد"
          : "فقط ماسک‌شده — با «نمایش» ثبت در لاگ انجام می‌شود"}
      </p>
    </div>
  );
}

/* ── تب «به‌زودی» ── */
function ComingSoon({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Gavel;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
        <Icon className="h-7 w-7 text-white/40" aria-hidden />
      </span>
      <p className="mt-3 text-sm font-extrabold text-white/80">{title}</p>
      <p className="mt-1.5 max-w-sm text-xs leading-6 text-white/45">{desc}</p>
      <span className="mt-4 rounded-full border border-ls-purple/40 bg-ls-purple/10 px-3 py-1 text-[11px] font-bold text-ls-purple-soft">
        به‌زودی
      </span>
    </div>
  );
}

/* ── دیالوگ عملیات ادمین (تأیید/رد/تعلیق/رفع تعلیق) ── */
type PendingAction = {
  kind: Exclude<AdminActionKind, "reveal">;
  req: AdminSellerRequest;
};

function ActionDialog({
  pending,
  onClose,
  onDecide,
}: {
  pending: PendingAction | null;
  onClose: () => void;
  onDecide: (
    kind: PendingAction["kind"],
    req: AdminSellerRequest,
    reason?: string
  ) => void;
}) {
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const needsReason = pending?.kind === "reject" || pending?.kind === "suspend";

  const close = () => {
    setReason("");
    setReasonError(null);
    onClose();
  };

  const title =
    pending?.kind === "approve"
      ? "این درخواست تأیید شود؟"
      : pending?.kind === "reject"
        ? "این درخواست رد شود؟"
        : pending?.kind === "suspend"
          ? "این فروشنده تعلیق شود؟"
          : "تعلیق برداشته شود؟";

  const desc =
    pending?.kind === "approve"
      ? `فروشگاه «${pending.req.storeName}» فعال می‌شود و فروشنده می‌تواند شو زمان‌بندی کند و لیستینگ بسازد.`
      : pending?.kind === "reject"
        ? "دلیل رد اجباری است و عیناً به فروشنده نمایش داده می‌شود."
        : pending?.kind === "suspend"
          ? "علت تعلیق اجباری است و عیناً به فروشنده نمایش داده می‌شود. فروشنده از همین لحظه قفل می‌شود."
          : `اکانت فروشندگی «${pending?.req.storeName ?? ""}» دوباره فعال می‌شود.`;

  const confirm = () => {
    if (!pending) return;
    if (needsReason) {
      const v =
        pending.kind === "reject"
          ? validateRejectReason(reason)
          : validateSuspendReason(reason);
      if (!v.ok) {
        setReasonError(v.message);
        return;
      }
      onDecide(pending.kind, pending.req, v.value);
    } else {
      onDecide(pending.kind, pending.req);
    }
    close();
  };

  return (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(v) => {
        if (!v) close();
      }}
    >
      <AlertDialogContent
        dir="rtl"
        className="max-w-[440px] rounded-2xl border-white/10 bg-[#14121f]"
      >
        <AlertDialogHeader className="text-right">
          <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-xs leading-6 text-white/60">
            {desc}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {needsReason && (
          <div className="space-y-1.5">
            <label
              htmlFor="admin-reason"
              className="block text-xs font-bold text-white/70"
            >
              {pending?.kind === "reject" ? "دلیل رد" : "علت تعلیق"}{" "}
              <span className="text-[#FF3B5C]">*</span>
            </label>
            <textarea
              id="admin-reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setReasonError(null);
              }}
              rows={3}
              aria-invalid={!!reasonError}
              aria-label={
                pending?.kind === "reject"
                  ? "دلیل رد درخواست — به فروشنده نمایش داده می‌شود"
                  : "علت تعلیق — به فروشنده نمایش داده می‌شود"
              }
              placeholder={
                pending?.kind === "reject"
                  ? "مثلاً: عکس مدرک هویتی ناخوانا بود"
                  : "مثلاً: تأخیر مکرر در ارسال سفارش‌ها"
              }
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white placeholder:text-white/30 focus:border-ls-purple/60 focus:outline-none"
            />
            {reasonError && (
              <p className="text-[11px] font-bold text-[#FF3B5C]" role="alert">
                {reasonError}
              </p>
            )}
            <p className="text-[10px] leading-4 text-white/40">
              این متن عیناً در صندوق ورودی فروشنده نمایش داده می‌شود.
            </p>
          </div>
        )}

        <AlertDialogFooter className="flex-row-reverse gap-2">
          <AlertDialogCancel
            onClick={close}
            className="rounded-xl border-white/10 bg-transparent text-white/80 hover:bg-white/5"
          >
            منصرف شدم
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              /* radix به‌صورت پیش‌فرض دیالوگ را می‌بندد — با خطای
                 اعتبارسنجی باید باز بماند؛ بستن دستی در close() انجام می‌شود */
              e.preventDefault();
              confirm();
            }}
            aria-label={
              pending?.kind === "approve"
                ? "تأیید درخواست فروشندگی"
                : pending?.kind === "reject"
                  ? "رد درخواست با دلیل"
                  : pending?.kind === "suspend"
                    ? "تعلیق فروشنده"
                    : "رفع تعلیق فروشنده"
            }
            className={cn(
              "rounded-xl text-white",
              pending?.kind === "approve" || pending?.kind === "unsuspend"
                ? "bg-ls-green text-[#04281e] hover:bg-ls-green/90"
                : "bg-[#FF3B5C] hover:bg-[#FF3B5C]/90"
            )}
          >
            {pending?.kind === "approve"
              ? "بله، تأیید کن"
              : pending?.kind === "reject"
                ? "رد با این دلیل"
                : pending?.kind === "suspend"
                  ? "تعلیق کن"
                  : "بله، رفع تعلیق"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ═══════════════════ پنل اصلی ═══════════════════ */

type TabKey = "requests" | "disputes" | "reports" | "shows";
type StatusFilter = "all" | AdminRequestStatus;

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "همه" },
  { key: "pending", label: "در انتظار" },
  { key: "approved", label: "تأییدشده" },
  { key: "rejected", label: "ردشده" },
  { key: "suspended", label: "تعلیق" },
];

export default function AdminApp() {
  const isAdmin = useAdminRole();

  /* v1.9.1 — mock مشترک: وضعیت فروشنده از sessionStorage بازیابی می‌شود
     (فقط روی mount، بعد از هیدریشن) تا درخواست کاربر دمو حتی با بارگذاری
     کامل صفحه در جدول ادمین دیده شود */
  useEffect(() => {
    useSellerOnboardingStore.getState().hydrateFromSession();
  }, []);

  const others = useAdminStore((s) => s.requests);
  const activityLog = useAdminStore((s) => s.activityLog);
  const decide = useAdminStore((s) => s.decide);
  const logReveal = useAdminStore((s) => s.logReveal);

  /* mock مشترک — درخواست کاربر دمو از استور onboarding می‌آید */
  const soStatus = useSellerOnboardingStore((s) => s.status);
  const soApp = useSellerOnboardingStore((s) => s.application);
  // v2.0.5 — ویژگی‌های فروش (مرحلهٔ ۳ و ۴) از draft استور برای پنل جزئیات ادمین
  const soType = useSellerOnboardingStore((s) => s.sellerTypeDraft);
  const soChannels = useSellerOnboardingStore((s) => s.sellChannelsDraft);
  const soKind = useSellerOnboardingStore((s) => s.businessKindDraft);
  const demoRequest = useMemo(
    () =>
      buildDemoRequest(soStatus, soApp, {
        sellerType: soType,
        sellChannels: soChannels,
        businessKind: soKind,
      }),
    [soStatus, soApp, soType, soChannels, soKind]
  );

  const allRequests = useMemo(
    () =>
      demoRequest
        ? [demoRequest, ...others].sort((a, b) => b.submittedAtMs - a.submittedAtMs)
        : [...others].sort((a, b) => b.submittedAtMs - a.submittedAtMs),
    [demoRequest, others]
  );

  /* فیلترها */
  const [tab, setTab] = useState<TabKey>("requests");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = allRequests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (category !== "all" && r.mainCategoryLabel !== category) return false;
      if (
        q &&
        !r.storeName.toLowerCase().includes(q) &&
        !r.slug.toLowerCase().includes(q)
      )
        return false;
      return true;
    });
    return sortDir === "desc"
      ? list.sort((a, b) => b.submittedAtMs - a.submittedAtMs)
      : list.sort((a, b) => a.submittedAtMs - b.submittedAtMs);
  }, [allRequests, statusFilter, category, query, sortDir]);

  /* درخواست انتخاب‌شده — از فهرست زنده deriving می‌شود تا وضعیتش
     بعد از تصمیم ادمین همان لحظه آپدیت شود */
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = allRequests.find((r) => r.id === selectedId) ?? null;

  /* v2.0.5 — برچسب‌های ویژگی‌های فروش (مرحلهٔ ۴) برای پنل جزئیات —
     undefined یعنی ردیف رندر نمی‌شود (سازگار با mockهای بدون این فیلدها) */
  const sellerTypeLabel =
    selected?.sellerType === "BUSINESS"
      ? SELLER_TYPE_LABEL.business
      : selected?.sellerType === "INDIVIDUAL"
        ? SELLER_TYPE_LABEL.individual
        : undefined;
  const profilePickLabel = selected
    ? selected.businessKind
      ? (BUSINESS_KIND_LABEL as Record<string, string>)[selected.businessKind]
      : (selected.sellChannels ?? []).length > 0
        ? (selected.sellChannels ?? [])
            .map((c) => (SELL_CHANNEL_LABEL as Record<string, string>)[c])
            .filter(Boolean)
            .join("، ")
        : undefined
    : undefined;

  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const pendingCount = allRequests.filter((r) => r.status === "pending").length;
  const approvedCount = allRequests.filter((r) => r.status === "approved").length;

  if (!isAdmin) return <Forbidden403 />;

  const onDecide = (
    kind: PendingAction["kind"],
    req: AdminSellerRequest,
    reason?: string
  ) => {
    const r = decide(req.id, kind, reason);
    if (r.ok) {
      toast.success(`${ADMIN_ACTION_LABEL[kind]} — ${req.storeName}`);
    } else {
      toast.error(r.message ?? "عملیات انجام نشد");
    }
  };

  const TABS: { key: TabKey; label: string; icon: typeof Gavel; soon?: boolean }[] = [
    { key: "requests", label: "درخواست‌های فروشندگی", icon: Store },
    { key: "disputes", label: "اختلاف‌ها", icon: Gavel, soon: true },
    { key: "reports", label: "گزارش‌ها", icon: FileText, soon: true },
    { key: "shows", label: "شوهای زنده — بستن اجباری", icon: Radio, soon: true },
  ];

  return (
    <div className="min-h-screen bg-ls-bg text-white">
      {/* ── هدر ── */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-ls-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
            style={{ background: "linear-gradient(135deg, #6C5CFF, #FF3B8B)" }}
            aria-hidden
          >
            🛍️
          </span>
          <div className="leading-tight">
            <p className="text-sm font-black">LiveShop — پنل مدیریت</p>
            <p className="text-[10px] text-white/45">
              کاربر: {ADMIN_ACTOR} · کلید دمو: ?role=admin
            </p>
          </div>
          <span className="mr-2 rounded-full border border-ls-purple/40 bg-ls-purple/10 px-2.5 py-1 text-[10px] font-bold text-ls-purple-soft">
            دمو
          </span>
          <Link
            href="/"
            className="mr-auto rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors"
            aria-label="رفتن به فروشگاه"
          >
            <ShoppingBag className="ml-1.5 inline h-3.5 w-3.5" aria-hidden />
            فروشگاه
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-12 pt-5">
        {/* ── داشبورد ساده ── */}
        <section
          className="grid grid-cols-3 gap-4"
          aria-label="داشبورد ادمین"
        >
          <button
            type="button"
            onClick={() => {
              setTab("requests");
              setStatusFilter("pending");
            }}
            aria-label="درخواست‌های در انتظار بررسی"
            className="rounded-2xl border border-amber-300/30 bg-amber-300/[0.07] p-4 text-right transition-colors hover:bg-amber-300/[0.12]"
          >
            <p className="text-[11px] font-bold text-white/60">
              درخواست‌های در انتظار
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-amber-300">
              {toFa(pendingCount)}
            </p>
          </button>
          <div className="rounded-2xl border border-ls-green/30 bg-ls-green/[0.07] p-4">
            <p className="text-[11px] font-bold text-white/60">
              فروشنده‌های فعال
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-ls-green">
              {toFa(approvedCount)}
            </p>
          </div>
          <div className="rounded-2xl border border-ls-pink/30 bg-ls-pink/[0.07] p-4">
            <p className="text-[11px] font-bold text-white/60">
              شوهای زندهٔ الان
            </p>
            <p className="mt-1 text-2xl font-black tabular-nums text-ls-pink">
              {toFa(LIVE_SHOWS.length)}
            </p>
          </div>
        </section>

        {/* ── تب‌ها ── */}
        <nav
          className="mt-6 flex flex-wrap items-center gap-2 border-b border-white/5 pb-3"
          aria-label="بخش‌های پنل ادمین"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                aria-current={active ? "page" : undefined}
                aria-label={`${t.label}${t.soon ? " — به‌زودی" : ""}`}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors",
                  active
                    ? "bg-ls-purple text-white"
                    : "bg-white/5 text-white/60 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                {t.label}
                {t.soon && (
                  <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px] font-black text-white/70">
                    به‌زودی
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── محتوای تب‌ها ── */}
        {tab === "disputes" && (
          <ComingSoon
            icon={Gavel}
            title="اختلاف‌ها"
            desc="بررسی اختلاف خریدار و فروشنده و تصمیم نهایی (بازگشت وجه یا آزادسازی مبلغ) — ساختار مطابق POST /admin/disputes/:id/resolve."
          />
        )}
        {tab === "reports" && (
          <ComingSoon
            icon={FileText}
            title="گزارش‌ها"
            desc="گزارش‌های تخلف و سوءاستفاده — ساختار مطابق GET /admin/reports."
          />
        )}
        {tab === "shows" && (
          <ComingSoon
            icon={Radio}
            title="شوهای زنده — بستن اجباری"
            desc="پایش پخش‌های زنده و بستن اجباری شوهای متخلف — ساختار مطابق POST /admin/shows/:id/force-end."
          />
        )}

        {tab === "requests" && (
          <div className="mt-5 space-y-5">
            {/* ابزار فیلتر */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-56 flex-1">
                <Search
                  className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35"
                  aria-hidden
                />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجوی نام فروشگاه یا شناسه…"
                  aria-label="جستجو در درخواست‌های فروشندگی"
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pr-9 pl-3 text-sm text-white placeholder:text-white/35 focus:border-ls-purple/60 focus:outline-none"
                />
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="فیلتر دسته"
                className="h-10 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-white/80 focus:border-ls-purple/60 focus:outline-none"
              >
                <option value="all">همهٔ دسته‌ها</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.label}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                aria-label={`مرتب‌سازی بر اساس تاریخ — ${
                  sortDir === "desc" ? "جدیدترین" : "قدیمی‌ترین"
                }`}
                className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-xs font-bold text-white/80 hover:bg-white/10 transition-colors"
              >
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden />
                {sortDir === "desc" ? "جدیدترین" : "قدیمی‌ترین"}
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="فیلتر وضعیت">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setStatusFilter(f.key)}
                  aria-pressed={statusFilter === f.key}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors",
                    statusFilter === f.key
                      ? "bg-ls-purple text-white"
                      : "bg-white/5 text-white/60 hover:text-white"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* جدول + جزئیات — چیدمان دسکتاپ */}
            <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_380px]">
              {/* جدول درخواست‌ها */}
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12101c]">
                <table className="w-full text-sm" aria-label="جدول درخواست‌های فروشندگی">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.03] text-[11px] text-white/50">
                      <th scope="col" className="px-4 py-3 text-right font-bold">فروشگاه</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">دسته</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">تاریخ ثبت</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">وضعیت</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">
                        <span className="sr-only">عملیات</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className={cn(
                          "cursor-pointer border-b border-white/5 transition-colors last:border-0",
                          selectedId === r.id ? "bg-ls-purple/10" : "hover:bg-white/[0.03]"
                        )}
                        aria-selected={selectedId === r.id}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ls-purple/15 text-ls-purple-soft">
                              <Store className="h-4 w-4" aria-hidden />
                            </span>
                            <div className="min-w-0">
                              <p className="flex items-center gap-1.5 truncate font-bold">
                                {r.storeName}
                                {r.isDemoUser && (
                                  <span className="shrink-0 rounded-full border border-ls-green/40 bg-ls-green/10 px-1.5 py-0.5 text-[9px] font-black text-ls-green">
                                    کاربر فعلی
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-white/40" dir="ltr">
                                @{r.slug}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/70">{r.mainCategoryLabel}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-white/60">
                          {r.submittedAtLabel}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={r.status} />
                        </td>
                        <td className="px-4 py-3 text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedId(r.id);
                            }}
                            aria-label={`مشاهدهٔ جزئیات ${r.storeName}`}
                            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-white/10 px-2.5 text-[11px] font-bold text-white/70 hover:bg-white/5 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" aria-hidden />
                            مشاهده
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-xs text-white/40">
                          درخواستی با این فیلترها پیدا نشد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* پنل جزئیات */}
              <aside
                aria-label="جزئیات درخواست"
                className="rounded-2xl border border-white/10 bg-[#12101c] p-4 xl:sticky xl:top-20"
              >
                {!selected ? (
                  <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                    <Store className="h-8 w-8 text-white/20" aria-hidden />
                    <p className="mt-3 text-xs leading-6 text-white/40">
                      یک درخواست را از جدول انتخاب کن تا جزئیات، مدارک و
                      عملیات نمایش داده شود.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">{selected.storeName}</p>
                        <p className="mt-0.5 text-[11px] text-white/45" dir="ltr">
                          @{selected.slug}
                        </p>
                      </div>
                      <StatusBadge status={selected.status} />
                    </div>

                    <dl className="space-y-1.5 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-white/50">دستهٔ اصلی</dt>
                        <dd className="font-bold text-white/85">{selected.mainCategoryLabel}</dd>
                      </div>
                      {sellerTypeLabel && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-white/50">نوع فروشنده</dt>
                          <dd className="font-bold text-white/85">{sellerTypeLabel}</dd>
                        </div>
                      )}
                      {profilePickLabel && (
                        <div className="flex items-center justify-between gap-2">
                          <dt className="text-white/50">ویژگی‌های فروش</dt>
                          <dd className="font-bold text-white/85">{profilePickLabel}</dd>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-white/50">تاریخ ثبت</dt>
                        <dd className="tabular-nums text-white/85">{selected.submittedAtLabel}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <dt className="text-white/50">شناسهٔ درخواست</dt>
                        <dd className="text-white/85" dir="ltr">{selected.id}</dd>
                      </div>
                      {selected.isDemoUser && (
                        <div className="border-t border-white/10 pt-1.5">
                          <dd className="text-[10px] leading-5 text-ls-green">
                            این درخواست به نمای فروشندهٔ کاربر فعلی متصل است —
                            تصمیم تو همان لحظه آنجا و در صندوق ورودی‌اش اعمال می‌شود.
                          </dd>
                        </div>
                      )}
                    </dl>

                    {/* دلیل رد/تعلیق قبلی */}
                    {(selected.rejectionReason || selected.suspendedReason) && (
                      <div className="rounded-xl border border-ls-pink/25 bg-ls-pink/[0.07] p-3">
                        <p className="text-[11px] font-bold text-white/70">
                          {selected.rejectionReason ? "دلیل رد ثبت‌شده:" : "علت تعلیق ثبت‌شده:"}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-white/80">
                          {selected.rejectionReason ?? selected.suspendedReason}
                        </p>
                      </div>
                    )}

                    {/* داده‌های حساس — فقط ماسک + نمایش با ثبت لاگ */}
                    <SecretField
                      label="کد ملی"
                      masked={maskedNidOf(selected)}
                      full={selected.nationalId}
                      target={selected.storeName}
                      onReveal={(detail) => {
                        logReveal(selected.storeName, `نمایش ${detail}`);
                        toast(`${ADMIN_ACTION_LABEL.reveal} — ${detail} (${selected.storeName})`);
                      }}
                    />
                    <SecretField
                      label="شماره شبا"
                      masked={maskedShebaOf(selected)}
                      full={selected.sheba}
                      target={selected.storeName}
                      onReveal={(detail) => {
                        logReveal(selected.storeName, `نمایش ${detail}`);
                        toast(`${ADMIN_ACTION_LABEL.reveal} — ${detail} (${selected.storeName})`);
                      }}
                    />

                    {/* عکس مدرک — placeholder */}
                    <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-5 text-center">
                      <ImageOff className="h-6 w-6 text-white/30" aria-hidden />
                      <p className="text-xs font-bold text-white/60">تصویر مدرک هویتی</p>
                      <p className="text-[10px] text-white/35">
                        placeholder — پیوست واقعی پس از اتصال API
                      </p>
                    </div>

                    {/* عملیات */}
                    <div className="space-y-2 border-t border-white/10 pt-3.5">
                      {selected.status === "pending" && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingAction({ kind: "approve", req: selected })
                            }
                            aria-label="تأیید درخواست فروشندگی"
                            className="w-full rounded-xl bg-ls-green py-3 text-sm font-black text-[#04281e] hover:bg-ls-green/90 transition-colors active:scale-[.99]"
                          >
                            تأیید درخواست
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setPendingAction({ kind: "reject", req: selected })
                            }
                            aria-label="رد درخواست فروشندگی با دلیل"
                            className="w-full rounded-xl bg-[#FF3B5C] py-3 text-sm font-black text-white hover:bg-[#FF3B5C]/90 transition-colors active:scale-[.99]"
                          >
                            رد درخواست
                          </button>
                        </>
                      )}
                      {selected.status === "approved" && (
                        <button
                          type="button"
                          onClick={() =>
                            setPendingAction({ kind: "suspend", req: selected })
                          }
                          aria-label="تعلیق اکانت فروشنده"
                          className="w-full rounded-xl border border-[#FF3B5C]/50 bg-[#FF3B5C]/10 py-3 text-sm font-black text-[#FF3B5C] hover:bg-[#FF3B5C]/20 transition-colors"
                        >
                          تعلیق اکانت فروشنده
                        </button>
                      )}
                      {selected.status === "suspended" && (
                        <button
                          type="button"
                          onClick={() =>
                            setPendingAction({ kind: "unsuspend", req: selected })
                          }
                          aria-label="رفع تعلیق اکانت فروشنده"
                          className="w-full rounded-xl bg-ls-green py-3 text-sm font-black text-[#04281e] hover:bg-ls-green/90 transition-colors active:scale-[.99]"
                        >
                          رفع تعلیق
                        </button>
                      )}
                      {selected.status === "rejected" && (
                        <p className="text-center text-[11px] leading-5 text-white/40">
                          این درخواست رد شده — پس از اصلاح فروشنده، درخواست
                          دوباره به صف بررسی می‌آید.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </div>
        )}

        {/* ── گزارش فعالیت ادمین ── */}
        <section
          aria-label="گزارش فعالیت ادمین"
          className="mt-8 rounded-2xl border border-white/10 bg-[#12101c] p-4"
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-ls-green" aria-hidden />
            <h2 className="text-sm font-extrabold">گزارش فعالیت ادمین</h2>
            <span className="text-[10px] text-white/40">
              (چه کسی، چه چیزی، کی — {toFa(activityLog.length)} رویداد)
            </span>
          </div>
          <ul className="mt-3 divide-y divide-white/5">
            {activityLog.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2.5 text-xs">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black",
                    a.action === "approve" || a.action === "unsuspend"
                      ? "bg-ls-green/15 text-ls-green"
                      : a.action === "reveal"
                        ? "bg-ls-purple/15 text-ls-purple-soft"
                        : "bg-ls-pink/15 text-ls-pink"
                  )}
                >
                  {a.actionLabel}
                </span>
                <span className="font-bold text-white/85">{a.actor}</span>
                <span className="text-white/50">·</span>
                <span className="text-white/70">{a.target}</span>
                {a.detail && (
                  <span className="text-white/45">— {a.detail}</span>
                )}
                <span className="mr-auto tabular-nums text-[10px] text-white/35">
                  {a.atLabel}
                </span>
              </li>
            ))}
            {activityLog.length === 0 && (
              <li className="py-6 text-center text-xs text-white/40">
                هنوز رویدادی ثبت نشده است.
              </li>
            )}
          </ul>
        </section>

        <p className="mt-6 text-center text-[10px] leading-5 text-white/30">
          پنل ادمین دمو است — داده‌ها mock و در حافظهٔ مرورگر نگه‌داری می‌شوند.
          ساختار مطابق docs/api-spec.md §7.
        </p>
      </main>

      {/* دیالوگ عملیات */}
      <ActionDialog
        pending={pendingAction}
        onClose={() => setPendingAction(null)}
        onDecide={onDecide}
      />
    </div>
  );
}
