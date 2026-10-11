"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — تنظیمات: اعلان‌ها (سفارش، شروع لایو دنبال‌شده‌ها،
   کمبود موجودی ذخیره‌شده‌ها، تبلیغاتی) + حریم خصوصی + خروج +
   حذف حساب با دیالوگ پیامدها و تأیید دومرحله‌ای.
   ───────────────────────────────────────────────────────────── */

import { useState } from "react";
import { toast } from "sonner";
import {
  Bell,
  LogOut,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
} from "lucide-react";
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
import { PageHeader, SectionTitle } from "@/components/liveshop/shared";
import { Switch } from "@/components/ui/switch";
import { useAppStore } from "@/store/app-store";
import { useAuth } from "@/store/auth-store";
import { useSettingsStore, type NotificationPrefs } from "@/store/settings-store";

const NOTIFICATION_ROWS: Array<{ key: keyof NotificationPrefs; title: string; desc: string }> = [
  { key: "orders", title: "به‌روزرسانی سفارش‌ها", desc: "ارسال، تحویل و اختلاف سفارش‌هایت" },
  { key: "liveStarts", title: "شروع لایو فروشنده‌های دنبال‌شده", desc: "همین که فروشندهٔ دنبال‌شده پخش را شروع کند" },
  { key: "restock", title: "کمبود موجودی ذخیره‌شده‌ها", desc: "کالای ذخیره‌شده رو به تمام‌شدن است" },
  { key: "promo", title: "پیام‌های تبلیغاتی", desc: "تخفیف‌ها و رویدادهای ویژه — پیش‌فرض خاموش" },
];

export default function SettingsView() {
  const back = useAppStore((s) => s.back);
  const { user, logout, deleteAccount } = useAuth();
  const notifications = useSettingsStore((s) => s.notifications);
  const setNotification = useSettingsStore((s) => s.setNotification);
  const privacy = useSettingsStore((s) => s.privacy);
  const setPrivacy = useSettingsStore((s) => s.setPrivacy);

  /* تأیید دومرحله‌ای حذف حساب: دیالوگ ۱ پیامدها + تأیید → دیالوگ ۲ پرسش نهایی */
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0);

  const onLogout = () => {
    logout();
    toast("از حساب خارج شدی");
    back();
  };

  const onDeleteFinal = () => {
    deleteAccount();
    setDeleteStep(0);
    toast.success("حساب حذف شد — این یک دمو است و داده‌ای واقعی نبود");
    back();
  };

  return (
    <div className="flex flex-1 flex-col" aria-label="تنظیمات">
      <PageHeader title="تنظیمات" onBack={back} />

      <div className="px-4 py-4 space-y-5">
        {/* ── اعلان‌ها ── */}
        <section className="space-y-2" aria-label="اعلان‌ها">
          <SectionTitle title="اعلان‌ها" icon="🔔" />
          <div className="bg-ls-card border border-white/5 rounded-2xl p-1.5 divide-y divide-white/5">
            {NOTIFICATION_ROWS.map((row) => (
              <div key={row.key} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold">{row.title}</p>
                  <p className="mt-0.5 text-[11px] leading-5 text-white/45">{row.desc}</p>
                </div>
                <Switch
                  checked={notifications[row.key]}
                  onCheckedChange={(v) => setNotification(row.key, v)}
                  aria-label={`${row.title}: ${notifications[row.key] ? "روشن" : "خاموش"}`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* ── حریم خصوصی ── */}
        <section className="space-y-2" aria-label="حریم خصوصی">
          <SectionTitle title="حریم خصوصی" icon="🛡️" />
          <div className="bg-ls-card border border-white/5 rounded-2xl p-1.5">
            <div className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold">نمایش خریدهای من در فید عمومی</p>
                <p className="mt-0.5 text-[11px] leading-5 text-white/45">
                  اگر خاموش باشد خریدهایت در «کسی دارد می‌خرد» دیده نمی‌شود
                </p>
              </div>
              <Switch
                checked={privacy.showPurchases}
                onCheckedChange={(v) => setPrivacy("showPurchases", v)}
                aria-label={`نمایش خریدها در فید عمومی: ${privacy.showPurchases ? "روشن" : "خاموش"}`}
              />
            </div>
          </div>
        </section>

        {/* ── حساب ── */}
        <section className="space-y-2" aria-label="حساب کاربری">
          <SectionTitle title="حساب" icon="👤" />
          <div className="bg-ls-card border border-white/5 rounded-2xl p-1.5 space-y-0.5">
            <button
              type="button"
              onClick={() => user ? useAppStore.getState().push("profileEdit") : toast("اول وارد شو")}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-right hover:bg-white/5 transition-colors"
              aria-label="ویرایش پروفایل"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ls-card-2 text-ls-purple-soft shrink-0">
                <UserCog className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-bold">ویرایش پروفایل</span>
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-right hover:bg-white/5 transition-colors"
              aria-label="خروج از حساب"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ls-card-2 text-ls-pink shrink-0">
                <LogOut className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-bold">{user ? "خروج از حساب" : "خروج (فعلاً مهمان هستی)"}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeleteStep(1)}
              className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-right text-red-400 hover:bg-red-400/5 transition-colors"
              aria-label="حذف حساب"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-400/10 text-red-400 shrink-0">
                <Trash2 className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="flex-1 text-sm font-bold">حذف حساب</span>
            </button>
          </div>
        </section>
      </div>

      {/* ── دیالوگ ۱ حذف حساب: پیامدها ── */}
      <AlertDialog open={deleteStep === 1} onOpenChange={(o) => !o && setDeleteStep(0)}>
        <AlertDialogContent dir="rtl" className="bg-ls-card border-white/10 max-w-[340px] rounded-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <ShieldAlert className="h-5 w-5 text-red-400" aria-hidden />
              حساب تو حذف شود؟
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-xs leading-6 text-white/60">
                <p>حذف حساب برگشت‌پذیر نیست و این اتفاق‌ها می‌افتد:</p>
                <ul className="list-disc space-y-1 pr-4">
                  <li>سفارش‌های در جریان و تاریخچهٔ خرید پاک می‌شود</li>
                  <li>موجودی کیف پول فقط تا ۷۲ ساعت بعد برای بازگشت به حساب بانکی قابل درخواست است</li>
                  <li>فالوها، آدرس‌ها و امتیاز باشگاه از بین می‌رود</li>
                  <li>شمارهٔ موبایل تا ۳۰ روز برای ثبت‌نام مجدد آزاد نمی‌شود</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="rounded-xl border-white/10 bg-transparent text-white/80 hover:bg-white/5">
              منصرف شدم
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setDeleteStep(2)}
              className="rounded-xl bg-red-500 text-white hover:bg-red-500/90"
              aria-label="ادامه به مرحلهٔ تأیید نهایی حذف حساب"
            >
              متوجه‌ام، ادامه بده
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── دیالوگ ۲ حذف حساب: پرسش نهایی ── */}
      <AlertDialog open={deleteStep === 2} onOpenChange={(o) => !o && setDeleteStep(0)}>
        <AlertDialogContent dir="rtl" className="bg-ls-card border-white/10 max-w-[340px] rounded-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="flex items-center gap-2 text-base">
              <ShieldCheck className="h-5 w-5 text-amber-400" aria-hidden />
              مطمئنی؟ این آخرین تأیید است
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-6 text-white/60">
              با این تأیید، حساب تو بلافاصله حذف می‌شود و امکان بازگرداندن آن وجود ندارد.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="rounded-xl border-white/10 bg-transparent text-white/80 hover:bg-white/5">
              نه، حسابم می‌ماند
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteFinal}
              className="rounded-xl bg-red-500 text-white hover:bg-red-500/90"
              aria-label="حذف نهایی حساب"
            >
              بله، حسابم را حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
