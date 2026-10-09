"use client";

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
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/app-store";
import { useOrdersStore } from "@/store/orders-store";
import { useWalletStore } from "@/store/wallet-store";
import { useActivityStore } from "@/store/activity-store";
import { useInboxStore, selectUnreadCount } from "@/store/inbox-store";
import { useRewardsStore } from "@/store/rewards-store";
import { faNum, toFa, toman } from "@/lib/format";
import { Avatar } from "@/components/liveshop/shared";
import { AUCTION_ENABLED } from "@/lib/config";

function MenuRow({
  icon: Icon,
  title,
  trailing,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  trailing?: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-right hover:bg-white/5 transition-colors"
    >
      <span className="w-9 h-9 rounded-xl bg-ls-card-2 flex items-center justify-center text-ls-purple-soft shrink-0">
        <Icon className="w-[18px] h-[18px]" aria-hidden />
      </span>
      <span className="flex-1 text-sm font-bold truncate">{title}</span>
      {trailing}
      <ChevronLeft className="w-4 h-4 text-white/30 shrink-0" aria-hidden />
    </button>
  );
}

export default function ProfileView() {
  const push = useAppStore((s) => s.push);
  const setRoot = useAppStore((s) => s.setRoot);
  const orders = useOrdersStore((s) => s.orders);
  const balance = useWalletStore((s) => s.balance);
  /* فاز ۳ — شمارنده‌های زنده برای ردیف‌های جدید */
  const myBids = useActivityStore((s) => s.myBids);
  const unreadCount = useInboxStore(selectUnreadCount);
  const rewardPoints = useRewardsStore((s) => s.points);
  const activeBidsCount = myBids.filter(
    (b) => b.status === "leading" || b.status === "outbid"
  ).length;

  return (
    <div className="flex-1 flex flex-col px-4 pt-4 pb-8 space-y-5">
      {/* کارت پروفایل */}
      <section
        aria-label="پروفایل کاربری"
        className="bg-ls-card border border-white/5 rounded-2xl p-4"
      >
        <div className="flex items-center gap-4">
          <Avatar emoji="🧑‍💻" color="#6C5CFF" size="xl" />
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-lg">علی رضایی</p>
            <p className="text-xs text-white/45 mt-0.5" dir="ltr">
              @ali_rezaei
            </p>
            <p className="text-[11px] text-white/35 mt-1">عضو از ۱۴۰۲</p>
          </div>
          <button
            onClick={() => toast("ویرایش پروفایل (دمو)")}
            aria-label="ویرایش پروفایل"
            className="mr-auto shrink-0 rounded-full border border-white/15 bg-ls-card-2 px-3.5 py-1.5 text-xs font-bold text-white/80 hover:bg-ls-line transition-colors"
          >
            ویرایش
          </button>
        </div>
      </section>

      {/* ردیف آمار */}
      <section className="grid grid-cols-3 gap-3" aria-label="آمار حساب">
        <div className="bg-ls-card border border-white/5 rounded-2xl p-3 text-center">
          <p className="text-lg font-extrabold tabular-nums">
            {faNum(orders.length)}
          </p>
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
          onClick={() => setRoot("sellerDashboard")}
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
        <MenuRow
          icon={MapPin}
          title="آدرس‌ها"
          onClick={() => toast("آدرس‌ها (دمو)")}
        />
        <MenuRow
          icon={Settings}
          title="تنظیمات"
          onClick={() => toast("تنظیمات (دمو)")}
        />
        <MenuRow
          icon={LifeBuoy}
          title="پشتیبانی"
          onClick={() => toast("پشتیبانی (دمو)")}
        />
        <MenuRow
          icon={Info}
          title="دربارهٔ LiveShop"
          onClick={() => toast("نسخهٔ ۱٫۰ — دمو")}
        />
      </nav>
    </div>
  );
}
