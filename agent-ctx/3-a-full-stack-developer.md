# Task 3-a — دیتا و استور سمت فروشنده (فاز ۲)

Agent: full-stack-developer
Date: فاز ۲ (Whatnot-Atlas — سمت فروشنده)

## فایل‌های من (فقط همین دو فایل — additive only)
- `src/lib/data/seller.ts` — **جدید** (دیتای static تایپ‌شده)
- `src/store/seller-store.ts` — **جدید** (zustand، 'use client')

هیچ فایل موجود edit نشد؛ dev server دست نخورد.

## قراردادهای نهایی برای ایجنت‌های 3-b / 3-c / 3-d

### از `@/lib/data/seller`
- انواع: `SellerScheduledShow`، `SellerOrderStatus` ("to_scan"|"shipped"|"completed"|"issue")، `SellerOrder`، `SellerPayout`، `SellerRevenue`، `InventoryDraft`، `WatchingViewer`
- داده‌ها:
  - `SELLER_SCHEDULED_SHOWS` (۲ شو: sch1، sch2 — فیلدهای prebid/giveaway/cohost/pinComment)
  - `SELLER_ORDERS` (۸ سفارش: ۴ to_scan + ۲ shipped + ۱ completed + ۱ issue؛ **id لاتین است — UI با toFa فارسی کند**)
  - `SELLER_REVENUE` (آبجکت سادهٔ تایپ‌شده، عمداً as const نیست تا mapping راحت باشد؛ lastShow.net = ۱۹٬۱۲۶٬۵۰۰ با تفکیک کارمزد/پردازش)
  - `INVENTORY_EXTRAS` (Record با کلید SKU: "SNK-A101".."SNK-A108" → { weightGrams } — با کوتیشن چون خط تیره دارد)
  - `INVENTORY_DRAFTS` (dr1 گازل، dr2 واکس — `missing[]` برای بج‌های «ناقص»)
  - `WATCHING_VIEWERS` (۶ نفر، هماهنگ با BOTS در live-store: reza_vault/mina_k72/sole_hunter + kian_plant/sara_snkrs/ali_rezaei)
  - `READY_ROOM`، `HUB_STATS`، `COMMISSION_NOTE`
- رنگ بج مهلت سفارش از `urgency`: ok → سبز #00C896، warn → amber (زرد)، late → قرمز #FF3B5C. بعد از printLabel این فیلد عملاً بی‌معناست.

### از `@/store/seller-store`
- `useSellerStore` — state: `scheduledShows`، `orders`، `tips` (جدیدترین‌اول)، `offers` (جدیدترین‌اول)، `drafts`، `publishedCount`
- انواع اکسپورت‌شده: `TipEvent`، `OfferEvent`، `SellerState`
- اکشن‌ها (امضا نهایی، تغییر ندهید):
  - `printLabel(orderId) → string | null` — فقط to_scan؛ shipped + `TPX-` + ۶رقم رندوم؛ کد برگشتی را برای toast/کپی استفاده کنید
  - `addTracking(orderId, code)` — فقط ثبت کد، وضعیت عوض نمی‌شود
  - `completeOrder(orderId)` — فقط از shipped؛ reviewLabel «خریدار رضایت داد ★»
  - `resolveIssue(orderId, reply)` — issueResolved=true (reply در دمو ذخیره نمی‌شود)
  - `addTip(amount, from?, emoji?, color?)` — prepend به tips + اگر `useLiveStore.getState().showId` بود، پیام سبز عمومی در چت لایو (author «انعام»، kind "system"، 💚، #00C896)
  - `addOffer(o)` — Omit<OfferEvent,"id"|"atLabel">؛ id/atLabel خودکار
  - `addDraft(d)` — id خودکار `dr${n}` (ادامه از dr3)
  - `publishDraft(draftId)` — گارد وجود دارد؛ حذف + publishedCount++
- شمارنده‌ها ماژول‌سطح‌اند (tip/offer از off/tip-3 و draft از dr3 ادامه می‌یابند) — seedها را دوباره mutate نکنید.

## نکات فنی
- امضای pushChat در live-store: `Omit<ChatMessage,"id"|"time"> & { time?: string }` — پیام انعام بدون time داده شد تا nowLabel داخل live-store زمان را بگذارد.
- seed استورها کپی مستقل (شامل cover) از دیتای static — mutation دیتای module را خراب نمی‌کند.
- چرخهٔ import نداریم: seller-store → live-store یک‌طرفه است (live-store هیچ وابستگی به seller-store ندارد).
- tsc: `grep -E "data/seller|seller-store"` خالی؛ eslint: 0 خطا. خطای موجودِ `AppShell.tsx` (missing sellerSchedule/sellerReadyRoom/sellerListing/sellerOrders/sellerRevenue در Record<ViewName,…>) از قبل بود — Viewها را شما (3-b/3-c/3-d) باید بسازید و آنجا ثبت کنید.
- برای لاتین‌نمایی هندل خریدارها (reza_vault و…) از `dir="ltr"` استفاده کنید؛ اعداد سفارش با `toFa`.
