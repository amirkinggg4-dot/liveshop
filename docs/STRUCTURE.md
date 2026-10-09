# ساختار پروژه — LiveShop (STRUCTURE)

این سند دقیقاً مشخص می‌کند هر بخش اصلی اپ در **کدام فایل** است. معماری: **SPA تک‌مسیره** — تنها روت URL، `/` است و ۲۶ «صفحه» به‌صورت View داخلی با روتر stack (zustand) مدیریت می‌شوند.

---

## ۱) درخت فایل‌ها

```
LiveShop/
├── README.md                        # معرفی، نصب/اجرا، مسیرها
├── CHANGELOG.md                     # تاریخچهٔ نسخه‌ها (v1.0 → v1.3.1)
├── docs/
│   ├── STRUCTURE.md                 # همین سند
│   └── screenshots/                 # ۵۴ اسکرین‌شات مرورگر (۲۵ ویو + ۲ حالت × موبایل/دسکتاپ)
├── package.json                     # اسکریپت‌ها و وابستگی‌ها
├── next.config.ts · tsconfig.json · tailwind.config.ts · postcss.config.mjs
├── components.json                  # پیکربندی shadcn/ui
├── prisma/
│   └── schema.prisma                # اسکیمای Prisma (SQLite)
├── db/
│   └── custom.db                    # دیتابیس SQLite از قبل پرشده (mock)
├── public/
│   ├── liveshop/                    # عکس‌های واقعی اپ (ویدیو/کالا/آواتار)
│   │   ├── live-sh1.jpg · live-sh2.jpg · live-sh3.jpg   # پس‌زمینهٔ ویدیوی شوها
│   │   ├── item-it1.jpg · item-it3.jpg                  # عکس کالاهای در حال مزایده
│   │   └── seller-s1.jpg                                # آواتار فروشندهٔ سینا
│   ├── logo.svg · robots.txt
├── src/
│   ├── app/
│   │   ├── layout.tsx               # <html lang="fa" dir="rtl"> + فونت Vazirmatn + Toaster
│   │   ├── globals.css              # توکن‌های برند، تم تیره، انیمیشن‌ها (ls-kenburns و …)
│   │   ├── page.tsx                 # تنها روت: مونتاژ AppShell (SPA)
│   │   └── api/route.ts             # اندپوینت تست/سلامت /api
│   ├── components/
│   │   ├── ui/                      # کامپوننت‌های shadcn/ui
│   │   └── liveshop/
│   │       ├── AppShell.tsx         # قالب اپ: هدر بالا + ناوبری پایین ۵تایی + سوییچ ویوها
│   │       ├── shared.tsx           # ShowCard، Avatar، PageHeader، Price و …
│   │       ├── bid-sheet.tsx        # ★ شیت مزایده (استپر + Max Bid)
│   │       ├── shop-tab.tsx         # ★ نوار/تب Shop داخل اتاق لایو
│   │       ├── seller-live-dashboard.tsx   # ★ داشبورد زندهٔ فروشنده (پشت دوربین)
│   │       ├── pre-bid-sheet.tsx    # شیت پیش‌بید شوهای به‌زودی
│   │       ├── giveaway-modal.tsx   # گیواوی زنده
│   │       ├── raid-cohost.tsx      # Raid و کو-هاست (دو شیت)
│   │       ├── dispute-sheet.tsx    # ضمانت خریدار / باز کردن اختلاف
│   │       ├── saved-searches.tsx   # جستجوهای ذخیره‌شدهٔ کاوش
│   │       ├── gateway-dialog.tsx   # درگاه شبیه‌سازی‌شدهٔ زرین‌پال/آیدی‌پی
│   │       ├── confetti.tsx         # افکت کانفتی برد
│   │       └── views/               # ۲۶ صفحهٔ اپ (فهرست کامل در README)
│   │           ├── HomeView.tsx · ExploreView.tsx · LiveView.tsx · ProductView.tsx
│   │           ├── CheckoutView.tsx · OrdersView.tsx · OrderDetailView.tsx
│   │           ├── WalletView.tsx · ProfileView.tsx · WinView.tsx
│   │           ├── SellerDashboardView.tsx · SellerInventoryView.tsx · SellerCreateListingView.tsx
│   │           ├── SellerScheduleView.tsx · SellerReadyRoomView.tsx · SellerOrdersView.tsx
│   │           ├── SellerRevenueView.tsx · SellerAnalyticsView.tsx · SellerMarketingView.tsx
│   │           ├── SellerRatesView.tsx · SellerHealthView.tsx · SellerSettingsView.tsx
│   │           ├── SellerStorefrontView.tsx
│   │           └── ActivityView.tsx · InboxView.tsx · RewardsView.tsx
│   ├── store/                       # ★ ۱۳ استور zustand (بخش ۳ همین سند)
│   ├── lib/
│   │   ├── data/                    # ★ دیتای mock (بخش ۴ همین سند)
│   │   ├── format.ts                # toFa / faNum / toman / faClock (ارقام فارسی + تومان)
│   │   ├── db.ts                    # کلاین Prisma
│   │   └── utils.ts                 # cn و ابزارهای مشترک
│   └── hooks/                       # use-toast و use-mobile
├── .env.example                     # نام متغیرهای محیطی با مقدار خالی
└── worklog.md                       # دفتر کار مشترک ایجنت‌ها
```

---

## ۲) فایل‌های صفحات کلیدی (دقیقاً کجاست؟)

| بخش | فایل دقیق |
| --- | --- |
| **صفحهٔ اتاق لایو (Live Room)** | `src/components/liveshop/views/LiveView.tsx` — بازطراحی‌شده در v1.3.1 مطابق مرجع Whatnot؛ شامل کامپوننت‌های داخلی: `LiveVideoLayer` (ویدیوی تمام‌صفحهٔ 100dvh)، `LiveHeader` (پیل فروشنده/بیننده)، `LiveRail` (دکمه‌های ۴۴px با برچسب فارسی)، `LiveChatOverlay` (چت شناور چپ-پایین)، `WinnerBanner`، `ProductDock` (کارت پایین واحد + دکمهٔ ثبت بید و خرید فوری)، `DesktopSidePanels` (ستون ۴۲۰px مرکز در دسکتاپ)، `FinishedModal` |
| **شیت بید (Bid Sheet)** | `src/components/liveshop/bid-sheet.tsx` — Drawer از پایین روی ویدیو؛ استپر پله‌ای، توگل Max Bid، اعتبارسنجی کیف پول، تایمر قرمز پالس‌دار |
| **شیت پیش‌بید** | `src/components/liveshop/pre-bid-sheet.tsx` |
| **چت لایو** | داخل خود صفحهٔ اتاق لایو است: `src/components/liveshop/views/LiveView.tsx` → کامپوننت `LiveChatOverlay` (پیام‌های سفید روی ویدیو با گرادیان، محو شدن بعد ~۶ ثانیه، حداکثر ۴ پیام، ورودی «پیام بنویس…»). **دیتای پیام‌ها:** `src/lib/data/chat.ts` |
| **نوار Shop (تب فروشگاه داخل لایو)** | `src/components/liveshop/shop-tab.tsx` — چهار وضعیت رنگی (در مزایده/آیتم بعدی/خرید فوری/فروخته‌شده) |
| **داشبورد فروشنده در لایو (پشت دوربین)** | `src/components/liveshop/seller-live-dashboard.tsx` — شیت روی ویدیو: فروش زنده، فید رویدادها، بیننده‌ها، انعام، Raid/کو-هاست (از `raid-cohost.tsx`) |
| **پنل/Seller Hub فروشنده** | `src/components/liveshop/views/SellerDashboardView.tsx` |
| **ناوبری و ثبت ویوها** | `src/store/app-store.ts` (نوع `ViewName`، `NAV_VIEWS`، روتر stack) + `src/components/liveshop/AppShell.tsx` |

## ۳) استورهای zustand — `src/store/`

| فایل | نقش |
| --- | --- |
| `app-store.ts` | روتر stack صفحات (push/back/setRoot) + `ViewName` و `NAV_VIEWS` |
| `live-store.ts` | موتور مزایدهٔ شبیه‌سازی‌شده: بید فعلی، پله، تایمر و تمدید ۱۰ ثانیه‌ای، ربات‌های رقیب، Max Bid، فاز شو |
| `wallet-store.ts` | موجودی، شارژ/تودیع، تاریخچهٔ تراکنش‌ها با برچسب درگاه |
| `orders-store.ts` | سفارش‌های خریدار و وضعیت‌های آن‌ها |
| `seller-store.ts` | سفارش‌های فروشنده (چاپ لیبل/کد رهگیری/تکمیل)، شوهای زمان‌بندی‌شده، انعام، پیش‌نویس‌ها |
| `seller-p1-store.ts` | وضعیت‌های فاز ۳ سمت فروشنده (بازاریابی/نرخ‌ها و …) |
| `activity-store.ts` | بیدها، پیشنهادهای خرید خصوصی و تاریخچهٔ فعالیت |
| `inbox-store.ts` | اعلان‌های صندوق ورودی (ناخوان‌ها، فیلترها) |
| `rewards-store.ts` | امتیاز، سطح، استریک، مأموریت‌ها و نشان‌ها |
| `prebid-store.ts` | پیش‌بید شوهای به‌زودی (ثبت/لغو) |
| `protection-store.ts` | ضمانت خریدار و پرونده‌های اختلاف |
| `marketing-store.ts` | بسته‌های تقویت شو و کدهای تخفیف |
| `raid-store.ts` | Raid و کو-هاست (دعوت‌ها، مقصدها) |

## ۴) دیتای mock — `src/lib/data/`

| فایل | محتوا |
| --- | --- |
| `types.ts` | تایپ‌های مشترک (Show، Seller، Item، Order و …) |
| `categories.ts` | ۱۰ دسته‌بندی با آیکون و شمارنده |
| `shows.ts` | فروشنده‌ها و شوهای زنده/به‌زودی |
| `items.ts` | آیتم‌های هر شو با ۴ وضعیت (در مزایده/آیتم بعدی/خرید فوری/فروخته‌شده) |
| `chat.ts` | پیام‌های اولیهٔ چت لایو + پیام‌های خریدمحور |
| `orders.ts` | روش‌های ارسال ایرانی (تیپاکس/پست/پیک) + سفارش‌های اولیه |
| `media.ts` | نقشهٔ عکس‌های واقعی: `SHOW_VIDEO` / `ITEM_PHOTO` / `SELLER_PHOTO` + fallback گرادیان |
| `seller.ts` | شوهای زمان‌بندی‌شده، سفارش‌های فروشنده با مهلت اسکن، درآمد و پلکان کارمزد، بیننده‌ها |
| `buyer-p1.ts` | دیتای فاز ۳ خریدار (بیدها/پیشنهادها/اعلان‌ها/اختلاف) |
| `rewards-p1.ts` | سطوح، نشان‌ها و مأموریت‌های ریواردز |
| `seller-analytics.ts` | KPIها، روند فروش، قیف تبدیل، نقشهٔ حرارتی |
| `seller-marketing.ts` | بسته‌های تقویت و کدهای تخفیف |
| `raid-p1.ts` | شوهای مقصد Raid و دعوت‌های کو-هاست |

> دیتابیس SQLite (`db/custom.db`) نیز همین داده‌های mock را نگه می‌دارد و با `npm run db:push` از نو ساخته می‌شود.

## ۵) اسکرین‌شات‌ها — `docs/screenshots/`

۵۴ فایل PNG: هر صفحه در دو نمای **موبایل ۳۹۰×۸۴۴** (`*-mobile.png`) و **دسکتاپ ۱۲۸۰×۸۰۰** (`*-desktop.png`) + دو حالت اضافهٔ اتاق لایو:
- `live-room-bid-sheet-open-{mobile,desktop}.png` — شیت بید باز روی ویدیو
- `seller-live-dashboard-{mobile,desktop}.png` — داشبورد زندهٔ فروشنده روی ویدیو

نام‌گذاری بر اساس ویو/مسیر است (مثال: `live-room-mobile.png`، `seller-hub-desktop.png`).
