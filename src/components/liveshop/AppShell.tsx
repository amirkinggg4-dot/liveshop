"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { toFa, toman } from "@/lib/format";
import { useAppStore, NAV_VIEWS, type ViewName } from "@/store/app-store";
import { useWalletStore } from "@/store/wallet-store";
import {
  Home,
  Compass,
  Package,
  User,
  Store,
  Wallet as WalletIcon,
} from "lucide-react";
import type { ReactNode } from "react";

import HomeView from "./views/HomeView";
import ExploreView from "./views/ExploreView";
import LiveView from "./views/LiveView";
import ProductView from "./views/ProductView";
import CheckoutView from "./views/CheckoutView";
import OrdersView from "./views/OrdersView";
import OrderDetailView from "./views/OrderDetailView";
import OrderReceiptView from "./views/OrderReceiptView";
import WalletView from "./views/WalletView";
import ProfileView from "./views/ProfileView";
import SellerDashboardView from "./views/SellerDashboardView";
import SellerInventoryView from "./views/SellerInventoryView";
import WinView from "./views/WinView";
import SellerScheduleView from "./views/SellerScheduleView";
import SellerReadyRoomView from "./views/SellerReadyRoomView";
import SellerOrdersView from "./views/SellerOrdersView";
import SellerRevenueView from "./views/SellerRevenueView";
import SellerCreateListingView from "./views/SellerCreateListingView";
import ActivityView from "./views/ActivityView";
import InboxView from "./views/InboxView";
import RewardsView from "./views/RewardsView";
import SellerAnalyticsView from "./views/SellerAnalyticsView";
import SellerHealthView from "./views/SellerHealthView";
import SellerMarketingView from "./views/SellerMarketingView";
import SellerRatesView from "./views/SellerRatesView";
import SellerStorefrontView from "./views/SellerStorefrontView";
import SellerSettingsView from "./views/SellerSettingsView";
import SellerOnboardingView from "./views/SellerOnboardingView";
// v2.0.2 — مرحلهٔ ۱ ثبت‌نام فروشنده: انتخاب دسته
import SellerCategoryPickView from "./views/SellerCategoryPickView";
// v2.0.3 — مرحلهٔ ۲ ثبت‌نام فروشنده: انتخاب زیرمجموعه
import SellerSubcategoryPickView from "./views/SellerSubcategoryPickView";
import SellerLiveReportView from "./views/SellerLiveReportView";
// v1.9.0 — حساب و ورود
import ProfileEditView from "./views/ProfileEditView";
import AddressesView from "./views/AddressesView";
import SettingsView from "./views/SettingsView";
import FaqView from "./views/FaqView";
import SellerFaqView from "./views/SellerFaqView";
import TermsView from "./views/TermsView";
import PrivacyView from "./views/PrivacyView";
import SupportView from "./views/SupportView";
import LoginSheet from "./login-sheet";
// v2.0.1 — شیت معرفی فروشندگی (غیرفروشنده/مهمان)
import SellerIntroSheet, {
  useSellerEntry,
} from "./seller-intro-sheet";
import {
  useSellerOnboardingStore,
} from "@/store/seller-onboarding-store";
import { useInboxStore } from "@/store/inbox-store";

const VIEW_COMPONENTS: Record<ViewName, () => ReactNode> = {
  home: HomeView,
  explore: ExploreView,
  live: LiveView,
  product: ProductView,
  checkout: CheckoutView,
  orders: OrdersView,
  orderDetail: OrderDetailView,
  orderReceipt: OrderReceiptView,
  wallet: WalletView,
  profile: ProfileView,
  sellerDashboard: SellerDashboardView,
  sellerInventory: SellerInventoryView,
  win: WinView,
  sellerSchedule: SellerScheduleView,
  sellerReadyRoom: SellerReadyRoomView,
  sellerOrders: SellerOrdersView,
  sellerRevenue: SellerRevenueView,
  sellerListing: SellerCreateListingView,
  // فاز ۳ (P1)
  activity: ActivityView,
  inbox: InboxView,
  rewards: RewardsView,
  sellerAnalytics: SellerAnalyticsView,
  sellerHealth: SellerHealthView,
  sellerMarketing: SellerMarketingView,
  sellerRates: SellerRatesView,
  sellerStorefront: SellerStorefrontView,
  sellerSettings: SellerSettingsView,
  // v1.7.0 — فروش: onboarding + گزارش پایان لایو
  sellerOnboarding: SellerOnboardingView,
  // v2.0.2 — مرحلهٔ ۱ ثبت‌نام: انتخاب دسته (بین شیت معرفی و مرحلهٔ زیرمجموعه)
  sellerCategoryPick: SellerCategoryPickView,
  // v2.0.3 — مرحلهٔ ۲ ثبت‌نام: انتخاب زیرمجموعه (بین دسته و فرم شروع فروش)
  sellerSubcategoryPick: SellerSubcategoryPickView,
  sellerLiveReport: SellerLiveReportView,
  // v1.9.0 — حساب و ورود
  profileEdit: ProfileEditView,
  addresses: AddressesView,
  settings: SettingsView,
  faq: FaqView,
  sellerFaq: SellerFaqView,
  terms: TermsView,
  privacy: PrivacyView,
  support: SupportView,
};

const NAV_ITEMS: {
  view: ViewName;
  label: string;
  icon: typeof Home;
}[] = [
  { view: "home", label: "خانه", icon: Home },
  { view: "explore", label: "کاوش", icon: Compass },
  { view: "sellerDashboard", label: "فروش", icon: Store },
  { view: "orders", label: "سفارش‌ها", icon: Package },
  { view: "profile", label: "حساب", icon: User },
];

/* v1.6.3 — عرض ستون اصلی per-view:
   کاوش در دسکتاپ عریض‌تر می‌شود تا گرید نتیجه‌ها ۳ تا ۴ ستون ببیند؛
   بقیهٔ صفحه‌ها همان max-w-md قبلی‌اند (بدون هیچ تغییر بصری). */
const VIEW_MAX_WIDTH: Partial<Record<ViewName, string>> = {
  explore: "max-w-md sm:max-w-2xl lg:max-w-4xl",
};

export default function AppShell() {
  const stack = useAppStore((s) => s.stack);
  const setRoot = useAppStore((s) => s.setRoot);
  const push = useAppStore((s) => s.push);
  const balance = useWalletStore((s) => s.balance);
  /* v2.0.1 — تب «فروش»: مهمان/none ← شیت معرفی فروشندگی؛
     pending/rejected/suspended/approved ← مستقیم (رفتار v1.9.1) */
  const handleSellerEntry = useSellerEntry();

  /* v1.9.1 — بازیابی وضعیت فروشنده + اعلان‌های تصمیم ادمین از sessionStorage
     (mock مشترک / و /admin — فقط روی mount، بعد از هیدریشن) */
  useEffect(() => {
    useSellerOnboardingStore.getState().hydrateFromSession();
    useInboxStore.getState().hydrateAdminNotifications();
  }, []);

  const current = stack[stack.length - 1];
  const View = VIEW_COMPONENTS[current.view];
  const showTopBar = current.view === "home" || current.view === "explore" || current.view === "orders" || current.view === "profile";
  const showNav = NAV_VIEWS.includes(current.view);
  const containerWidth = VIEW_MAX_WIDTH[current.view] ?? "max-w-md";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#12101f] via-ls-bg to-[#0a0812]">
      <div
        className={cn(
          "w-full mx-auto min-h-screen flex flex-col border-x border-white/5 shadow-2xl shadow-black/50",
          containerWidth
        )}
      >
        {showTopBar && (
          <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-ls-bg/85 backdrop-blur-md border-b border-white/5">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base"
                style={{
                  background: "linear-gradient(135deg, #6C5CFF, #FF3B8B)",
                }}
                aria-hidden
              >
                🛍️
              </span>
              <div className="leading-tight">
                <p className="font-black text-sm">LiveShop</p>
                <p className="text-[10px] text-white/55">خرید زنده با قیمت ثابت</p>
              </div>
            </div>
            <button
              onClick={() => push("wallet")}
              className="mr-auto flex items-center gap-1.5 rounded-full bg-ls-card-2 border border-ls-purple/30 pl-3 pr-2 py-1.5 text-xs font-bold hover:border-ls-purple/60 transition-colors"
              aria-label={`موجودی کیف پول: ${toman(balance)}`}
            >
              <WalletIcon className="w-4 h-4 text-ls-green" aria-hidden />
              <span className="tabular-nums">{toFa(balance.toLocaleString("en-US").replace(/,/g, "٬"))}</span>
              <span className="text-white/50 font-normal">تومان</span>
            </button>
          </header>
        )}

        <main className="flex-1 flex flex-col">{View ? <View /> : null}</main>

        {/* v1.9.0 — شیت ورود سراسری (خودش از استور auth باز/بسته می‌شود) */}
        <LoginSheet />

        {/* v2.0.1 — شیت معرفی فروشندگی (سراسری؛ از useSellerEntry باز می‌شود) */}
        <SellerIntroSheet />

        {showNav && (
          <nav
            className="sticky bottom-0 z-30 mt-auto bg-ls-card/95 backdrop-blur-md border-t border-white/5"
            aria-label="ناوبری اصلی"
          >
            <ul className="grid grid-cols-5 px-1 pb-[max(env(safe-area-inset-bottom),6px)] pt-1.5">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = current.view === item.view;
                /* v2.0.1 — تب فروش: مهمان/none ← شیت معرفی؛ بقیهٔ وضعیت‌ها ← مستقیم */
                const onNav =
                  item.view === "sellerDashboard"
                    ? handleSellerEntry
                    : () => setRoot(item.view);
                return (
                  <li key={item.view}>
                    <button
                      onClick={onNav}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "w-full flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors",
                        active ? "text-ls-purple-soft" : "text-white/55 hover:text-white/85"
                      )}
                    >
                      <Icon
                        className={cn("w-5 h-5", active && "drop-shadow-[0_0_8px_rgba(108,92,255,.8)]")}
                        aria-hidden
                      />
                      <span className="text-[10px] font-bold">{item.label}</span>
                      <span
                        className={cn(
                          "w-5 h-0.5 rounded-full transition-all",
                          active ? "bg-ls-purple" : "bg-transparent"
                        )}
                        aria-hidden
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
