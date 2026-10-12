"use client";

/* ─────────────────────────────────────────────────────────────
   v1.9.0 — صفحهٔ حساب: سربرگ auth-aware (مهمان ← «ورود / ثبت‌نام»؛
   لاگین ← پروفایل + ویرایش)، منوی کامل (آدرس‌ها، تنظیمات، پشتیبانی،
   سؤالات متداول، قوانین، حریم خصوصی)، خروج با تأیید و جایگاه
   «نماد اعتماد» در پایین صفحه.
   ───────────────────────────────────────────────────────────── */

import type { ReactNode } from "react";
import {
  ChevronLeft,
  Wallet,
  Package,
  Store,
  MapPin,
  Settings,
  LifeBuoy,
  Info,
  Gavel,
  Inbox,
  Trophy,
  HelpCircle,
  ScrollText,
  ShieldCheck,
  LogOut,
  UserPlus,
  type LucideIcon,
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
import { toast } from "sonner";
import { useState } from "react";
import { useAppStore } from "@/store/app-store";
import { useOrdersStore } from "@/store/orders-store";
import { useWalletStore } from "@/store/wallet-store";
import { useActivityStore } from "@/store/activity-store";
import { useInboxStore, selectUnreadCount } from "@/store/inbox-store";
import { useRewardsStore } from "@/store/rewards-store";
import { useAuth } from "@/store/auth-store";
import { useSellerEntry } from "@/components/liveshop/seller-intro-sheet";
import { faNum, toFa, toman } from "@/lib/format";
import { Avatar } from "@/components/liveshop/shared";
import { TrustBadgePlaceholder } from "@/components/liveshop/trust-badge";
import { AUCTION_ENABLED } from "@/lib/config";

function MenuRow({
  icon: Icon,
  title,
  trailing,
  onClick,
  tone,
}: {
  icon: LucideIcon;
  title: string;
  trailing?: ReactNode;
  onClick: () => void;
  tone?: "danger";
}) {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      className={cnRow(tone)}
    >
      <span
        className={
          tone === "danger"
            ? "w-9 h-9 rounded-xl bg-red-400/10 flex items-center justify-center text-red-400 shrink-0"
            : "w-9 h-9 rounded-xl bg-ls-card-2 flex items-center justify-center text-ls-purple-soft shrink-0"
        }
      >
        <Icon className="w-[18px] h-[18px]" aria-hidden />
      </span>
      <span className="flex-1 text-sm font-bold truncate">{title}</span>
      {trailing}
      <ChevronLeft className="w-4 h-4 text-white/30 shrink-0" aria-hidden />
    </button>
  );
}

function cnRow(tone?: "danger") {
  return tone === "danger"
    ? "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-right text-red-400 hover:bg-red-400/5 transition-colors"
    : "w-full flex items-center gap-3 rounded-xl px-3 py-3 text-right hover:bg-white/5 transition-colors";
}

export default function ProfileView() {
  const push = useAppStore((s) => s.push);
  const setRoot = useAppStore((s) => s.setRoot);
  const orders = useOrdersStore((s) => s.orders);
  const balance = useWalletStore((s) => s.balance);
  const myBids = useActivityStore((s) => s.myBids);
  const unreadCount = useInboxStore(selectUnreadCount);
  const rewardPoints = useRewardsStore((s) => s.points);
  const { user, logout, openLoginSheet } = useAuth();
  /* v2.0.1 — «فروشندهٔ من»: مهمان/none ← شیت معرفی فروشندگی؛
     بقیهٔ وضعیت‌ها ← مستقیم به پنل/کارت وضعیت (رفتار v1.9.1) */
  const handleSellerEntry = useSellerEntry();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const activeBidsCount = myBids.filter(
    (b) => b.status === "leading" || b.status === "outbid"
  ).length;

  const onLogoutConfirm = () => {
    logout();
    setLogoutOpen(false);
    toast("از حساب خارج شدی");
  };

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 space-y-5">
      {/* ── سربرگ auth-aware ── */}
      <section
        aria-label="پروفایل کاربری"
        className="bg-ls-card border border-white/5 rounded-2xl p-4"
      >
        {user ? (
          <div className="flex items-center gap-4">
            <Avatar emoji={user.avatarEmoji} color={user.avatarColor} size="xl" />
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-lg">{user.name}</p>
              <p className="text-xs text-white/45 mt-0.5" dir="ltr">
                @{user.username}
              </p>
              <p className="text-[11px] text-white/35 mt-1">{user.memberSince}</p>
            </div>
            <button
              onClick={() => push("profileEdit")}
              aria-label="ویرایش پروفایل"
              className="mr-auto shrink-0 rounded-full border border-white/15 bg-ls-card-2 px-3.5 py-1.5 text-xs font-bold text-white/80 hover:bg-ls-line transition-colors"
            >
              ویرایش
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/[0.03] text-white/30"
              aria-hidden
            >
              <UserPlus className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-base">وارد نشدی</p>
              <p className="text-[11px] text-white/45 mt-0.5 leading-5">
                برای خرید امانی و کیف پول وارد شو — مرور بدون ورود آزاد است.
              </p>
            </div>
            <button
              onClick={() => openLoginSheet()}
              aria-label="ورود یا ثبت‌نام"
              className="mr-auto shrink-0 rounded-full bg-ls-purple px-4 py-2 text-xs font-black text-white hover:bg-ls-purple/90 transition-colors"
            >
              ورود / ثبت‌نام
            </button>
          </div>
        )}
      </section>

      {/* ردیف آمار */}
      <section className="grid grid-cols-3 gap-3" aria-label="آمار حساب">
        <div className="bg-ls-card border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-lg font-extrabold tabular-nums">{faNum(orders.length)}</p>
          <p className="text-[11px] text-white/45 mt-0.5">خریدها</p>
        </div>
        <div className="bg-ls-card border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-lg font-extrabold tabular-nums">{toFa(24)}</p>
          <p className="text-[11px] text-white/45 mt-0.5">فالوشده‌ها</p>
        </div>
        <div className="bg-ls-card border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-lg font-extrabold tabular-nums">{toFa(640)}</p>
          <p className="text-[11px] text-white/45 mt-0.5">امتیاز باشگاه</p>
        </div>
      </section>

      {/* منوی حساب */}
      <nav
        aria-label="منوی حساب"
        className="bg-ls-card border border-white/5 rounded-2xl p-1.5 space-y-0.5"
      >
        <MenuRow
          icon={Wallet}
          title="کیف پول"
          trailing={
            <span className="text-xs font-bold text-ls-green tabular-nums">
              {toman(balance)}
            </span>
          }
          onClick={() => push("wallet")}
        />
        <MenuRow
          icon={Package}
          title="سفارش‌ها"
          trailing={
            <span className="text-xs font-bold text-white/50 tabular-nums">
              {faNum(orders.length)}
            </span>
          }
          onClick={() => setRoot("orders")}
        />
        <MenuRow
          icon={Store}
          title="فروشندهٔ من"
          onClick={() =>
            /* v2.0.1 — گیت ورود با شیت معرفی: مهمان/none ← شیت؛ بقیه ← مستقیم */
            handleSellerEntry()
          }
        />
        <MenuRow
          icon={MapPin}
          title="آدرس‌ها"
          onClick={() => push("addresses")}
        />
        {/* فاز ۳ (P1) — فعالیت‌ها، صندوق ورودی، باشگاه ریواردز (فقط اضافه‌شده) */}
        <MenuRow
          icon={Gavel}
          title={AUCTION_ENABLED ? "فعالیت‌ها و بیدها" : "فعالیت‌ها"}
          trailing={
            AUCTION_ENABLED && activeBidsCount > 0 ? (
              <span className="rounded-full bg-ls-purple/20 border border-ls-purple/40 px-2 py-0.5 text-[10px] font-bold text-ls-purple-soft tabular-nums">
                {faNum(activeBidsCount)} بید فعال
              </span>
            ) : undefined
          }
          onClick={() => push("activity")}
        />
        <MenuRow
          icon={Inbox}
          title="صندوق ورودی"
          trailing={
            unreadCount > 0 ? (
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ls-green animate-ls-pulse" aria-hidden />
                <span className="text-xs font-bold text-ls-green tabular-nums">
                  {faNum(unreadCount)} ناخوانده
                </span>
              </span>
            ) : undefined
          }
          onClick={() => push("inbox")}
        />
        <MenuRow
          icon={Trophy}
          title="باشگاه ریواردز"
          trailing={
            <span className="text-xs font-bold text-ls-pink tabular-nums">
              {faNum(rewardPoints)} امتیاز
            </span>
          }
          onClick={() => push("rewards")}
        />
      </nav>

      {/* اعتماد و پشتیبانی */}
      <nav
        aria-label="اعتماد و پشتیبانی"
        className="bg-ls-card border border-white/5 rounded-2xl p-1.5 space-y-0.5"
      >
        <MenuRow icon={HelpCircle} title="سؤالات متداول" onClick={() => push("faq")} />
        <MenuRow icon={ScrollText} title="قوانین و مقررات" onClick={() => push("terms")} />
        <MenuRow icon={ShieldCheck} title="حریم خصوصی" onClick={() => push("privacy")} />
        <MenuRow icon={LifeBuoy} title="تماس با پشتیبانی" onClick={() => push("support")} />
        <MenuRow icon={Settings} title="تنظیمات" onClick={() => push("settings")} />
        {user && (
          <MenuRow icon={LogOut} title="خروج از حساب" tone="danger" onClick={() => setLogoutOpen(true)} />
        )}
        <MenuRow
          icon={Info}
          title="دربارهٔ LiveShop"
          onClick={() => toast("LiveShop — دمو")}
        />
      </nav>

      {/* جایگاه نماد اعتماد */}
      <TrustBadgePlaceholder />

      {/* ── تأیید خروج ── */}
      <AlertDialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <AlertDialogContent dir="rtl" className="bg-ls-card border-white/10 max-w-[340px] rounded-2xl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-base">از حساب خارج شوی؟</AlertDialogTitle>
            <AlertDialogDescription className="text-xs leading-6 text-white/60">
              برای خرید و دیدن کیف پول دوباره باید وارد شوی. مرور و جستجو بدون ورود آزاد است.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel className="rounded-xl border-white/10 bg-transparent text-white/80 hover:bg-white/5">
              منصرف شدم
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onLogoutConfirm}
              className="rounded-xl bg-ls-pink text-white hover:bg-ls-pink/90"
              aria-label="تأیید خروج از حساب"
            >
              بله، خارج شو
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
