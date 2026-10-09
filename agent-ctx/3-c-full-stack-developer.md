# Task 3-c — سفارش‌های فروشنده (SCAN BY) + درآمد پلکانی + ساخت لیستینگ

Agent: full-stack-developer
Date: فاز ۲ (Whatnot-Atlas — تصاویر ۲۷، ۲۸، ۲۹)

## فایل‌های من (فقط همین سه فایل — additive only)
- `src/components/liveshop/views/SellerOrdersView.tsx` — **جدید** (تصویر ۲۸)
- `src/components/liveshop/views/SellerRevenueView.tsx` — **جدید** (تصویر ۲۹)
- `src/components/liveshop/views/SellerCreateListingView.tsx` — **جدید** (تصویر ۲۷)

هیچ فایل موجودی edit نشد؛ dev server دست نخورد. (تغییرات موازی LiveView/SellerDashboard/… در git متعلق به ایجنت‌های دیگر است.)

## تعامل‌های سیم‌شده

### SellerOrdersView
- تب‌های role=tablist با شمارندهٔ زنده از `useSellerStore(orders)`: to_scan / shipped / completed / issue (پیش‌فرض to_scan) + EmptyState اختصاصی هر تب.
- بنر هشدار amber «نرخ اسکن به‌موقع ۹۲٪» فقط در تب اسکن (از HUB_STATS.onTimeScanPct).
- to_scan: «چاپ لیبل مرسوله» → PrintLabelDialog (تأیید → Loader2 «در حال ساخت مرسوله…» ۱۲۰۰ms در ref → `printLabel(id)` → toast با کد toFa) و «ثبت کد رهگیری» → TrackDialog (Input mono + Enter → گارد خالی → `addTracking`).
- shipped: کد رهگیری mono dir=ltr + «تکمیل سفارش» سبز → `completeOrder` + toast (کارتی به completed می‌رود و شمارندهٔ تب‌ها زنده به‌روز می‌شود).
- completed: tint سبز + «★ {reviewLabel}».
- issue: کارت صورتی + issueText + «پاسخ به اختلاف» → IssueReplyDialog (Textarea + `resolveIssue(id, reply)`) → «✓ پاسخ داده شد — در انتظار داوری».
- رنگ بج SCAN BY از urgency: ok سبز / warn amber / late #FF3B5C + animate-ls-pulse.

### SellerRevenueView
- کارت موجودی با گرادیان inline مثل کیف پول + دو دکمه: «برداشت فوری» → WithdrawDialog (شبا + مبلغ + تأیید سبز → ۱۰۰۰ms → toast «تا ۲۴ ساعت به شبا واریز می‌شود») و «تنظیمات تسویه» → toast.
- تفکیک آخرین شو: ناخالص / کمیسیون ۸٪ / درگاه ۲.۹٪+۳۰٬۰۰۰ (منفی‌ها #FF3B5C، برچسب فرمول روی همان ردیف) / خالص سبز.
- پلکان کارمزد با بج «٪۸/٪۵/٪۳» + COMMISSION_NOTE؛ تاریخچهٔ تسویه با دکمهٔ «فاکتور» (toast دمو).

### SellerCreateListingView
- گرید عکس ۳تایی: باکس اصلی با کاور جاری + بج «اصلی»؛ دو جایگاه dashed که کلیکشان ایندکس را در ۴ گرادیان preset می‌چرخاند (coverPicked=true).
- فرم: عنوان/برند/سایز، چیپ‌های وضعیت (aria-pressed)، شروع مزایده، Switch خرید فوری (پیش‌فرض روشن + ⓘ title)، قیمت فوری + hint، وزن «۹۰۰»/ابعاد، باکس قوانین ریپلیکا.
- «انتشار لیستینگ» (sticky bottom): اعتبارسنجی عنوان/قیمت → toast.success + back().
- «ذخیرهٔ پیش‌نویس» (trailing هدر): گارد عنوان → `addDraft({title, brand||"بدون برند", emoji:"👟", cover, missing})` → در انبار فروشنده با بج missing ظاهر می‌شود.

## نکات فنی برای ایجنت‌های بعدی
- هر سه نما فقط از قرارداد 3-a تغذیه می‌شوند؛ state محلی، هیچ استور جدیدی نساختم. دیالوگ‌های سفارش self-contained و با `key={order.id}` remount می‌شوند (ریست state بدون setState-in-effect).
- تایمرها `useRef<ReturnType<typeof setTimeout>>` + cleanup در unmount (الگوی gateway-dialog).
- **لوسیکد این نسخه prop `title` ندارد (TS2322)** — tooltip ⓘ با span wrapper (title + aria-label) حل شد؛ اگر جای دیگر tooltip خواستی همین الگو.
- parseFaNum محلی در ListingView: ارقام فارسی→لاتین + حذف جداکننده (کپی الگوی gateway-dialog).
- `resolveIssue(orderId, reply)` — پیاده‌سازی استور reply را نادیده می‌گیرد (دمو)؛ صدا زدن با دو آرگومان درست است.
- برچسب روش ارسال: `SHIPPING_METHODS.find(...)?.label` + fallback map {tipax/post/peyk} — peyk واقعی «پیک شهری (تهران)» است.
- بررسی: tsc grep سه فایل → خالی؛ eslint سه فایل → 0؛ dev.log سالم (GET / 200).
