# Task 2-d — Home/Explore فاز ۱ (تصاویر ۰۲ و ۱۳)

Agent: full-stack-developer

## آنچه انجام شد
- `HomeView.tsx`: تب «برای شما/دنبال‌شده‌ها» (پیش‌فرض برای شما، EmptyState کوچک برای حالت خالی)، نوار پیش‌نمایش «بید فعلی + تایمر» با footer prop جدید ShowCard، فالبک «خرید فوری از …»، فوتر به‌زودی‌ها (نوار شروع + toggle یادآوری).
- `ExploreView.tsx`: چیپ toggle «فقط لایوها» (پیش‌فرض روشن)، حالت ادغام به‌زودی‌ها در لیست شوها + عنوان پویا («فقط زنده‌ها»/«همهٔ شوها»)، دکمهٔ یادآوری روی کارت‌های به‌زودی (ردیف compact و حالت ادغام).

## قراردادها و نکات فنی برای ایجنت‌های بعدی
1. **Duplicating local components**: `ReminderToggle`، `UpcomingFooter` و (فقط HomeView) `LiveBidBar` به‌صورت کامپوننت محلی داخل هر فایل تعریف شده‌اند (محدودیت تسک: فقط دو فایل). اگر قرار است مشترک شوند → به `shared.tsx` منتقل شوند؛ نقطهٔ اتصال، پروپ `footer?: React.ReactNode` در ShowCard است (از baseline موجود).
2. **span به‌جای button داخل ShowCard**: چون ShowCard ریشهٔ `<button>` دارد، کنترل یادآوری `span[role="button"]` + tabIndex + onKeyDown (Enter/Space) است — اگر کسی خواست به button واقعی تبدیل کند، باید ShowCard را به div/role تبدیل کند وگرنه invalid DOM nesting (button-in-button) رخ می‌دهد. `stopPropagation` کلیک را از رسیدن به openShow کارت باز می‌کند.
3. **State یادآوری محلی است** (`Set<string>` در هر View) — sync بین Home و Explore وجود ندارد؛ اگر خواستید سراسری شود: zustand store جدید (مثل wallet-store) بدون تغییر UI.
4. **گاردها**: `getAuctionItem` می‌تواند undefined بدهد؛ `currentBid` fallback به `startPrice`؛ `timerSec ?? 0`؛ min buyNowPrice با filter type-guard و گارد آرایهٔ خالی (null → نوار رندر نمی‌شود).
5. **تایمر نمایشی/ثابت است** (mock از `timerSec`) — وقتی موتور مزایدهٔ زنده آمد، فقط LiveBidBar باید به دادهٔ زنده وصل شود؛ رنگ اضطراری `text-[#FF3B5C]` در `timerSec <= 30`.
6. **عنوان پویای ExploreView**: بدون فیلتر دسته «فقط زنده‌ها» (پیش‌فرض) / «همهٔ شوها» (ادغام)؛ با فیلتر دسته، همان label دسته (حفظ baseline). در حالت ادغام، سکشن جدا «به‌زودی» رندر نمی‌شود (جلوگیری از تکرار).
7. Toastها عمداً بیرون از setState updater صدا زده می‌شوند (StrictMode دوبار اجرا می‌کند → toast دوتایی نشود).

## وضعیت
- tsc: صفر خطا در دو فایل | eslint: پاک | dev.log: سالم (GET / 200)
- فایل‌های تغییر یافته: فقط `src/components/liveshop/views/HomeView.tsx` و `src/components/liveshop/views/ExploreView.tsx`
