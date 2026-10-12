"use client";

/* ─────────────────────────────────────────────────────────────
   v2.0.1 — شیت معرفی فروشندگی (SellerIntroSheet)
   وقتی کاربر غیرفروشنده (وضعیت none) یا مهمان روی تب «فروش» یا ردیف
   «فروشندهٔ من» می‌زند، یک Drawer پایین باز می‌شود با: ردیف افقی عکس
   کالاها (فقط عکس‌های public خود پروژه — ITEM_PHOTO تک‌منبع)، عنوان
   «می‌خواهی بفروشی؟»، سه مزیت با آیکون lucide و دو دکمهٔ «شروع»
   (مهمان ← ورود ← فرم شروع فروش) و «سؤالات متداول فروشنده».
   برای وضعیت‌های pending/rejected/suspended/approved این شیت نمایش
   داده نمی‌شود — مسیر مستقیم مانند قبل. بسته‌شدن با کشیدن (vaul) یا ✕.
   متن و ارقام فارسی، RTL، بدون ایموجی.
   ───────────────────────────────────────────────────────────── */

import {
  BadgePercent,
  ShieldCheck,
  Timer,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAppStore } from "@/store/app-store";
import { useAuthStore } from "@/store/auth-store";
import {
  useForcedSellerStatus,
  useSellerOnboardingStore,
} from "@/store/seller-onboarding-store";
import { useSellerIntroStore } from "@/store/seller-intro-store";
import { ITEM_PHOTO } from "@/lib/data/media";

/* عکس‌های ردیف معرفی — فقط از public خود پروژه (alt صادقانه = عنوان واقعی کالا)
   نکته: it5 حذف شد چون عکس تولیدشدهٔ آن (صندل) با عنوان داده («هودی») نمی‌خواند
   — ناهم‌خوانی قدیمی داده/عکس که بیرون از محدودهٔ این نسخه است. */
const INTRO_PHOTOS: Array<{ src: string; alt: string }> = [
  { src: ITEM_PHOTO.it1, alt: "کالای نمونهٔ فروشنده: نایک دَنک لو «پاندا»" },
  { src: ITEM_PHOTO.ct1, alt: "کالای نمونهٔ فروشنده: پوکمون کارت اولترا رِیر" },
  { src: ITEM_PHOTO.it8, alt: "کالای نمونهٔ فروشنده: کولهٔ ورزشی ضدآب ۳۰ لیتری" },
  { src: ITEM_PHOTO.it3, alt: "کالای نمونهٔ فروشنده: جردن ۱ مید «شیکاگو»" },
  { src: ITEM_PHOTO.ct2, alt: "کالای نمونهٔ فروشنده: فانکو پاپ ۱۰ اینچی" },
];

const BENEFITS: Array<{ icon: LucideIcon; label: string }> = [
  { icon: Timer, label: "در چند دقیقه شروع کن" },
  { icon: BadgePercent, label: "کارمزد شفاف" },
  { icon: ShieldCheck, label: "پرداخت امن امانی" },
];

/* ── منطق ورود به بخش فروش — مشترک بین تب «فروش» و ردیف «فروشندهٔ من» ──
   شیت فقط برای مهمان یا کاربر لاگین‌شدهٔ none باز می‌شود؛
   pending/rejected/suspended/approved مستقیم به پنل/کارت وضعیت می‌روند
   (رفتار v1.9.1 بدون تغییر). با کلید دموی ‎?seller=<وضعیت>‎ هم رفتار
   قبلی حفظ می‌شود تا گیت‌های وضعیت مثل قبل قابل نمایش/تست باشند. */
export function useSellerEntry(): () => void {
  const authUser = useAuthStore((s) => s.user);
  const openLoginSheet = useAuthStore((s) => s.openLoginSheet);
  const forced = useForcedSellerStatus();
  const storeStatus = useSellerOnboardingStore((s) => s.status);
  const setRoot = useAppStore((s) => s.setRoot);
  const openIntro = useSellerIntroStore((s) => s.openIntro);

  return () => {
    const status = forced ?? storeStatus;
    if (!authUser) {
      /* مهمان — با کلید دموی صریح، مسیر قبلی (شیت ورود) حفظ می‌شود */
      if (forced) {
        openLoginSheet(() => setRoot("sellerDashboard"));
        return;
      }
      openIntro();
      return;
    }
    if (status === "none") {
      openIntro();
      return;
    }
    /* pending/rejected/suspended/approved — بدون شیت، مستقیم مثل قبل */
    setRoot("sellerDashboard");
  };
}

export default function SellerIntroSheet() {
  const open = useSellerIntroStore((s) => s.open);
  const closeIntro = useSellerIntroStore((s) => s.closeIntro);
  const openIntro = useSellerIntroStore((s) => s.openIntro);
  const push = useAppStore((s) => s.push);
  const setRoot = useAppStore((s) => s.setRoot);
  const authUser = useAuthStore((s) => s.user);
  const openLoginSheet = useAuthStore((s) => s.openLoginSheet);

  /* «شروع» — مهمان: اول ورود، بعد فرم شروع فروش؛ لاگین: مستقیم فرم
     (پشته: پنل فروشنده ریشه می‌شود و فرم روی آن — بازگشت به بخش شروع) */
  const onStart = () => {
    closeIntro();
    const go = () => {
      setRoot("sellerDashboard");
      push("sellerOnboarding");
    };
    if (!authUser) {
      openLoginSheet(go);
      return;
    }
    go();
  };

  /* «سؤالات متداول فروشنده» — صفحهٔ FAQ مخصوص فروشنده */
  const onFaq = () => {
    closeIntro();
    push("sellerFaq");
  };

  return (
    <Drawer
      open={open}
      onOpenChange={(o) => (o ? openIntro() : closeIntro())}
    >
      <DrawerContent
        dir="rtl"
        aria-label="شیت معرفی فروشندگی"
        className="mx-auto max-w-md rounded-t-3xl border-t border-ls-purple/30 bg-ls-card px-5 pb-[max(env(safe-area-inset-bottom),20px)] text-right"
      >
        {/* بسته‌شدن با ✕ (کشیدن دستگیره هم پشتیبانی می‌شود — vaul) */}
        <button
          type="button"
          onClick={closeIntro}
          aria-label="بستن شیت معرفی فروشندگی"
          className="absolute left-3 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <div className="space-y-4 pb-3 pt-7">
          {/* ردیف افقی عکس کالاها */}
          <div
            className="-mx-5 flex gap-2.5 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="نمونهٔ کالاهای فروشندگان"
          >
            {INTRO_PHOTOS.map((p) => (
              <img
                key={p.src}
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="h-20 w-20 shrink-0 rounded-2xl border border-white/10 object-cover"
              />
            ))}
          </div>

          <div>
            <DrawerTitle className="text-lg font-black leading-7">
              می‌خواهی بفروشی؟
            </DrawerTitle>
            <DrawerDescription className="sr-only">
              معرفی فروشندگی در LiveShop — ثبت درخواست چند دقیقه طول می‌کشد،
              کارمزد شفاف است و پول خریدار امن امانی می‌ماند.
            </DrawerDescription>
          </div>

          {/* سه مزیت */}
          <ul className="space-y-2.5" aria-label="مزیت‌های فروشندگی">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ls-purple/15 text-ls-purple-soft">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                <span className="text-sm font-bold">{label}</span>
              </li>
            ))}
          </ul>

          {/* دو دکمه */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={onStart}
              aria-label="شروع فروشندگی"
              className="w-full rounded-2xl bg-ls-pink py-4 text-sm font-black text-white shadow-lg shadow-ls-pink/30 transition-colors hover:bg-ls-pink/90 active:scale-[.99]"
            >
              شروع
            </button>
            <button
              type="button"
              onClick={onFaq}
              aria-label="سؤالات متداول فروشنده"
              className="w-full rounded-2xl border border-white/10 bg-ls-card-2 py-4 text-sm font-extrabold text-white/80 transition-colors hover:border-ls-purple/40 hover:text-white active:scale-[.99]"
            >
              سؤالات متداول فروشنده
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
