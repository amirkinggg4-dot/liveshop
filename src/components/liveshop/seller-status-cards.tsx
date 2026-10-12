"use client";

import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  FileWarning,
  Info,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import {
  SELLER_STATUS_LABEL,
  type SellerOnboardingStatus,
} from "@/store/seller-onboarding-store";
import { toast } from "sonner";

/* ─────────────────────────────────────────────────────────────
   v1.9.1 — کارت‌های وضعیت درخواست فروشندگی (مشترک بین نمای
   «شروع فروش» و گیت تب «فروش»)
   ─ نسخهٔ انتقال‌یافته از SellerOnboardingView (v1.7.0) بدون دکمهٔ
     دموی «شبیه‌سازی تأیید ادمین» — تأیید از پنل ادمین (/admin) انجام
     می‌شود و وضعیت همان لحظه در نمای فروشنده تغییر می‌کند.
   ───────────────────────────────────────────────────────────── */

/* ── چیپ وضعیت ── */
const STATUS_CHIP: Record<SellerOnboardingStatus, { cls: string; icon: typeof Clock3 }> = {
  none: { cls: "bg-white/10 text-white/60 border border-white/15", icon: Info },
  pending: {
    cls: "bg-amber-300/15 text-amber-300 border border-amber-300/40",
    icon: Clock3,
  },
  approved: {
    cls: "bg-ls-green/15 text-ls-green border border-ls-green/40",
    icon: BadgeCheck,
  },
  rejected: {
    cls: "bg-ls-pink/15 text-ls-pink border border-ls-pink/40",
    icon: FileWarning,
  },
  suspended: {
    cls: "bg-[#FF3B5C]/15 text-[#FF3B5C] border border-[#FF3B5C]/40",
    icon: ShieldAlert,
  },
};

export function SellerStatusChip({ status }: { status: SellerOnboardingStatus }) {
  const chip = STATUS_CHIP[status];
  const Icon = chip.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black",
        chip.cls
      )}
      role="status"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {SELLER_STATUS_LABEL[status]}
    </span>
  );
}

/* ── کارت وضعیت (در انتظار / رد / تعلیق / تأیید) ── */
export function SellerStatusCard({
  status,
  reason,
  onEdit,
}: {
  status: SellerOnboardingStatus;
  reason?: string | null;
  onEdit: () => void;
}) {
  const goDash = useAppStore((s) => s.setRoot);

  if (status === "pending") {
    return (
      <section
        aria-label="وضعیت درخواست فروشندگی — در انتظار تأیید"
        className="space-y-3 rounded-2xl border border-amber-300/40 bg-amber-300/10 p-4"
      >
        <div className="flex items-center gap-2">
          <Clock3 className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />
          <p className="text-sm font-black text-amber-300">
            درخواستت در صف بررسی است
          </p>
        </div>
        <p className="text-xs leading-5 text-white/75">
          تیم LiveShop حداکثر تا {`۴۸`} ساعت کاری درخواستت را بررسی می‌کند.
          نتیجه از صندوق ورودی و همین صفحه اعلام می‌شود.
        </p>
        <div className="rounded-xl border border-white/10 bg-ls-card-2 p-3">
          <p className="text-[11px] font-bold text-white/70">
            تا تأیید شدن این‌ها غیرفعال است:
          </p>
          <ul className="mt-1.5 space-y-1 text-[11px] text-white/55">
            <li>• شروع پخش زنده</li>
            <li>• ساخت لیستینگ جدید</li>
          </ul>
        </div>
        {/* v1.9.1 — جای دکمهٔ «شبیه‌سازی تأیید ادمین» پنل ادمین است */}
        <p className="text-[10px] leading-4 text-white/40">
          بررسی درخواست‌ها توسط تیم LiveShop انجام می‌شود —{" "}
          <Link
            href="/admin?role=admin"
            className="font-bold text-ls-purple-soft underline underline-offset-2"
            aria-label="باز کردن پنل ادمین (دمو)"
          >
            (دمو) باز کردن پنل ادمین
          </Link>
        </p>
      </section>
    );
  }

  if (status === "rejected") {
    return (
      <section
        aria-label="وضعیت درخواست فروشندگی — رد شده"
        className="space-y-3 rounded-2xl border border-ls-pink/40 bg-ls-pink/10 p-4"
      >
        <div className="flex items-center gap-2">
          <FileWarning className="h-5 w-5 shrink-0 text-ls-pink" aria-hidden />
          <p className="text-sm font-black text-ls-pink">
            درخواست فروشندگی رد شد
          </p>
        </div>
        <div className="rounded-xl border border-ls-pink/25 bg-ls-card-2 p-3">
          <p className="text-[11px] font-bold text-white/70">دلیل رد:</p>
          <p className="mt-1 text-xs leading-5 text-white/80">
            {reason || "مدارک ارسالی قابل راستی‌آزمایی نبود."}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="اصلاح اطلاعات و ارسال مجدد درخواست"
          className="w-full rounded-xl bg-ls-pink py-2.5 text-xs font-black text-white hover:bg-ls-pink/90 transition-colors active:scale-[.99]"
        >
          اصلاح اطلاعات و ارسال مجدد
        </button>
      </section>
    );
  }

  if (status === "suspended") {
    return (
      <section
        aria-label="وضعیت درخواست فروشندگی — تعلیق"
        className="space-y-3 rounded-2xl border border-[#FF3B5C]/40 bg-[#FF3B5C]/10 p-4"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert
            className="h-5 w-5 shrink-0 text-[#FF3B5C]"
            aria-hidden
          />
          <p className="text-sm font-black text-[#FF3B5C]">
            اکانت فروشندگی موقتاً تعلیق شده
          </p>
        </div>
        <div className="rounded-xl border border-[#FF3B5C]/25 bg-ls-card-2 p-3">
          <p className="text-[11px] font-bold text-white/70">علت تعلیق:</p>
          <p className="mt-1 text-xs leading-5 text-white/80">
            {reason || "فعالیت فروشگاه با قوانین LiveShop همخوان نبود."}
          </p>
        </div>
        <p className="text-[11px] leading-5 text-white/60">
          برای پیگیری با پشتیبانی در تماس باش — پاسخ‌گویی {`۲۴`} ساعته در
          روزهای کاری.
        </p>
      </section>
    );
  }

  if (status === "approved") {
    return (
      <section
        aria-label="وضعیت درخواست فروشندگی — تأیید شده"
        className="space-y-3 rounded-2xl border border-ls-green/40 bg-ls-green/10 p-4"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-ls-green" aria-hidden />
          <p className="text-sm font-black text-ls-green">
            فروشندهٔ تأییدشده‌ای! 🎉
          </p>
        </div>
        <p className="text-xs leading-5 text-white/75">
          فروشگاهت فعال است — می‌توانی شو زمان‌بندی کنی و لیستینگ بسازی.
        </p>
        <button
          type="button"
          onClick={() => goDash("sellerDashboard")}
          aria-label="رفتن به پنل فروشنده"
          className="w-full rounded-xl bg-ls-purple py-2.5 text-xs font-black text-white hover:bg-ls-purple-deep transition-colors active:scale-[.99]"
        >
          رفتن به پنل فروشنده
        </button>
      </section>
    );
  }

  return null;
}

/* ── گیت مهمانِ تب فروش — کارت «برای فروش اول وارد شو» ── */
export function SellerGuestGate({ onLogin }: { onLogin: () => void }) {
  return (
    <section
      aria-label="گیت ورود فروشندگی — مهمان"
      className="space-y-3 rounded-2xl border border-ls-purple/30 bg-gradient-to-l from-ls-purple/15 to-ls-pink/10 p-5"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ls-purple/20 text-ls-purple-soft">
        <Info className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-base font-black">برای فروش، اول وارد شو</p>
      <p className="text-xs leading-6 text-white/70">
        فروشندگی در LiveShop به حساب کاربری متصل است — با ورود، وضعیت
        درخواست فروشندگی‌ات را می‌بینی یا درخواست جدیدت را ثبت می‌کنی.
      </p>
      <button
        type="button"
        onClick={onLogin}
        aria-label="ورود برای فروشندگی"
        className="w-full rounded-xl bg-ls-purple py-3 text-sm font-black text-white shadow-lg shadow-ls-purple/30 hover:bg-ls-purple-deep transition-colors active:scale-[.99]"
      >
        ورود با شمارهٔ موبایل
      </button>
      <button
        type="button"
        onClick={() => toast("مرور فروشگاه بدون ورود آزاد است — ورود فقط برای فروش و خرید لازم است")}
        aria-label="چرا باید وارد شوم؟"
        className="w-full rounded-xl border border-white/10 py-2.5 text-xs font-bold text-white/70 hover:bg-white/5 transition-colors"
      >
        چرا باید وارد شوم؟
      </button>
    </section>
  );
}
