# Task 2-b — full-stack-developer — فاز ۱: اتاق لایو (موتور مزایده + BidSheet + ShopTab + گیواوی)

## خلاصه
LiveView روی baseline بازنویسی و به `useLiveStore` وصل شد؛ سه فایل جدید ساخته شد. هیچ محتوای تأییدشده حذف نشد؛ تنها جایگزینی مجاز: Dialog دموی «ثبت بید» → شیت مزایدهٔ واقعی (vaul).

## فایل‌های من (فقط این‌ها نوشته/تغییر کرد)
- `src/components/liveshop/views/LiveView.tsx` (بازنویسی روی baseline)
- `src/components/liveshop/bid-sheet.tsx` (جدید)
- `src/components/liveshop/shop-tab.tsx` (جدید)
- `src/components/liveshop/giveaway-modal.tsx` (جدید)

## نکات فنی برای ایجنت‌های بعدی
- **Engine wiring**: mount → `startShow(currentShowId ?? 'sh1')`، unmount → `stopShow` در cleanup. `setInterval(1000, tick)` فقط با `phase==='running' || giveaway.phase==='countdown'` (تیک گیواوی را هم جلو می‌برد).
- **الگوی بدون setState-in-effect** (خطای lint فعال است):
  - فلش «+۱۰ ثانیه تمدید شد» → visibility مشتق: `Date.now() - lastExtendAt < 1500` + `key={lastExtendAt}` برای replay انیمیشن (هر تیک موتور re-render می‌دهد).
  - مقدار اولیهٔ استپر BidSheet → در ProductDock شیت با `key={bidNonce}` remount می‌شود؛ nonce فقط در event handler باز کردن +۱ می‌شود؛ داخل شیت `useState(() => currentBid + step)`.
  - شمارش معکوس ۳.۵ ثانیهٔ مودال برد ربات → `AutoNextCountdown` با interval محلی (setState داخل callback async = مجاز) + `firedRef` گارد؛ در صفر → `dismissFinished() + startNextItem()`.
- **گیواوی**: بستن مودال فقط UI است؛ store در phase 'won' می‌ماند. dismissed-state در LiveView است (`givDismissed`) و `handleGiveaway` قبل از `startGiveaway()` آن را ریست می‌کند → GiveawayModal props: `{ dismissed, onDismiss }`.
- **pendingWin**: مودال برد من فقط `push('win') + dismissFinished()` می‌کند؛ WinView موجود، pendingWin را می‌خواند و در unmount با `clearPendingWin` پاک می‌کند — من چیزی clear نمی‌کنم.
- **BidSheet**: min استپر = `currentBid + step` (زنده از store)؛ Max Bid: Switch بنفش + Input با پارس ارقام فارسی (`parseAmountInput`)؛ مقدار سقف اولیه `currentBid + 3×step` یا مقدار موجود در store. اعتبارسنجی نهایی با `placeMyBid` موتور است (error → `toast.error(res.error)`).
- **ShopTab**: `absolute inset-0 z-40 bg-ls-bg/97 backdrop-blur` داخل ریشهٔ LiveView (ریشه `relative` هم گرفت — فقط افزودن). آیتم فعال مزایده در گرید، بید/تایمر زنده از store.top-level می‌گیرد (`isLiveActive`)؛ بقیه آیتم‌ها static. کارت = div با role=button + tabIndex + Enter/Space تا button تودرتو (BIN) نداشته باشیم.
- **WinnerBanner**: روی لبهٔ پایین ویدیو، `px-14` تا با ریل چپ تداخل نکند؛ me → گرادیان سبز «تو پیشتی! 🔥»، ربات → گرادیان بنفش + bidderLabel، خالی → «اولین بید را تو بزن!».
- تایمر کارت: `<=10` قرمز + `animate-ls-timer-alert`؛ رفتار baseline قرمزِ `<30` حفظ شد.

## وضعیت
- `bunx tsc --noEmit | grep` چهار فایل → صفر خطا؛ eslint چهار فایل → 0؛ dev.log سالم (GET / 200).
- فایل‌های مشترک (shared/store/ui) دست نخوردند.
