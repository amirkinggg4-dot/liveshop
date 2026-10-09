# Task 2-c — درگاه شارژ شبیه‌سازی‌شده + صفحهٔ برد (WinView)

Agent: full-stack-developer
Date: فاز ۱ (P0)

## فایل‌های من
- `src/components/liveshop/gateway-dialog.tsx` — **جدید** (self-contained)
- `src/components/liveshop/views/WalletView.tsx` — جراحی محدود
- `src/components/liveshop/views/WinView.tsx` — ساخت کامل (جایگزین stub)

## قراردادهای مهم برای ایجنت‌های بعدی

### GatewayDialog (`gateway-dialog.tsx`)
- props: `{ open: boolean; onOpenChange: (open: boolean) => void }` — در هر جایی قابل mount است.
- خودش `useWalletStore.charge(amount, gateway)` را صدا می‌زند و toast می‌دهد؛ والد فقط open/onOpenChange می‌دهد.
- state داخلی ۴ مرحله‌ای: `gateway → amount → processing → success`؛ هنگام بستن کامل reset می‌شود (gateway به زرین‌پال برمی‌گردد).
- پردازش ۱۲۰۰ms با `setTimeout` در `timerRef` است؛ اگر دیالوگ حین پردازش بسته شود، تایمر لغو و پرداخت لغو می‌شود (شارژی انجام نمی‌شود).
- پارس مبلغ: ارقام فارسی→لاتین + حذف جداکننده‌ها (کپی همان منطق baseline).

### WinView
- داده را فقط از `useLiveStore(s => s.pendingWin)` می‌خواند؛ **در unmount همیشه `clearPendingWin()` اجرا می‌شود** — پس بازگشت (back) به این نما پس از خروج، EmptyState 🏆 می‌دهد (رفتار مورد انتظار).
- سفارشِ برد را از `useOrdersStore(s => s.orders[0])` می‌خواند (موتور live-store همین الان آن را unshift کرده). اگر سفارش نبود (edge: refresh)، fallbackهای ایمن دارم ولی `openOrder`/`setRated` گارد شده‌اند.
- فروشنده از `getSeller` با نگاشت showId: `sh1→s1, sh2→s2, بقیه→s3` (همان نگاشت موتور).
- هدایت به این صفحه: `push('win')` — مثلاً از مودال `finishedItem` در LiveView وقتی `finishedItem.iWon === true`.

### WalletView
- فقط سه تغییر: (۱) Dialog سادهٔ baseline → `<GatewayDialog open={chargeOpen} onOpenChange={setChargeOpen} />`، (۲) خط ریز «از طریق {gateway}» زیر عنوان تراکنش‌های دارای `tx.gateway`، (۳) پاک‌سازی importهای مرده. بقیهٔ فایل با baseline یکسان است.

## نکات فنی
- اجرای setTimeout در ref + cleanup در unmount؛ از setState داخل useEffect پرهیز شد (نسبت به قانون eslint set-state-in-effect امن).
- تایم‌لاین WinView عمداً hardcoded است (نکته‌های ریز «تا ۲ روز کاری» / «کد رهگیری اینجا نمایش داده می‌شود») — با استایل OrderDetailView ولی دادهٔ مستقل.
- رنگ‌ها: فقط بنفش/صورتی/سبز برند + amber-300 برای ستارهٔ امتیاز (مجاز طبق RatingStars موجود).
- tsc و eslint هر دو پاک؛ dev.log سالم (GET / 200).
