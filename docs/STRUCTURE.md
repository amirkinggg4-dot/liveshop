# ساختار پروژه — LiveShop (STRUCTURE)

این سند دقیقاً مشخص می‌کند هر بخش اصلی اپ در **کدام فایل** است. معماری: **SPA تک‌مسیره** — تنها روت URL، `/` است و ۲۶ «صفحه» به‌صورت View داخلی با روتر stack (zustand) مدیریت می‌شوند.

> **v1.4.1 — اصلاحات ظاهری روی v1.4:** کلید `AUCTION_ENABLED = false` در `src/lib/config.ts` همهٔ بخش‌های حراج را پنهان می‌کند (نه حذف‌شده). با `true` کردن همین کلید، شیت بید، Max Bid، تایمر، پیل برندهٔ فعلی، ربات‌های بیدگذار، تب بیدها، WinView، پیش‌بید و فیلد قیمت مزایده دوباره فعال می‌شوند. در v1.4.1 فقط ظاهر اصلاح شد (برچسب تکراری، شیت خرید، دسته‌بندی‌ها) — منطق/استورها/دیتای mock دست نخورد.

---

## ۱) درخت فایل‌ها

```
LiveShop/
├── README.md                        # معرفی، نصب/اجرا، مسیرها
├── CHANGELOG.md                     # تاریخچهٔ نسخه‌ها (v1.0 → v1.4.1)
├── docs/
│   ├── STRUCTURE.md                 # همین سند
│   └── screenshots/                 # اسکرین‌شات‌های مرورگر (ویوها × موبایل/دسکتاپ)
├── package.json                     # اسکریپت‌ها و وابستگی‌ها
├── next.config.ts · tsconfig.json · tailwind.config.ts · postcss.config.mjs
├── components.json                  # پیکربندی shadcn/ui
├── prisma/
│   └── schema.prisma                # اسکیمای Prisma (SQLite)
├── db/
│   └── custom.db                    # دیتابیس SQLite از قبل پرشده (mock)
├── public/
│   ├── liveshop/                    # عکس‌های واقعی اپ (ویدیو/کالا/آواتار/دسته)
│   │   ├── live-sh1.jpg · live-sh2.jpg · live-sh3.jpg   # پس‌زمینهٔ ویدیوی شوها
│   │   ├── item-it*.jpg                                  # عکس کالاهای لایو
│   │   ├── seller-s*.jpg                                 # آواتار فروشنده‌ها
│   │   └── cat-*.jpg                                     # عکس دسته‌بندی‌ها
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
│   │       ├── shared.tsx           # ShowCard، LiveGridCard، SmartImg، Price، StatusChip و …
│   │       ├── quick-checkout-sheet.tsx  # ★ v1.4 شیت خرید سریع (سایز/تعداد/ارسال/پرداخت امانی)
│   │       ├── bid-sheet.tsx        # شیت مزایده (پشت AUCTION_ENABLED — حذف نشده)
│   │       ├── shop-tab.tsx         # ★ شیت Shop داخل اتاق لایو (قیمت ثابت + موجودی + خرید)
│   │       ├── seller-live-dashboard.tsx   # ★ داشبورد زندهٔ فروشنده (+ تب «کالاها» برای پین)
│   │       ├── pre-bid-sheet.tsx    # شیت پیش‌بید (پشت AUCTION_ENABLED)
│   │       ├── giveaway-modal.tsx   # گیواوی زنده
│   │       ├── raid-cohost.tsx      # Raid و کو-هاست (دو شیت)
│   │       ├── dispute-sheet.tsx    # ضمانت خریدار / باز کردن اختلاف
│   │       ├── saved-searches.tsx   # جستجوهای ذخیره‌شدهٔ کاوش
│   │       ├── gateway-dialog.tsx   # درگاه شبیه‌سازی‌شدهٔ زرین‌پال/آیدی‌پی
│   │       ├── confetti.tsx         # افکت کانفتی خرید/برد
│   │       └── views/               # ۲۶ صفحهٔ اپ (فهرست کامل در README)
│   │           ├── HomeView.tsx · ExploreView.tsx · LiveView.tsx · ProductView.tsx
│   │           ├── CheckoutView.tsx · OrdersView.tsx · OrderDetailView.tsx
│   │           ├── WalletView.tsx · ProfileView.tsx · WinView.tsx (پشت AUCTION_ENABLED)
│   │           ├── SellerDashboardView.tsx · SellerInventoryView.tsx · SellerCreateListingView.tsx
│   │           ├── SellerScheduleView.tsx · SellerReadyRoomView.tsx · SellerOrdersView.tsx
│   │           ├── SellerRevenueView.tsx · SellerAnalyticsView.tsx · SellerMarketingView.tsx
│   │           ├── SellerRatesView.tsx · SellerHealthView.tsx · SellerSettingsView.tsx
│   │           ├── SellerStorefrontView.tsx
│   │           └── ActivityView.tsx · InboxView.tsx · RewardsView.tsx
│   ├── store/                       # ★ ۱۳ استور zustand (بخش ۳ همین سند)
│   ├── lib/
│   │   ├── config.ts                # ★ v1.4 کلید AUCTION_ENABLED + APP_VERSION
│   │   ├── data/                    # ★ دیتای mock (بخش ۴ همین سند)
│   │   ├── format.ts                # toFa / faNum / toman / faClock (ارقام فارسی + تومان)
│   │   ├── db.ts                    # کلاینت Prisma
│   │   └── utils.ts                 # cn و ابزارهای مشترک
│   └── hooks/                       # use-toast و use-mobile
├── .env.example                     # نام متغیرهای محیطی با مقدار خالی
└── worklog.md                       # دفتر کار مشترک ایجنت‌ها
```

---

## ۲) فایل‌های صفحات کلیدی (دقیقاً کجاست؟)

| بخش | فایل دقیق |
| --- | --- |
| **صفحهٔ اتاق لایو (Live Room)** | `src/components/liveshop/views/LiveView.tsx` — ویدیوی تمام‌صفحه + هدر فروشنده/بیننده + ریل کناری + چت شناور. کامپوننت‌های داخلی: `LiveVideoLayer`، `LiveHeader`، `LiveRail`، `LiveChatOverlay`، `WinnerBanner` (پشت AUCTION_ENABLED)، `ProductDock` (کارت پایین — v1.4: قیمت ثابت + موجودی + دکمهٔ «خرید …»؛ نسخهٔ مزایده پشت کلید)، `DesktopSidePanels`، `FinishedModal` (پشت AUCTION_ENABLED) |
| **شیت خرید سریع (Quick Checkout)** | `src/components/liveshop/quick-checkout-sheet.tsx` — v1.4: سایز/رنگ با موجودی جدا، تعداد، آدرس ذخیره‌شده، ارسال (تیپاکس/پست/پیک)، جمع کل، موجودی کیف پول + شارژ، پرداخت امانی با کانفتی |
| **موتور خرید/موجودی** | `src/store/live-store.ts` → `purchaseItem` (تابع واحد اتمیک: چک موجودی → چک کیف پول → کاهش → چت → سفارش امانی) + `pinItem` (تعویض «کالای در حال نمایش» از داشبورد) + شبیه‌ساز خرید ربات‌ها. موتور مزایده (applyBid/finishItem/Max Bid) پشت `AUCTION_ENABLED` حفظ شده |
| **شیت بید (Bid Sheet)** | `src/components/liveshop/bid-sheet.tsx` — در v1.4 پنهان (پشت AUCTION_ENABLED)، کد کامل سرجایش است |
| **شیت پیش‌بید** | `src/components/liveshop/pre-bid-sheet.tsx` — پشت AUCTION_ENABLED |
| **چت لایو** | داخل خود صفحهٔ اتاق لایو است: `src/components/liveshop/views/LiveView.tsx` → کامپوننت `LiveChatOverlay` (پیام‌های سفید روی ویدیو با گرادیان، محو شدن بعد ~۶ ثانیه، حداکثر ۴ پیام). **دیتای پیام‌ها:** `src/lib/data/chat.ts` |
| **شیت Shop (فروشگاه داخل لایو)** | `src/components/liveshop/shop-tab.tsx` — v1.4: همهٔ کالاها با عکس/قیمت ثابت/موجودی + دکمهٔ «خرید»؛ کالای پین‌شده بالا و برجسته؛ حالت مزایده پشت کلید |
| **داشبورد فروشنده در لایو (پشت دوربین)** | `src/components/liveshop/seller-live-dashboard.tsx` — فروش زنده، تب «کالاها» (پین کالای بعدی برای همهٔ بیننده‌ها)، بیننده‌ها، انعام، Raid/کو-هاست |
| **پنل/Seller Hub فروشنده** | `src/components/liveshop/views/SellerDashboardView.tsx` |
| **ناوبری و ثبت ویوها** | `src/store/app-store.ts` (نوع `ViewName`، `NAV_VIEWS`، روتر stack) + `src/components/liveshop/AppShell.tsx` |

## ۳) استورهای zustand — `src/store/`

| فایل | نقش |
| --- | --- |
| `app-store.ts` | روتر stack صفحات (push/back/setRoot) + `ViewName` و `NAV_VIEWS` |
| `live-store.ts` | موتور اتاق لایو — v1.4: `pinnedItemId`/`pinItem`، `purchaseItem` (خرید اتمیک با قیمت ثابت)، خرید ربات‌ها؛ موتور مزایده (بید/تایمر/Max Bid/ربات‌های بیدگذار) پشت `AUCTION_ENABLED` حفظ شده |
| `wallet-store.ts` | موجودی، شارژ/تودیع، تاریخچهٔ تراکنش‌ها با برچسب درگاه |
| `orders-store.ts` | سفارش‌های خریدار (v1.4: تایم‌لاین امانی ۵ مرحله‌ای) |
| `seller-store.ts` | سفارش‌های فروشنده (چاپ لیبل/کد رهگیری/تکمیل)، شوهای زمان‌بندی‌شده، انعام، پیش‌نویس‌ها |
| `seller-p1-store.ts` | وضعیت‌های فاز ۳ سمت فروشنده (بازاریابی/نرخ‌ها و …) |
| `activity-store.ts` | بیدها (پشت AUCTION_ENABLED)، پیشنهادهای خرید خصوصی و تاریخچهٔ فعالیت |
| `inbox-store.ts` | اعلان‌های صندوق ورودی (ناخوان‌ها، فیلترها) |
| `rewards-store.ts` | امتیاز، سطح، استریک، مأموریت‌ها و نشان‌ها |
| `prebid-store.ts` | پیش‌بید شوهای به‌زودی (پشت AUCTION_ENABLED) |
| `protection-store.ts` | ضمانت خریدار و پرونده‌های اختلاف |
| `marketing-store.ts` | بسته‌های تقویت شو و کدهای تخفیف |
| `raid-store.ts` | Raid و کو-هاست (دعوت‌ها، مقصدها) |

## ۴) دیتای mock — `src/lib/data/`

| فایل | محتوا |
| --- | --- |
| `config.ts` (در `lib/`) | v1.4 — کلید `AUCTION_ENABLED` + شمارهٔ نسخه + آستانهٔ موجودی کم |
| `types.ts` | تایپ‌های مشترک — `ShopItem` اکنون `price`/`stock`/`variants`/`weightGrams`/`dims` دارد؛ فیلدهای حراج حفظ شده؛ `Order` دارای `qty`/`variantLabel`/`escrow` |
| `categories.ts` | ۱۰ دسته‌بندی با آیکون و شمارنده |
| `shows.ts` | فروشنده‌ها و شوهای زنده/به‌زودی — تمرکز روی «کفش و استریت‌ویر» |
| `items.ts` | کالاهای هر شو با قیمت ثابت/موجودی/گزینه‌های سایز-رنگ + `getPinnedItem` (کالای در حال نمایش) + `stockLabelFa` |
| `chat.ts` | پیام‌های اولیهٔ چت لایو (خریدمحور) |
| `orders.ts` | روش‌های ارسال ایرانی + تایم‌لاین امانی (`escrowTimeline`) + سفارش‌های اولیه |
| `media.ts` | نقشهٔ عکس‌های واقعی: `SHOW_VIDEO` / `SHOW_PHOTO` / `ITEM_PHOTO` / `SELLER_PHOTO` / `CATEGORY_PHOTO` |
| `seller.ts` | شوهای زمان‌بندی‌شده، سفارش‌های فروشنده با مهلت اسکن، درآمد و پلکان کارمزد، بیننده‌ها |
| `buyer-p1.ts` | دیتای فاز ۳ خریدار (بیدها/پیشنهادها/اعلان‌ها/اختلاف) |
| `rewards-p1.ts` | سطوح، نشان‌ها و مأموریت‌های ریواردز |
| `seller-analytics.ts` | KPIها، روند فروش، قیف تبدیل، نقشهٔ حرارتی |
| `seller-marketing.ts` | بسته‌های تقویت و کدهای تخفیف |
| `raid-p1.ts` | شوهای مقصد Raid و دعوت‌های کو-هاست |

> دیتابیس SQLite (`db/custom.db`) نیز همین داده‌های mock را نگه می‌دارد و با `npm run db:push` از نو ساخته می‌شود.

## ۵) اسکرین‌شات‌ها — `docs/screenshots/`

هر صفحه در دو نمای **موبایل ۳۹۰×۸۴۴** (`*-mobile.png`) و **دسکتاپ ۱۲۸۰×۸۰۰** (`*-desktop.png`).

- **جدید در v1.4:** `quick-checkout-mobile.png` (شیت خرید سریع)، `shop-sheet-mobile.png` (شیت Shop با قیمت ثابت)
- **حذف‌شده در v1.4:** `live-room-bid-sheet-open-*.png` — شیت بید در حالت قیمت ثابت دیگر نمایش داده نمی‌شود (پشت AUCTION_ENABLED)
- **به‌روزشده در v1.4 (موبایل):** home، live-room، orders، order-detail، checkout، product، explore، activity، seller-listing، seller-inventory، seller-schedule، seller-orders، seller-live-dashboard
- **به‌روزشده در v1.4.1 (موبایل ۳۹۰):** home (این‌بار صفحهٔ واقعی خانه — قبلاً اشتباهاً کاوش بود)، live-room، shop-sheet، quick-checkout (سایز‌های ۴۸px + فوتر چسبان)، explore (کاشی‌های عکس‌دار دسته‌بندی)
- نمای دسکتاپ از قبل v1.3 است (فقط live-room دسکتاپ تغییر چیدمان پایین دارد)

نام‌گذاری بر اساس ویو/مسیر است (مثال: `live-room-mobile.png`، `seller-hub-desktop.png`).
