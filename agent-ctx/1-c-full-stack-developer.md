# Task 1-c — full-stack-developer — LiveShop v1.0 baseline (کالا/پرداخت/سفارش/کیف پول)

## خلاصه
پنج نمای تجاری baseline v1.0 ساخته/جایگزین شد؛ هیچ فایل مشترک یا فایل ایجنت‌های دیگر تغییر نکرد.

## فایل‌ها
- `src/components/liveshop/views/ProductView.tsx`
- `src/components/liveshop/views/CheckoutView.tsx`
- `src/components/liveshop/views/OrdersView.tsx`
- `src/components/liveshop/views/OrderDetailView.tsx`
- `src/components/liveshop/views/WalletView.tsx`

## نکات فنی برای ایجنت‌های بعدی
- **ProductView**: تایمر مزایده یک زیرکامپوننت `AuctionTimer` است (شمارش معکوس محلی از `item.timerSec`؛ زیر ۳۰ ثانیه قرمز `#FF3B5C` + `animate-ls-timer-alert`). با `key={item.id}` ریست می‌شود. دیالوگ تأیید بید فقط toast موفقیت — در فاز ۱ موتور واقعی مزایده جایگزین می‌شود.
- **CheckoutView**: سفارش جدید با `nextOrderId()` (digitt فارسی)، تایم‌لاین ۳ مرحله‌ای (فقط «پرداخت شد» انجام‌شده)، آدرس `DEFAULT_ADDRESS`، `createdAtLabel: "همین حالا"` و سپس `setRoot('orders')`. اگر موجودی ناکافی: `toast.error` + `push('wallet')`.
- **OrdersView**: فیلترها «همه/جاری/تحویل‌شده» با منطق `timeline.some(!done)` / `every(done)`. چیپ وضعیت: اولین step انجام‌نشده (صورتی outline) یا «تحویل شد» (سبز).
- **OrderDetailView**: تایم‌لاین عمودی با خط اتصال `border-r border-white/10` (در RTL خط سمت راست ستون دایره‌هاست). کد رهگیری با `dir="ltr"` + `font-mono` و `toFa`. دکمهٔ امتیاز فقط برای سفارش تحویل‌شدهٔ `!rated`.
- **WalletView**: کارت موجودی با گرادیان inline `linear-gradient(135deg,#6C5CFF,#4a3dd6)`. دیالوگ شارژ: چیپ‌های ۵۰۰هزار/۱م/۲م + Input آزاد؛ پارس ورودی با تبدیل ارقام فارسی و حذف جداکننده‌ها (`parseAmountInput`). «شارژ/خرید این ماه» از جمع `txs` محاسبهٔ داینامیک می‌شود (با تراکنش‌های فعلی seed: شارژ ۴٬۰۰۰٬۰۰۰ و خرید ۱٬۸۵۰٬۰۰۰ — طبق دستور «جمع txs»).
- همهٔ viewها: `'use client'`، ریشهٔ `flex-1 flex flex-col`، `aria-label` فارسی، فقط رنگ‌های برند، اعداد فارسی از `@/lib/format`، toast از `sonner`.
- نوار اکشن چسبان پایین Product/Checkout: `sticky bottom-0 bg-ls-bg/90 backdrop-blur border-t border-white/5 p-3`.

## وضعیت
- `bunx tsc --noEmit` → صفر خطا در پنج فایل این تسک (خطاهای examples/ و skills/ و فایل‌های ایجنت‌های دیگر مربوط به اینجاست).
- `eslint` پنج فایل → بدون خطا.
- dev سرور: کامپایل موفق، `GET / 200`.
