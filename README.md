# LiveShop 🛍️ — خرید زنده، مزایدهٔ لحظه‌ای

اپلیکیشن «لایوکامرس» فارسی و راست‌چین (RTL) با تم تیره — پخش زنده + مزایده + فروشگاه، بومی‌سازی‌شده برای ایران (تومان، ارقام فارسی، ارسال تیپاکس/پست/پیک، کیف پول با درگاه شبیه‌سازی‌شدهٔ زرین‌پال/آیدی‌پی).

> **نسخهٔ فعلی:** v1.3.1 (اتم فاز ۳ + بازطراحی اتاق لایو مطابق مرجع Whatnot) — تاریخچهٔ کامل تغییرات در [`CHANGELOG.md`](./CHANGELOG.md)
> **قانون طلایی پروژه:** هیچ صفحه/قابلیت موجودی حذف یا تغییر نمی‌کند؛ فقط چیزهای تازه اضافه می‌شوند.

---

## ⚙️ پیش‌نیازها

| ابزار | نسخهٔ لازم |
| --- | --- |
| **Node.js** | **≥ 20.9** (لازمِ Next.js 16) |
| npm | همراه Node (یا از **Bun ≥ 1.1** استفاده کنید) |
| (اختیاری) Bun | ≥ 1.1 — اسکریپت‌های پروژه با bun هم اجرا می‌شوند |

## 🚀 نصب و اجرا

```bash
# ۱) نصب وابستگی‌ها
npm install            # یا: bun install

# ۲) متغیرهای محیطی (فایل .env از git حذف است؛ از نمونه بسازید)
cp .env.example .env   # سپس DATABASE_URL را تنظیم کنید

# ۳) دیتابیس (SQLite + Prisma) — فایل db/custom.db در ریپو هست؛ برای ساخت مجدد:
npx prisma generate
npm run db:push

# ۴) اجرای محیط توسعه (http://localhost:3000)
npm run dev            # یا: bun run dev
```

### Build و اجرای production

```bash
npm run build          # خروجی standalone + کپی static/public
npm run start          # اجرای سرور standalone روی همان اسکریپت پروژه
```

اسکریپت‌های دیگر: `npm run lint` (بررسی کیفیت کد)، `npm run db:generate`، `npm run db:migrate`، `npm run db:reset`.

---

## 🗺️ مسیرها (Routes)

**معماری: SPA تک‌مسیره.** در سطح URL فقط دو مسیر وجود دارد و «صفحات» اپ با روترِ داخلی stack (مبتنی بر zustand در `src/store/app-store.ts`) مدیریت می‌شوند — مطابق سند مرجع پروژه فقط `/` باید روت قابل‌مشاهده باشد.

### مسیرهای URL

| مسیر | توضیح |
| --- | --- |
| `/` | کل اپلیکیشن LiveShop (تمام ۲۶ صفحه از همین روت رندر می‌شوند) |
| `/api` | اندپوینت تست/سلامت (پاسخ JSON ساده) |

### صفحات داخلی (۲۶ ویو)

| ویو (ViewName) | فایل | توضیح یک‌خطی |
| --- | --- | --- |
| `home` | `views/HomeView.tsx` | خانه: شوهای زندهٔ داغ با بید و تایمر زنده، به‌زودی‌ها با یادآوری، دسته‌بندی‌ها |
| `explore` | `views/ExploreView.tsx` | کاوش: جستجوی شو/فروشنده، گرید دسته‌ها، پیش‌بید و جستجوهای ذخیره‌شده |
| `live` | `views/LiveView.tsx` | **اتاق لایو**: ویدیوی تمام‌صفحه، چت شناور روی تصویر، کارت واحد مزایده و شیت‌ها |
| `product` | `views/ProductView.tsx` | جزئیات محصول: کاور، شرط/سایز، قیمت بر اساس وضعیت، ارسال |
| `checkout` | `views/CheckoutView.tsx` | تسویه سفارش: آدرس، تیپاکس/پست/پیک، پرداخت از کیف پول |
| `orders` | `views/OrdersView.tsx` | سفارش‌های من با فیلتر همه/جاری/تحویل‌شده |
| `orderDetail` | `views/OrderDetailView.tsx` | جزئیات سفارش: تایم‌لاین، رهگیری + ضمانت خریدار و باز کردن اختلاف |
| `wallet` | `views/WalletView.tsx` | کیف پول: موجودی، شارژ (زرین‌پال/آیدی‌پی شبیه‌سازی‌شده)، تراکنش‌ها |
| `profile` | `views/ProfileView.tsx` | حساب کاربری: آمار و منوی کامل (کیف پول، فروشندهٔ من، فعالیت‌ها، …) |
| `sellerDashboard` | `views/SellerDashboardView.tsx` | پنل فروشنده + **Seller Hub** (۸ ماژول + شروع لایو) |
| `sellerInventory` | `views/SellerInventoryView.tsx` | انبار کالا: فیلتر وضعیت‌ها، وزن، قفل آیتم در شو فعال |
| `win` | `views/WinView.tsx` | صفحهٔ برد مزایده: کانفتی، تفکیک قیمت، تایم‌لاین سفارش |
| `sellerSchedule` | `views/SellerScheduleView.tsx` | زمان‌بندی شو: فرم کامل + فهرست شوهای زمان‌بندی‌شده |
| `sellerReadyRoom` | `views/SellerReadyRoomView.tsx` | اتاق آماده‌به‌پخش: پیش‌نمایش دوربین، صف شو، شروع پخش |
| `sellerOrders` | `views/SellerOrdersView.tsx` | سفارش‌های فروشنده: مهلت اسکن، چاپ لیبل تیپاکس، مشکلات |
| `sellerRevenue` | `views/SellerRevenueView.tsx` | درآمد: تسویه شبا، کارمزد پلکانی، تفکیک شو |
| `sellerListing` | `views/SellerCreateListingView.tsx` | ساخت لیستینگ: عکس‌ها، قیمت‌گذاری دوگانه، وزن/ابعاد |
| `activity` | `views/ActivityView.tsx` | فعالیت‌ها و بیدها: بیدهای زنده، پیشنهادهای خصوصی، تاریخچه |
| `inbox` | `views/InboxView.tsx` | صندوق ورودی: اعلان‌های مزایده/سفارش/فالو/سیستم |
| `rewards` | `views/RewardsView.tsx` | باشگاه ریواردز: سطح، استریک، مأموریت‌ها، نشان‌ها |
| `sellerAnalytics` | `views/SellerAnalyticsView.tsx` | آنالیتیکس فروش: KPI، روند ۸ هفته، قیف تبدیل، نقشهٔ حرارتی |
| `sellerHealth` | `views/SellerHealthView.tsx` | سلامت اکانت فروشنده: امتیاز، شاخص‌ها، چک‌لیست بهبود |
| `sellerMarketing` | `views/SellerMarketingView.tsx` | بازاریابی: تقویت شو، کدهای تخفیف، تیزر Raid/کو-هاست |
| `sellerRates` | `views/SellerRatesView.tsx` | نرخ‌های من: پلکان کارمزد، هزینهٔ درگاه، ماشین‌حساب زنده |
| `sellerStorefront` | `views/SellerStorefrontView.tsx` | صفحهٔ عمومی فروشنده: هیرو، سیاست‌ها، نظرات |
| `sellerSettings` | `views/SellerSettingsView.tsx` | تنظیمات فروشنده: تسویه شبای، اعلان‌ها، ناحیهٔ خطر |

*(مسیر همهٔ ویوها: `src/components/liveshop/views/` — نقشهٔ کامل فایل‌ها در [`docs/STRUCTURE.md`](./docs/STRUCTURE.md))*

---

## 🧪 داده‌ها — همه mock هستند

این پروژه **فقط فرانت‌اند دمو با دادهٔ mock** است؛ هیچ بک‌اند/درگاه پرداخت/لاجستیکی واقعی در کار نیست (زرین‌پال، آیدی‌پی و تیپاکس «شبیه‌سازی‌شده» هستند).

- **منبع اصلی دادهٔ mock:** پوشهٔ **`src/lib/data/`** — شوها و فروشنده‌ها (`shows.ts`)، آیتم‌ها (`items.ts`)، پیام‌های چت (`chat.ts`)، سفارش‌ها و روش‌های ارسال (`orders.ts`)، دسته‌بندی‌ها (`categories.ts`)، نقشهٔ عکس‌ها (`media.ts`) و دیتای فازها (`buyer-p1.ts`، `rewards-p1.ts`، `seller.ts`، `seller-analytics.ts`، `seller-marketing.ts`، `raid-p1.ts`، `types.ts`)
- **دیتابیس SQLite** (Prisma): فایل از قبل پرشدهٔ `db/custom.db` در ریپو هست؛ با `npm run db:push` از نو ساخته می‌شود
- استورهای کلاینتمد (zustand) در `src/store/` شروع‌به‌کار را با همین داده‌های mock انجام می‌دهند

## 📸 اسکرین‌شات‌ها

پوشهٔ [`docs/screenshots/`](./docs/screenshots) شامل ۵۴ اسکرین‌شات واقعی مرورگر است: هر صفحه در دو نمای **موبایل ۳۹۰px** (`*-mobile.png`) و **دسکتاپ ۱۲۸۰px** (`*-desktop.png`) + دو حالت اضافهٔ اتاق لایو (شیت بید باز، داشبورد زندهٔ فروشنده). نام‌گذاری بر اساس مسیر/ویو است (مثل `live-room-mobile.png`).

## 🧱 تکنولوژی

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui · zustand · Prisma (SQLite) · Vazirmatn (RTL) · رنگ‌های برند: بنفش `#6C5CFF` / صورتی `#FF3B8B` / سبز `#00C896`
