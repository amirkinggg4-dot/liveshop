# LiveShop — Worklog (دفتر کار مشترک ایجنت‌ها)

> قانون طلایی: هیچ صفحه/فایل/متن/رنگ/چیدمان موجود را حذف یا تغییر نده؛ فقط اضافه کن.
> طراحی: تم تیره، بنفش #6C5CFF، صورتی #FF3B8B، سبز #00C896، راست‌چین فارسی، تومان + اعداد فارسی.
> داده‌ها mock و در `src/lib/data` نگه‌داری می‌شوند.

---
Task ID: 0
Agent: main (Z.ai Code)
Task: آماده‌سازی زیرساخت نسخهٔ v1.0 بازسازی‌شدهٔ LiveShop (workspace خالی بود و فقط template پیش‌فرض داشت؛ مطابق توصیف کاربر — ۱۲ صفحه، تم تیره و رنگ‌های تاییدشده — بازسازی می‌شود و به‌عنوان v1.0 ثبت/ZIP خواهد شد)

Work Log:
- بررسی پروژه: workspace فقط template پیش‌فرض Next.js 16 بود؛ LiveShop موجود نبود → تصمیم: بازسازی دقیق v1.0 طبق مشخصات تأییدشده، سپس فاز ۱ روی آن.
- ساخت معماری SPA تک‌مسیره: تنها route مجاز `/` است؛ ۱۲ صفحه به‌صورت View داخلی با router zustand (stack-based) مدیریت می‌شوند.
- globals.css: توکن‌های برند (بنفش #6C5CFF، صورتی #FF3B8B، سبز #00C896، پس‌زمینه #0B0A12)، تم تیرهٔ همیشه‌فعال، انیمیشن‌های ls-pulse / ls-fade-up / ls-confetti / ls-timer-alert، اسکرول‌بار سفارشی.
- layout.tsx: lang="fa" dir="rtl" + فونت Vazirmatn (Google Fonts با fallback) + Toaster (sonner).
- src/lib/format.ts: toFa / faNum / toman / faClock / compactFa (اعداد فارسی + تومان).
- src/lib/data/*: types.ts, categories.ts, shows.ts (فروشنده‌ها و شوها), items.ts (آیتم‌های هر شو با ۴ وضعیت), chat.ts (پیام‌های چت لایو با پیام‌های خریدمحور), orders.ts (روش‌های ارسال: تیپاکس/پست/پیک شهری + سفارش‌های اولیه).
- src/store/*: app-store (روتر stack)، wallet-store (موجودی/تاریخچه/charge/spend)، orders-store (سفارش‌ها).
- src/components/liveshop/shared.tsx: ShowCard، GradientCover، Avatar، LiveBadge، StatusChip، RatingStars، SectionTitle، PageHeader، Price، EmptyState، Chip.
- src/components/liveshop/AppShell.tsx: نوار بالا + BottomNav پنج‌تایی (خانه/کاوش/فروش/سفارش‌ها/حساب) + مسیریابی Viewها.
- src/app/page.tsx: رندر AppShell. ۱۲ View stub ساخته شد تا ایجنت‌ها جایگزین کنند.

Stage Summary:
- زیرساخت کامل v1.0 آماده است؛ ایجنت‌های Task 1-a/1-b/1-c فقط فایل‌های View خودشان را می‌نویسند:
  - 1-a → views/HomeView.tsx, ExploreView.tsx, ProfileView.tsx, SellerDashboardView.tsx, SellerInventoryView.tsx
  - 1-b → views/LiveView.tsx
  - 1-c → views/ProductView.tsx, CheckoutView.tsx, OrdersView.tsx, OrderDetailView.tsx, WalletView.tsx
- قواعد مشترک: RTL فارسی، تومان با اعداد فارسی (src/lib/format)، فقط رنگ‌های برند، shadcn مجاز، بدون عکس خارجی (گرادیان + ایموجی)، بدون اجرای dev/build.

---
Task ID: 1-b
Agent: full-stack-developer
Task: baseline v1.0 — LiveView (نمای اتاق لایو)

Work Log:
- worklog.md و فایل‌های پایه (format.ts, data/*, app-store.ts, shared.tsx, AppShell.tsx, dialog.tsx) کامل خوانده شد؛ توکن‌های رنگ و انیمیشن‌های globals.css بررسی شد.
- stub فعلی `views/LiveView.tsx` کامل جایگزین شد با ۴ کامپوننت داخلی جدا (آمادهٔ جراحی تمیز فاز ۱): LiveHeader, LiveVideo, ProductDock, LiveChat.
- LiveHeader: دکمهٔ back با ChevronRight داخل دایرهٔ نیمه‌شفاف → back()؛ چیپ فروشنده (Avatar sm + نام + ✓ تأیید)؛ LiveBadge با viewers شو در سمت چپ (ms-auto).
- LiveVideo: GradientCover شو با h-[42vh] max-h-80 rounded-b-3xl + ایموجی بزرگ با animate-ls-float؛ ریل عمودی مطلق سمت چپ ویدیو با سه دکمهٔ دایره‌ای نیمه‌شفاف: قلب صورتی (شروع ۱۲۴، هر کلیک +۱ + fill محلی، بدون toast)، toggle بی‌صدا Volume2/VolumeX، Share2 → toast «لینک شو کپی شد (دمو)»؛ نوار tags زیر ویدیو با چیپ‌های show.tags + «{faNum(viewers)} بینندهٔ زنده» با آیکون Eye.
- ProductDock: کارت bg-ls-card با بوردر بنفش و سایهٔ glow؛ آیتم فعلی از getAuctionItem(showId) ?? getShowItems(showId)[0]؛ ردیف ۱ کلیک‌پذیر → openItem (GradientCover 16×16 + عنوان bold + متای برند · سایز · condition)؛ وضعیت auction: «بید فعلی» + Price بنفش + چیپ تایمر faClock با شرط قرمز text-[#FF3B5C] برای timerSec<30 + دکمهٔ بنفش flex-1 «ثبت بید» با Dialog ساده (مبلغ پیشنهادی currentBid+step، تایید → toast.success «بید تو ثبت شد ✅»، انصراف) + دکمهٔ سبز outline «خرید فوری» → push('checkout', item.id)؛ buy_now: دکمهٔ سبز کامل با قیمت؛ sold: دکمهٔ خاکستری disabled؛ up_next: StatusChip صورتی + دکمهٔ «یادآوری» → toast 🔔؛ دکمه‌ها stopPropagation؛ زیر کارت: هزینهٔ ارسال با white/40.
- LiveChat: عنوان «چت زنده» + تعداد پیام (faNum)؛ لیست پیام‌ها با کپی CHAT_BY_SHOW[showId] در useState (append ممکن) با max-h-64 overflow-y-auto scroll-thin + auto-scroll به پایین؛ رندر بر اساس kind: normal (Avatar + نام + متن)، mod (نام بنفش + bg-ls-purple/10)، purchase (کادر سبز border-ls-green/40 + chip tag)، system/winner/giveaway (pill وسط‌چین به ترتیب خاکستری/بنفش/صورتی)؛ Input + دکمهٔ Send بنفش دایره‌ای؛ ارسال پیام کاربر «علی» 🧑‍💻 #6C5CFF kind normal + پاک شدن input + ارسال با Enter.
- بدون engine مزایده (تایمر نمایشی ثابت از timerSec) طبق محدودهٔ baseline؛ aria-label فارسی برای همهٔ دکمه‌ها.
- `bunx tsc --noEmit | grep "views/LiveView"` → بدون خطا؛ lint فایل خودم پاک (خطای موجود فقط در ProductView.tsx متعلق به ایجنت دیگر)؛ dev.log سالم، GET / 200.

Stage Summary:
- نمای «اتاق لایو» (LiveView) در baseline v1.0 کامل شد: هدر شناور + ویدیوی گرادیانی با ریل تعامل + کارت محصول چهاروضعیتی (auction/buy_now/sold/up_next) با Dialog ثبت بید + چت زندهٔ کاملاً تعاملی با append پیام کاربر.
- قرارداد برای فاز ۱: ProductDock و LiveChat به‌صورت کامپوننت‌های مستقل داخل همین فایل هستند؛ جایگزینی با engine مزایده و socket فقط این دو بخش را دست می‌زند؛ LiveHeader/LiveVideo مستقل‌اند.
- هیچ فایل مشترک دیگری تغییر نکرد (فقط stub فایل خودم).

---
Task ID: 1-c
Agent: full-stack-developer
Task: baseline v1.0 — Product/Checkout/Orders/OrderDetail/Wallet

Work Log:
- worklog.md و فایل‌های پایه (format.ts, types.ts, shows.ts, items.ts, orders.ts, app-store.ts, wallet-store.ts, orders-store.ts, shared.tsx, dialog.tsx) کامل خوانده شد؛ توکن‌های رنگ و انیمیشن‌های globals.css بررسی شد.
- stub پنج فایل خودم (ProductView/CheckoutView/OrdersView/OrderDetailView/WalletView) کامل جایگزین شد؛ هیچ فایل مشترک یا فایل ایجنت دیگر دست نخورد.
- ProductView: PageHeader «جزئیات محصول» + GradientCover h-56 rounded-b-3xl با StatusChip شناور؛ چیپ‌های برند/سایز/condition؛ کارت فروشنده (Avatar + نام + ✓ + RatingStars + «ورود به شو» → openShow)؛ کارت قیمت چهارجانبه (auction: «بید فعلی» + Price بنفش 2xl + چیپ «پلهٔ مزایده» + AuctionTimer زیرکامپوننت با شمارش معکوس محلی و قرمز #FF3B5C زیر ۳۰ ثانیه با animate-ls-timer-alert؛ buy_now: سبز 2xl؛ sold: soldPrice سفید/۶۰ + «فروخته شد به …»)؛ توضیحات leading-7؛ ردیف ارسال Truck + «ارسال با تیپاکس» + Price ریز + نکتهٔ «هزینهٔ ارسال جدا…»؛ نوار اکشن چسبان: auction → بنفش «ثبت بید — {currentBid+step}» با Dialog تأیید → toast.success «بید تو ثبت شد ✅» (فاز ۱: موتور واقعی) + دکمهٔ سبز outline «خرید فوری» → push('checkout')؛ buy_now → دکمهٔ سبز بزرگ با قیمت؛ sold → خاکستری disabled؛ up_next → outline صورتی «یادآوری» → toast 🔔.
- CheckoutView: آیتم از currentItemId وگرنه اولین buy_now شو؛ کارت خلاصهٔ کالا (GradientCover 14×14 + فروشنده + Price)؛ کارت آدرس (MapPin بنفش + DEFAULT_ADDRESS whitespace-pre-line + «ویرایش» → toast دمو)؛ «روش ارسال» با Radio سفارشی از SHIPPING_METHODS (انتخاب: border-ls-purple bg-ls-purple/10 + Check بنفش، eta ریز، Price چپ)؛ کارت پرداخت (کالا / «هزینهٔ ارسال — {label}» / جداکننده / «قابل پرداخت» بنفش xl + ردیف Wallet سبز «پرداخت از کیف پول — موجودی…»)؛ دکمهٔ بنفش «پرداخت {total}»: موجودی ناکافی → toast.error + push('wallet')؛ وگرنه spend → addOrder (id=nextOrderId، تایم‌لاین ۳مرحله‌ای فقط «پرداخت شد» done، createdAtLabel «همین حالا»، آدرس DEFAULT_ADDRESS) → toast.success 🎉 → setRoot('orders').
- OrdersView: SectionTitle «سفارش‌های من» + count badge؛ چیپ‌های فیلتر همه/جاری/تحویل‌شده (منطق some(!done) / every(done))؛ کارت سفارش → openOrder (GradientCover 14×14 rounded-xl + عنوان/فروشنده/«سفارش #id» + Price + چیپ وضعیت: اولین step انجام‌نشده صورتی outline یا «تحویل شد» سبز)؛ خالی → EmptyState 📦 + «رفتن به کاوش» → setRoot('explore').
- OrderDetailView: سفارش از currentOrderId با fallback اولین؛ کارت کالا، تفکیک قیمت (کالا/ارسال/مجموع بنفش)، کارت آدرس، ردیف ارسال (Truck + label روش + کد رهگیری mono dir=ltr با toFa، کلیک → toast «کد کپی شد (دمو)»)؛ تایم‌لاین عمودی ۳ مرحله‌ای: دایرهٔ سبز پر با Check سفید برای done / دایرهٔ خط‌چین خاکستری برای pending + خط اتصال عمودی border-r border-white/10 + atLabel ریز؛ دکمه‌ها: «پیگیری سفارش» بنفش (toast کد یا «به‌زودی کد رهگیری فعال می‌شود (دمو)») + «تماس با فروشنده» outline (toast دمو)؛ اگر تحویل‌شده و !rated → دکمهٔ سبز «امتیاز به فروشنده» → toast.success ⭐ + setRated(id).
- WalletView: کارت موجودی گرادیان بنفش inline (135deg,#6C5CFF,#4a3dd6) + «موجودی قابل استفاده» + Price سفید 3xl + ردیف Wallet «پرداخت در لایو با یک کلیک…»؛ دکمهٔ سبز «+ شارژ کیف پول» → Dialog: چیپ‌های ۵۰۰٬۰۰۰/۱٬۰۰۰٬۰۰۰/۲٬۰۰۰٬۰۰۰ + Input عددی دلخواه (پارس با تبدیل ارقام فارسی و حذف جداکننده‌ها) + دکمهٔ بنفش «پرداخت» → charge(amount,'زرین‌پال') → toast.success «کیف پول شارژ شد ✅» + بستن (فاز ۱: انتخاب درگاه)؛ دو کارت ریز «شارژ/خرید این ماه» از جمع داینامیک txs؛ «تاریخچهٔ تراکنش‌ها» در max-h-96 overflow-y-auto scroll-thin: آیکون دایره‌ای per-kind (charge: ArrowDownCircle سبز / purchase: ArrowUpCircle صورتی / win: Trophy amber-300 / refund: Undo2 سفید/۶۰) + title + atLabel ریز + مبلغ (+ سبز / − سفید) با toman.
- رعایت کامل قواعد: 'use client'، ریشهٔ flex-1 flex flex-col با aria-label فارسی، RTL، اعداد فارسی از @/lib/format، بدون عکس (GradientCover+emoji)، فقط رنگ‌های برند + قرمز #FF3B5C برای تایمر/خطا، toast از sonner.
- `bunx tsc --noEmit | grep` پنج فایل → بدون خطا (خطاهای examples/ و skills/ مربوط به این تسک نیست)؛ eslint پنج فایل پاک (اولاً یک خطای set-state-in-effect در ProductView بود که با استخراج AuctionTimer به زیرکامپوننت keyed برطرف شد)؛ dev.log سالم: کامپایل موفق، GET / 200.

Stage Summary:
- پنج نمای تجاری baseline v1.0 تکمیل شد: مسیر کامل خرید (لایو/کالا → تسویه → سفارش‌ها → جزئیات سفارش → کیف پول) با ناوبری stack-based کار می‌کند؛ خرید فوری واقعاً از کیف پول کم می‌کند و سفارش می‌سازد.
- قرارداد برای فاز ۱: موتور مزایده فقط Dialog ثبت بید و AuctionTimer در ProductView + هماهنگی ProductDock در LiveView را دست می‌زند؛ درگاه پرداخت فقط Dialog شارژ WalletView + spend در CheckoutView؛ اتصال socket/پیگیری مرسولات می‌تواند در OrderDetailView به تایم‌لاین اضافه شود.
- جزئیات فنی برای ایجنت‌های بعدی در `agent-ctx/1-c-full-stack-developer.md` ثبت شد.
- هیچ فایل مشترک دیگری تغییر نکرد (فقط stub فایل‌های خودم).
---
Task ID: 1-a
Agent: full-stack-developer
Task: baseline v1.0 — Home/Explore/Profile/SellerDashboard/SellerInventory

Work Log:
- مرحلهٔ صفر: worklog.md و APIهای مشترک خوانده شد (format, data/types, shows, categories, orders, items, app-store, orders-store, wallet-store, shared.tsx, AppShell.tsx) تا از توکن‌ها و امضای کامپوننت‌ها مطمئن شوم.
- HomeView: تیتر خوش‌آمد + شمارش لایوها با faNum، ردیف چیپ‌های دسته‌بندی (اسکرول افقی no-scrollbar، کلیک → setRoot('explore'))، لیست عمودی ShowCard برای LIVE_SHOWS با openShow، ردیف افقی ShowCard compact برای UPCOMING_SHOWS با toast یادآوری، بنر «چطور کار می‌کنه؟» با حاشیهٔ گرادیان بنفش→صورتی و سه گام مزایده، pb-8.
- ExploreView: نوار جستجوی شادیک (Input + آیکون Search) با فیلتر کلاینت‌ساید روی SHOWS (title/category) و SELLERS (name/handle)؛ در حالت جستجو سکشن‌های «شوها» (ShowCard compact دو ستونه) و «فروشندگان» (Avatar + handle با dir=ltr + RatingStars + دکمهٔ فالو outline → toast) و EmptyState برای بی‌نتیجگی؛ در حالت خالی: گرید ۲ ستونهٔ دسته‌بندی‌ها (emoji بزرگ + «{faNum(liveCount)} شو زنده» به رنگ ls-pink)، فیلتر دسته با state محلی + چیپ فعال با ✕، سکشن شوهای زنده (کامل یا فیلترشده + EmptyState برای دستهٔ بدون لایو) و ردیف «به‌زودی».
- ProfileView: کارت پروفایل (Avatar xl با ایموجی 🧑‍💻 و رنگ #6C5CFF، نام، هندل، «عضو از ۱۴۰۲»، دکمهٔ ویرایش → toast)، ردیف ۳ کارت آمار (خریدها از useOrdersStore، فالوشده‌ها ۲۴، امتیاز باشگاه ۶۴۰ — همگی faNum/toFa)، منوی لیستی ۷ ردیفه با آیکون lucide و ChevronLeft (RTL): کیف پول با trailing موجودی سبز از wallet-store → push('wallet')، سفارش‌ها با trailing تعداد → setRoot('orders')، فروشندهٔ من → setRoot('sellerDashboard')، و آدرس‌ها/تنظیمات/پشتیبانی/درباره با toast دمو.
- SellerDashboardView: PageHeader با onBack={back} (چون TopBar ندارد)، کارت هویت فروشنده از getSeller('s1') با نشان تأیید بنفش و chip برنامهٔ مزایده، گرید ۳ کارت آمار هفته (تoman + ▲درصد سبز)، کارت هشدار «نیاز به اقدام» (border-ls-pink/40 bg-ls-pink/10 + دکمهٔ صورتی → setRoot('orders'))، گرید ۲×۲ اکشن‌ها (انبار/سفارش‌ها/کیف پول/شو بعدی با CalendarClock و toast)، کارت لایو فعال با LiveBadge و دکمهٔ بنفش «مشاهدهٔ لایو» → openShow('sh1').
- SellerInventoryView: PageHeader با زیرعنوان «{faNum(itemsTotal)} آیتم»، چیپ‌های شمارش فعال/در مزایده/فروخته (محاسبهٔ داینامیک از ITEMS_SH1 با نقطهٔ رنگی)، Input جستجوی عنوان، لیست ردیفی آیتم‌ها (GradientCover w-12 h-12 + عنوان + brand/size/sku با toFa + ستون قیمت Price(currentBid ?? buyNowPrice ?? soldPrice ?? startPrice) + StatusChip؛ کلیک → toast) داخل max-h-96 overflow-y-auto scroll-thin، دکمهٔ شناور «+ آیتم جدید» با sticky bottom-24 → toast، EmptyState برای جستجوی بی‌نتیجه.
- رعایت قواعد: 'use client'، ریشهٔ flex-1 flex flex-col، فقط رنگ‌های برند، اعداد فارسی کامل (هیچ رقم لاتینی — SKUها با toFa)، toast از sonner، aria-label فارسی برای همهٔ دکمه‌ها/کارت‌های سفارشی، بدون fetch و بدون عکس خارجی.
- بررسی نهایی: bunx tsc --noEmit → صفر خطا در پنج فایل این تسک؛ bun run lint → 0 error (فقط ۱ warning قدیمی layout.tsx از Task 0)؛ dev.log سالم (GET / 200).

Stage Summary:
- پنج نمای baseline (Home/Explore/Profile/SellerDashboard/SellerInventory) کامل و جایگزین stub شدند؛ اپ روی مسیرهای خانه/کاوش/حساب/پنل فروشنده کاملاً ناوبری‌پذیر است.
- الگوهای مشترک رعایت شد: ShowCard/GradientCover/Avatar/RatingStars/PageHeader/Chip/EmptyState از shared، zustand router (push/setRoot/back/openShow)، فرمت اعداد فارسی از @/lib/format.
- هیچ فایل دیگری edit نشد؛ فاز ۱ (نوار بید/پیش‌نمایش روی کارت‌ها و اتصال Live/Product) برای ایجنت‌های 1-b/1-c باقی است.

---
Task ID: 1
Agent: main (Z.ai Code)
Task: یکپارچه‌سازی و تأیید baseline v1.0 + آرشیو

Work Log:
- سه ایجنت موازی (1-a، 1-b، 1-c) هر ۱۲ نمای v1.0 را ساختند
- رفع باگ یک‌المانه: CheckoutView حالا param پشتهٔ ناوبری را هم می‌خواند (خرید فوریِ آیتم درست را باز می‌کند)
- lint پاک، tsc پاک (فقط خطاهای vendored examples/skills خارج از محدوده)
- تأیید مرورگری (agent-browser): خانه، لایو، تسویه، خطای موجودی ناکافی، شارژ کیف پول (+۱٬۰۰۰٬۰۰۰ ✓)، سفارش‌ها، پنل فروشنده، انبار کالا، حساب، کاوش — همه رندر و تعامل سالم؛ بدون خطای کنسول
- ساخت liveshop-v1.0.zip در download/ و ثبت v1.0 در CHANGELOG.md

Stage Summary:
- v1.0 کامل و آرشیو شد — نقطهٔ بازگشت امن برای فاز ۱

---
Task ID: 2-d
Agent: full-stack-developer
Task: فاز ۱ (P0) — ارتقای فید اصلی و کشف شوها (تصاویر ۰۲ و ۱۳)

Work Log:
- مرحلهٔ صفر: worklog.md (Task 0، 1-b، 1-c، 1-a، 1) و فایل‌های پایه (HomeView، ExploreView، shared.tsx، shows.ts، items.ts/getAuctionItem، format.ts، app-store.ts، types.ts، توکن‌های globals.css) خوانده شد؛ قانون طلایی «فقط اضافه کن» رعایت شد — ساختار و محتوای baseline هر دو View دست‌نخورده ماند و فقط المان‌های جدید افزوده شد.
- HomeView — تب‌های «برای شما / دنبال‌شده‌ها»: ردیف دو دکمهٔ چیپ (state محلی، پیش‌فرض «برای شما») داخل سکشن شوهای زنده زیر SectionTitle؛ «برای شما» = همهٔ LIVE_SHOWS، «دنبال‌شده‌ها» = LIVE_SHOWS.filter(isFollowing)؛ استایل فعال bg-ls-purple text-white و غیرفعال bg-ls-card-2 text-white/60 با aria-pressed؛ حالت خالیِ دنبال‌شده‌ها → EmptyState کوچک محلی (🫥 «هنوز فروشنده‌ای را دنبال نکرده‌ای» + دکمهٔ «رفتن به کاوش» → setRoot('explore')).
- HomeView — نوار پیش‌نمایش روی کارت شو: کامپوننت محلی LiveBidBar به‌عنوان پروپ footer جدید ShowCard (زیر ردیف فروشنده): برای شو live با getAuctionItem → ردیف mt-1 rounded-lg bg-ls-card-2 px-2.5 py-1.5 text-[11px] با قطرهٔ بنفش w-1.5 h-1.5 + «بید فعلی {toman(currentBid)}» بنفش bold (text-ls-purple-soft) + سمت چپ (ms-auto) Clock ریز w-3 + faClock(timerSec) که زیر ۳۱ ثانیه text-[#FF3B5C] می‌شود؛ بدون آیتم مزایده → «خرید فوری از {toman(min buyNowPrice)}» سبز با Math.min و گارد آرایهٔ خالی (filter type-guard)؛ گارد undefined بودن getAuctionItem و currentBid (fallback به startPrice) و timerSec گذاشته شد. اعداد نمایشی ثابت (mock) — تایمر زنده ندارد.
- HomeView — سکشن «به‌زودی» با یادآوری: کامپوننت‌های محلی ReminderToggle و UpcomingFooter؛ فوتر هر کارت compact = نوار «شروع: {startsAtLabel}» (Clock صورتی + bg-ls-card-2) + دکمهٔ toggle یادآوری (Set محلی از idها): عادی outline صورتی «یادآوری 🔔» (border-ls-pink/50 text-ls-pink)، فعال سبز پر «یادآوری فعال ✓» (bg-ls-green text-[#04281e])؛ روشن → toast.success «یادآوری فعال شد — ۳۰ دقیقه قبل از شروع خبر می‌دهیم»، خاموش → toast «یادآوری برداشته شد»؛ toast عمداً خارج از setState updater (StrictMode-safe).
- نکتهٔ فنی مشترک: چون ShowCard یک <button> است، دکمهٔ یادآوری به‌صورت span با role="button" + tabIndex + aria-pressed + aria-label فارسی + onKeyDown (Enter/Space با preventDefault و stopPropagation) پیاده شد تا هم DOM nesting نامعتبر (button-in-button) و هم warning کنسول رخ ندهد و کیبورد/اسکرین‌ریدر پشتیبانی شود؛ کلیک دکمه با stopPropagation مانع openShow کارت می‌شود.
- ExploreView — چیپ «فقط لایوها»: toggle چیپ در اسلات action SectionTitle سکشن شوها (دات نشانگر + برچسب «فقط لایوها»، aria-pressed + aria-label فارسی)؛ پیش‌فرض روشن (مثل baseline: فقط زنده‌ها) → خاموش که شود لیست ادغامی [...liveList, ...upcomingList] در همان لیست رندر می‌شود (کارت‌های به‌زودی با فوتر شروع+یادآوری) و سکشن جدا «به‌زودی» پایین صفحه پنهان می‌شود (بدون تکرار)؛ عنوان سکشن پویا: بدون فیلتر دسته «فقط زنده‌ها» / «همهٔ شوها»، با فیلتر دسته همان label دسته (حفظ baseline).
- ExploreView — یادآوری به‌زودی‌ها: همان الگوی HomeView — در ردیف compact «به‌زودی» پایین صفحه فوتر UpcomingFooter (نوار شروع + ReminderToggle) به کارت‌ها اضافه شد؛ Set یادآوری‌ها state مشترک خود View است تا ردیف compact و حالت ادغام هم‌حالت بمانند؛ جستجو، گرید دسته‌ها، چیپ فیلتر دسته و کارت‌های لایو بدون تغییر (بند ۳ تسک).
- رعایت قواعد: 'use client'، RTL، ارقام فارسی از @/lib/format (faClock/toman/faNum)، فقط رنگ‌های برند + قرمز #FF3B5C برای تایمر اضطراری، aria-label فارسی برای همهٔ کنترل‌های جدید، بدون تغییر shared.tsx یا هر فایل دیگر (فقط دو فایل متعلق به تسک).
- بررسی نهایی: `bunx tsc --noEmit | grep views/(HomeView|ExploreView)` → صفر خطا؛ eslint هر دو فایل → پاک؛ dev.log سالم (کامپایل موفق، GET / 200).

Stage Summary:
- فید خانه و کاوشِ فاز ۱ فعال شد: تب «برای شما/دنبال‌شده‌ها» + نوار «بید فعلی + تایمر» (یا «خرید فوری از …») روی کارت‌های لایو خانه + سکشن به‌زودی با toggle یادآوری (toast دوزبانهٔ فارسی) در هر دو View و چیپ «فقط لایوها» با حالت ادغام در کاوش.
- قرارداد برای تسک‌های بعدی: ReminderToggle/UpcomingFooter/LiveBidBar عمداً به‌صورت کامپوننت محلی در هر فایل تکرار شده‌اند (محدودیت «فقط دو فایل») — اگر به shared منتقل شدند، footer prop جدید ShowCard (از baseline 1-a) نقطهٔ اتصال است؛ state یادآوری محلی است و بعداً می‌تواند به store سراسری برود بدون تغییر UI.

---
Task ID: 2-c
Agent: full-stack-developer
Task: فاز ۱ (P0) — درگاه شارژ شبیه‌سازی‌شده (زرین‌پال/آیدی‌پی) + صفحهٔ برد و سفارش (WinView)

Work Log:
- مرحلهٔ صفر: worklog.md (Task 0/1-a/1-b/1-c) و APIها خوانده شد: wallet-store (charge با gateway، spend، canAfford)، orders-store (addOrder/setRated)، live-store (pendingWin: {itemId, itemPrice, shippingPrice, showId} + clearPendingWin — موتور پس از برد کسر می‌کند و سفارش می‌سازد)، OrderDetailView (الگوی تایم‌لاین)، shared.tsx، confetti.tsx.
- فایل جدید `src/components/liveshop/gateway-dialog.tsx` ساخته شد — دیالوگ شارژ چندمرحله‌ای با state محلی: ۱) انتخاب درگاه: دو کارت رادیویی بزرگ (زرین‌پال: دایرهٔ گرادیان بنفش #6C5CFF→#4a3dd6 با حرف Z + «درگاه پرداخت زرین‌پال (شبیه‌سازی‌شده)» / آیدی‌پی: دایرهٔ سبز #00C896 با ShieldCheck + «درگاه آیدی‌پی (شبیه‌سازی‌شده)»)، پیش‌فرض زرین‌پال، role=radiogroup/radio + aria-checked؛ ۲) مبلغ: چیپ‌های ۵۰۰٬۰۰۰/۱٬۰۰۰٬۰۰۰/۲٬۰۰۰٬۰۰۰ (فعال با ارقام فارسی faNum) + Input با همان منطق پارس baseline (تبدیل ارقام فارسی، حذف جداکننده‌ها) + پیش‌نمایش «معادل: … تومان» + ردیف درگاه انتخابی با دکمهٔ تغییر (بازگشت به مرحلهٔ ۱)؛ ۳) پردازش: دکمهٔ بنفش «پرداخت از طریق {gateway}» (disabled وقتی مبلغ صفر) → Loader2 animate-spin + «در حال اتصال به درگاه {gateway}…» + ریز «این یک درگاه شبیه‌سازی‌شده برای دمو است» — ۱.۲ ثانیه با setTimeout در ref (لغو در بستن دیالوگ/unmount — انصراف = عدم شارژ)؛ ۴) رسید موفق: CheckCircle2 سبز + «پرداخت موفق!» + مبلغ + «از طریق {gateway}» + دکمهٔ «بازگشت به کیف پول» — در لحظهٔ موفقیت charge(amount, gateway) + toast.success «کیف پول شارژ شد ✅»؛ reset کامل state هنگام بستن.
- WalletView جراحی شد (طبق قانون طلایی فقط همین): Dialog سادهٔ baseline حذف و با `<GatewayDialog open onOpenChange>` جایگزین شد؛ دکمهٔ «+ شارژ کیف پول» همان رفتار (باز کردن دیالوگ)؛ در ردیف تاریخچه، اگر tx.gateway بود زیر عنوان خط ریز بنفش «از طریق {gateway}» اضافه شد؛ کارت موجودی/آمار ماه/اسکرول تاریخچه دست‌نخورده ماند؛ importهای مرده (toast، Chip، Dialog، charge) پاک شد.
- WinView کامل ساخته شد (جایگزین stub): بدون pendingWin → PageHeader «سفارش شما» + EmptyState 🏆 «هنوز چیزی نبردی!» + توضیح + دکمهٔ بنفش «رفتن به شوهای زنده» → openShow('sh1')؛ با pendingWin → Confetti روی کل صفحه (mount با ورود)، هیرو: دایرهٔ سبز بزرگ Check با glow + «شما برنده شدید! 🎉» (text-2xl font-black) + «پرداخت خودکار از کیف پول انجام شد»؛ کارت آیتم: GradientCover ۱۶×۱۶ + عنوان/برند (از سفارش تازه‌ساختهٔ موتور orders[0] با fallback) + ردیف فروشنده (Avatar sm + «فروشنده: …» از getSeller بر اساس showId: sh1→s1, sh2→s2, ش3→s3 با ✓ تأیید)؛ کارت تفکیک قیمت: «قیمت کالا (بید برنده)» + «هزینهٔ ارسال — تیپاکس» + جداکنندهٔ dashed + «مجموع پرداخت‌شده» بنفش xl + ردیف ریز Wallet سبز «کسر شده از موجودی کیف پول»؛ کارت آدرس: MapPin + DEFAULT_ADDRESS با whitespace-pre-line + «ویرایش» → toast «ویرایش آدرس (دمو)»؛ تایم‌لاین عمودی ۳مرحله‌ای هم‌استایل OrderDetailView (دایرهٔ سبز Check / خط‌چین + خط اتصال border-r): «پرداخت شد» ✓ سبز («همین حالا») / «در حال آماده‌سازی» pending («تا ۲ روز کاری») / «ارسال شد» pending («کد رهگیری اینجا نمایش داده می‌شود»)؛ نوار اکشن چسبان sticky bottom-0 با backdrop مثل ProductView: «پیگیری سفارش» بنفش flex-1 → openOrder(orders[0].id) + «امتیاز به فروشنده» outline → Dialog امتیازدهی با ۵ ستارهٔ کلیک‌خور (Star fill-amber-300 بر اساس state، پیش‌فرض ۵، role=radio + aria-label فارسی با toFa) + «ثبت امتیاز» → setRated(order.id) + toast.success «امتیاز تو ثبت شد ⭐» + بستن؛ unmount → clearPendingWin().
- قواعد: 'use client'، ریشهٔ flex-1 flex flex-col با aria-label فارسی، RTL، ارقام/مبالغ فارسی از @/lib/format (toman/fatoFa)، بدون عکس (GradientCover/Avatar/emoji)، فقط رنگ‌های برند + amber-300 مجاز برای ستاره، toast از sonner، بدون پکیج جدید.
- بررسی: `bunx tsc --noEmit | grep (WalletView|WinView|gateway-dialog)` → صفر خطا؛ eslint سه فایل → پاک؛ dev.log سالم (Compiled + GET / 200).

Stage Summary:
- جریان کامل فاز ۱ متصل شد: برد در مزایده (موتور live-store) → کسر خودکار کیف پول + سفارش → صفحهٔ برد (WinView) با رسید تفکیک‌شده و تایم‌لاین → «پیگیری سفارش» به OrderDetailView همان سفارش → «امتیاز به فروشنده» با ستاره‌ها ثبت می‌شود؛ شارژ کیف پول حالا مسیر واقعی درگاه (انتخاب زرین‌پال/آیدی‌پی → پردازش → رسید) را دارد و تراکنش با برچسب درگاه در تاریخچه می‌نشیند.
- قرارداد برای ایجنت‌های بعدی: GatewayDialog کاملاً self-contained است (خودش charge و toast را صدا می‌زند) و در هر جای اپ قابل استفاده؛ WinView به pendingWin زندهٔ live-store وابسته است و با unmount آن را پاک می‌کند — ورود مستقیم به 'win' بدون برد، EmptyState می‌دهد؛ LiveView برای هدایت به این صفحه کافی است پس از finishedItem.iWon دکمه‌ای با push('win') بگذارد.
- جزئیات فنی در `agent-ctx/2-c-full-stack-developer.md` ثبت شد.
- هیچ فایل مشترک دیگری تغییر نکرد (فقط فایل‌های خودم: WalletView، WinView، gateway-dialog جدید).

---
Task ID: 2-b
Agent: full-stack-developer
Task: فاز ۱ (P0) — بازسازی کامل «اتاق لایو»: موتور مزایده + شیت بید + تب Shop + گیواوی

Work Log:
- مرحلهٔ صفر: worklog.md (Task 0/1-b/1-c/1-a/1) و agent-ctx/1-c خوانده شد؛ store/live-store.ts (موتور کامل)، baseline LiveView، shared.tsx، format.ts، data/items|shows، ui/drawer|switch|dialog و confetti بررسی شد. WinView هم بررسی شد: pendingWin را خودش مصرف و در unmount پاک می‌کند (هم‌نشینی با جریان «مشاهدهٔ سفارش» بدون دست‌زدن به آن).
- views/LiveView.tsx روی baseline بازنویسی شد (ساختار حفظ: LiveHeader دست‌نخورده، ویدیو + ریل + کارت محصول + چت):
  - mount → startShow(currentShowId ?? 'sh1') و unmount → stopShow در cleanup؛ setInterval(1000, tick) فقط وقتی phase==='running' یا giveaway.phase==='countdown'؛ همهٔ intervalها در cleanup پاک می‌شوند.
  - بنر برندهٔ فعلی (WinnerBanner) روی لبهٔ پایین ویدیو: گرادیان بنفش + Avatar ریز + bidderLabel؛ برای me سبز با «تو پیشتی! 🔥»؛ winnerId خالی → «اولین بید را تو بزن!».
  - تایمر کارت محصول: <=10s قرمز #FF3B5C + animate-ls-timer-alert (رفتار قرمز <30s baseline حفظ شد)؛ فلش «+۱۰ ثانیه تمدید شد ⏱» چیپ صورتی animate-ls-fade-up با key={lastExtendAt} — visibility مشتق از Date.now()-lastExtendAt<1500 (بدون setState در effect، re-render هر تیک موتور آن را دقیق می‌بندد).
  - ریل کناری — فقط اضافه: Store (باز کردن ShopTab) و Gift (startGiveaway) زیر قلب؛ قلب/بی‌صدا/اشتراک baseline دست‌نخورده.
  - ProductDock متصل به موتور: آیتم فعال از store.items+activeItemId، بید/تایمر زنده از store؛ دکمهٔ بنفش «ثبت بید — {toman(currentBid+step)}» → BidSheet (جایگزین مجاز Dialog دمو)؛ «خرید فوری» → push('checkout', item.id) بدون دیالوگ؛ sold → دکمهٔ خاکستری disabled؛ phase 'awaiting_next' → کارت خاکستری «در انتظار آیتم بعدی ⏳»؛ کلیک کارت → openItem.
  - مودال پایان مزایده (FinishedModal): iWon → Confetti + «شما برنده شدید! 🎉» + «مشاهدهٔ سفارش» → push('win') + dismissFinished() (WinView موجود pendingWin را نشان می‌دهد)؛ برد ربات → «مزایده تمام شد» + برنده + شمارش معکوس ۳.۵ ثانیه‌ای (AutoNextCountdown با interval محلی و firedRef) سپس خودکار dismissFinished() + startNextItem().
  - LiveChat: منبع = liveStore.chat (seed از CHAT_BY_SHOW در startShow)؛ استایل‌های baseline عیناً حفظ (purchase سبز+tag، mod بنفش، pill وسط system/winner/giveaway)؛ پیام‌های موتور خودکار می‌آیند؛ ارسال → pushChat(علی/🧑‍💻/#6C5CFF/normal)؛ auto-scroll پایین.
- bid-sheet.tsx (جدید): vaul Drawer از ui/drawer — دستگیره + عنوان + ردیف آیتم (GradientCover w-10 + brand/size)؛ بلوک «بید فعلی» با Price بنفش و تایمر (قرمز+پالس <=10)؛ استپر دایره‌ای ± با clamp به min=currentBid+step و عدد بزرگ وسط (مقدار اولیه currentBid+step) + «پلهٔ مزایده»؛ توگل Max Bid با ui/Switch (بنفش) + Input سقف با پارس ارقام فارسی (پیش‌فرض currentBid+3×step، از store اگر قبلاً ست شده) + متن کمکی «حتی اگر آفلاین باشی» → setMyMaxBid(enabled, amount)؛ جعبهٔ هشدار ضدکلاهبرداری زمانی با کلاس‌های دقیق صورتکی؛ ردیف کیف پول (موجودی زنده) + «شارژ کیف پول» → push('wallet') با بستن شیت؛ دکمهٔ بنفش بزرگ «ثبت بید — {toman(amount)}» → placeMyBid: ok → toast.success «بید تو ثبت شد ✅» + close، error → toast.error پیام فارسی موتور. برای sync مقدار اولیه بدون setState در effect، شیت در ProductDock با key={nonce} (افزایش در event باز شدن) remount می‌شود.
- shop-tab.tsx (جدید): اورلی absolute inset-0 z-40 bg-ls-bg/97 backdrop-blur داخل ستون لایو (ریشهٔ LiveView relative شد — تنها افزودن کلاس)؛ هدر «Shop این شو» + X + شمارندهٔ «{faNum(soldCount)} از {faNum(items.length)} فروخته شد» + نوار Progress سبز (soldCount/items)؛ گرید grid-cols-2 gap-3 اسکرولی از liveStore.items: کارت = GradientCover h-24 + StatusChip گوشه + (بچ «زنده» روی آیتم فعال) + عنوان line-clamp-2 + قیمت per-status (auction: بید فعلی زنده — برای آیتم فعال از store.currentBid/timerSec، بقیه static؛ up_next: «شروع از»؛ buy_now: قیمت سبز + دکمهٔ ریز خرید فوری → push('checkout') با stopPropagation؛ sold: soldPrice + «فروخته شد به {soldTo}»)؛ کلیک کارت (نه BIN) → openItem؛ کارت div با role=button + tabIndex + Enter/Space (جلوگیری از button تودرتو).
- giveaway-modal.tsx (جدید): ui Dialog با شرط giveaway.phase !== 'idle' (به‌علاوهٔ dismissed محلی — بستن فقط UI، store در 'won' می‌ماند؛ با Gift بعدی handleGiveaway مقدار dismissed را ریست می‌کند)؛ countdown → دایرهٔ بزرگ بنفش animate-ls-pulse با faNum(secondsLeft) + «در حال قرعه‌کشی زنده…»؛ won → Confetti + 🏆 + chip برنده با رنگ اختصاصی (winnerEmoji + winnerLabel) + «جایزه به پروفایل برنده اضافه شد (دمو)» + دکمهٔ «عالیه!».
- رعایت قواعد: 'use client'، RTL، اعداد فارسی از @/lib/format (faNum/toman/faClock/toFa)، toast از sonner، aria-label فارسی در همهٔ دکمه‌ها/کارتها، بدون عکس (GradientCover)، بدون پکیج جدید، فقط رنگ‌های برند + قرمز #FF3B5C تایمر، ریشهٔ LiveView = flex-1 flex flex-col (+relative برای اورلی).
- بررسی نهایی: `bunx tsc --noEmit | grep` چهار فایل → صفر خطا (خطاهای examples/skills و ایجنت‌های موازی نادیده)؛ eslint چهار فایل → 0 خطا؛ dev.log سالم: کامپایل موفق، GET / 200.

Stage Summary:
- اتاق لایو v1.1 شد: موتور مزایدهٔ زنده (ربات‌ها، پلهٔ خودکار، ضدکلاهبرداری زمانی، Max Bid، کسر کیف پول + ساخت خودکار سفارش پس از برد) به UI وصل است؛ شیت بید vaul، تب Shop زنده داخل لایو، گیواوی مودال و مودال پایان مزایده با جریان کامل برد (Confetti → مشاهدهٔ سفارش → WinView).
- قرارداد برای ایجنت‌های بعدی: ProductView همچنان Dialog دموی خودش را دارد (فاز ۱ محدودهٔ 2-b فقط LiveView بود)؛ placeMyBid/setMyMaxBid/pendingWin از store/live-store قابل استفاده‌اند اگر بعداً ProductView هم بخواهد وصل شود؛ dismissed-state گیواوی در LiveView نگه‌داری می‌شود (GiveawayModal stateless-بودن store را حفظ می‌کند).
- هیچ فایل مشترک/محتوای تأییدشده حذف نشد؛ تنها جایگزینی مجاز (Dialog ثبت بید دمو → شیت مزایدهٔ واقعی) انجام شد.

---
Task ID: 2
Agent: main (Z.ai Code)
Task: یکپارچه‌سازی و تأیید فاز ۱ (P0) + آرشیو v1.1

Work Log:
- Task 2-a (خودم): موتور مزایده در src/store/live-store.ts (پلهٔ خودکار، ضدکلاهبرداری زمانی +۱۰ث، ربات‌ها، Max Bid فقط یک‌پله در رقابت با چک موجودی، کسر خودکار کیف پول + ساخت سفارش پس از برد، گیواوی، چت موتور) + کامپوننت Confetti
- Task 2-b (ایجنت): LiveView متصل به موتور (بنر برندهٔ فعلی، تایمر قرمز پالس‌دار، فلش «+۱۰ ثانیه»، دکمه‌های Shop و Gift در ریل، مودال پایان مزایده)، bid-sheet (استپر ±، Max Bid توگل + سقف، هشدار ضدکلاهبرداری، اعتبارسنجی)، shop-tab (۴ وضعیت + شمارندهٔ «X از Y فروخته شد»)، giveaway-modal (شمارش معکوس + کانفتی + ثبت در چت)
- Task 2-c (ایجنت): gateway-dialog (زرین‌پال/آیدی‌پی + پردازش + رسید)، WalletView ارتقا یافت (برچسب درگاه در تاریخچه)، WinView کامل (کانفتی، تفکیک قیمت کالا+ارسال، آدرس، تایم‌لاین ۳مرحله‌ای، پیگیری سفارش، امتیازدهی ۵ستاره)
- Task 2-d (ایجنت): HomeView تب‌های «برای شما/دنبال‌شده‌ها» + نوار «بید فعلی+تایمر» روی کارت‌ها + یادآوری شوهای آینده؛ ExploreView چیپ «فقط لایوها» + یادآوری
- رفع ۲ خطای جزئی: conditional hook در CheckoutView، آیکون lucide
- تأیید مرورگری کامل (گ waypoint): تب‌های فید، پیش‌نمایش بید، یادآوری، شروع/تمدید تایمر، بیدهای ربات زنده، بنر برنده، هر دو اعتبارسنجی شیت، جنگ Max Bid (چند دور)، برد ربات → مودال پایان → آیتم بعدی → حالت «در انتظار آیتم بعدی»، شارژ زرین‌پال ۸M + آیدی‌پی ۲۰M (پردازش+رسید)، برد واقعی کاربر ۱۱.۸M → کسر خودکار → صفحهٔ برد با کانفتی → سفارش #۱۰۲۴۱ در جزئیات سفارش، تب Shop (۴ وضعیت)، گیواوی (شمارش+کانفتی+چت)، هایلایت پیام‌های خریدمحور — همه سالم، بدون خطای کنسول
- lint و tsc پاک

Stage Summary:
- فاز ۱ کامل و تأییدشده → liveshop-v1.1.zip + CHANGELOG v1.1 — آماده برای تأیید کاربر قبل از فاز ۲ (فروشنده)

---
Task ID: 3-a
Agent: full-stack-developer
Task: فاز ۲ — دیتا و استور سمت فروشنده (data/seller.ts + seller-store.ts)

Work Log:
- مرحلهٔ صفر: worklog.md کامل + فایل‌های پایه خوانده شد (data/types، items، shows، orders، format، store/live-store، wallet-store، agent-ctx/2-c) تا امضای pushChat (Omit<ChatMessage,"id"|"time"> & {time?})، الگوی شمارندهٔ شناسه و nowLabel دقیق رعایت شود.
- فایل جدید `src/lib/data/seller.ts` ساخته شد — کامنت هدر فارسی مثل بقیهٔ دیتافایل‌ها، فقط import نوع Cover از ./types؛ شامل: SellerScheduledShow + SELLER_SCHEDULED_SHOWS (دقیقاً sch1/sch2 با فیلدهای prebid/giveaway/cohost/pinComment طبق اسپک)؛ SellerOrderStatus + SellerOrder + SELLER_ORDERS (دقیقاً ۸ سفارش با id لاتین: ۴ to_scan شامل late «۳ ساعت — نزدیک مهلت!» / warn «۶ ساعت» / ok «۱ روز و ۴ ساعت» / ok «۲ روز»، ۲ shipped با کد TPX-482910 و TPX-481752، ۱ completed با reviewLabel «خریدار ۵ ستاره ثبت کرد ★»، ۱ issue با issueText جعبهٔ آسیب‌دیده و urgency warn)؛ کالاها هماهنگ با فروشندهٔ s1 (آسیکس/صندل/دَنک/جوراب/جردن/کوله/نیوبالانس/سامبا — رکورد مستقل، بدون import از items.ts) و خریدارها هماهنگ با BOTS (reza_vault، mina_k72، sole_hunter، sara_snkrs، ali_rezaei، kian_plant با emoji/color یکسان).
- SELLER_REVENUE تایپ‌شده با اینترفیس‌های کمکی SellerRevenue/SellerPayout (به‌جای as const تا آرایه‌ها readonly نشوند): available/pendingClearing/lifetime + lastShow با محاسبات سازگار (۲۱٬۵۰۰٬۰۰۰ − ۱٬۷۲۰٬۰۰۰ کارمزد ۸٪ − ۶۵۳٬۵۰۰ پردازش ۲.۹٪+۳۰٬۰۰۰ = ۱۹٬۱۲۶٬۵۰۰ خالص) + tiers پلکانی ۸/۵/۳٪ + ۴ payouts «واریز شد».
- INVENTORY_EXTRAS برای هر ۸ SKU (SNK-A101..A108) با وزن منطقی (کفش ۸۵۰–۱۰۵۰، جوراب ۱۲۰، کوله ۶۵۰، صندل ۶۰۰)؛ INVENTORY_DRAFTS دقیقاً dr1 «آدیداس گازل» (missing: عکس اصلی/قیمت شروع) و dr2 «واکس کتانی حرفه‌ای» (missing: عکس اصلی)؛ WATCHING_VIEWERS شش‌نفره با badge و purchases؛ READY_ROOM و HUB_STATS با as const طبق اسپک؛ COMMISSION_NOTE عیناً.
- فایل جدید `src/store/seller-store.ts` ساخته شد — 'use client'، zustand create، کامنت هدر «استور سمت فروشنده — فاز ۲»؛ TipEvent/OfferEvent/SellerState اکسپورت شدند؛ seedها کپی مستقل (cover هم spread شد) از دیتاهای static؛ شمارنده‌های ماژول‌سطح tipCounter/offerCounter/draftCounter از ۲ شروع می‌شوند (ادامهٔ tip-1/2، off-1/2، dr1/2)؛ nowLabel کپی کوچک از live-store (بدون import، مطابق دستور).
- اکشن‌ها طبق قرارداد نهایی: addScheduledShow (append)؛ printLabel فقط برای to_scan → status shipped + trackingCode `TPX-` + ۶رقم رندوم لاتین و برگشت کد یا null (createdAtLabel/urgency دست نمی‌خورد)؛ addTracking فقط کد را ثبت می‌کند؛ completeOrder فقط shipped → completed + reviewLabel «خریدار رضایت داد ★»؛ resolveIssue → issueResolved=true (reply در دمو ذخیره نمی‌شود — کامنت گذاشته شد)؛ addTip → prepend به tips + اگر useLiveStore.getState().showId بود pushChat عمومی سبز «💚 {from} انعام {toman(amount)} داد — دستت درد نکنه!» با kind system و color #00C896؛ addOffer → prepend با id/atLabel خودکار؛ addDraft → append با id=`dr${n}`؛ publishDraft → گارد وجود، حذف + publishedCount++.
- هیچ فایل موجود edit نشد (git status: فقط دو فایل جدید اضافه شد)؛ dev server restart نشد.
- بررسی نهایی: `bunx tsc --noEmit | grep -E "data/seller|seller-store"` → خالی (صفر خطا؛ خطاهای examples/ و skills/ و خطای قدیمی AppShell برای Viewهای فروشندهٔ هنوز‌ساخته‌نشده مربوط به ایجنت‌های 3-b/3-c/3-d است)؛ eslint هر دو فایل → 0 خطا 0 هشدار؛ dev.log سالم (Compiled + GET / 200).

Stage Summary:
- قراردادهای نهایی فاز ۲ برای ایجنت‌های بعدی (3-b/3-c/3-d) اکسپورت شد:
  • از `@/lib/data/seller`: انواع SellerScheduledShow، SellerOrderStatus، SellerOrder، SellerPayout، SellerRevenue، InventoryDraft، WatchingViewer + داده‌های SELLER_SCHEDULED_SHOWS، SELLER_ORDERS، SELLER_REVENUE، INVENTORY_EXTRAS، INVENTORY_DRAFTS، WATCHING_VIEWERS، READY_ROOM، HUB_STATS، COMMISSION_NOTE.
  • از `@/store/seller-store`: useSellerStore (state: scheduledShows/orders/tips/offers/drafts/publishedCount + اکشن‌های addScheduledShow/printLabel/addTracking/completeOrder/resolveIssue/addTip/addOffer/addDraft/publishDraft) و انواع TipEvent/OfferEvent/SellerState.
- تصمیم‌های کلیدی: لیست tips/offers جدیدترین‌اول است (پیوستن به ابتدای آرایه، هم‌الگو با wallet txs)؛ id سفارش‌ها لاتین است و UI باید با toFa فارسی‌شان کند؛ urgency فقط رنگ بج مهلت را تعیین می‌کند (ok سبز/warn amber/late قرمز #FF3B5C) و بعد از printLabel عملاً بی‌معنا می‌شود؛ SELLER_REVENUE عمداً آبجکت سادهٔ تایپ‌شده است (نه as const) تا mapping در UI بدون friction باشد؛ انعام‌ها فقط وقتی شو لایو باز است (liveStore.showId) در چت عمومی می‌نشینند و در هر حال در tips استور می‌مانند.
- هیچ نمایی هنوز به این استور وصل نشد — نمای‌سازی (hub/schedule/ready-room/listing/orders/revenue) با همین قراردادها برای تسک‌های بعدی.

---
Task ID: 3-b
Agent: full-stack-developer
Task: فاز ۲ — Seller Hub در پنل فروشنده + زمان‌بندی شو (تصویر ۲۴) + اتاق آماده‌به‌پخش (تصویر ۲۵)

Work Log:
- ابتدا worklog و قراردادهای 3-a خوانده شد (src/lib/data/seller.ts و src/store/seller-store.ts) و ساختار SellerDashboardView / shared.tsx / format.ts / categories.ts / items.ts / ui/input.tsx / ui/switch.tsx برای هماهنگی بررسی شد.
- SellerDashboardView فقط به‌صورت افزایشی (additive) ویرایش شد — هیچ عنصر/سکشن موجودی جابه‌جا یا تغییر نکرد؛ فقط یک سکشن جدید «هاب فروشنده» در انتهای div داخلی (بعد از «کارت لایو فعال») اضافه شد + ایمپورت‌های جدید (CalendarDays/Megaphone/Settings/ShieldCheck/TrendingUp، useSellerStore، HUB_STATS/SELLER_REVENUE، GradientCover/SectionTitle) و کامپوننت کمکی HubTile در سطح ماژول append شد.
- سکشن هاب فروشنده (اطلس تصویر ۲۳): هدر کارت گرادیانی بنفش→صورتی با GradientCover از رنگ/ایموجی فروشندهٔ s1، «Seller Hub» font-black، @handle با dir=ltr، چیپ سبز «✓ فروشندهٔ تأییدشده» (شرطی به seller.verified) و دکمهٔ دائمی بنفش «● شروع لایو» (ms-auto، سایهٔ بنفش) → push("sellerReadyRoom") با aria-label «شروع لایو — اتاق آماده‌به‌پخش».
- گرید هشت‌ماژوله grid-cols-4 gap-2 با HubTile (آیکون w-9 در بک‌گراند رنگ/15، نام text-[11px] font-bold، وضعیت text-[9px] truncate، نقطهٔ قرمز #FF3B5C animate-ls-pulse در گوشهٔ بالا-چپ فقط برای شوها و سفارش‌ها): شوها (زیرعنوان زنده از استور: «{faNum(n)} زمان‌بندی‌شده · ۱ لایو») → push("sellerSchedule")؛ انبار («۱۴۲ لیستینگ فعال») → push("sellerInventory")؛ سفارش‌ها (زیرعنوان زنده: تعداد to_scan از استور) → push("sellerOrders")؛ درآمد (toman(available,false)+« موجودی») → push("sellerRevenue")؛ بازاریابی/آنالیتیکس/سلامت اکانت/تنظیمات → toast دمو. سکشن با aria-label="هاب فروشنده" و SectionTitle «هاب فروشنده — هشت در به کسب‌وکار 🎛️».
- فایل جدید `src/components/liveshop/views/SellerScheduleView.tsx` (اطلس تصویر ۲۴): دراپ‌زون کاور dashed بنفش h-36 با placeholder (ImagePlus + «انتخاب کاور شو» + «سایز توصیه‌شده: ۱۰۸۰×۱۹۲۰») که با کلیک اول کاور انتخاب و کلیک‌های بعدی بین ۳ کاور پریست چرخش می‌کند؛ Input عنوان با label؛ چیپ‌های دسته‌بندی از CATEGORIES (پیش‌فرض «کتونی و کفش») با overflow-x no-scrollbar؛ دو ردیف چیپ روز (پیش‌فرض پنج‌شنبه) و ساعت (پیش‌فرض ۲۱:۰۰) تک‌انتخابی با aria-pressed؛ کارت گزینه‌ها با ۴ Switch از ui/switch (پیش‌بید روشن، گیواوی/هم‌میزبانی/پین کامنت خاموش)؛ باکس اطلاع بنفش با Info؛ دکمهٔ «زمان‌بندی شو» با اعتبارسنجی عنوان (toast.error «عنوان شو را وارد کن») → ساخت SellerScheduledShow کامل (id=sch-Date.now، whenLabel=`${day} ${hour}`، itemsCount=24، کاور انتخابی یا پریست اول) → addScheduledShow → toast.success «شو زمان‌بندی شد — فالوورها خبر می‌شوند ✅» → back()؛ لیست شوهای زمان‌بندی‌شده از استور (max-h-96 scroll-thin) با GradientCover، whenLabel با Clock صورتی، شمارش آیتم، چیپ «پیش‌بید فعال»، دکمهٔ outline صورتی «ویرایش» → toast دمو و outline بنفش «اتاق آماده‌باش» → push("sellerReadyRoom").
- فایل جدید `src/components/liveshop/views/SellerReadyRoomView.tsx` (اطلس تصویر ۲۵): پیش‌نمایش دوربین GradientCover از شوی sh1 با h-64 rounded-3xl، اورلی bg-black/45، ایموجی بزرگ text-6xl animate-ls-float + «پیش‌نمایش دوربین (دمو)»، چیپ سبز اتصال با نقطهٔ پالس («اتصال: عالی · ۴۵ms» از READY_ROOM)، سه چیپ پایین-چپ (تاگل میکروفون سبز/صورتی با aria-pressed — پیش‌فرض روشن، «موقعیت: خاموش» ثابت با MapPin، «اورلی‌ها» → toast فاز ۳)؛ کارت صف شو با PlayCircle و چیپ بنفش «۲۴ آیتم»، ۴ ردیف از getShowItems("sh1").slice(0,4) با fmt «مزایده · شروع {toman(startPrice,false)}»، بج کهربایی «بعدی (UP NEXT)» فقط ردیف اول و دکمه‌های ChevronUp/ChevronDown (w-7، disabled در دو انتها، جابه‌جایی در state محلی، aria-label «جابه‌جایی به بالا/پایین»)؛ دو کارت آمار 🔔 «۱٬۲۰۴ یادآوری ارسال شد» و 👁 «۵۱۲ فالوور مطلع شد» با اعداد بنفش font-extrabold؛ دکمهٔ بزرگ صورتی «● شروع پخش زنده» → toast.success «پخش زنده شروع شد 🔴» → openShow("sh1") + پانوشت قوانین فروشنده.
- رعایت کامل قواعد: 'use client'، اعداد/مبالغ فارسی (faNum/toman)، فقط رنگ‌های برند (#FF3B5C فقط نقطهٔ اقدام)، کارت‌های bg-ls-card/border-white/5/rounded-2xl/p-4، aria-label فارسی روی همهٔ کنترل‌های تعاملی، toast از sonner، بدون پکیج جدید و بدون تصویر (فقط GradientCover/emoji)، لیست‌ها با max-h-96 overflow-y-auto scroll-thin.
- هیچ فایل دیگری لمس نشد (AppShell عمداً باز نشد — ثبت ۵ نمای جدید در VIEW_COMPONENTS با ایجنت اصلی است)؛ dev server restart نشد.
- بررسی نهایی: `bunx tsc --noEmit | grep -E "SellerDashboardView|SellerScheduleView|SellerReadyRoomView"` → خالی (صفر خطا؛ تنها خطاهای pre-existing: examples/، skills/ و خطای شناخته‌شدهٔ AppShell برای ۵ نمای ثبت‌نشده)؛ eslint هر سه فایل → 0 خطا 0 هشدار؛ dev.log سالم (Compiled + GET / 200).

Stage Summary:
- قرارداد نهایی برای ایجنت اصلی (ثبت رجیستری): دو نمای جدید Default-export شدند و باید در `AppShell.tsx` به VIEW_COMPONENTS اضافه شوند: `sellerSchedule: SellerScheduleView` (import از "./views/SellerScheduleView") و `sellerReadyRoom: SellerReadyRoomView` (import از "./views/SellerReadyRoomView") — با این کار خطای TS2739 فعلی AppShell (برای sellerSchedule/sellerReadyRoom/sellerListing/sellerOrders/sellerRevenue) بخش مربوط به این دو نما حل می‌شود؛ sellerListing/sellerOrders/sellerRevenue همچنان برای 3-c/3-d.
- اتصال‌های ناوبری برقرارشده: SellerDashboard → push("sellerSchedule") (کاشی شوها)، push("sellerOrders") (کاشی سفارش‌ها)، push("sellerRevenue") (کاشی درآمد)، push("sellerInventory") (کاشی انبار)، push("sellerReadyRoom") (دکمهٔ «● شروع لایو» هدر هاب)؛ SellerSchedule → push("sellerReadyRoom") (دکمهٔ «اتاق آماده‌باش» هر ردیف) و back() بعد از ثبت موفق؛ SellerReadyRoom → openShow("sh1") (دکمهٔ «● شروع پخش زنده») و back().
- تغییر state که اکنون زنده است: addScheduledShow از seller-store (لیست «شوهای زمان‌بندی‌شده» در SellerScheduleView و زیرعنوان کاشی «شوها» در هاب هر دو reactive آپدیت می‌شوند)؛ صف اتاق آماده‌باش state محلی است و با back/from-reentry ریست می‌شود (عمدی و مطابق دمو).
- نکته برای 3-c/3-d: کاشی «سفارش‌ها» و «درآمد» هاب به sellerOrders/sellerRevenue پوش می‌کنند که هنوز در رجیستری نیستند — تا ثبت‌شان، این دو کاشی نباید کلیک شوند (بقیهٔ مسیرها کار می‌کنند)؛ فرمت زیرعنوان کاشی‌ها (text-[9px] truncate) باید با دادهٔ استور همگام بماند (تعداد to_scan و طول scheduledShows از useSellerStore).
- Switch های فرم زمان‌بندی از رنگ --primary (#6c5cff) استفاده می‌کنند — بنفش برند، بدون تغییر ساختار ui/switch.tsx.

---
Task ID: 3-d
Agent: full-stack-developer
Task: فاز ۲ — داشبورد زندهٔ فروشنده روی ویدیو (تصویر ۰۴) + ارتقای انبار با وضعیت/قفل/وزن (تصویر ۲۶)

Work Log:
- مرحلهٔ صفر: worklog.md (به‌ویژه Task 2-b ساخت LiveView و Task 3-a قراردادهای seller) + seller.ts (WATCHING_VIEWERS/HUB_STATS/INVENTORY_EXTRAS)، seller-store.ts (tips/offers/addTip)، live-store.ts (items/soldCount/chat/pushChat)، LiveView.tsx و SellerInventoryView.tsx کامل، shop-tab/bid-sheet/shared/drawer، items.ts/types.ts/format.ts و app-store (push('sellerListing') موجود) خوانده شد.
- فایل جدید `src/components/liveshop/seller-live-dashboard.tsx` ساخته شد (default export، 'use client'، vaul Drawer هم‌الگوی bid-sheet با دستگیرهٔ خودکار DrawerContent):
  • هدر: BarChart3 سبز + «داشبورد فروشنده» font-black + زیرعنوان «پشت دوربین — بدون ترک صحنه» + X بستن (ms-auto، bg-ls-card-2 w-8 h-8) + DrawerTitle/Description برای a11y.
  • دو کارت آمار بزرگ (grid-cols-2 gap-3): «فروش زنده» سبز = مجموع soldPrice آیتم‌های sold از live-store (text-xl font-black tabular-nums، زنده با هر فروش موتور) و «سفارش‌ها» = faNum(soldCount).
  • چیپ‌های فیلتر رویداد (همه/مزایده/فروش/گیواوی/انعام) با aria-pressed — فعال بنفش، غیر فعال bg-ls-card-2؛ تب‌های «رویدادها»/«بیننده‌ها» (segmented، flex-1، role=tablist).
  • تب رویدادها (useMemo از هر دو استور، ترتیب ادغام چت→انعام→پیشنهاد): ChatMessage → kind sale/giveaway/auction/other (شناخت بید با author==="Max Bid" یا startsWith("بید "))، tips → متن «{amount} انعام از {from}» با مبلغ سبز font-bold inline، offers → «{buyer} برای «{itemTitle}» پیشنهاد {toman} داد» با بج کهربایی «پیشنهاد»؛ هر ردیف bg-ls-card + Avatar sm + بج نوع ریز (بنفش/سبز/صورتی/سبز/amber) + زمان ms-auto؛ فیلد max-h-72 scroll-thin با حالت خالی.
  • شبیه‌سازی انعام زنده: useEffect با گارد open، هر ۱۵ ثانیه addTip تصادفی از سه خریدار (reza_vault/mina_k72/sole_hunter) و مبالغ ۲۰۰/۵۰۰ هزار و ۱ میلیون (cleanup دارد)؛ دکمهٔ «ثبت انعام (دمو) 💚» → addTip(500_000, "بینندهٔ مهمان") + toast sonner.
  • تب بیننده‌ها: خط هدر «{faNum(WATCHING_VIEWERS.length)} نفر در حال تماشا — با اسم صدا کن تا تعامل بیشتر شود» + لیست WATCHING_VIEWERS با name dir="ltr"، بج VIP کهربایی/خریدار ثابت بنفش/تازه‌وارد سبز (bg-x/15) و «{faNum(purchases)} خرید قبلی» ms-auto.
- LiveView.tsx — فقط ۳ نقطهٔ مجاز، به‌صورت افزودنی: (۱) بخش import — BarChart3 به lucide + import SellerLiveDashboard؛ (۲) LiveVideo — پروپ onSellerDash به type+destructure و یک دکمهٔ ریل جدید دقیقاً بعد از Gift و قبل از بی‌صدا با همان استایل Gift ولی text-ls-green، icon BarChart3، aria-label «داشبورد فروشنده — پشت دوربین» و کامنت «فاز ۲ — داشبورد زندهٔ فروشنده»؛ (۳) default export — state sellerDashOpen کنار shopOpen، پاس onSellerDash به LiveVideo و رندر <SellerLiveDashboard/> بلافاصله بعد از <ShopTab/>. هیچ خط/کلاس/متن دیگری تغییر نکرد.
- SellerInventoryView.tsx — فقط افزودنی طبق اسپک (چیپ‌ها، سرچ، لیست، دکمهٔ شناور و EmptyState همه حفظ شدند): import های Lock/useSellerStore/INVENTORY_EXTRAS/cn + push از app-store؛ state فیلتر all|auction|up_next|buy_now|sold|draft + drafts از seller-store؛ محاسبهٔ visible (فیلتر دقیق وضعیت) و رندر جداگانهٔ پیش‌نویس‌ها وقتی filter==="draft" (ردیف هم‌استایل با «ناقص: …» amber و دکمهٔ صورتی outline «تکمیل لیستینگ» → push("sellerListing")، EmptyState برای خالی)؛ ردیف دوم چیپ‌های فیلتر زیر چیپ‌های شمارش موجود با «پیش‌نویس (۲)» داینامیک از drafts.length و aria-pressed؛ در هر ردیف آیتم یک خط ریز جدید زیر متای موجود: قفل ویرایش کهربایی برای auction (Lock w-3 h-3 «قفل ویرایش — در شو فعال») + «وزن: {faNum} گرم» از INVENTORY_EXTRAS (span flex gap-2، متای قبلی دست‌نخورده)؛ onClick ردیف auction → toast «آیتم در شو فعال است — ویرایش قفل است 🔒» و return (سایر وضعیت‌ها همان toast جزئیات)؛ دکمهٔ شناور «آیتم جدید» → push("sellerListing").
- رعایت قواعد: فارسی RTL، اعداد/مبالغ با faNum/toman، فقط پالت برند (amber فقط بج VIP/پیشنهاد/ناقص)، toast از sonner، aria-label فارسی، بدون پکیج و تصویر جدید، intervalها cleanup شده.
- بررسی نهایی: `bunx tsc --noEmit | grep -E "seller-live-dashboard|SellerInventoryView|LiveView"` → خالی (صفر خطا)؛ eslint هر سه فایل → 0 خطا 0 هشدار؛ dev.log سالم (Compiled + GET / 200).

Stage Summary:
- اتاق لایو حالا دکمهٔ ریل سبز «داشبورد فروشنده — پشت دوربین» دارد که شیت داشبورد زنده (تصویر ۰۴) را باز می‌کند: فروش زنده/سفارش‌ها زنده از موتور مزایده، فید رویدادهای ترکیبی (چت/انعام/پیشنهاد) با فیلتر، شبیه‌سازی انعام هر ۱۵ ثانیه، ثبت انعام دستی و تب «بیننده‌ها» با بج و سابقهٔ خرید — فروشنده بدون ترک صحنه کنترل کامل دارد.
- انبار (تصویر ۲۶) به «منبع حقیقت کالا» ارتقا یافت: فیلتر وضعیت شش‌تایی شامل پیش‌نویس‌های seller-store (با شمارندهٔ داینامیک و دکمهٔ «تکمیل لیستینگ» به sellerListing)، قفل ویرایش کهربایی روی آیتم‌های در شو فعال (با toast به‌جای جزئیات) و نمایش وزن هر SKU از INVENTORY_EXTRAS؛ دکمهٔ شناور «آیتم جدید» حالا به فرم لیستینگ واقعی (sellerListing) می‌رود.
- قرارداد برای ایجنت‌های بعدی: SellerLiveDashboard فقط با props {open, onClose} از هر جایی قابل رندر است و مستقیماً از live-store/seller-store می‌خواند (بدون پروپ دیتا)؛ addTip انعام را همزمان در tips و (اگر شو باز باشد) در چت عمومی می‌گذارد — پس در فید داشبورد انعام دوبار دیده نشود، فقط نسخهٔ tip رندر می‌شود و نسخهٔ chat به kind "other" می‌رود؛ drafts/publishDraft برای SellerListingView آماده است.
- exact touchpoints — LiveView.tsx: خطوط import (BarChart3 + SellerLiveDashboard)، type/destructure پروپ onSellerDash در LiveVideo، دکمهٔ ریل جدید بین Gift و mute، state sellerDashOpen، پاس onSellerDash به <LiveVideo/>، رندر <SellerLiveDashboard/> بعد از <ShopTab/> — SellerInventoryView.tsx: imports، push/filter/drafts state، محاسبهٔ visible، ردیف چیپ‌های فیلتر جدید، شاخهٔ draft + visible.map در لیست، خط قفل/وزن داخل ردیف آیتم، گارد auction در onClick، onClick دکمهٔ شناور.

---
Task ID: 3-c
Agent: full-stack-developer
Task: فاز ۲ — سفارش‌های فروشنده با SCAN BY (تصویر ۲۸) + درآمد و کمیسیون پلکانی (تصویر ۲۹) + ساخت لیستینگ (تصویر ۲۷)

Work Log:
- مرحلهٔ صفر: worklog.md کامل (Task 0 تا 3-a) و قراردادها خوانده شد: lib/data/seller.ts (SellerOrder/SELLER_ORDERS، SellerRevenue/SELLER_REVENUE، InventoryDraft، COMMISSION_NOTE، HUB_STATS)، store/seller-store.ts (printLabel/addTracking/completeOrder/resolveIssue/addDraft)، app-store (back)، shared.tsx، format.ts، orders.ts/SHIPPING_METHODS، types.ts و ui/{input,dialog,switch,textarea,label} — همچنین agent-ctx/3-a و الگوی دیالوگ/تایمر gateway-dialog (setTimeout در ref + cleanup) و الگوی parse ارقام فارسی کپی شد.
- فایل جدید `views/SellerOrdersView.tsx` (Atlas تصویر ۲۸): ریشهٔ flex-1 + PageHeader «سفارش‌های فروشنده / چیدن و ارسال مرسوله‌ها»؛ تب‌های role=tablist چهارتایی با شمارندهٔ زندهٔ faNum از orders استور (در انتظار اسکن ۴ / ارسال‌شده ۲ / تکمیل‌شده ۱ / مشکلات ۱ — فعال bg-ls-purple، غیرفعال bg-ls-card-2 text-white/60)؛ بنر هشدار amber فقط در تب اسکن با Gauge و نرخ به‌موقع {faNum(HUB_STATS.onTimeScanPct)}٪ bold (۹۲٪) و آستانهٔ ۸۰٪؛ لیست کارت‌ها space-y-2.5 داخل max-h-96 overflow-y-auto scroll-thin.
- کارت سفارش: «سفارش #{toFa(o.id)}» font-black + بج سمت چپ (ms-auto): to_scan → «مهلت اسکن · {scanByLabel}» با رنگ urgency (ok سبز / warn amber-300 / late #FF3B5C با animate-ls-pulse)، بقیهٔ وضعیت‌ها چیپ «ارسال شد» سبز / «تکمیل شد» white/55 / «اختلاف» صورتی؛ ردیف GradientCover w-11 rounded-xl + عنوان + Avatar خریدار با نام dir=ltr + چیپ ریز amber «VIP» برای buyerVip؛ خط «✓ پرداخت‌شده — کالا + ارسال» با برچسب روش ارسال از SHIPPING_METHODS (پیدا کردن label + fallback map تیپاکس/پست پیشتاز/پیک شهری).
- اکشن‌ها: تکمیل‌شده → tint سبز (border-ls-green/25 bg-ls-green/5) + خط «★ {reviewLabel}» سبز؛ ارسال‌شده → کد رهگیری mono dir=ltr در bg-ls-card-2 + دکمهٔ outline سبز «تکمیل سفارش» → completeOrder + toast.success؛ اختلاف → کارت صورتی‌رنگ (border-ls-pink/40 bg-ls-pink/5) + issueText + دکمهٔ صورتی «پاسخ به اختلاف» → دیالوگ با نمایش متن پرونده + Textarea «پاسخ شما به خریدار…» → resolveIssue + toast «پاسخ ثبت شد — پرونده برای داوری ذخیره شد» (پس از پاسخ: «✓ پاسخ داده شد — در انتظار داوری» سبز)؛ to_scan → دو دکمهٔ grid-cols-2 «چاپ لیبل مرسوله» بنفش و «ثبت کد رهگیری» outline.
- سه دیالوگ self-contained در همان فایل با key={orderId} برای ریست state: PrintLabelDialog (عنوان «ایجاد مرسوله در تیپاکس»، خلاصهٔ کالا+روش ارسال، تأیید → Loader2 + «در حال ساخت مرسوله…» ۱.۲ ثانیه با setTimeout در ref و cleanup در unmount/بستن → printLabel → toast «مرسوله ساخته شد — کد رهگیری {toFa(code)}» یا toast.error اگر null)؛ TrackDialog (Input mono dir=ltr placeholder «TPX-123456» + Enter → گارد خالی → addTracking + toast)؛ IssueReplyDialog (Textarea + گارد خالی). حالت خالی هر تب EmptyState با ایموجی اختصاصی (📦/🚚/✅/⚖️).
- فایل جدید `views/SellerRevenueView.tsx` (Atlas تصویر ۲۹): کارت موجودی rounded-3xl با گرادیان inline (135deg,#6C5CFF,#4a3dd6) مثل کیف پول + «موجودی قابل برداشت» + عدد 3xl font-black {toman(available)} + ردیف Wallet «تسویهٔ خودکار بعدی» + خط shebaMasked با dir=ltr + دو دکمهٔ grid-cols-2: «برداشت فوری» (bg-white/15 border-white/25) → WithdrawDialog (نمایش شبا + مبلغ بزرگ سبز + تأیید سبز «ثبت درخواست برداشت» → پردازش ۱ ثانیه Loader2 → toast.success «درخواست برداشت ثبت شد — تا ۲۴ ساعت به شبا واریز می‌شود») و «تنظیمات تسویه» outline → toast دمو.
- ادامهٔ SellerRevenueView: دو مینی‌کارت «در حال تسویه / درآمد کل» (bg-ls-card p-3.5، مقدار font-extrabold tabular-nums)؛ سکشن «تفکیک آخرین شو» با عنوان شو در action SectionTitle و کارت ردیف‌های justify-between: فروش ناخالص سفید / جداکننده / «کمیسیون (۸٪)» و «هزینهٔ پردازش درگاه (۲.۹٪ + ۳۰٬۰۰۰ تومان)» با منفی قرمز #FF3B5C (برچسب فرمول با toFa(processingPct)=«۲.۹» و faNum(processingFlat) ساخته شد) / جداکنندهٔ dashed / «خالص شو» سبز font-black text-base + نکتهٔ شفافیت text-[10px] white/40؛ کارت «پلکان کارمزد» (bg-ls-purple/10 border-ls-purple/30) با BarChart3 بنفش + بج بنفش «٪۸/٪۵/٪۳» به‌ازای هر پله + COMMISSION_NOTE عیناً؛ سکشن «تاریخچهٔ تسویه» با شمارندهٔ action و لیست max-h-96 scroll-thin: CheckCircle2 سبز + مبلغ + atLabel·روش + چیپ «واریز شد» سبز + دکمهٔ ریز outline «فاکتور» → toast دمو (aria-label فارسی).
- فایل جدید `views/SellerCreateListingView.tsx` (Atlas تصویر ۲۷): PageHeader «لیستینگ جدید» با trailing دکمهٔ متنی «ذخیرهٔ پیش‌نویس» (text-ls-purple-soft) → saveDraft؛ گرید عکس grid-cols-3 gap-2.5: باکس اصلی aspect-square با GradientCover کاور جاری + بج «اصلی» (bg-black/60 text-[9px]) و دو جایگاه dashed (border-white/15 bg-ls-card/60 + Plus) که کلیک روی هرکدام ایندکس کاور مشترک را در ۴ گرادیان preset (صورتی→بنفش، بنفش→تیره، سبز→زمرد، نارنجی→قهوه‌ای) می‌چرخاند و coverPicked را true می‌کند؛ Inputهای عنوان/برند («مثلاً نایک»)/سایز («۴۲») با Label؛ چیپ‌های وضعیت «نو با جعبه» (پیش‌فرض فعال)/«نو بدون جعبه»/«کارکرده» با aria-pressed.
- ادامهٔ SellerCreateListingView: کارت قیمت‌گذاری (bg-ls-card p-4 space-y-3.5): Input عددی dir=ltr «شروع مزایده (تومان)» + ردیف toggle «خرید فوری» با Switch (پیش‌فرض روشن، data-[state=checked]:bg-ls-purple) + آیکون ⓘ راهنما داخل span دارای title و aria-label (لوسیکد title prop ندارد — TS2212 گرفت و همین‌طور حل شد) + Input «قیمت خرید فوری» و hint «قیمت فوری معمولاً بالاتر از شروع مزایده تعیین می‌شود.» فقط وقتی روشن؛ فیلدهای ارسال grid-cols-2 «وزن (گرم)» (پیش‌فرض «۹۰۰») و «ابعاد بسته» (placeholder «۳۰×۲۰×۱۲») + hint تیپاکس/پست؛ باکس قوانین صورتی (border-ls-pink/30 bg-ls-pink/10 + ShieldAlert) با متن ریپلیکا؛ نوار انتشار چسبان sticky bottom-0 با گرادیان from-ls-bg via-ls-bg/95 → دکمهٔ بنفش «انتشار لیستینگ» با اعتبارسنجی (بدون عنوان → toast.error «عنوان را وارد کن»، قیمت ≤۰ → «قیمت شروع مزایده را وارد کن»، موفق → toast.success «لیستینگ منتشر شد ✅ — به انبار اضافه شد» + back()).
- saveDraft: گارد عنوان، سپس addDraft({title، brand || «بدون برند»، emoji «👟»، cover کپی، missing: [!coverPicked&&«عکس اصلی»، startPrice<=0&&«قیمت شروع»].filter(Boolean)}) → toast «پیش‌نویس ذخیره شد — در انبار می‌بینی» + back() — پیش‌نویس‌ها در انبار فروشنده (SellerInventoryView از seller-store.drafts) با بج missing دیده می‌شوند. parseFaNum محلی (ارقام فارسی→لاتین + حذف جداکننده) در همین فایل.
- رعایت قواعد: 'use client'، RTL، فقط سه فایل جدید (هیچ فایل موجودی دست نخورد — git تأیید شد؛ تغییرات موازی LiveView/SellerDashboard و… متعلق به ایجنت 3-b و main است)، اعداد/مبالغ فارسی از @/lib/format، فقط رنگ‌های برند (+قرمز #FF3B5C برای late/کسرها و amber فقط بج SCAN BY/هشدار اسکن/VIP)، toast از sonner، aria-label فارسی روی همهٔ کنترل‌ها، بدون عکس و بدون پکیج جدید، تایمرها در ref با cleanup.
- بررسی نهایی: `bunx tsc --noEmit | grep سه فایل` → خالی (فقط یک خطای اولیهٔ title prop روی آیکون لوسیکد بود که با span wrapper حل شد)؛ `bunx eslint` سه فایل → exit 0 بدون خطا؛ dev.log سالم (Compiled + GET / 200).

Stage Summary:
- هر سه نمای فروشندهٔ تسک 3-c فعال شد: «سفارش‌های فروشنده» با انضباط لجستیکی SCAN BY (چهار تب زندهٔ شمارنده‌دار، چاپ لیبل تیپاکس با پردازش شبیه‌سازی‌شده و تولید خودکار کد، ثبت دستی رهگیری، تکمیل سفارش با ستارهٔ رضایت، پاسخ به اختلاف با پروندهٔ داوری) + «درآمد فروشنده» با موجودی قابل برداشت/برداشت فوری به شبا، تفکیک کامل آخرین شو با فرمول هر کسر (کمیسیون پلکانی ۸٪ و درگاه ۲.۹٪+۳۰٬۰۰۰)، پلکان کارمزد و تاریخچهٔ تسویه + «لیستینگ جدید» با فرم کامل انتشار و پیش‌نویس.
- قرارداد برای ایجنت‌های بعدی (یکپارچه‌ساز / 3-d): SellerOrdersView/SellerRevenueView/SellerCreateListingView فقط از قرارداد 3-a تغذیه می‌شوند (useSellerStore + SELLER_ORDERS/SELLER_REVENUE/COMMISSION_NOTE/HUB_STATS) و هیچ state محلی سراسری نمی‌سازند؛ سه دیالوگ سفارش‌ها self-contained و در هر جای اپ قابل کپی‌اند؛ انتشار لیستینگ فعلاً toast+back است و در فاز بعد می‌تواند به آیتم واقعی انبار (ITEMS_SH1) وصل شود؛ saveDraft از addDraft استور استفاده می‌کند و پیش‌نویس جدید با id خودکار dr3+ در انبار ظاهر می‌شود (missing badges زنده).
- نکتهٔ فنی: آیکون‌های lucide-react در این نسخه prop title ندارند (TS2322) — برای tooltip از span wrapper با title+aria-label استفاده شد؛ دیالوگ‌ها با key={order.id} remount می‌شوند تا state بین باز شدن‌ها ریست شود بدون setState در effect (قانون set-state-in-effect امن ماند).

---
Task ID: 4
Agent: main (Z.ai Code)
Task: فاز ۲ — یکپارچه‌سازی، تأیید مرورگری و آرشیو v1.2

Work Log:
- پیش از شروع ایجنت‌ها: افزودن ۵ نام View جدید (sellerSchedule/sellerReadyRoom/sellerListing/sellerOrders/sellerRevenue) به ViewName و NAV_VIEWS در app-store.ts — تنها تغییر فایل مشترک قبل از ایجنت‌ها
- Task 3-a (ایجنت): دیتای فروشنده (src/lib/data/seller.ts — شوهای زمان‌بندی‌شده، ۸ سفارش با مهلت اسکن، درآمد و پلکان کارمزد، INVENTORY_EXTRAS، پیش‌نویس‌ها، بیننده‌ها، READY_ROOM/HUB_STATS) + استور (src/store/seller-store.ts — printLabel/addTracking/completeOrder/resolveIssue/addTip با نمایش عمومی سبز در چت/addDraft/publishDraft)
- Task 3-b (ایجنت): Seller Hub به‌صورت افزودنی به پایین SellerDashboardView (هدر + گرید ۴×۲ هشت ماژول + نقطهٔ قرمز روی شوها/سفارش‌ها + شمارنده‌های زنده از استور) + SellerScheduleView (فرم کامل با ۴ توگل و فهرست شوها) + SellerReadyRoomView (پیش‌نمایش دوربین، صف با UP NEXT و جابه‌جایی، آمار یادآوری، شروع پخش)
- Task 3-c (ایجنت): SellerOrdersView (۴ تب، بنر نرخ اسکن ۹۲٪، بج مهلت رنگی، دیالوگ چاپ لیبل تیپاکس با کد TPX خودکار، ثبت رهگیری، تکمیل، پاسخ به اختلاف) + SellerRevenueView (موجودی/تسویه/کل، تفکیک شو با فرمول، پلکان کارمزد ۸→۵→۳٪، تاریخچهٔ شبا) + SellerCreateListingView (گرید عکس اصلی، قیمت‌گذاری دوگانه، وزن/ابعاد، قوانین دسته، اعتبارسنجی و پیش‌نویس)
- Task 3-d (ایجنت): seller-live-dashboard.tsx (شیت vaul روی ویدیو با فروش/سفارش زنده از موتور مزایده، فیلتر رویدادها، تب بیننده‌ها، انعام زندهٔ ۱۵ثانیه‌ای) + دو نقطهٔ افزودنی در LiveView (دکمهٔ سبز نمودار روی ریل + رندر شیت) + افزودنی‌های انبار (فیلتر وضعیت، قفل ویرایش آیتم در-شو، وزن، شاخهٔ پیش‌نویس) — تنها عنصر موجودِ تغییرکرده: onClick دکمهٔ «آیتم جدید» → sellerListing
- یکپارچه‌سازی (خودم): ثبت ۵ View جدید در VIEW_COMPONENTS/imports در AppShell.tsx
- بررسی: tsc پاک (صفر خطای پروژه‌ای)، bun run lint پاک، dev.log سالم (Compiled + GET / 200)
- تأیید مرورگری کامل (agent-browser، موبایل ۳۹۰px و دسکتاپ ۱۲۸۰px، بدون خطای کنسول): Seller Hub (هشت ماژول + نقطه‌های قرمز + شمارندهٔ زنده «۳ زمان‌بندی‌شده» پس از ثبت شو جدید)، فرم زمان‌بندی (اعتبارسنجی + ثبت + افزودن به فهرست)، اتاق آماده‌باش (جابه‌جایی صف + شروع پخش → اتاق لایو)، داشبورد زندهٔ فروشنده (فروش زندهٔ ۷٬۰۰۰٬۰۰۰ هم‌گام با موتور، فیلتر انعام، تب بیننده‌ها با VIP، انعام دمو → پیام سبز در چت لایو ✓)، سفارش‌های فروشنده (چاپ لیبل سفارش ۸۸۴۱ → انتقال به ارسال‌شده با TPX-396359، شمارنده‌های تب ۴→۳ و ۲→۳، پاسخ به اختلاف → «پاسخ داده شد»)، درآمد (دیالوگ برداشت فوری، تفکیک شو)، لیستینگ (اعتبارسنجی «عنوان را وارد کن» → انتشار موفق → بازگشت)، انبار (فیلتر پیش‌نویس، قفل آیتم در-شو، وزن) — و رگرسیون: خانه/کاوش/لایو/پنل فروشندهٔ قدیمی همگی سالم
- آرشیو: download/liveshop-v1.2.zip (۱۲۸ فایل) + ثبت کامل v1.2 در CHANGELOG.md

Stage Summary:
- فاز ۲ (P0) کامل و تأیید مرورگری شد: Seller Hub هشت‌ماژوله (افزودنی به پنل فروشنده)، زمان‌بندی شو، اتاق آماده‌به‌پخش، انبار وضعیت‌دار با قفل/وزن/پیش‌نویس، ساخت لیستینگ، سفارش‌ها با انضباط SCAN BY، درآمد با کارمزد پلکانی و داشبورد زندهٔ پشت-دوربین با انعام
- قانون طلایی محترم ماند: هیچ صفحه/متن/رنگ/چیدمان قبلی حذف یا تغییر نکرد؛ دو جایگزینی اعلام‌شدهٔ جزئی: دکمهٔ دموی «آیتم جدید» انبار → صفحهٔ واقعی لیستینگ (الگوی مجاز فاز ۱)
- آماده برای تأیید کاربر قبل از فاز ۳ (P1): ضمانت خریدار، Raid/Co-host، Pre-bid، باشگاه ریواردز، صندوق ورودی، جستجوهای ذخیره‌شده، آنالیتیکس و سلامت اکانت کامل
---
Task ID: 5-c
Agent: general-purpose
Task: فاز ۳ — آنالیتیکس فروشنده (۳۱) و سلامت اکانت (۳۰)

Work Log:
- مرحلهٔ صفر: tail و Task IDهای worklog خوانده شد؛ مرجع‌ها بررسی شدند: format.ts (toFa/faNum/toman/compactFa)، shared.tsx (PageHeader/SectionTitle/Chip/EmptyState)، SellerRevenueView (الگوی نمای فروشنده — دست نخورد)، seller-store.ts (الگوی zustand)، seller.ts (HUB_STATS و اعداد درآمد برای هماهنگی) و app-store.ts (نام‌های sellerAnalytics/sellerHealth از قبل ثبت — دست نخورد).
- فایل دیتای جدید `lib/data/seller-analytics.ts` (تایپ‌های لوکال + دیتا): ANALYTIC_PERIODS («۷ روز»/«۳۰ روز»/«فصل» as const)؛ ANALYTIC_KPIS به‌ازای هر دوره {gmv/orders/viewers/conversion/watchMin/deltaLabel} با رشد واقع‌گرایانه (۷روز GMV ۱۸٫۵م، ۳۰روز ۶۴٫۲م، فصل ۱۴۲م) — اعداد JS number می‌مانند و deltaLabel ثابت هر دوره («+٪۱۲/٪۹/٪۲۳ نسبت به دورهٔ قبل»)؛ REVENUE_SERIES هشت‌هفته‌ای ۸٫۲م→۲۵٫۸م با نوسان (هفته ۷ = ۲۱٫۵م هماهنگ با gross آخرین شو در SELLER_REVENUE)؛ FUNNEL چهارپله‌ای ۱۲۴۰۰→۷۲۰۰→۱۸۶۰→۳۱۲ با رنگ‌های #6C5CFF/#8a7dff/#FF3B8B/#00C896؛ TOP_ITEMS پنج‌گانه تم کتونی «کفش‌خانهٔ سینا» (دنک پاندا/سامبا/جردن ۱/نیوبالانس ۵۳۰/آسیکس GT-2000 — جمع ۱۴۰م ≤ GMV فصل)؛ HEAT_HOURS دوازده‌ساعته («۱۲»..«۲۳»،«۰۰») با پیک ۱۰۰ در «۲۱» + HEAT_PEAK_LABEL «پیک بیننده: ۲۱:۰۰ — جمعه‌شب»؛ HEALTH_SCORE=92؛ HEALTH_METRICS شش‌ردیفی با value فارسیِ قالب‌شده (٪۹۲ good/٪۰٫۸ good/۲ سفارش warn/۸٫۶ از ۱۰ good/۴۵ دقیقه good/۰ good)؛ HEALTH_TASKS چهارتایی با impact «+۲ امتیاز» و done:false؛ POLICY_ROWS سه‌گانهٔ ok:true؛ HEALTH_TIPS سه توصیهٔ ثابت.
- فایل استور جدید `store/seller-p1-store.ts`: zustand مینیمال — doneTaskIds:string[] (seed خالی) + toggleTask(id) افزودن/حذف + سلکتور اکسپورت‌شدهٔ selectDoneCount = doneTaskIds.length.
- فایل نمای جدید `views/SellerAnalyticsView.tsx` (Atlas ۳۱): ریشه flex-1 + PageHeader «آنالیتیکس/عملکرد فروش شما» onBack=back؛ ردیف چیپ‌های دوره (۳ Chip فعال bg-ls-purple) + برچسب delta سبز TrendingUp سمت چپ؛ گرید grid-cols-2 چهار کارت KPI با آیکون‌کاشی رنگی (GMV بنفش ShoppingBag، سفارش‌ها صورتی ShoppingCart، بیننده سبز Eye با compactFa، نرخ تبدیل سفید MousePointerClick ٪) — اعداد بزرگ faNum + پسوند ریز «تومان/سفارش» و aria-label فارسی هر کارت؛ کارت «روند فروش ۸ هفته»: نمودار میله‌ای CSS خالص flex items-end h-28 gap-1.5 با میله flex-1 rounded-t bg-ls-purple/70 hover:bg-ls-purple و height=(value/max)٪ min-h-1، tooltip با span title+aria-label روی هر میله، سقف محور compactFa بالا-چپ، برچسب هفته‌های یک‌درمیان text-[9px] ردیف دوم و جمع ۸ هفته با toman پایین؛ کارت «قیف تبدیل»: هر پله ردیف لیبل+شمارنده+نوار h-2.5 rounded-full با width=(value/اولین)٪ و backgroundColor از دیتا + بج «٪x از مرحلهٔ قبل» برای پله‌های ۲ به بعد (faDec = toFa با ٫ اعشاری) + خط تبدیل کل ٪۲٫۵؛ «پرفروش‌ترین‌ها» لیست max-h-64 overflow-y-auto scroll-thin با کاشی ایموجی، «N فروش»، gmv و رتبهٔ فارسی؛ «بهترین ساعت پخش»: نوار حرارتی grid grid-cols-12 gap-1 سلول‌های h-6 rounded bg-ls-green با opacity=value/100 (پیک ring-2 ring-ls-green) + لیبل ساعت ۸px زیر هر سلول + caption پیک با Flame.
- فایل نمای جدید `views/SellerHealthView.tsx` (Atlas ۳۰): PageHeader «سلامت اکانت»؛ قهرمان امتیاز: حلقهٔ SVG ۱۲۰px (r=52، strokeDized bg کلاس stroke-ls-card-2، پروگرس stroke #00C896 با strokeDasharray = C×۰٫۹۲ و rotate(-90) و strokeLinecap round) + مرکز «۹۲» ۳xl و «عالی» سبز + کپشن «آستانهٔ سالم: ۸۰ — زیر ۸۰ محدودیت نمایش» + بج سبز «بالای آستانه»؛ کارت هشدار کهربایی (border-amber-400/30 bg-amber-400/10 — amber مجاز برای هشدار) با Truck و متن جبران اسکن دیرهنگام role=alert؛ «شاخص‌ها» شش‌ردیفی divide-y با دات رنگی (good سبز/warn کهربایی)، مقدار bold (warn کهربایی) و detail ریز white/45؛ «کارهای بهبود»: Checkbox شادکن با checked از doneTaskIds استور P1 و onCheckedChange=toggleTask، تیتر خط‌خوردهٔ محو وقتی done، بج بنفش «+۲ امتیاز»، شمارندهٔ doneCount/۴ در SectionTitle و فوتر «هر کار تکمیل‌شده مستقیم روی امتیاز سلامت اثر می‌گذارد»؛ «وضعیت قوانین» سه‌ردیفه ShieldCheck سبز + چیپ «فعال» سبز؛ کارت توصیهٔ «چطور بالای ۸۰ بمانیم» با سه بولت و Lightbulb بنفش (کارت bg-ls-purple/10).
- رعایت قواعد: فقط ۴ فایل جدید ساخته شد و هیچ فایل موجودی ویرایش نشد (git status تأیید)؛ 'use client' هر دو نما؛ RTL فارسی؛ فقط پالت برند بنفش/صورتی/سبز/سفید + amber فقط هشدار سلامت و دات warn؛ اعداد/مبالغ با faNum/toman/compactFa/toFa و اعشار فارسی با ٫؛ کارت‌ها bg-ls-card border-white/5 rounded-2xl p-4؛ لیست‌ها scroll-thin؛ aria-label فارسی روی کنترل‌ها و role=img روی نمودار/نقشهٔ حرارتی؛ آیکون‌های لوسیکد داخل span یا aria-hidden؛ بدون پکیج/تصویر/کتابخانهٔ نمودار جدید؛ بدون setState در effect و بدون interval.
- بررسی نهایی: `bunx tsc --noEmit` → صفر خطا در ۴ فایل من (تنها خطای AppShell.tsx مربوط به ثبت نماهای فاز ۳ است که وظیفهٔ یکپارچه‌سازی main است و خطاهای examples/skills از قبل موجود)؛ `bunx eslint` چهار فایل → exit 0 بدون خطا/هشدار؛ بدون build/dev طبق دستور.

Stage Summary:
- هر دو نمای فروشندهٔ فاز ۳ (اسلایس 5-c) آمادهٔ یکپارچه‌سازی است: «آنالیتیکس» با چیپ‌های دورهٔ ۷روز/۳۰روز/فصل، ۴ کارت KPI رنگ‌کدشده با برچسب رشد، نمودار میله‌ای CSS خالص ۸ هفته با tooltip و جمع دوره، قیف تبدیل ۴پله‌ای با درصد عبور بین پله‌ها، پرفروش‌ترین‌های اسکرول‌شو و نقشهٔ حرارتی بهترین ساعت پخش با پیک جمعه‌شب ۲۱:۰۰؛ «سلامت اکانت» با حلقهٔ SVG امتیاز ۹۲/عالی، هشدار کهربایی جبران اسکن، ۶ شاخص با دات وضعیت، چک‌لیست «کارهای بهبود» با Checkbox متصل به استور (تیتر خط‌خورده + بج +۲ امتیاز + شمارندهٔ زنده)، وضعیت قوانین فعال و توصیه‌های ماندن بالای آستانهٔ ۸۰.
- قرارداد دقیق برای main/ایجنت‌های بعدی: ۱) SellerAnalyticsView و SellerHealthView هر دو default export بدون prop و با onBack از useAppStore.back — فقط کافی است در VIEW_COMPONENTS/AppShell.tsx به «sellerAnalytics» و «sellerHealth» وصل شوند. ۲) دیتا از @/lib/data/seller-analytics با اکسپورت‌های ANALYTIC_PERIODS/ANALYTIC_KPIS/REVENUE_SERIES/FUNNEL/TOP_ITEMS/HEAT_HOURS/HEAT_PEAK_LABEL/HEALTH_SCORE/HEALTH_METRICS/HEALTH_TASKS/POLICY_ROWS/HEALTH_TIPS (تایپ‌ها: AnalyticPeriod/AnalyticKpis/WeekPoint/FunnelStep/TopItem/HeatHour/HealthStatus/HealthMetric/HealthTask/PolicyRow). ۳) استور @/store/seller-p1-store با useSellerP1Store (doneTaskIds + toggleTask) و سلکتور selectDoneCount — اگر ماژول دیگری خواست کار همان را تیک بزند فقط toggleTask(id) با idهای t1..t4 از HEALTH_TASKS. ۴) اعداد دوره‌ها JS number هستند و deltaLabel رشتهٔ فارسی آمادهٔ نمایش؛ FUNNEL/TOP_ITEMS با رنگ‌های hex برند و سازگار با SellerRevenueView (هفتهٔ ۷ = ۲۱٬۵۰۰٬۰۰۰ هماهنگ با gross آخرین شو).

---
Task ID: 5-a
Agent: general-purpose
Task: فاز ۳ — فعالیت‌ها/بیدها (۱۹)، صندوق ورودی (۲۰)، جستجوهای ذخیره‌شده (۱۴)

Work Log:
- مرحلهٔ صفر: tail کارنامک (Task 0 تا 4) و قراردادها خوانده شد: format.ts (toFa/faNum/toman/faClock)، types.ts (Cover)، shows.ts (فروشنده‌های واقعی)، shared.tsx (PageHeader/EmptyState/GradientCover/Avatar)، seller-store.ts (الگوی seed کپی‌شده + شمارندهٔ id)، SellerOrdersView.tsx (الگوی تب/چیپ شمارنده‌دار)، wallet-store.ts (canAfford موجود برای گارد بید) و globals.css (scroll-thin/animate-ls-timer-alert تأیید شد).
- فایل جدید `lib/data/buyer-p1.ts`: تایپ‌های MyBidEntry (status: leading/outbid/won/lost)، MyOfferEntry (pending/accepted/declined/expired)، SavedSearch، InboxNotification (7 kind) + seedها: ۴ بید (۱ پیشتاز «نایک دَنک لو» ۴٬۳۰۰٬۰۰۰ تایمر ۱۸۳ثانیه / ۱ بید-بالاتر «هدفون سونی XM5» / ۱ برد «کاسیو ادیس» / ۱ باخت «پوکمون اولترا ریر») با نام فروشنده/شوی واقعی از shows.ts، ۳ پیشنهاد (۲ pending + ۱ expired)، ۴ جستجوی ذخیره‌شده («نایک اورجینال»/«ساعت مچی · لایو»/…) و ۹ اعلان فارسی (بید بالاتر، برد مزایده، ارسال TPX-396359، شارژ زرین‌پال، انعام، فالوور مینا، یادآور «شبِ کتاب»، تغییر قوانین پله) — ۳ ناخوانده + getInboxKindMeta(kind) → {label, color} (فقط رنگ‌های برند).
- فایل جدید `store/activity-store.ts`: seedهای deep-copied + tickCountdown (کاهش endsInSec فقط leading/outbid تا حداقل ۰) + bumpBid(bidId): {ok, error?} — یک پله (myBid+step)، گارد canAfford(newMyBid+shippingPrice) از wallet-store → خطای «موجودی کافی نیست — اول کیف پولت را شارژ کن»، موفق → status leading و currentBid=myBid؛ withdrawBid حذف کامل؛ acceptOffer/declineOffer؛ toggleSearchAlert/removeSearch؛ saveSearch(query, filterLabel?) با matchCount تصادفی ۳..۴۲ و dedupe بر اساس query → «این جستجو قبلاً ذخیره شده».
- فایل جدید `store/inbox-store.ts`: markRead(id)/markAllRead() + فانکشن اکسپورت `selectUnreadCount(state)` (reduce ناخوانده‌ها) به‌عنوان سلکتور آمادهٔ useInboxStore(selectUnreadCount).
- فایل جدید `views/ActivityView.tsx` (تصویر ۱۹): PageHeader «فعالیت‌های من / بیدها، پیشنهادها و تاریخچه» با onBack از useAppStore.back؛ shadcn Tabs سه‌تایی با شمارندهٔ زندهٔ فارسی (بیدها = leading+outbid / پیشنهادها = pending / تاریخچه) با data-[state=active]:bg-ls-purple؛ کارت بید فعال: GradientCover ۵۶px + خط شو·فروشنده + چیپ وضعیت (پیشتاز سبز با glow، بید بالاتر رفته صورتی با tint کارت، برنده بنفش، باخت white/10) + گرید ۳ستونه «بید فعلی / بید من (font-black) / پایان در» که تایمر ≤۳۰ثانیه text-ls-pink + animate-ls-timer-alert می‌گیرد + خط ارسال/پله/زمان ثبت + دکمه‌های «+ یک پله» (bumpBid → toast.success «بید جدید ثبت شد ✅» یا toast.error) و «حذف بید» ghost؛ کارت پیشنهاد: Avatar فروشنده + مبلغ بزرگ صورتی + expiresLabel + پیام ایتالیک + «پذیرش» سبز (toast.success «پیشنهاد پذیرفته شد — فروشنده تماس می‌گیرد») و «رد» outline؛ تاریخچه: ردیف‌های جمع‌وجور بیدهای won/lost + پیشنهادهای accepted/declined/expired با چیپ وضعیت داخل max-h-96 scroll-thin؛ useEffect interval ۱ثانیه → tickCountdown با clearInterval cleanup (بدون setState مستقیم در effect).
- فایل جدید `views/InboxView.tsx` (تصویر ۲۰): PageHeader «صندوق ورودی» + subtitle زندهٔ «۳ ناخوانده» (faNum از selectUnreadCount، وقتی صفر: «همه خوانده شده») + trailing «خواندن همه» (markAllRead + toast، اگر صفر بود toast «ناخوانده‌ای نداری»)؛ ردیف چیپ‌های فیلتر ۵تایی (همه/مزایده‌ها [bid+win]/سفارش‌ها [payment+shipping]/فالو [follow+tip]/سیستم) با role=tablist و شمارندهٔ فارسی؛ لیست max-h-[520px] scroll-thin: مربع آیکون رنگی (backgroundColor `${color}22` + ایموجی)، عنوان font-black + نقطهٔ سبز ناخوانده برای unread، بدنه line-clamp-2 white/60، atLabel، onClick → markRead + hover:bg-white/5، ردیف ناخوانده border-ls-purple/30؛ حالت خالی EmptyState 📭؛ لیبل دسته در aria-label از getInboxKindMeta استفاده شد.
- فایل جدید `saved-searches.tsx`: اکسپورت نام‌دار `SavedSearchesRow({currentQuery?, onPick?})` self-contained (خودش از activity-store می‌خواند)؛ برچسب ریز سکشن با Search icon و بج شمارنده؛ چیپ‌های افقی scroll-thin: 🔎 + query + بج سبز matchCount + زنگوله (BellRing سبز/Bell سفید-۴۰ با toggleSearchAlert و toast روشن/خاموش) + X (removeSearch + toast) — هر دو با stopPropagation داخل chip-div دارای role=button (بدون button تو در تو) با پشتیبانی Enter/Space؛ کلیک چیپ → onPick(query) + toast «جستجو اعمال شد»؛ با currentQuery غیرخالی چیپ dashed «+ ذخیرهٔ این جستجو» → saveSearch → toast.success «جستجو ذخیره شد 🔔» یا toast.error «این جستجو قبلاً ذخیره شده»؛ اگر هیچ جستجو و کوئری‌ای نباشد null برمی‌گرداند.
- رعایت قواعد: قانون طلایی — فقط ۶ فایل جدید ساخته شد، هیچ فایل موجودی دست نخورد (app-store و AppShell انگشت‌نخورده؛ integration با main agent)؛ 'use client' روی ۵ فایل کلاینت (دیتا مثل seller.ts خالص)؛ اعداد/مبالغ با faNum/toman/faClock، ارقام لاتین صفر در UI؛ فقط پالت برند (amber/آبی استفاده نشد)؛ toast از sonner؛ aria-label فارسی روی همهٔ کنترل‌ها؛ آیکون‌های lucide بدون title با span wrapper؛ بدون پکیج و تصویر جدید.
- بررسی نهایی: `bunx tsc --noEmit | grep -E "buyer-p1|activity-store|inbox-store|ActivityView|InboxView|saved-searches"` → خالی (صفر خطا؛ خطاهای باقی‌ماندهٔ پروژه مال AppShell integration و SellerRatesView ایجنت‌های موازی است)؛ `bunx eslint` هر ۶ فایل → exit 0 بدون خطا/هشدار.

Stage Summary:
- هر سه اسلایس خریدار فاز ۳ آمادهٔ یکپارچه‌سازی است: «فعالیت‌های من» (تصویر ۱۹) با تب‌های بیدها/پیشنهادها/تاریخچه، تایمر زندهٔ ۱ثانیه‌ای، «+ یک پله» با گارد موجودی واقعی کیف پول و حذف بید؛ «صندوق ورودی» (تصویر ۲۰) با فیلتر دسته‌ای شمارنده‌دار، نقطهٔ ناخوانده، خواندن تک‌تک/همه و بج «۳ ناخوانده»؛ و ردیف خوداتکای «جستجوهای ذخیره‌شده» (تصویر ۱۴) با زنگولهٔ هشدار، حذف و ذخیرهٔ کوئری جاری — همه روی دادهٔ زندهٔ استور با seedهای فارسی هم‌نام فروشنده‌های واقعی (سینا/مینا/گجت‌بازار/عطر و نگین/کلکسیون‌یار).
- قرارداد اکسپورت‌ها — store/activity-store.ts: `useActivityStore` با state {myBids, myOffers, savedSearches} و اکشن‌ها: `tickCountdown(): void`، `bumpBid(bidId: string): {ok: boolean; error?: string}`، `withdrawBid(bidId): void`، `acceptOffer(id)/declineOffer(id): void`، `toggleSearchAlert(id)/removeSearch(id): void`، `saveSearch(query: string, filterLabel?: string): {ok: boolean; error?: string}` (تایپ ActionResult اکسپورت می‌شود)؛ store/inbox-store.ts: `useInboxStore` با {notifications, markRead(id), markAllRead()} + `selectUnreadCount(state): number`؛ lib/data/buyer-p1.ts: تایپ‌های MyBidEntry/MyOfferEntry/SavedSearch/InboxNotification/ActionResult و آرایه‌های MY_BIDS/MY_OFFERS/SAVED_SEARCHES/INBOX_NOTIFICATIONS + `getInboxKindMeta(kind): {label, color}`؛ کامپوننت‌ها: `ActivityView` (default، بدون پروپ)، `InboxView` (default، بدون پروپ) و **`SavedSearchesRow({ currentQuery?: string; onPick?: (q: string) => void })`** (اکسپورت نام‌دار از saved-searches.tsx — برای Explore/کاوش: onPick متن کوئری را تحویل می‌دهد و currentQuery برای چیپ «+ ذخیرهٔ این جستجو»).
- نکته برای یکپارچه‌ساز: activity/inbox در VIEW_COMPONENTS/AppShell با importهای default ثبت شوند؛ unread badge پروفایل می‌تواند از useInboxStore(selectUnreadCount) بخواند؛ SavedSearchesRow را بالای لیست نتایج کاوش بگذارید (mb-4 دارد)؛ bumpBid و saveSearch فقط {ok,error} برمی‌گردانند — toast در لایهٔ UI است.

---
Task ID: 5-b
Agent: general-purpose
Task: فاز ۳ — باشگاه ریواردز (۳۳+۲۱)، پیش‌بید، ضمانت خریدار و اختلاف (۰۵)

Work Log:
- مرحلهٔ صفر: tail worklog (تا Task 4) و قراردادها خوانده شد: format.ts (toFa/faNum/toman)، types.ts (Cover/Show)، shows.ts (sh6 «شبِ کتاب: نایاب‌ها و امضادار» upcoming — طبق دستور برای پیش‌بید استفاده شد)، orders.ts (شناسه‌های واقعی «۱۰۲۳۴»/«۱۰۲۲۹»)، shared.tsx (PageHeader/SectionTitle/GradientCover/Chip/Price)، bid-sheet.tsx (الگوی vaul Drawer + parseAmountInput — کپی محلی)، wallet-store (canAfford) و seller-store (الگوی استور: کپی عمیق seed + شمارندهٔ شناسه + nowLabel).
- ۷ فایل جدید ساخته شد (فقط افزودنی — هیچ فایل موجودی ویرایش نشد؛ git تأیید شد؛ app-store.ts و seller-live-dashboard.tsx متعلق به main/ایجنت‌های موازی‌اند):
- `src/lib/data/rewards-p1.ts`: REWARDS_PROFILE (points 640 / streakWeeks 5 / watchedShows 37 / tierLabel «نقره‌ای»)، REWARD_TIERS چهار سطح (برنزی ۰ / نقره‌ای ۵۰۰ / طلایی ۱۵۰۰ / الماسی ۴۰۰۰) با مزایای فارسی («نشان طلایی کنار اسم»، «اولویت پشتیبانی»، «دعوت شوهای خصوصی» و…)، REWARD_BADGES هشت‌تایی (۴ کسب‌شده با earnedAtLabel + ۴ قفل با howToEarn)، REWARD_TASKS شش مأموریت (rt1 claimed، rt2/rt3/rt5 claimable با ready:true، rt4/rt6 در جریان) با progressLabel، PREBID_SHOW_ID="sh6"، PREBID_ITEMS چهار آیتم pb1..pb4 با تم هماهنگ با خود sh6 (کتاب امضادار/کمیک نایاب/دفتر اسکریب — پرانتز «sneaker/watch/bag» با تم sh6 که کتاب است ناسازگار بود و «matching an upcoming show» محترم شد)، PROTECTION_REASONS پنج‌تایی، PROTECTION_COPY (title/subtitle/bullets×3)، PROTECTION_CASES یک seed (case-1 روی سفارش واقعی «۱۰۲۲۹» فیگور ناروتو، in_review، ۳ مرحله، ۲ پیام) + تایپ‌های محلی اکسپورت‌شده.
- `src/store/rewards-store.ts`: points/streakWeeks از seed، claimedIds از taskهای claimed، claimTask(id) → {ok, points?} (تکراری → {ok:false}؛ موفق → امتیاز اضافه و برگردانده می‌شود برای toast).
- `src/store/prebid-store.ts`: myPrebids: Record<itemId, {amount, active}>؛ placePrebid(itemId, amount) → اعتبارسنجی ترتیبی: آیتم نبود / «حداقل پیش‌بید X تومان است» (faNum) / canAfford(wallet) نبود → «موجودی کافی نیست — کیف پول را شارژ کن»؛ cancelPrebid حذف می‌کند؛ PREBID_ITEMS re-export شد.
- `src/store/protection-store.ts`: cases با کپی عمیق seed؛ openCase({orderId, itemTitle, amount, reason, desc}) → id `case-${++counter}`، status "submitted"، ۳ مرحلهٔ تازه (اولی با atLabel nowLabel)، اولین پیام buyer=desc، prepend در لیست، id برمی‌گردد؛ addMessage(caseId, text) → پیام buyer + پاسخ خودکار «پذیرفته شد — کارشناس تا ۲۴ ساعت آینده بررسی می‌کند ✅».
- `src/components/liveshop/views/RewardsView.tsx` (Atlas ۳۳+۲۱): PageHeader «باشگاه ریواردز»؛ هیرو گرادیان from-ls-purple/25 to-ls-pink/25 border-ls-purple/30 با امتیاز بزرگ faNum + چیپ سطح بنفش، نوار پیشرفت گرادیانی بنفش→صورتی تا سطح بعدی (٪ = (points-cur.min)/(next.min-cur.min)) با «X امتیاز تا سطح Y»، ردیف «🔥 استریک ۵ هفته‌ای» + «👁 ۳۷ شو دیده‌شده»؛ «مأموریت‌ها» با شمارندهٔ action، لیست max-h-96 scroll-thin، هر ردیف: عنوان+توضیح+progressLabel، بج بنفش «+X امتیاز»، دکمهٔ سبز «دریافت امتیاز» (فقط ready) → toast.success(`+${faNum} امتیاز گرفتی!`)، claimed → چیپ سبز «دریافت شد ✓»، در جریان → چیپ خنثی؛ «نشان‌ها» grid-cols-4 gap-2 (کسب‌شده رنگی با earnedAtLabel در title، قفل grayscale opacity-50 + Lock ریز داخل span با title+aria)؛ «مزایای سطح فعلی» با Check سبز + تیزر سطح بعدی (Sparkles بنفش، ۲ مزیت اول سطح بعد).
- `src/components/liveshop/pre-bid-sheet.tsx`: props {show, open, onOpenChange}؛ vaul Drawer با DrawerContent max-h-[85vh] (handle داخلی shadcn)، عنوان «پیش‌بید — قبل از شروع شو»، بنر شو (کاور + startsAtLabel)، کارت توضیح «مثل Max Bid عمل می‌کند»، آیتم‌ها: GradientCover + برند + شروع (Price) + «N پیش‌بیدکننده»، پیش‌بید ثبت‌شده → چیپ سبز «پیش‌بید من: X» + دکمهٔ لغو X، وگرنه Input (parseAmountInput محلی، قرمز #FF3B5C اگر زیر حداقل) + چیپ‌های سریع startPrice و startPrice+step + «ثبت پیش‌بید» بنفش → toast موفق «پیش‌بید ثبت شد ✅ — لحظهٔ شروع خودکار می‌رود» / toast.error خطای استور؛ ردیف موجودی + «شارژ کیف پول» (push wallet پس از بستن)؛ بستن شیت پیش‌نویس‌ها را پاک می‌کند (event handler، بدون setState در effect).
- `src/components/liveshop/dispute-sheet.tsx`: props {orderId, itemTitle, amount, open, onOpenChange}؛ هدر سبز ShieldCheck «ضمانت خریدار LiveShop» + مبلغ محفوظ + خلاصهٔ سفارش؛ مرحلهٔ ۱ radiogroup پنج دلیلی (انتخاب‌شده: border-ls-green bg-ls-green/10 + Check)؛ مرحلهٔ ۲ Textarea «توضیح بده چه اتفاقی افتاد…» با شمارندهٔ کاراکتر فارسی (حداقل ۱۰)؛ دکمهٔ بنفش «ثبت اختلاف و درخواست بررسی» → openCase → toast «اختلاف ثبت شد — کارشناس تا ۲۴ ساعت بررسی می‌کند ✅» + بستن و ریست فرم؛ زیر جداکننده «پرونده‌های من»: کارت فشرده هر پرونده (سفارش #، دلیل، چیپ وضعیت: submitted بنفش «ثبت شد» / in_review صورتی «در بررسی» / resolved سبز «حل شد»)، نقاط مراحل با title/aria، پیام‌ها max-h-40 scroll-thin (خریدار بنفش، پشتیبانی سبز) + کامپوزر «پیام به کارشناس…» با Send (rotate-180 برای RTL) وصل به addMessage.
- رعایت قواعد: "use client" در هر ۵ فایل ts/tsx، فارسی RTL، فقط رنگ‌های برند (قرمز #FF3B5C فقط هشدار زیر حداقل، amber استفاده نشد)، اعداد با faNum/toFa و مبالغ با toman، aria-label فارسی روی همهٔ کنترل‌ها، lucide داخل span دارای title، toast از sonner، بدون setState در effect body (ریست‌ها در onOpenChange/هندلرها)، بدون پکیج و تصویر جدید، لیست‌های بلند max-h-96/40 + scroll-thin.
- بررسی نهایی: `bunx tsc --noEmit | grep (۷ فایل من)` → خالی (خطاهای باقی‌مانده فقط در فایل‌های ایجنت‌های موازی: AppShell از ثبت viewهای فاز ۳، SellerRatesView، examples/skills)؛ `bunx eslint` هر ۷ فایل → exit 0 بدون خطا/هشدار؛ git status → فقط ۷ فایل untracked از من.

Stage Summary:
- سه اسلایس فاز ۳ آمادهٔ یکپارچه‌سازی: «باشگاه ریواردز» با هیروی امتیاز/سطح/استریک و نوار پیشرفت تا سطح بعدی، ۶ مأموریت با دریافت امتیاز زنده (امتیاز استور +toast)، ۸ نشان (۴ قفل با راهنمای کسب) و مزایای سطح فعلی + تیزر سطح بعد؛ «پیش‌بید» شیت vaul با ۴ آیتم شو sh6، ثبت/لغو پیش‌بید با اعتبارسنجی حداقل مبلغ و موجودی کیف پول (رزرو؛ برداشت واقعی هنگام شروع شو در فاز بعد)؛ «ضمانت خریدار» شیت دو مرحله‌ای ثبت اختلاف با پرونده‌های من زنده (پیام‌نگاری با پاسخ خودکار پشتیبانی).
- قرارداد دقیق برای یکپارچه‌ساز: useRewardsStore → {points, streakWeeks, claimedIds, claimTask(id): {ok, points?}}؛ usePrebidStore → {myPrebids: Record<string,{amount,active}>, placePrebid(itemId, amount): {ok, error?}, cancelPrebid(itemId)} + re-export PREBID_ITEMS؛ useProtectionStore → {cases, openCase({orderId, itemTitle, amount, reason, desc}): string, addMessage(caseId, text)}؛ PreBidSheet فقط props {show: Show, open, onOpenChange} می‌گیرد (نمونه: <PreBidSheet show={getShow("sh6")} …/>) و DisputeSheet فقط {orderId, itemTitle, amount, open, onOpenChange}؛ RewardsView default export آمادهٔ ثبت در VIEW_COMPONENTS با کلید "rewards" (فقط import+ثبت در AppShell باقی مانده).
- نکته: claimTask روی هر مأموریت غیر-claimed آزاد است (گیت نمایشی ready در UI است)؛ در پیش‌بید، آیتم‌های پیش‌بید تماتیک با sh6 (کتاب) هماهنگ شدند نه sneaker/watch/bag — اگر شوی دیگر هدف بود فقط PREBID_SHOW_ID و آیتم‌ها در rewards-p1.ts عوض شوند.

---
Task ID: 5-e
Agent: general-purpose
Task: فاز ۳ — Raid و کو-هاست (۳۲) در داشبورد زندهٔ فروشنده

Work Log:
- مرحلهٔ صفر: tail کارناوال و Task IDها خواند؛ seller-live-dashboard.tsx (شیت vaul با تب/فیلتر/انعام)، live-store.ts (امضای pushChat: Omit<ChatMessage,"id"|"time"> & {time?} — kind "system")، shows.ts (شوهای زندهٔ sh1/sh2/sh3/sh5 + SELLERS)، shared.tsx (Avatar/GradientCover)، format.ts (toFa/faNum/compactFa)، bid-sheet.tsx (الگوی Drawer) و الگوی nowLabel در seller-store.ts.
- فایل جدید `src/lib/data/raid-p1.ts`: تایپ‌های محلی RaidTarget/CohostStatus/CohostCandidate (export همه)؛ RAID_TARGETS چهارگانه از شوهای واقعی با کپی ایستا (کاور deep-copy) — sh1 «شب کتونی‌های کمیاب 🔥»/کفش‌خانهٔ سینا/۲۴۸ بیننده، sh2 گلخانهٔ مینا/۱۳۹، sh3 کلکسیون‌یار تهران/۳۱۲، sh5 عطر و نگین/۱۷۴؛ COHOST_CANDIDATES از s2/s3/s4/s6 با followers واقعی و status — فقط s3 با seed «invited» برای دموی چیپ «ارسال شد ✓».
- فایل جدید `src/store/raid-store.ts` (zustand): state — raidTargetShowId/raidDoneLabel/invites (Record<sellerId,"sent"|"accepted"> با seed s3)/incomingInvite (seed دمویی از گجت‌بازار s4 برای شو «شب کتونی‌های کمیاب 🔥»)/lastRaidAtLabel؛ nowLabel فارسی HH:MM (کپی الگوی seller-store). اکشن‌ها: doRaid(targetShowId, viewersCount) → set سه فیلد + برچسب «🚀 Raid به «title»» + pushChat سیستم «🚀 بیننده‌ها به شو «title» منتقل شدند — بدرقهٔ گرم!» (author "Raid"، emoji 🚀، رنگ #6C5CFF) و return برچسب برای toast؛ sendInvite → invites[sellerId]="sent" + return برچسب toast با نام داوطلب؛ acceptIncoming → pushChat «🤝 کو-هاست با name شروع شد — دو صدا، یک شو!» (رنگ سبز #00C896) + invites="accepted" + پاک‌کردن incomingInvite؛ declineIncoming → پاک‌کردن.
- فایل جدید `src/components/liveshop/raid-cohost.tsx` — دو export نام‌دار:
  - RaidSheet: Drawer با عنوان «Raid — انتقال بیننده‌ها» + بنر توضیح بنفش «وقتی پخش را تمام می‌کنی، بیننده‌ها همان لحظه به شو مقصد می‌روند»؛ فلوی دومرحله‌ای با state محلی list|confirm (ریست در هندلر onOpenChange هنگام بستن — بدون setState در effect)؛ مرحلهٔ فهرست: ردیف‌های RAID_TARGETS با GradientCover w-11، عنوان، خط فروشنده، چیپ دسته، بج بینندهٔ صورتی compactFa + دکمهٔ «انتخاب»؛ مرحلهٔ تأیید: عدد بزرگ 4xl «N بیننده منتقل می‌شوند به…» (faNum + aria-live) + خلاصهٔ مقصد + دکمهٔ بنفهٔ «انجامش بده 🚀» (bg-ls-purple shadow) و «بازگشت»؛ روی تأیید: doRaid + toast.success(برچسب) + بستن شیت؛ چیپ وضعیت سبز «آخرین Raid: label — ساعت lastRaidAtLabel» تا وقتی raidDoneLabel هست.
  - CoHostSheet: Drawer با عنوان «پخش مشترک (Co-host)» + بنر سبز «یک فروشندهٔ دیگر هم‌زمان با تو دوربین روشن می‌کند — دو صدا، یک لایو»؛ کارت درخواست ورودی (اگر incomingInvite) با border-ls-green/40: Avatar + «درخواست کو-هاست از X» + «برای شو «Y»» + دکمهٔ سبز «پذیرش» (text-[#04281e]) / «رد» ghost → toast؛ گرید داوطلب‌ها: Avatar md، نام، @handle dir=ltr، دنبال‌کننده compactFa، چیپ دسته، دکمهٔ «دعوت» بنفش / چیپ «ارسال شد ✓» بنفش‌soft / چیپ «پذیرش شد ✓» سبز؛ سکشن «دعوت‌های فعال» پایین لیست با چیپ «در انتظار پاسخ…» یا «پذیرش شد ✓ — کو-هاست فعال»؛ همهٔ aria-labelها فارسی، لیست‌ها max-h-72 scroll-thin.
- ویرایش افزودنی seller-live-dashboard.tsx (۳۲ خط insert، صفر حذف — git تأیید شد): import RaidSheet/CoHostSheet؛ دو state محلی raidOpen/cohostOpen بعد از state تب‌ها؛ سکشن جدید پایانِ محتوای اسکرولی (بعد از ternary تب بیننده‌ها، قبل از بسته‌شدن div محتوا): divider (border-t border-white/5 pt-3) + گرید دو دکمه «🚀 Raid» (border-ls-purple/40 text-ls-purple-soft bg-ls-purple/10 rounded-xl px-3 py-2 text-xs font-bold، aria-label «انتقال بیننده‌ها با Raid») و «🤝 کو-هاست» (همان کلاس‌ها با ls-green، aria-label «دعوت به پخش مشترک») + کپشن «ابزارهای رشد پخش — فاز ۳» (text-[10px] white/40)؛ رندر <RaidSheet/> و <CoHostSheet/> بعد از div محتوای اسکرولی و قبل از بسته‌شدن DrawerContent (ریشهٔ کامپوننت Drawer است نه fragment — پورتال vaul مستقل است و باز شدن قابل اعتماد).
- رعایت قواعد: 'use client' در استور/کامپوننت (دیتا مثل shows.ts بدون دایرکتیو)، RTL فارسی، فقط رنگ‌های برند (بنفش/صورتی/سبز؛ سبز متن تیرهٔ #04281e فقط روی bg-ls-green مطابق الگوی StatusChip موجود)، اعداد با toFa/faNum/compactFa، toast از sonner، aria-label فارسی، lucide بدون title (فقط ایموجی/آیکون aria-hidden)، بدون پکیج و تصویر جدید، بدون setState در effect.
- بررسی نهایی: `bunx tsc --noEmit | grep raid-p1|raid-store|raid-cohost|seller-live-dashboard` → خالی (یک TS2552 اولیه در raid-store از shorthand set اصلاح شد: raidTargetShowId: targetShowId)؛ خطاهای باقی‌ماندهٔ tsc فقط از فایل‌های ایجنت‌های موازی (AppShell/SellerRatesView/examples/skills)؛ `bunx eslint` چهار فایل → exit 0 بدون خطا/هشدار؛ git diff داشبورد → ۳۲ insertions / 0 deletions (افزودنی محض).

Stage Summary:
- ابزارهای رشد پخش (تصویر ۳۲) در داشبورد زندهٔ فروشنده فعال شد: دکمه‌های «🚀 Raid» و «🤝 کو-هاست» در انتهای محتوای داشبورد، شیت Raid با فلوی دومرحله‌ای انتخاب→تأیید که روی تأیید پیام سیستمی «بدرقهٔ گرم» را در چت عمومی لایو می‌گذارد و چیپ «آخرین Raid» با ساعت فارسی نگه می‌دارد؛ شیت کو-هاست با درخواست ورودی دمویی (گجت‌بازار برای شو sh1 — پذیرش/رد با پیام سیستمی سبز)، دعوت داوطلب‌های واقعی s2/s3/s4/s6 با چرخهٔ «دعوت → ارسال شد ✓ → پذیرش شد ✓» و سکشن دعوت‌های فعال.
- قرارداد برای ایجنت‌های بعدی: استور `useRaidStore` با state {raidTargetShowId, raidDoneLabel, invites, incomingInvite, lastRaidAtLabel} و اکشن‌های {doRaid(targetShowId, viewersCount): string, sendInvite(sellerId): string, acceptIncoming(), declineIncoming()} — دو اکشن اول برچسب toast را return می‌کنند؛ doRaid/acceptIncoming مستقیم از useLiveStore.getState().pushChat (kind "system") پیام می‌گذارند و در فید داشبورد به‌ترتیب با kind "system" (author "Raid"/"کو-هاست") دیده می‌شوند؛ دیتا در raid-p1.ts کاملاً ایستا و deep-copy است (ویرایش shows.ts بی‌اثر بر آن)؛ RaidSheet/CoHostSheet فقط props {open, onOpenChange} می‌گیرند و در هر جای اپ قابل رندرند؛ seed دعوت s3 و seed درخواست ورودی s4 — accepts دائمی تا reload است (state session-level).
- exact touchpoints — seller-live-dashboard.tsx فقط ۳ افزودنی: (۱) خط import بعد از importهای ui/drawer؛ (۲) دو useState بعد از state tab؛ (۳) سکشن دودکمه‌ای+کپشن در انتهای div اسکرولی و رندر دو شیت بعد از آن div داخل DrawerContent. هیچ خط موجودی حذف/جابه‌جا/ری‌استایل نشد.

---
Task ID: 5-d
Agent: general-purpose
Task: فاز ۳ — بازاریابی، نرخ‌های من/هزینه‌ها (۱۰)، صفحهٔ فروشنده (۰۷)، تنظیمات فروشنده

Work Log:
- مرحلهٔ صفر: tail و Task IDهای worklog خوانده شد؛ مراجع کامل خوانده شد: format.ts (toFa/faNum/toman/compactFa)، types.ts، seller.ts (SELLER_SCHEDULED_SHOWS/SELLER_REVENUE با کمیسیون ۸٪ و پردازش ۲.۹٪+۳۰٬۰۰۰ — سازگاری نگه‌داشته شد)، shared.tsx (PageHeader/SectionTitle/Chip/Avatar/GradientCover/RatingStars)، SellerRevenueView (الگوی رندر)، seller-store.ts (الگوی استور)، app-store (۴ نام View از قبل ثبت‌شده — دست نخورد)، ui/{dialog,switch,alert-dialog,input} و globals.css (توکن‌های ls، scroll-thin، animate-ls-pulse). خوانده شد که آیکون‌های lucide prop title ندارند → فقط span wrapper.
- فایل جدید `src/lib/data/seller-marketing.ts`: PromoCode×3 (NOROOZ15 ٪۱۵ فعال / SNEAKER10 ٪۱۰ فعال / LIVE5 ٪۵ پر شده با usedCount/maxCount و expiresLabel)؛ BOOST_PACKAGES×3 («تقویت سبک 🚀 ۲۰۰٬۰۰۰ +۲٬۰۰۰ بینندهٔ بالقوه»، «تقویت سنگین 🛰️ ۵۰۰٬۰۰۰ +۶٬۰۰۰»، «گپ دسته 📣 ۹۰۰٬۰۰۰ +۱۲٬۰۰۰ + جای ویژه»)؛ ACTIVE_BOOST: ActiveBoost | null = { showTitle: "کفش‌بار جمعه‌شب", endsLabel: "۲ روز مانده" }؛ MY_GMV_MONTH = 42_500_000؛ COMMISSION_TIERS (٪۸ تا ۵۰م / ٪۵ تا ۱۵۰م / ٪۳ بالای ۱۵۰م) + TIER_CUTS: number[] = [50M, 150M] برای محاسبه؛ PROCESSING = { pct: 2.9, flat: 30_000 }؛ NOTE_BUYER_FEE؛ STOREFRONT (sellerId "s1"، داستان ۳ پاراگرافی کفش‌فروش با \n\n، totalSalesLabel "۱٬۲۴۰"، sinceLabel "از ۱۴۰۱"، policies×3 ارسال ۲۴ساعته تیپاکس/بازگشت ۷روزه/تضمین اصالت، REVIEWS×4 با name/emoji/color/rating 5/text/atLabel/itemTitle)؛ SHEBA_MASKED "IR-****-۵۴۲۱-****"؛ NOTIF_PREFS×4 (سفارش جدید/بید بالاتر/پیام خریدار/تسویه انجام شد)؛ DANGER copy. همهٔ تایپ‌ها export شدند.
- فایل جدید `src/store/marketing-store.ts` (zustand، الگوی seller-store): promoCodes از seed کپی؛ toggleCode(id)؛ addCode({percent}) → کد `LS-XXXX` چهارحرفی از الفبای بدون ابهام (حذف I,O,0,1)، id `pm${++promoCounter}` (شروع از ۴)، active true، usedCount 0، maxCount 100، expiresLabel «۳۰ روز»، prepend و return کد برای toast؛ boostActive: ACTIVE_BOOST؛ startBoost(pkgId, showTitle) → boostActive { showTitle, endsLabel: "۷ روز" } و return BoostPackage | null؛ stopBoost() → null. بدون پارامتر get بلااستفاده.
- فایل جدید `views/SellerMarketingView.tsx`: PageHeader «بازاریابی / کد تخفیف و تقویت شو» onBack={back}؛ کارت تقویت فعال فقط وقتی boostActive با قاب گرادیان بنفش p-[1.5px] (linear-gradient 135deg #6C5CFF→#4a3dd6) + نقطهٔ سبز animate-ls-pulse + showTitle + بج endsLabel + دکمهٔ ghost «توقف» → stopBoost + toast؛ «بسته‌های تقویت» grid grid-cols-1 gap-2 با کارت‌های bg-ls-card (ایموجی/نام/reachLabel سبز/toman قیمت) و دکمهٔ بنفش «اجرا برای شو بعدی» → startBoost(pkg.id, scheduledShows[0]?.title ?? "شو بعدی" از seller-store) + toast.success «تقویت فعال شد 🚀 — شو بعدی بیشتر دیده می‌شود»؛ کارت «کدهای تخفیف» با لیست max-h-96 scroll-thin: چیپ کد dir=ltr font-mono bg-ls-card-2، بج درصد صورتی «٪۱۵»، Switch با data-[state=checked]:bg-ls-purple (ردیف غیرفعال opacity-50)، نوار پیشرفت استفاده (width ٪) با برچسب faNum «۳۴ از ۱۰۰ استفاده شده» و role=progressbar؛ «ساخت کد جدید» → Dialog شادکن با چیپ‌های ٪۵/٪۱۰/٪۱۵/٪۲۰ (state پیش‌فرض ۱۰) → addCode + toast.success «کد تخفیف ساخته شد 🎟️ — {code}»؛ کارت تیزر «🤝 همکاری در پخش (Raid / Co-host)» با desc «از داشبورد زندهٔ فروشنده در دسترس است» (بدون ناوبری).
- فایل جدید `views/SellerRatesView.tsx` (Atlas ۱۰): PageHeader «نرخ‌های من / کارمزدها و هزینه‌ها»؛ هیروی پلکان فعلی «٪۸» بنفش 3xl + خط فروش ماهانه toman(MY_GMV_MONTH) + نوار پیشرفت تا آستانهٔ ۵۰م (٪۸۵ با role=progressbar) + خط محاسبه‌شده «فقط ۷٬۵۰۰٬۰۰۰ تومان فروش تا پلکان ٪۵» (remaining = nextCut − GMV؛ در پلهٔ آخر «بالاترین پلکان را باز کرده‌ای 🎉» و progress ۱۰۰)؛ کارت پلکان‌ها ۳ ردیف (rate بزرگ + rangeLabel) با هایلایت ردیف فعلی border-ls-purple bg-ls-purple/10 + چیپ «فعلی»؛ ردیف پردازش درگاه «٪۲٫۹ + ۳۰٬۰۰۰ تومان» (toFa روی 2.9 + faNum) با نکتهٔ تسویهٔ هفتگی پنج‌شنبه‌ها؛ کارت سبز ShieldCheck «کارمزد خریدار: صفر» با NOTE_BUYER_FEE عیناً + خط تفاوت با رقبا؛ ماشین‌حساب تعاملی: Input inputMode=numeric با placeholder فارسی + parseFaNum محلی (۰-۹ و ٠-٩ → لاتین، حذف ٬ و ، و فاصله) → useMemo: کمیسیون با rateِ پلهٔ مبلغ ورودی، پردازش درگاه، «خالص شما» سبز bold — حالت خالی/صفر همهٔ ردیف‌ها «—»؛ کارت نکتهٔ کوچک «نرخ‌ها به‌صورت خودکار با رشد فروش بهتر می‌شوند — بدون درخواست».
- فایل جدید `views/SellerStorefrontView.tsx` (Atlas ۰۷): PageHeader با trailing دکمهٔ Share2 → toast «لینک فروشنده کپی شد (دمو)»؛ هیرو GradientCover h-32 rounded-2xl (cover از color/emoji فروشنده s1 با getSeller) با ایموجی text-6xl + بج sinceLabel/scheduleLabel روی کاور + Avatar xl با -mt-9 mx-4 همپوشان + نام + ✓ تأیید بنفش (span با title — آیکون نیست) + هندل dir=ltr + RatingStars(4.9, 2341)؛ آمار grid-cols-3: فروش‌ها (totalSalesLabel "۱٬۲۴۰") / فالوور (compactFa(12400) → «۱۲ هزار») / امتیاز (toFa(4.9))؛ «داستان فروشنده» whitespace-pre-line text-sm leading-7 text-white/75؛ «سیاست‌های فروش» ۳ ردیف ایموجی/عنوان/desc؛ «شوهای آینده» از SELLER_SCHEDULED_SHOWS با شمارنده: ردیف فشرده GradientCover thumb w-12 + عنوان + Clock + whenLabel و itemsCount + دکمهٔ «یادآوری» → toast «یادآوری فعال شد 🔔»؛ «نظرات خریداران» لیست max-h-96 scroll-thin: Avatar + نام dir=ltr + RatingStars + متن + خط «خرید: {itemTitle} · {atLabel}»؛ دکمهٔ بزرگ فالو پایین با toggle محلی: حالت عادی بنفس با گلِو «+ فالو»، حالت فالو سبز border-ls-green/40 با Check «فالو شد»؛ خط شفافیت هزینهٔ ارسال toman(45_000) در انتها.
- فایل جدید `views/SellerSettingsView.tsx`: PageHeader «تنظیمات فروشنده»؛ «تسویه»: Wallet + شبأ ماسک‌شده dir=ltr font-mono + «ویرایش شبا» ghost → toast (دمو)؛ «اعلان‌ها»: ۴ ردیف NOTIF_PREFS با Switch (state محلی با initializer از دیتا — بدون setState در effect) با data-[state=checked]:bg-ls-purple؛ «ارسال پیش‌فرض»: radiogroup ۳ ردیفه تیپاکس/پست پیشتاز/پیک شهری با role=radio و aria-checked و Check بنفش روی انتخاب (state محلی، پیش‌فرض تیپاکس)؛ «زبان و نمایش»: ردیف «فارسی — راست‌چین» با چیپ قفل (Lock) + ردیف «تم تیره» با چیپ بنفش «همیشه فعال»؛ «ناحیهٔ خطر» border-ls-pink/30 bg-ls-pink/5: Switch «تعطیلی موقت فروشگاه» با data-[state=checked]:bg-[#FF3B5C] و toast دوحالته، دکمهٔ مخرب «حذف حساب» با Trash2 → AlertDialog شادکن («حذف حساب قطعی است — دمو: اتفاقی نمی‌افتد» + hint) با انصراف/«بله، حذف کن» و toast «دمو — حسابی حذف نشد 😌» روی تأیید.
- رعایت قواعد: 'use client' در هر ۳ فایل tsx+استور؛ additive-only — فقط ۶ فایل جدید ساخته شد و هیچ فایل موجودی (از جمله app-store و AppShell) ادیت نشد (git check تاییدی زیر)؛ اعداد همه با toFa/faNum/toman/compactFa (کد تخفیف LTR اکسَمپت)؛ فقط پالت بنفش/صورتی/سبز + #FF3B5C برای خطر (بدون آبی/نیلی/زرد؛ amber فقط ستاره‌های shared)؛ aria-label فارسی روی همهٔ کنترل‌ها؛ toast از sonner؛ بدون پکیج و تصویر جدید؛ هیچ effect و هیچ setState-in-effect نوشته نشد؛ تایمر نداریم.
- بررسی نهایی: `bunx tsc --noEmit | grep (۶ فایل)` → صفر خطا در فایل‌های من (تنها خطای باقی‌ماندهٔ پروژه در AppShell.tsx است: ثبت ۹ View جدید برای ایجنت‌های موازی فاز ۳ — وظیفهٔ یکپارچه‌سازی main agent، خارج از محدودهٔ من)؛ `bunx eslint` هر ۶ فایل → exit 0 بدون خطا و هشدار؛ چک رنگ ممنوع (blue/indigo/yellow) → صفر مورد.

Stage Summary:
- چهار نمای فروشندهٔ فاز ۳-d آمادهٔ اتصال در AppShell است: «بازاریابی» (تقویت فعال با قاب گرادیان و نقطهٔ زنده، سه بستهٔ تقویت با اجرای یک‌کلیکی روی شو بعدی، کدهای تخفیف با سوییچ/نوار استفاده/دیالوگ ساخت کد LS-XXXX، تیزر Raid/Co-host)، «نرخ‌های من» (هیروی پلکان ٪۸ با نوار پیشرفت و «۷٬۵۰۰٬۰۰۰ تومان تا پلکان ٪۵» محاسبه‌شده، نردبان پلکان با هایلایت فعلی، پردازش درگاه ٪۲٫۹+۳۰٬۰۰۰، کارت سبز کارمزد خریدار صفر، ماشین‌حساب خالص درآمد با parse ارقام فارسی)، «صفحهٔ فروشنده» (هیرو کاور+آواتار همپوشان+تأیید+ستاره، آمار ۳تایی، داستان، سیاست‌ها، شوهای آینده با یادآوری، نظرات اسکرولی، دکمهٔ فالو toggle) و «تنظیمات فروشنده» (شبأ ماسک، اعلان‌ها، ارسال پیش‌فرض رادیویی، زبان/تم قفل، ناحیهٔ خطر با تعطیلی موقت و AlertDialog حذف حساب).
- قرارداد دقیق برای یکپارچه‌ساز: ۱) AppShell.tsx باید ۴ ایمپورت + ۴ ثبت در VIEW_COMPONENTS اضافه کند: sellerMarketing: SellerMarketingView / sellerRates: SellerRatesView / sellerStorefront: SellerStorefrontView / sellerSettings: SellerSettingsView (همگی default export بدون props، مثل SellerRevenueView). ۲) استور `useMarketingStore` از "@/store/marketing-store": { promoCodes, boostActive, toggleCode, addCode({percent})→PromoCode, startBoost(pkgId, showTitle)→BoostPackage|null, stopBoost } — addCode کد `LS-XXXX` و expiresLabel «۳۰ روز» می‌سازد و جدیدترین را اول می‌گذارد؛ startBoost برچسب پایان «۷ روز» ست می‌کند. ۳) دیتا از "@/lib/data/seller-marketing": PROMO_CODES/BOOST_PACKAGES/ACTIVE_BOOST/MY_GMV_MONTH/COMMISSION_TIERS/TIER_CUTS/PROCESSING/NOTE_BUYER_FEE/STOREFRONT (story با \n\n برای whitespace-pre-line، reviews با color برای Avatar)/SHEBA_MASKED/NOTIF_PREFS/DANGER + تایپ‌های PromoCode/BoostPackage/ActiveBoost/CommissionTier/StorefrontPolicy/StorefrontReview/StorefrontData/NotifPref. ۴) سازگاری اعداد: کمیسیون ۸٪ و پردازش ۲.۹٪+۳۰٬۰۰۰ همان SELLER_REVENUE است؛ فروش ماهانهٔ نمونه ۴۲٬۵۰۰٬۰۰۰ زیر آستانهٔ ۵۰م (فقط ۷٬۵۰۰٬۰۰۰ تا ٪۵) — اگر بعداً thresholds تغییر کند TIER_CUTS منبع واحد است. ۵) نقطهٔ اتصال آینده: بسته‌های تقویت فعلاً فقط state را تغییر می‌دهند (بدون شارژ کیف پول) و می‌توانند در فاز بعد به wallet-store وصل شوند؛ تقویت فعال می‌تواند بعداً در SellerDashboardView/ScheduleView هم با boostActive نشان داده شود.

---
Task ID: 6
Agent: main (Z.ai Code)
Task: فاز ۳ — یکپارچه‌سازی، تأیید مرورگری و آرشیو v1.3

Work Log:
- پیش از ایجنت‌ها: افزودن ۹ نام View جدید (activity/rewards/inbox/sellerAnalytics/sellerHealth/sellerMarketing/sellerRates/sellerStorefront/sellerSettings) به ViewName و NAV_VIEWS در app-store.ts — تنها تغییر فایل مشترک قبل از ایجنت‌ها
- پنج ایجنت موازی (5-a تا 5-e) هرکدام فقط فایل جدید ساختند؛ تنها فایل موجودِ دست‌خورده: seller-live-dashboard.tsx (افزودنی خالص ۳۲ خط / ۰ حذف — git تأیید شد)
- یکپارچه‌سازی (خودم): ثبت ۹ View در imports/VIEW_COMPONENTS در AppShell.tsx
- SellerDashboardView: وصل کردن ۴ کاشی هاب که «در فاز ۳ فعال می‌شود» وعده داده بودند (بازاریابی→sellerMarketing، آنالیتیکس→sellerAnalytics، سلامت اکانت→sellerHealth، تنظیمات→sellerSettings — جایگزین toastهای placeholder طبق الگوی اعلام‌شدهٔ فاز ۲) + دکمهٔ جدید «صفحهٔ فروشنده» بعد از گرید هشت‌ماژوله → sellerStorefront
- ProfileView: سه ردیف منوی جدید با شمارندهٔ زنده — «فعالیت‌ها و بیدها» (N بید فعال از useActivityStore)، «صندوق ورودی» (N ناخوانده از selectUnreadCount)، «باشگاه ریواردز» (امتیاز از useRewardsStore)
- ExploreView: ردیف «جستجوهای ذخیره‌شده» زیر نوار جستجو (SavedSearchesRow با onPick→setQuery و currentQuery برای «ذخیرهٔ این جستجو») + دکمهٔ «پیش‌بید» داخل فوتر شوهای به‌زودی (prop جدید onPrebid در UpcomingFooter، بدون تغییر بقیه) + رندر PreBidSheet با key={show.id}
- OrderDetailView: بنر سبز «ضمانت خریدار LiveShop» بعد از کارت کالا + دکمهٔ صورتی «باز کردن اختلاف — ضمانت خریدار» + رندر DisputeSheet (key={order.id})
- SellerRevenueView: میان‌بر «نرخ‌های من و ماشین‌حساب هزینه» بعد از کارت پلکان کارمزد → sellerRates
- باگ‌فیکس: faDec در SellerAnalyticsView اعداد اعشاری بلند چاپ می‌کرد (٪۵۸٫۰۶۴۵۱۶…) → گرد کردن به یک رقم اعشار (Math.round(n*10)/10)
- رگرسیون هنگام تست: سرور dev یک بار قطع شد → ری‌استارت و ادامهٔ تست
- بررسی: tsc صفر خطای پروژه‌ای، bun run lint پاک، dev.log سالم
- تأیید مرورگری کامل (agent-browser، موبایل ۳۹۰px و دسکتاپ ۱۲۸۰px، بدون خطای کنسول): پروفایل (سه ردیف جدید با شمارندهٔ زنده) → فعالیت‌ها (چیپ وضعیت پیشتاز/بید بالاتر، «+ یک پله» → توست «موجودی کافی نیست» اعتبارسنجی کیف پول ✓) → صندوق ورودی (فیلترهای شمارنده‌دار، «خواندن همه» → «همه خوانده شدند» ✓) → باشگاه ریواردز (دریافت مأموریت → ۶۴۰←۶۷۰ امتیاز + نوار پیشرفت + توست «+۳۰ امتیاز» ✓) → کاوش (چیپ‌های جستجوی ذخیره با زنگ هشدار؛ دکمهٔ پیش‌بید → شیت پیش‌بید → ثبت ۱٬۲۰۰٬۰۰۰ → چیپ سبز «پیش‌بید من» ✓) → سفارش (بنر ضمانت خریدار؛ باز کردن اختلاف → انتخاب دلیل + توضیح → ثبت → توست ۲۴ ساعت ✓) → هاب فروشنده (۴ کاشی فعال + دکمهٔ صفحهٔ فروشنده) → آنالیتیکس (چیپ دوره، ۴ KPI، نمودار میله‌ای، قیف با ٪ اصلاح‌شده ٪۵۸٫۱/٪۲۵٫۸، نوار حرارتی) → سلامت اکانت (حلقهٔ ۹۲، تیک کار بهبود → خط‌خوردگی + ۱/۴ ✓) → بازاریابی (ساخت کد LS-A3UA ٪۱۵ → اول لیست + توست ✓) → تنظیمات (رادیو تیپاکس، ناحیهٔ خطر) → صفحهٔ فروشنده (سیاست‌ها، شوهای آینده، نظرات) → نرخ‌های من (ماشین‌حساب ۳٬۰۰۰٬۰۰۰ → کمیسیون ۲۴۰٬۰۰۰ + درگاه ۱۱۷٬۰۰۰ = خالص ۲٬۶۴۳٬۰۰۰ ✓) → اتاق لایو از مسیر فروشنده (شروع لایو → پخش) → داشبورد زنده (دکمه‌های Raid/کو-هاست؛ Raid دو مرحله‌ای → «۱۲۶۹ بیننده» → توست موفق + پیام «🚀 بدرقهٔ گرم» در چت لایو ✓؛ کو-هاست → پذیرش دعوت گجت‌بازار → پیام «🤝 دو صدا، یک شو» در چت ✓) — و رگرسیون خانه/کاوش/سفارش‌ها/لایو سالم
- آرشیو: download/liveshop-v1.3.zip + ثبت کامل v1.3 در CHANGELOG.md

Stage Summary:
- فاز ۳ (P1) کامل و تأیید مرورگری شد: ۹ صفحهٔ جدید (فعالیت‌ها/بیدها ۱۹، صندوق ورودی ۲۰، باشگاه ریواردز ۳۳+۲۱، آنالیتیکس ۳۱، سلامت اکانت ۳۰، بازاریابی، نرخ‌های من/هزینه‌ها ۱۰، صفحهٔ فروشنده ۰۷، تنظیمات فروشنده) + ۴ شیت/کامپوننت (پیش‌بید، اختلاف/ضمانت خریدار ۰۵، Raid و کو-هاست ۳۲، جستجوهای ذخیره‌شده ۱۴) + ۵ فایل دیتا و ۷ استور جدید
- قانون طلایی محترم ماند: هیچ محتوای قبلی حذف/تغییر نکرد؛ فقط افزودنی‌ها + جایگزینی ۴ toast وعده‌داده‌شدهٔ فاز ۲ با ناوبری واقعی (الگوی اعلام‌شده)
- تلمبهٔ باقی‌مانده برای فاز ۴ (P2): انتخاب اورلی اتاق آماده‌باش (توست «در فاز ۳» از فاز ۲ — جزو فهرست تأییدشدهٔ فاز ۳ نبود)، اتصال پیش‌بید به موتور مزایده هنگام شروع شو، اتصال بسته‌های تقویت به کیف پول
- آماده برای تأیید کاربر قبل از فاز ۴ (P2): بارکد، BNPL، CSV، Rehearsal

---
Task ID: 7
Agent: main (Z.ai Code)
Task: v1.3.1 — بازطراحی صفحهٔ اتاق لایو (Live Room) مطابق مرجع Whatnot (فارسی/RTL/تم تیره/تومان حفظ شد)

Work Log:
- کاربر دو عکس پیوست کرد (عکس ۱: لایو فعلی پروژه، عکس ۲: مرجع Whatnot) و خواست فقط صفحهٔ Live Room از نظر ساختار و چیدمان شبیه مرجع شود؛ پایان کار در همین نسخهٔ v1.3.1 و بدون ورود به فاز ۴
- تولید ۶ عکس واقعی با image-generation (بدون ایموجی): public/liveshop/{live-sh1,live-sh2,live-sh3}.jpg (۷۶۸×۱۳۴۴ — فروشنده در حال نمایش کالا با نئون بنفش/صورتی به سبک مرجع) + {item-it1,item-it3}.jpg (عکس محصول دنک پاندا و جردن شیکاگو) + seller-s1.jpg (آواتار سینا) — نکته: سایز تولید باید مضرب ۳۲ باشد (۷۲۰×۱۴۴۰ رد شد، ۷۶۸×۱۳۴۴ قبول)
- فایل جدید src/lib/data/media.ts: سه نقشهٔ SHOW_VIDEO / ITEM_PHOTO / SELLER_PHOTO با fallback گرادیان برای شو/کالاهای بدون عکس
- بازنویسی کامل src/components/liveshop/views/LiveView.tsx (تنها صفحهٔ بازطراحی‌شده):
  ۱) ویدیو: fixed inset-0 z-40 (۱۰۰dvh) + animate-ls-kenburns + گرادیان خوانایی بالا/پایین؛ fallback بدون ایموجی (گرادیان برند + جاروی نور animate-[ls-shine])
  ۲) دسکتاپ ۱۲۸۰: ستون موبایلی max-w-[420px] مرکز با rounded-[2rem] + هالهٔ بنفش؛ aside راست «شوهای زندهٔ دیگر» (openShow) و aside چپ «به‌زودی» — هر دو hidden lg:flex با max-h و scroll-thin
  ۳) هدر: راست = پیل فروشنده (عکس واقعی/Avatar fallback + نام truncate + ★rating amber + تیک تأیید)؛ چپ = پیل قرمز #FF3B5C بیننده با نقطهٔ پالس + دکمهٔ کوچک‌کردن ChevronDown (back) — pt-[max(env(safe-area-inset-top),12px)]
  ۴) ریل راست: دکمه‌های w-11 h-11 (۴۴px) گرد با برچسب فارسی زیر هرکدام: لایک(با تعداد faNum) / گیواوی / آمار (فقط show.sellerId===MY_SELLER_ID='s1') / بی‌صدا / اشتراک / کیف پول (جدید → push wallet) / فروشگاه — لنگر bottom ناحیهٔ میانی، بدون تداخل با هدر
  ۵) چت اورلی چپ-پایین: max ۴ پیام (slice(-4))، TTL نرمال ۶ ثانیه / خاص ۹.۵ ثانیه + ۸۰۰ms fade (transition opacity/translate)، متن سفید + نام رنگی + text-shadow، پیل‌های system/winner/giveaway، کارت سبز purchase با tag، ورودی گرد نیمه‌شفاف «پیام بنویس…» با دکمهٔ ارسال دایره‌ای داخلش (pointer-events-none روی کانتینر پیام‌ها)
  ۶) پیل «برندهٔ فعلی» (WinnerBanner بدون تغییر منطق) بالای کارت پایین centered — فقط در phase running/sold
  ۷) کارت پایین واحد (ProductDock بازنویسی بصری): عکس گرد ۶۴px واقعی (Image fill) + نام + «۱ موجود» سبز + تگ‌های ریز داخل کارت + خط conditions/ارسال | چپ: «بید فعلی» + Price درشت + تایمر چیپ (≤۱۰ث → قرمز #FF3B5C + animate-ls-timer-alert)؛ ردیف دکمه‌ها: ثبت بید flex-1 h-12 whitespace-nowrap با ChevronsLeft + خرید فوری ثانویه h-12؛ حالت‌های buy_now/sold/up_next/awaiting حفظ؛ BidSheet با همان الگوی key={bidNonce}
  ۸) شیت‌ها سرجایشان: ShopTab (absolute داخل ستون)، SellerLiveDashboard/BidSheet (Drawer portal z-50 > روت z-40)، GiveawayModal/FinishedModal (Dialog) — هیچ‌کدام ادیت نشدند
- افزودن keyframe/cلاس ls-kenburns به انتهای globals.css (تنها تغییر فایل مشترک — افزودنی خالص)
- رفع باگ حین تست: دکمهٔ خرید فوری متن‌ش wrap عمودی می‌شد → whitespace-nowrap + px-4 (و truncate روی متن دکمهٔ بید)
- تأیید مرورگری با agent-browser (بدون خطای کنسول):
  * موبایل ۳۹۰×۸۴۴: اسکرین‌شات نهایی با عکس مرجع مقایسه شد — هدر/ریل/چت/کارت/پیل برنده هم‌خوان با مرجع (آینهٔ RTL)
  * رگرسیون: شیت بید باز شد + اعتبارسنجی «حداقل بید مجاز» با موتور ✓ / سوییچ Max Bid ✓ / محو شدن پیام‌های چت بعد از ~۶ ثانیه (اسکرین‌شات قبل/بعد) ✓ / ارسال پیام «علی» ✓ / تب Shop با وضعیت زنده (it1 فروخته شد در جلسه) ✓ / گیواوی شمارش ۷→ برنده mina_k72 + کانفتی ✓ / داشبورد زنده (فروش ۱۶٬۲۰۰٬۰۰۰ زنده) + Raid دومرحله‌ای → پیام «🚀 بیننده‌ها به شو … بدرقهٔ گرم» در چت جدید ✓ / تایمر قرمز دقیقاً در ۰۰:۱۰ (polling DOM) ✓ / بی‌صدا toggle ✓ / خرید فوری → تسویه ✓ / کوچک‌کردن → خانه ✓ (click via ref؛ eval click گاهی stale می‌شد)
  * آمار فقط برای صاحب شو: روی sh3 (sellerId s3) دکمه حذف شد ✓ + عکس ویدیوی مخصوص sh3 نمایش داده شد ✓
  * دسکتاپ ۱۲۸۰×۸۰۰: ستون ۴۲۰px مرکز + لیست زنده‌ها راست + به‌زودی چپ ✓
- آرشیو: download/liveshop-v1.3.1.zip (همان ساختار zip قبلی) + ثبت کامل v1.3.1 در CHANGELOG.md

Stage Summary:
- اتاق لایو حالا از نظر ساختار با مرجع Whatnot هم‌خوان است: ویدیوی تمام‌صفحه با عکس واقعی (بدون ایموجی بزرگ)، چت شناور چپ-پایین با محو شدن پیام‌ها و ورودی «پیام بنویس…»، کارت پایین واحد با عکس گرد ۶۴px + قیمت درشت + تایمر قرمز پالس‌دار + دکمهٔ بید تمام‌عرض + خرید فوری ثانویه، ریل ۴۴px با برچسب بی‌صدا/اشتراک/کیف پول/فروشگاه (+آمار فقط برای صاحب شو)، پیل فروشنده با آواتار واقعی و امتیاز ستاره‌دار راست / پیل قرمز بیننده + کوچک‌کردن چپ، پیل برندهٔ فعلی دقیقاً بالای کارت
- قرارداد برای ایجنت‌های بعدی: نقشهٔ عکس‌ها در src/lib/data/media.ts است — برای افزودن عکس واقعی به شو/کالا/فروشندهٔ جدید فقط کلید همان id را اضافه کنید؛ SHOW_VIDEO نداشتن کلید = fallback گرادیان بدون ایموجی؛ MY_SELLER_ID='s1' در LiveView تعریف شده (ملاک نمایش دکمهٔ آمار)؛ فایل LiveView حالا کامپوننت‌های LiveVideoLayer/LiveHeader/LiveRail/LiveChatOverlay/WinnerBanner/ProductDock/DesktopSidePanels/FinishedModal را دارد
- محدوده: فقط LiveView + media.ts + ۶ عکس + یک افزودنی CSS — هیچ صفحه/استور/شیت دیگری تغییر نکرد (تأیید با lint/tsc بدون خطای جدید)
- نسخهٔ نهایی v1.3.1 — طبق دستور کاربر وارد فاز ۴ نشد

---
Task ID: publish-v1.3
Agent: main (Z.ai Code)
Task: انتشار پروژهٔ LiveShop روی GitHub — مخزن amirkinggg4-dot/liveshop (شاخهٔ main) — بدون تغییر هیچ کد و قابلیتی

Work Log:
- بررسی وضعیت گیت: مخزن لوکال روی main با کامیت‌های قدیمی template؛ `.env` (فقط DATABASE_URL لوکال، بدون راز) در تاریخچه track شده بود؛ `download/*.zip`، `upload/` (۲۳MB مستندات مرجع) و `tool-results/` هم track بودند
- توکن GitHub تأیید شد (کاربر: amirkinggg4-dot)؛ از بین ۶ مخزن قابل‌دسترس، مخزن مقصد `amirkinggg4-dot/liveshop` شناسایی شد (خالی، default branch: main، دسترسی push ✓)
- `.gitignore` به‌روزرسانی شد: `*.zip`، `/upload/`، `/tool-results/` + استثنای `!.env.example`؛ سپس `.env`، ۵ فایل zip، `upload/` و `tool-results/` با `git rm --cached` از index خارج شدند (فایل‌ها روی دیسک باقی ماندند)
- `.env.example` ساخته شد (فقط نام متغیرها با مقدار خالی: DATABASE_URL)
- `README.md` نوشته شد: نسخهٔ Node (≥۲۰.۹)، نصب/اجرا/build (npm و bun)، توضیح معماری SPA تک‌مسیره + جدول مسیرها و ۲۷ ویو، محل دادهٔ mock
- `docs/STRUCTURE.md` نوشته شد: درخت فایل + نقشهٔ دقیق فایل‌های اتاق لایو، شیت بید، چت، نوار Shop، داشبورد فروشنده، ۱۳ استور zustand و ۱۳ فایل دیتای mock
- ۵۴ اسکرین‌شات واقعی با agent-browser در `docs/screenshots` گرفته شد: ۲۵ ویو + ۲ حالت اضافی (شیت بید باز، داشبورد زنده) × ۲ نمای (موبایل ۳۹۰×۸۴۴ / دسکتاپ ۱۲۸۰×۸۰۰) — شامل اتاق لایو با شیت بید باز و بسته و داشبورد فروشندهٔ زنده؛ QC بصری روی ۴ شات کلیدی انجام شد
- تاریخچهٔ لوکال (که .env در آن بود) به یک کامیت ریشهٔ تازه squash شد تا .env به‌هیچ‌وجه در تاریخچهٔ منتشرشده نباشد؛ پیام کامیت طبق درخواست: «chore: publish v1.3 with docs and screenshots»
- push ناموفق ماند: توکن fine-grained کاربر احراز هویت می‌شود اما برای مخزن liveshop دسترسی «Contents» ندارد — git push → 403 «Permission denied to amirkinggg4-dot» (با ۳ قالب احراز هویت متفاوت تست شد) و GET /contents → 404؛ REST API نقش admin کاربر را نشان می‌دهد ولی مجوزهای خود توکن را نه. کامیت لوکال آمادهٔ push است و فقط منتظر دسترسی Contents: Read and write از توکن است

Stage Summary:
- مخزن هدف: https://github.com/amirkinggg4-dot/liveshop — کامیت لوکال آمادهٔ انتشار (تک‌کامیت، شاخهٔ main)؛ push به‌دلیل نداشتن دسترسی Contents در توکن فعلی انجام نشد و پس از اصلاح دسترسی از سوی کاربر، همان کامیت با یک push منتشر می‌شود
- چیزهایی که عمداً push نشد: `.env`، `node_modules/`، `.next/`، `download/*.zip` (آرشیوهای نسخه‌ها)، `upload/` (PDF و اسکرین‌شات‌های مرجع ۲۳MB)، `tool-results/` (خروجی‌های داخلی ابزارها) — و به‌جای .env فایل `.env.example` اضافه شد
- ویوی «برد» (WinView) در اسکرین‌شات‌ها نیست چون فقط پس از بردن یک مزایدهٔ کامل ظاهر می‌شود؛ ۲۷ ویوی دیگر کامل پوشش داده شدند
- هیچ فایل کد/قابلیتی تغییر یا حذف نشد؛ فقط فایل‌های مستندسازی (README، docs)، `.env.example`، `.gitignore` و اسکرین‌شات‌ها اضافه شدند

---
Task ID: publish-v1.3 (فاز push)
Agent: main (Z.ai Code)
Task: تکمیل انتشار — push کامیت آمادهٔ v1.3 به مخزن amirkinggg4-dot/liveshop روی main با توکن جدید کاربر

Work Log:
- کامیت آمادهٔ فاز قبل (fe3529f، ۲۲۲ فایل) سالم بود: اسکن git grep روی کل درخت tracked برای الگوهای توکن (github_pat_ / ghp_ / gho_) → تمیز؛ .env در تاریخچه نیست (تک‌کامیت squash‌شدهٔ ریشه)
- توکن جدید کاربر با API تست شد: GET /user → amirkinggg4-dot ✓؛ GET /repos/amirkinggg4-dot/liveshop → permissions: admin/push/maintain ✓؛ 404 قبلی GET /contents فقط به‌دلیل خالی بودن مخزن بود («This repository is empty»)
- push موفق: `git -c credential.helper= push https://x-access-token:<TOKEN>@github.com/amirkinggg4-dot/liveshop.git main:main` → «* [new branch] main -> main»؛ توکن فقط به‌صورت درون‌خطی در URL صریح استفاده شد و در هیچ فایلی (از جمله .git/config) ذخیره نشد
- راستی‌آزمایی: ls-remote → refs/heads/main = fe3529f5cde88935c54e34a2cee614d25d023598 == HEAD لوکال ✓؛ GET /commits/fe3529f → 200 با ۲۲۲ فایل ✓؛ git tree recursive → ۲۴۶ آبجکت، truncated=false ✓
- upstream تنظیم شد: git fetch origin main + git branch -u origin/main main → «## main...origin/main» همگام

Stage Summary:
- انتشار کامل شد: https://github.com/amirkinggg4-dot/liveshop (public) — شاخهٔ main
- کامیت: https://github.com/amirkinggg4-dot/liveshop/commit/fe3529f5cde88935c54e34a2cee614d25d023598
- عمداً منتشر نشد: .env، node_modules/، .next/، download/*.zip، upload/، tool-results/ — به‌جای .env فایل .env.example منتشر شد
- توصیهٔ امنیتی: هر دو توکن fine-grained که کاربر در چت پیست کرده (قدیمی و جدید) پس از اطمینان از انتشار باید revoke شوند

---
Task ID: 8 (v1.3.2)
Agent: main (Z.ai Code)
Task: پالیش ظاهر اتاق لایو و خانه طبق مرجع Whatnot + اسکرین‌شات‌های موبایل + commit/push — بدون تغییر منطق/استور/دیتا

Work Log:
- الف) اتاق لایو (LiveView): کادر سبز پیام‌های سؤال حذف → متن سفید ساده + چیپ کوچک کنار نام (ChatLine بازنویسی + ChipTag جدید)؛ چیپ نوع برای system/winner/giveaway؛ گرادیان تیرهٔ ملایم پشت چت؛ تایمر ۱۸px بولد (≤۱۰ث قرمز پالس‌دار، ≤۵ث ۲۱px)؛ داک ساده (نام/۱ موجود/قیمت/خط ریز برند·سایز·ارسال)؛ تگ‌ها → نشان کوچک گوشهٔ عکس؛ خرید فوری باریک‌تر؛ پالس قیمت با ls-bid-pop ۳۸۰ms (key remount)؛ خطوط «بید … ثبت کرد» زرد؛ devIndicators: false در next.config
- ب) خانه (HomeView): ردیف استوری «همین حالا زنده» (حلقهٔ conic برند + نشان زنده)؛ گرید دوسطحی LiveGridCard ۴:۵ با عکس تمام‌کارت/گرادیان پایین/بید+تایمر؛ چیپ‌های ۱۱px با snap؛ کارت‌های به‌زودی با عکس واقعی (photo prop به ShowCard/GradientCover — افزودنی)
- ج) عمومی: SmartImg (اسکلت پالس‌دار + fade ۳۰۰ms)؛ SellerAvatar؛ کنتراست خاکستری‌ها /45-50→/55-65؛ CHAT_FADE ۸۰۰→۴۰۰ms؛ ls-bid-pop keyframe جدید در globals.css (تنها افزودنی)
- رسانه: ۱۹ عکس واقعی با z-ai image تولید شد (۱۰ دسته، ۵ آواتار s2-s6، ۴ کالا) → media.ts گسترش (SHOW_PHOTO/CATEGORY_PHOTO کامل). نکته: فراخوانی موازی z-ai → 429؛ ترتیبی با ریترای شد
- تأیید مرورگری ۳۹۰×۸۴۴ (agent-browser): خانه/لایو/شیت بید/سفارش‌ها ✓؛ خط زرد بید با بید ربات‌ها (بید شخصی به‌دلیل موجودی دموی ۲.۵M < ۵M ممکن نشد — همان مسیر کد pushChat) ✓؛ کلاس پالس روی قیمت ✓؛ فونت‌سایز تایمر ۱۸px ✓؛ nextjs-portal فقط STYLE نامرئی ✓؛ بدون خطای کنسول؛ lint تمیز
- بید اول شخص به ۵٬۰۰۰٬۰۰۰ خطای «موجودی کافی نیست» داد و اعتبارسنجی شیت را هم تأیید کرد (رفتار درست)
- اسکرین‌شات‌های موبایل جایگزین شد: home / live-room / live-room-bid-sheet-open / orders (دسکتاپ دست نخورد)
- CHANGELOG.md ورودی v1.3.2 + آرشیو download/liveshop-v1.3.2.zip (۹.۵MB/۲۶۴ فایل — بدون node_modules/.next/.git/skills/upload/zips/.env)
- commit «feat: v1.3.2 ui polish — …» (c4e550f، ۳۱ فایل) + push موفق به main؛ ls-remote == HEAD لوکال
- نکتهٔ امنیتی: تطبیق «github_pat_» در کامیت خودکار worklog فقط کلمهٔ الگو در متن گزارش بود، نه توکن (ریجکس توکن کامل → خالی)

Stage Summary:
- v1.3.2 منتشر شد: https://github.com/amirkinggg4-dot/liveshop/commit/c4e550f84c41408fa15d2da5b5b0bf6da4cc9c7a
- موارد حفظ‌شده (از قبل بود): حداکثر ۴ پیام/محو ۶ث، «تو پیشتی!» سبز، دکمهٔ آمار فقط برای صاحب شو، safe-area تب‌بار
- صادقانه: چند عکس به‌ازای هر دسته نه — ۱ عکس برای هر ۱۰ دسته؛ وضعیت «شرط کالا» از خط ریز داک برداشته شد (در صفحهٔ محصول هست)؛ LiveBidBar حذف شد چون اطلاعات‌اش داخل LiveGridCard آمد (جابه‌جایی نه حذف قابلیت)؛ انیمیشن‌های محیطی بی‌پایان (ken-burns/pulse) طبق طراحی قبلی ماندند

---
Task ID: 9 (v1.4)
Agent: main (Z.ai Code)
Task: تبدیل پروژه از «حراج زنده» به «لایو شاپ با قیمت ثابت» — خاموش‌کردن حراج با کلید AUCTION_ENABLED (نه پاک‌کردن)، خرید سریع امانی، موجودی اتمیک، پین کالای در حال نمایش، سفارش‌های امانی، لیستینگ/انبار/ساخت شو فروشنده، mock کفش و استریت‌ویر، نسخه v1.4 + اسکرین‌شات‌ها + push

Work Log:
- کلید جدید src/lib/config.ts: AUCTION_ENABLED=false + APP_VERSION=v1.4 + آستانه موجودی کم؛ gating در ۱۴ فایل UI (LiveView، ShopTab، ProductView، CheckoutView، ExploreView، ActivityView، SellerLiveDashboard، SellerCreateListingView، SellerInventoryView، SellerScheduleView، ProfileView، shared، WinView/FinishedModal و...)
- data: types.ts (+price/stock/variants/weightGrams/dims به ShopItem، +qty/variantLabel/escrow به Order)؛ items.ts بازنویسی (کفش و استریت‌ویر: دنک پاندا/سامبا/جردن ۱/NB۵۳۰/آسیکس/کانورس + هودی/تیشرت/جوراب/کوله با قیمت واقعی تومان و موجودی و سایزهای ۴۱-۴۳؛ گیاه/کارت ماندند؛ getPinnedItem و stockLabelFa جدید)؛ shows.ts (تگ‌ها «قیمت ثابت»، بایوها)؛ chat.ts (پیام خریدمحور)؛ orders.ts (تایم‌لاین امانی escrowTimeline ۵ مرحله‌ای)
- live-store: pinnedItemId/pinItem (تعویض کالای در حال نمایش + پیام چت «کالای جدید: …»)؛ purchaseItem اتمیک (چک موجودی → چک کیف پول → کاهش کالا+گزینه → چت «X ✅ خرید کرد» → کسر امانی + سفارش) با کامنت مسیر API سمت سرور؛ tick در حالت ثابت = خرید گاه‌به‌گاه ربات‌ها (۱ خرید/~۲۰ث میانگین)؛ موتور مزایده کامل حفظ شد
- UI جدید: quick-checkout-sheet.tsx (سایز/رنگ با موجودی، تعداد تا سقف، آدرس، ارسال ۳روش، جمع کل، کیف پول + شارژ، بنر امانی، کانفتی + «خرید شما ثبت شد»؛ انتخاب گزینه derived — اگر گزینه تمام شود خودکار می‌رود روی موجود)؛ ProductDock دو حالته (ثابت/مزایده) با پیل «کالای در حال نمایش» + انیمیشن تعویض + «تمام شد» غیرفعال؛ ShopTab بازنویسی (عکس/قیمت/موجودی/خرید، پین بالا برجسته، خرید داخل شیت)؛ تب «کالاها» در داشبورد فروشنده با دکمه پین
- سفارش‌ها: OrderDetail بنر «پول شما نزد لحظه امانت است» + تایم‌لاین ۵مرحله‌ای + ردیف تعداد/سایز؛ SellerOrders بنر «پول بعد از تحویل آزاد می‌شود»؛ CheckoutView از مسیر واحد purchaseItem
- فروشنده: لیستینگ (قیمت ثابت + موجودی + افزودن/حذف گزینه‌های سایز/رنگ با موجودی جدا + وزن/ابعاد؛ فیلدهای مزایده پشت کلید)؛ انبار (فیلتر موجود/در شو/تمام‌شده/پیش‌نویس + شمارنده‌ها + موجودی ردیف + قفل)؛ ساخت شو (بخش «ترتیب کالاها در شو» با فلش بالا/پایین و پین‌شدن کالای اول)
- خانه/کاوش: LiveGridCard قیمت ثابت پین‌شده + چیپ «۳ عدد مانده» (کهربایی زیر ۳)؛ StatusChip حالت ثابت («قیمت ثابت»/«در صف شو»)؛ بنر «چطور کار میکنه؟» و AppShell subtitle جدید؛ layout title/description
- باگ یافت‌شده در E2E و رفع: انتخاب سایز وقتی ربات‌ها همان سایز را می‌خریدند stale می‌شد → بازنویسی با useMemo derived (بدون setState در effect؛ رفع خط lint react-hooks/set-state-in-effect)
- رسانه: ۱۳ اسکرین‌شات موبایل ۳۹۰ بازگرفته/جدید (home، live-room، shop-sheet، quick-checkout، orders، order-detail، checkout، product، explore، activity، seller-listing/inventory/schedule/orders/live-dashboard)؛ ۲ اسکرین‌شات شیت بید (که دیگر دیده نمی‌شود) حذف شد
- verify: lint ✓ tsc (src) ✓ dev.log بدون خطا ✓ مرورگر ۳۹۰: خانه/لایو/شیت خرید/خطای موجودی/خرید موفق+کانفتی+چت+کاهش موجودی/Shop/پین داشبورد/سفارش امانی/انبار/لیستینگ/کاوش بدون پیش‌بید/فعالیت بدون تب بید/خرید ربات تا «تمام شد» ✓ بدون خطای کنسول
- docs: CHANGELOG.md ورودی کامل v1.4، STRUCTURE.md بازنویسی (کلید config + فایل‌های جدید + وضعیت اسکرین‌شات‌ها)، README (عنوان/نسخه/جدول ویوها/بخش «چطور کار می‌کند»)؛ worklog این بخش

Stage Summary:
- v1.4 کامل: پروژه «لایو شاپ با قیمت ثابت» شد و هیچ قابلیتی حذف نشد — کل موتور حراج پشت AUCTION_ENABLED=false زنده و قابل بازگشت است (استورها کامپایل می‌مانند)
- جریان خرید: پین فروشنده → کارت همه با انیمیشن+چت → خرید سریع → کسر امانی → سفارش ۵مرحله‌ای → بنر امانت دو طرف؛ موجودی اتمیک در purchaseItem (آماده اتصال به API)
- صادقانه: ۱) خرید از ShopTab/ProductView گاهی به شیت خرید سریع می‌رود گاهی به CheckoutView (مسیر محصول → صفحه تسویه حفظ شد) ۲) اتصال واقعی purchaseItem به API سمت سرور هنوز mock است (فقط ساختار آماده) ۳) اسکرین‌شات‌های دسکتاپ از v1.3 مانده‌اند (فقط موبایل ۳۹۰ مطابق درخواست بازگرفته شد) ۴) WinView و پیش‌بید فقط پنهان‌اند؛ تست بازگشت با AUCTION_ENABLED=true در این نسخه اجرا نشد (فقط کامپایل) ۵) موجودی کیف پول دمو در طول تست E2E شارژهای آزمایشی خورد (mock است و با رفرش صفحه به seed برنمی‌گردد)

---
Task ID: 10 (v1.4.1)
Agent: main (Z.ai Code)
Task: فقط اصلاحات ظاهری — برچسب تکراری «قیمت ثابت»، شیت خرید سریع (سایز ۴۸px/موجودی زیر دکمه/فوتر چسبان)، اسکرین‌شات واقعی خانه، دسته‌بندی‌های یکدست بدون ایموجی، تأیید آمار-فقط-صاحب-شو، بررسی ویدیوی فروشنده؛ نسخه v1.4.1 + اسکرین‌شات‌ها + push. منطق/استور/دیتای mock دست نخورد.

Work Log:
- برچسب «قیمت ثابت» از کارت پایین ProductDock حذف شد + چیپ تگ شو (که «قیمت ثابت» بود) هم از کارت پایین برداشته شد؛ در عنوان شیت خرید سریع هم حذف شد → برچسب فقط روی کارت‌های شیت Shop (چیپ سبز StatusChip) می‌ماند
- quick-checkout-sheet: دکمه‌های سایز min-h-12/min-w-12 (≥۴۸px)؛ موجودی هر گزینه زیر دکمه («۲ عدد»/«تمام شد» — کهربایی زیر ۳)؛ بازچینی Drawer به h-[85vh] با سه ناحیه: هدر ثابت / محتوای overflow-y-auto / فوتر چسبان «پرداخت» با safe-area
- shared.tsx: CategoryIcon (نقشهٔ lucide یکدست ۱۰ دسته: Footprints/Sprout/Layers/Headphones/Shirt/Gem/Home/Puzzle/BookOpen/Palette) + CategoryTile (کاشی عکس ۷۶px از CATEGORY_PHOTO موجود، بدون تغییر دیتا)؛ home و explore هر دو ردیف افقی اسکرولی شدند (explore دیگر گرید ایموجی بزرگ ندارد؛ زیرنویس «N شو زنده» + حالت فعال)؛ SellerScheduleView چیپ‌ها children-محور شدند با CategoryIcon
- LiveGridCard خانه از قبل منطبق مشخصات کاربر بود (۴:۵/عکس تمام‌کارت/زنده+بیننده/گرادیان/نام/فروشنده/قیمت پین‌شده) — فقط تأیید و تصویربرداری
- «آمار» ریل: از قبل gated با MY_SELLER_ID بود — در مرورگر تأیید شد: در sh1 (s1) دیده می‌شود، در sh2 (s2) غایب است
- ویدیوی فروشنده: Glob روی public/*.{mp4,webm,mov,ogg,m4v} → خالی؛ طبق شرط کاربر عکس ثابت + ken-burns ماند و موضوع صادقانه گزارش شد
- verify: tsc (src) ✓ lint ✓ dev.log بدون خطا ✓ مرورگر ۳۹۰: خانه/لایو/Shop/خرید سریع (انتخاب سایز→۴۱ تمام شد خودکار به ۴۲ رفت)؛ اسکرول شیت (sh=795/ch=521) با فوتر چسبان (top=780/vh=844)؛ شارژ کیف پول دمو از UI (۲M+۲.۵M) برای حالت سبز «پرداخت ۶٬۵۷۰٬۰۰۰»؛ بدون خطای کنسول (فقط هشدار LCP Next)
- اسکرین‌شات موبایل ۳۹۰: home (این‌بار واقعی — قبلی کاوش بود!)، live-room، shop-sheet، quick-checkout، explore → docs/screenshots؛ حذف ۲ فایل leftover شیت بید (حراج پنهان)
- docs: CHANGELOG [v1.4.1] کامل، STRUCTURE.md (سربرگ + بخش اسکرین‌شات)، README (نسخه)؛ config.ts APP_VERSION=v1.4.1؛ package.json 0.2.2

Stage Summary:
- v1.4.1 = فقط ظاهر: ۶ مورد درخواستی کاربر اعمال/تأیید شد؛ هیچ استور/منطق/دیتایی تغییر نکرد (categories.ts با ایموجی سرجایش است)
- «قیمت ثابت» حالا دقیقاً یک جاست: کارت‌های شیت Shop
- صادقانه: ۱) ویدیوی حلقه‌ای فروشنده انجام نشد چون فایل ویدیوی نمونه در public/ نیست (شرط کاربر) — عکس ثابت ماند ۲) اسکرین‌شات‌های دسکتاپ هنوز از v1.3 هستند (خارج از درخواست) ۳) موجودی/کیف پول دمو در جریان تست تغییر کرد (mock، با رفرش به seed برنمی‌گردد) ۴) کیف پول برای اسکرین‌شات سبز از UI شارژ شد

---
Task ID: 11 (backend-phase-1)
Agent: main (Z.ai Code)
Task: فقط مرحلهٔ ۱ بک‌اند — PostgreSQL واقعی، ورود با OTP و API کالا/شو (بخش‌های ۱ و ۲ قرارداد api-spec.md)؛ بدون دست‌زدن به UI. کاربر کد را پس از push می‌خواند.

Work Log:
- وضعیت گیت: main لوکال = dc0ca3e (v1.4.1) و ls-remote نشان داد remote هم همان است (only tracking ref stale بود)؛ چیزی برای push قبلی نمانده بود.
- دو فایل آپلودی کاربر خوانده شد: upload/api-spec.md (قرارداد v0.1 — پایهٔ /api/v1، Bearer JWT ۱۵دقیقه+refresh، خطاها {error:{code,message}} فارسی) و upload/schema.prisma (اسکیمای هدف PostgreSQL).
- دیتابیس: Postgres در سندباکس نصب نبود و پروسه‌های spawn از tool calls بین فراخوانی‌ها کشته می‌شوند (تست کنترل‌شده با sleep تأیید شد) → بستهٔ embedded-postgres@17.10 (PostgreSQL 17.10 واقعی) + scripts/dev-postgres.ts (idempotent؛ cluster در db/postgres/، gitignored). نکتهٔ سندباکس: DATABASE_URL قدیمی sqlite در env صادر می‌شود و بر .env اولویت دارد → همهٔ عملیات CLI/سرور با override درون‌خطی.
- اسکیما: فایل کاربر عیناً ملاک شد + ۴ افزودن مستندشده: RefreshToken (چرخش §1)، OtpCode.requestIp (rate per-IP §1)، SellerProfile.avatarUrl (ویترین)، Show.createdAt (keyset cursor فید /shows — مدل Show createdAt نداشت). قیود raw-SQL اسپک (stock_nonneg CHECK + one_pinned_per_show partial unique index) به انتهای migration اول append شد و migrate reset/dev دوباره اجرا شد.
- کتابخانه‌های سرور در src/lib/server: http.ts (ApiError + قرارداد خطا + handle wrapper + zod parseBody)، auth.ts (jose HS256، access ۱۵دقیقه، refresh ۳۰روزه هش‌شده، rotateSession با تشخیص reuse و باطل‌سازی کل خانواده، requireUser/getOptionalUser، walletBalance از SUM(LedgerEntry))، otp.ts (نرمال‌سازی 09/+98/0098، هش HMAC، TTL ۲دقیقه، ۵ تلاش، یک‌بارمصرف، rate 3/10min per phone و per IP، ارسال Kavenegar یا کنسول+devCode)، shows.ts (include و سریالایز کارت شو با قیمت/موجودی پین).
- مسیرها (۱۰ فایل در src/app/api/v1): auth/otp/request، auth/otp/verify، auth/refresh، me (GET/PATCH)، categories، shows (فیلتر status/category + cursor keyset + limit)، shows/[id]، sellers/[idOrSlug] (storefront؛ fallback id)، sellers/[idOrSlug]/follow (POST/DELETE + CANNOT_FOLLOW_SELF)، search؛ و بازنویسی /api به health با ping دیتابیس. باگ مسیر Next: [slug] و [id] هم‌سطح مجاز نیستند → یکسان‌سازی به [idOrSlug].
- باگ منطقی که در تست خودش را نشان داد: deleteMany سراسری phone در requestOtp شمارندهٔ rate را صفر می‌کرد → حذف شد (فقط ردیف‌های منقضی پاک می‌شوند؛ verify فقط ردیف همان کد را می‌سوزاند) تا «۳ درخواست در پنجره» واقعاً برقرار باشد.
- seed (prisma/seed.ts + bun run db:seed): TRUNCATE همهٔ جدول‌ها + همان دنیای mock اپ: ۱۰ دسته، ۵ فروشندهٔ APPROVED (سینا/مینا/کلکسیون‌یار/گجت‌بازار/عطر و نگین با عکس‌های public/liveshop)، ۱۰ کالا با ۲۸ واریانت سایز (دانک پاندا/سامبا/جردن ۱/NB۵۳۰/مونسترا/فیکوس/کارت پیکاچو/فیگور/هدفون/عود)، ۳ شو LIVE + ۱ SCHEDULED + ۱ ENDED هرکدام با یک پین، خریدار دمو 09121234567 با کیف پول ۵٬۰۰۰٬۰۰۰ (دو ردیف Ledger با txnId مشترک جمعاً صفر).
- تست E2E (اسکریپت fetch خارج از ریپو در ~/tmp-tests — هیچ تستی commit نشد): ۲۹/۲۹ پاس شامل devCode، کد غلط→INVALID_OTP، verify→tokens، me+wallet، patch نام، چرخش refresh، reuse→401 INVALID_REFRESH_TOKEN، ابطال خانواده، 3+1 rate (per phone) و per-IP، categories، shows LIVE/SCHEDULED+category، cursor pagination، جزئیات شو، storefront، follow/unfollow/401، جستجوی فارسی، ۴ قرارداد خطا. نکته: پنجرهٔ rate در DB ماندگار است → re-seed قبل از هر run.
- رگرسیون UI: git status فقط فایل‌های بک‌اند (هیچ فایل components/store/data/format/config/page/layout/globals) + تأیید مرورگری ۳۹۰×۸۴۴ که خانه با همان استورهای mock کامل رندر می‌شود و کنسول تمیز است.
- tsc پاک (فقط خطاهای vendored examples/skills قدیمی خارج از محدوده) و lint پاک.
- مستندات: docs/api-spec.md (کپی قرارداد کاربر)، docs/BACKEND.md (راه‌اندازی postgres/deploy/seed، جریان OTP، نمونه‌ها، امنیت، لیست افزوده‌های اسکیما با دلیل)، README بخش «بک‌اند»، CHANGELOG ورودی [backend-phase-1] (سرفصل v1.4.1 در جایگزینی حذف شده بود که فوراً بازگردانده شد).

Stage Summary:
- مرحلهٔ ۱ کامل شد و push شد: Postgres واقعی (17.10) + migration با قیود بیزینسی + OTP login با تمام قیود اسپک + Discovery API کالا/شو با کارت «قیمت+موجودی کالای پین‌شده» — UI صفر درصد تغییر کرد.
- تصمیم‌های مهم برای مرحلهٔ ۲: بخش ۴ (چک‌اوت) روی همین Account/Ledger و CHECK stock می‌نشیند؛ بخش ۳ (اتاق لایو) روی show:{id} socket؛ devCode فقط وقتی KAVENEGAR_API_KEY خالی است؛ refreshها هش‌شده و family-revocable.
- نکات سندباکس برای ایجنت‌های بعدی: پروسه‌های طولانی بین tool calls زنده نمی‌مانند (mega-call لازم)؛ DATABASE_URL صادرشده باید inline override شود؛ Postgres cluster در db/postgres/ (gitignored) ماندگار است.

---
Task ID: 12 (security-hardening v1.5.1)
Agent: main (Z.ai Code)
Task: فقط شش ایراد امنیتی src/lib/server اصلاح شود (devCode، اتمیک‌شدن attempts، پاک‌سازی بر اساس پنجرهٔ نرخ، getAuthSecret واحد، اتمیک‌کردن rotateSession، clientIp + TRUSTED_PROXY + بازنویسی XFF در Caddyfile) + برای هر مورد تست fail-before/pass-after + تست/tsc/lint + نسخهٔ v1.5.1 + push. UI و بقیه دست‌نخورده.

Work Log:
- ۱۷ تست امنیتی در src/lib/server/__tests__ (bun test) نوشته شد و هر ۷ تست تفکیک‌کننده «قبل از اصلاح» با git stash واقعاً شکست خوردند و «بعد از اصلاح» پاس شدند: ۱۰۰ verify هم‌زمان با کد غلط (دقیقاً ۵ INVALID و ۹۵ TOO_MANY و کد درست هم بعدش رد)، ۴ درخواست کد با فاصلهٔ ۳ دقیقهٔ شبیه‌سازی‌شده در پنجرهٔ ۱۰ دقیقه (چهارمی بلاک، بعد از ۱۱ دقیقه آزاد + پاک‌سازی by createdAt)، دو refresh هم‌زمان با یک توکن (فقط یکی)، production بدون کلید پیامک (OTP_DELIVERY_FAILED و صفر ردیف در DB)، secret خالی/<۳۲/تغییر-secret، جعل x-forwarded-for بدون TRUSTED_PROXY؛ بقیه regression guard (per-IP، family-kill، expired، devCode dev، TRUSTED_PROXY=true)
- اصلاحات: secret.ts جدید (getAuthSecret ≥۳۲ کاراکتر، بدون fallback خالی؛ hashCode/hashToken/secretKey همه از آن)؛ otp.ts (guard fail-closed production-بدون-کلید قبل از هر نوشتنی، حذف ردیف فقط createdAt < window، claim اتمیک attempts با updateMany شرطی، deleteMany idempotent با codeHash)؛ auth.ts (rotateSession با updateMany شرطی id+revokedAt:null+expiresAt>now — count!==1 مثل reuse: ابطال کل نشست‌ها + INVALID_REFRESH_TOKEN)؛ http.ts (clientIp فقط با TRUSTED_PROXY=true از x-forwarded-for، وگرنه x-real-ip/local)
- Caddyfile: کامنت قرارداد «بازنویسی نه append» (header_up X-Forwarded-For {remote_host} از قبل set می‌کرد — الان مستند شده)؛ .env: TRUSTED_PROXY="true" (این دیپلوی همیشه پشت Caddy است)؛ .env.example مستند کامل؛ README بخش «IP کاربر و TRUSTED_PROXY» + بخش تست‌ها + نسخه؛ docs/BACKEND.md جدول شش اصلاح + توضیح تست‌ها؛ CHANGELOG [v1.5.1]؛ config.ts APP_VERSION و package.json version = v1.5.1
- زیرساخت تست: scripts/test-server.sh + bun run test:server — Postgres embedded را در صورت نیاز بالا می‌آورد، اسکیمای جداگانهٔ liveshop_test را (CREATE SCHEMA + prisma db push) sync می‌کند و bun test را با AUTH_SECRET تستی اجرا می‌کند؛ دیتای dev/seed دست‌نخورده
- تأیید زندهٔ fix 6: سرور با .env جدید ری‌استارت شد؛ curl با x-forwarded-for جعلی ۶.۶.۶.۶ از در گیت‌وی (:81) → requestIp ذخیره‌شده = 127.0.0.1 (اثبات بازنویسیِ Caddy، نه append) و curl مستقیم به :3000 با همان هدر → 6.6.6.6 (همان caveat مستندشده در README)؛ ردیف‌های تست پاک شدند
- verify: ۱۷/۱۷ پاس ✓؛ tsc فقط ۴ خطای قدیمی vendored (examples/skills — خارج از محدوده، در فاز ۱ هم بود) و صفر خطای پروژه ✓؛ lint پاک ✓؛ dev.log بدون خطا ✓؛ مرورگر ۳۹۰×۸۴۴: خانه کامل رندر (کیف پول/سلام علی/زنده/۱۰ دسته/شوهای داغ) و کنسول بدون خطا ✓ — هیچ فایل UI در git status نیست
- نکتهٔ دیباگ برای ایجنت‌های بعدی: ۱) «await x?.y» === «await (x?.y)» است و روی Promise مقدار undefined می‌دهد (باگ تست خط ۷۷ بود نه کد اپ!) ۲) setSystemTime فقط ساعت JS را mock می‌کند و createdAt/expiresAt را DB می‌نویسد → شبیه‌سازی زمان تست‌ها با شیفت SQL هر دو ستون انجام شد ۳) پروسه‌های nohup بین tool calls زنده نمی‌مانند → ری‌استارت + curl باید در یک فراخوانی باشد ۴) bun -e با require کار می‌کند، import ESM در -e نه

Stage Summary:
- v1.5.1 کامل و push شد: هر ۶ مورد امنیتی با تست fail-before/pass-after پوشش داده شد؛ کلاینت دیگر نمی‌تواند با هدر جعلی محدودیت per-IP را دور بزند، ۱۰۰ حدس مواز دیگر از سقف ۵ تلاش عبور نمی‌کند، حذف ردیف‌ها شمارندهٔ نرخ را صفر نمی‌کند، secret خالی/ضعیف به‌جای کلید تهی خطای بلند می‌دهد، مسابقهٔ refresh فقط یک برنده دارد و production بدون سرویس پیامک به‌جای لو دادن کد fail-closed می‌شود
- صادقانه تست‌نشده: ارسال واقعی SMS کاوه‌نگار (کلید واقعی نداریم — فقط مسیر نبودِ کلید/خطای provider)، کلاینت بیرونی واقعی از اینترنت (تست پراکسی با curl داخل سندباکس بود)، سرانس تایمینگ مقایسهٔ fixedTimeEqual به‌صورت آماری، و تست E2E UI روی مسیر ورود (فاز ۱ UI را به API وصل نکرده — طبق محدودهٔ کاربر)

---
Task ID: docs-shots-v1.5.1
Agent: Z.ai Code (main)
Task: full screenshot set for v1.5.1 — only docs/screenshots + INDEX.md; zero code changes (UI & backend untouched)

Work Log:
- verified git state: local HEAD = origin/main = 25415ad (v1.5.1); re-seeded Postgres demo data
- recon: app is single-route SPA (zustand stack views), mock data in src/lib/data, wallet seed 2,500,000 Toman, chat TTL 6s, no localStorage persistence → fresh page load = fresh state
- two Explore agents produced full interaction recipes for buyer + seller views
- built Playwright runner (/home/z/shots-runner/runner.mjs, outside repo) with 120 shot definitions × 2 devices (mobile 390×844@2x, desktop 1280×800), per-shot verify strings + active-tab assertions + min-size checks; dev indicator hidden in capture env (nextjs-portal display:none via init script; project already had devIndicators:false)
- fixed 10+ selector issues (aria-labels override visible text, chips role=tab vs button, wallet pill absent in live room, second topup must run from wallet page, drain race with bot purchases, confetti unmounts with closing drawer)
- captured 240 PNGs (120 states × 2 devices), 44 fullPage; deleted 52 old v1.4 screenshots (git rm), 2 old names (seller-ready-room-*) overwritten in place by fresh captures
- built docs/screenshots/INDEX.md: 240-row table (file/page/state/size), 12-item honest "uncovered" list, old→new replacement mapping, visual observations (latin digits in live dock price, sticky-header fullPage artifact, invisible quick-checkout confetti)
- visual spot-checks via image reads: live-room sold-out dock, confetti giveaway, checkout view, order timeline stage 3, followed tab, rates calculator, raid confirm, topup success, hub full — all match their filenames

Stage Summary:
- docs/screenshots now holds exactly the v1.5.1 set: 240 files + INDEX.md; no app code changed
- known UI observations recorded in INDEX: quick-checkout success confetti is rendered inside the closing drawer (effectively invisible), latin digits in live-room dock price, buyer settings/addresses rows are toast-only
- still unreachable without code changes: order timeline stages 4-5, buyer rating dialog, auction UI (gated off), true offline UI

---
Task ID: v1.6.1-home
Agent: Z.ai Code (main)
Task: بازطراحی فقط بخش «خانه» (HomeView و کامپوننت‌های خودش) — ۹ خواستهٔ کاربر + اسکرین‌شات‌های ۹ حالت × موبایل/دسکتاپ + نسخه v1.6.1 + commit/push

Work Log:
- recon: HomeView قبلی مستقیم به LIVE_SHOWS وصل بود؛ LiveGridCard فقط در خانه استفاده می‌شود (بازسازی آزاد)؛ SectionTitle/EmptyState/CategoryTile مشترک‌اند (فقط پراپ افزودنی)؛ React Query از قبل نصب؛ API v1 ‏(shows/categories) با serializer ‏showCard موجود
- data layer: ‏src/hooks/useLiveShows.ts (useInfiniteQuery + cursor pagination، mock برش صفحه‌ای ۴تایی با تأخیر ۳۵۰ms، مسیر API با NEXT_PUBLIC_USE_API=true → GET /shows?status=LIVE) و useCategories.ts (useQuery، مپ nameFa→label/liveShowCount→liveCount) — نوع خروجی هر دو حالت یکی (Show[]/Category[])؛ فیلدهای اختیاری Show در types.ts (sellerName/sellerAvatar/sellerVerified/pinnedPrice/pinnedStock/photoUrl)؛ Providers (QueryClientProvider) در page.tsx
- تست: src/hooks/__tests__/home-api-mapping.test.ts — ۸ تست bun (نمونهٔ seed API → تایپ UI بدون خطا، null-safe، صفحه‌بندی cursor mock، cursor نامعتبر) — همه پاس
- shared.tsx: LiveGridCard بازطراحی (عنوان line-clamp-2، قیمت ردیف جدا همیشه کامل بدون truncate، نشان موجودی ردیف زیر قیمت، اسم فروشنده می‌شکند نه «…»، پشتیبانی کاور/آواتار خارجی API با img ساده)؛ SectionTitle/EmptyState پراپ lucide اختیاری (مسیر ایموجی بقیهٔ نماهها حفظ)؛ CategoryTile پراپ icon + fallback LayoutGrid
- HomeView: نوار بالا (جستجو → کاوش با فوکوس، زنگ با شمارندهٔ ناخوانده از inbox-store)، کاشی «همه» + دسته‌ها → explore-intent-store (state/param مشترک)، کارت به‌زودی (حذف برچسب «قیمت ثابت» و «خرید فوری» و startsAtLabel، شمارش نسبی «۲ ساعت دیگر»، snap-x با کارت ۸۰٪ عرض، لمس → شیت پیش‌نمایش با کاور/فروشنده/کالاهای برنامه‌ریزی‌شده با قیمت/یادآوری)، حالت‌ها (skeleton استوری+دسته+گرید، خطا + تلاش دوباره، آفلاین navigator.onLine، «الان لایوی نیست» + پیشنهاد به‌زودی‌ها) با کلید ?state=loading|error|empty، ایموجی‌ها → lucide (Radio/Flame/Clock/Sparkles/Hand/UserRoundPlus...)، بنر «چطور کار می‌کنه؟» با بستن + localStorage (try/catch)
- نکتهٔ فنی مهم: قانون lint جدید react-hooks/set-state-in-effect سه setState داخل effect را رد کرد → هر سه منبع بیرونی (کلید ?state=، dismissed بنر، navigator.onLine) به useSyncExternalStore مهاجرت کردند؛ باگ subscribe بنر (ثبت‌نشدن listener) در همین راه پیدا و رفع شد
- hydration mismatch شمارش نسبی (محاسبهٔ زمان در load ماژول سرور ↔ کلاینت) با الگوی useMounted (useSyncExternalStore) رفع شد — لیبل نسبی فقط بعد از mount؛ افست‌های ساعت ثابت (۲/۴۵/۷۸) تا لیبل مستقل از ساعت اجرا باشد
- ExploreView: فقط مصرف نیت (۲۰ خط افزودنی — دستهٔ از پیش انتخاب‌شده + فوکوس ورودی جستجو)
- اسکرین‌شات: رانر Playwright خارج از ریپو (home-shots-v161.mjs) — ۹ وضعیت × ۲ اندازه، قبل از هر ذخیره assert متن/موقعیت، بعد از آن hash-جدا بودن هر ۱۸ فایل + حداقل حجم؛ ۳ دور اصلاح قاب (upcoming آخرین سکشن است و با لود صفحهٔ ۲ جابه‌جا می‌شود → صبر برای «همهٔ لایوها را دیدی» + re-scroll + اسکرول افقی ردیف به کارت دوم برای تمایز از bottom)؛ بازبینی چشمی ۱۰+ عکس
- docs: ۸ عکس کهنهٔ home-* حذف، ۶ نام هم‌نام بازنویسی شدند، INDEX.md (جدول ۱۸ ردیفهٔ v1.6.1 + نگاشت قدیم→جدید + نکته‌های صادقانه)؛ CHANGELOG [v1.6.1]؛ config.ts APP_VERSION + package.json = 1.6.1
- verify نهایی: lint پاک، tsc فقط ۴ خطای قدیمی vendored خارج از src، ۸/۸ تست پاس، smoke تست مرورگر ۲۱/۲۱ پاس با صفر خطای کنسول، dev.log تمیز

Stage Summary:
- v1.6.1 کامل: هر ۹ خواسته پیاده شد؛ خانه دیگر به LIVE_SHOWS وصل نیست (useLiveShows/useCategories با cursor pagination)؛ هیچ صفحهٔ دیگری بازطراحی نشد (فقط مصرف نیت در کاوش + پراپ‌های اختیاری مشترک)
- صادقانه: شمارش نسبی از mock می‌آید (نه scheduledAt واقعی)؛ در حالت API واقعی isFollowing=false و کاور/آواتار به URL واقعی وابسته‌اند (fallback دارد)؛ SoonBadge کاور به‌زودی‌ها همچنان ایموجی 🕒 دارد (کامپوننت مشترک با کاوش — خارج از محدوده)؛ در ?state=error|empty سربرگ تعداد واقعی دیتای mock را نشان می‌دهد؛ حالت API=true فقط با تست mapper پوشش داده شد (نه E2E با دیتابیس پر)؛ عکس‌ها روی dev server گرفته شدند (نه build)

---
Task ID: v1.6.2-explore-redesign
Agent: Z.ai Code (main)
Task: دو بخش — الف) اصلاح‌های کوچک خانه (بنر «چطور کار می‌کنه؟» یک‌خطی با شیت، SoonBadge لوسید، سربرگ صادق در ?state=error|empty) ب) بازطراحی کامل «کاوش» (کارت‌های خانه، تب‌های جستجو، فیلتر/مرتب‌سازی، جستجوهای اخیر، حالت‌ها، hookهای React Query) + ۲۴ اسکرین‌شات + تست + v1.6.2 + push

Work Log:
- شروع: git در 979c72d (v1.6.1 محلی، هنوز push نشده بود)؛ recon کامل HomeView/ExploreView/shared/hooks/api-spec §2/route‌های API
- الف-خانه: ‏HowItWorksBanner → نوار یک‌خطی فشرده (Sparkles + «چطور کار می‌کنه؟» + «بیشتر بدانید» + ✕) با HowItWorksSheet جدید (گام‌ها + توضیح امانی + «متوجهم»/«دیگر نشان نده») — dismiss دائمی همان localStorage try/catch؛ سربرگ در error/empty متن جایگزین («الان نمی‌توانیم لایوها را نشان دهیم» / «فعلاً لایوی در جریان نیست»)؛ استورهای ?state=/online/useMounted به lib/forced-state.ts مشترک منتقل شد
- SoonBadge (shared.tsx): 🕒 → Clock لوسید؛ ShowCard: اسم فروشنده دیگر truncate نیست (break-words + فونت ریزتر)؛ CategoryTile: عنوان تا ۲ خط بدون «…» (max-h-8 overflow-hidden)؛ saved-searches: 🔎 → Search
- استخراج UpcomingShowCard + UpcomingFooter + ReminderToggle به views/home/upcoming-card.tsx (شمارش نسبی + یادآوری + پیش‌بید اختیاری) — خانه و کاوش هر دو همین را مصرف می‌کنند؛ خانه در v1.6.1 با ShowCard inline بود، حالا مشترک
- ب-کاوش (بازنویسی کامل ExploreView + اجزای views/explore/*): نوار ابزار (فیلتر با نشان تعداد + مرتب‌سازی با نام فعال + سوییچ «فقط لایوها»)، چیپ‌های فیلتر فعال قابل‌حذف، تیتر ثابت «فهرست شوها»، تب‌های جستجو شوها/کالاها/فروشندگان با شمارش، کارت کالا با «در لایوی فلان» (openShow)، ردیف فروشنده با BadgeCheck، پرطرفدارها، EmptyStateهای Moon/SearchX لوسید، skeleton/error/آفلاین با ?state=، شیت فیلتر (قیمت از/تا، سایز، برند، نو/دست‌دوم، فقط زنده — اعمال/حذف همه) و شیت مرتب‌سازی (۴ گزینه با تیک) — فایل‌ها: explore/filters.ts، filter-sheet.tsx، sort-sheet.tsx، product-card.tsx، recent-searches.tsx
- لایهٔ داده: ‏hooks/useSearch.ts (mock با نرمال‌سازی فارسی + مسیر API ‏GET /search?q= + مپر apiSearchToUi) و hooks/useExploreShows.ts (mock LIVE+UPCOMING با فیلتر دسته + API دو درخواست موازی LIVE/SCHEDULED با category slug)؛ apiShowToUiShow در useLiveShows پارامتر وضعیت گرفت (LIVE→live، SCHEDULED→upcoming) + apiShowStatusToUi — نکته: ‏.map(apiShowToUiShow) با پارامتر دوم به index پارامتر می‌داد (tsc گرفت — wrap شد)
- src/lib/persian.ts: نرمال‌سازی ی/ي، ك/ك، ارقام فارسی/عربی→لاتین، حذف نیم‌فاصله/اعراب + faIncludes/faEquals — جستجو با «پوكمون» (ك عربی) و «۹.۵» (ارقام فارسی) کار می‌کند
- جستجوهای اخیر: localStorage try/catch + استور useSyncExternalStore — باگ مهم: getSnapshot که آرایهٔ نو می‌ساخت حلقهٔ بی‌نهایت رندر داد (Maximum update depth exceeded) → کش اسنپ‌شات + notify؛ اسکلت کاشی‌ها اسکرول افقی می‌داد → overflow-hidden؛ «پرطرفدارها»/«جستجوهای اخیر» فقط در uiState=ready (قاب error/skeleton تمیز)
- تست: ‏src/hooks/__tests__/explore-api-mapping.test.ts — ۱۵ تست (mapper /search با seed واقعی شامل SCHEDULED/ENDED، null-safety، نرمال‌سازی، searchMock، mock کاوش) — جمعاً ۲۳/۲۳ پاس با تست‌های خانه
- اسکرین‌شات: ‏shots-runner/explore-shots-v162.mjs — ۱۲ وضعیت × موبایل ۳۹۰/دسکتاپ ۱۲۸۰؛ هر عکس قبل از ذخیره assert محتوایی با نامش (تب فعال، متن کلیدی، وضعیت) و بعدش hash-جدا بودن هر ۲۴ فایل؛ دو اشکال رانر: ‏:has-text("نو") کانورس را می‌گرفت (تطبیق دقیق ^نو$ شد) و toast مرتب‌سازی قاب را می‌پوشاند (انتظار ۵ ثانیه)؛ ۱۸ عکس خانه هم با رانر v1.6.1 بازگرفته شد (بنر عوض شده بود) و ۱۶ عکس قدیمی کاوش (UI قبلی) git rm شد؛ بازبینی چشمی ۱۷ عکس
- docs: ‏INDEX.md (۲۴ ردیف جدید + نگاشت قدیم→جدید + نکته‌های صادقانه + حل‌شدن‌های v1.6.1)؛ CHANGELOG [v1.6.2]؛ config.ts APP_VERSION + package.json = 1.6.2
- verify نهایی: ۲۳/۲۳ تست ✓؛ lint پاک ✓؛ tsc صفر خطای پروژه (فقط vendored قدیمی) ✓؛ smoke مرورگری ۱۳ مرحله‌ای (تب‌ها، نرمال‌سازی، فیلتر/مرتب‌سازی، سه حالت ?state=، سوییچ فقط لایوها، سربرگ خانه در error/empty) همه پاس با صفر خطای کنسول ✓؛ dev.log تمیز ✓
- push: سه کامیت (086ffb5، 979c72d، 8a8f68c) با توکن inline و ‏-c credential.helper= پush شد؛ origin/main = 8a8f68c با ls-remote تأیید شد؛ توکن در هیچ فایل/کامیتی نیست (فقط دو اشارهٔ متنی به «الگوی github_pat_» در گزارش‌های اسکن قدیمی worklog — همان false-positive مستند قبلی)

Stage Summary:
- v1.6.2 کامل و push شد: هر ۳ خواستهٔ خانه و ۹ خواستهٔ کاوش پیاده شد؛ کاوش حالا از همان زبان بصری خانه استفاده می‌کند (LiveGridCard دوستونه + کارت به‌زودی مشترک + حالت‌ها و کلید ?state= یکسان)؛ لایهٔ دادهٔ کاوش مثل خانه React-Query با کلید NEXT_PUBLIC_USE_API (پیش‌فرض mock)
- صادقانه انجام‌نشده: نرمال‌سازی فارسی سمت سرور /search (فقط mock نرمال می‌کند)؛ «در لایوی فلان» و فیلتر سایز/وضعیت فقط در mock معنا دارند (پاسخ API فعلی showId/سایز/وضعیت کالا را برنمی‌گرداند)؛ مرتب‌سازی «تازه‌ترین» در mock ترتیب فهرست است؛ حالت آفلاین واقعی با قطع شبکهٔ مرورگر تست شد نه قطع سرور؛ حالت API=true فقط با تست mapper پوشش داده شد (E2E با دیتابیس پر نشد)

---
Task ID: v1.6.3
Agent: main (Z.ai Code)
Task: دو بخش — الف) اصلاح ظاهر کاوش (گرید نتایج + ایموجی mock)، ب) کامل‌کردن API برای NEXT_PUBLIC_USE_API=true (normalizeFa مشترک + searchText + فیلتر/مرتب‌سازی سرور + isFollowed + startsAt) با migration، تست Postgres، اسکرین‌شات، مستندات، push

Work Log:
- الف-۱ گرید نتایج (علت واقعی): تب شوها دو گرید جدا grid-cols-2 داشت (زنده/به‌زودی) → با نتایج کم هر گرید فقط خانهٔ راست RTL پر می‌شد («ستون نیم‌عرض راست، چپ خالی»)؛ ستون کاوش هم در AppShell با max-w-md در دسکتاپ حداکثر ۲ ستون باریک می‌شد. رفع: تب شوها/کالاها در یک ResultGrid واکنش‌گرا (grid-cols-2 sm:3 lg:4) + عرض per-view کاوش در AppShell (sm:max-w-2xl lg:max-w-4xl — فقط کاوش؛ بقیهٔ صفحه‌ها max-w-md) + تک‌نتیجه col-span-full با سقف 280px (نه کشیده نه ریز)؛ فروشندگان sm:2/lg:3
- الف-۲ ایموجی mock: عنوان «شب کتونی‌های کمیاب 🔥» در shows.ts/raid-p1.ts/seller.ts(queueShowTitle) بدون ایموجی + فیلد hot و نشان lucide Flame («داغ») در LiveGridCard؛ نقد «…اومد 🎁» و برچسب «…ثبت کرد ★» پاک شدند؛ اسکن کامل src/lib/data — ایموجی‌های ساختاری (cover.emoji/avatar/آیکون دسته) و چت/گیواوی عمداً ماندند (فهرست در CHANGELOG)
- ب-۱: src/lib/normalize.ts (تابع واحد normalizeFa + buildSearchText) — persian.ts فقط re-export؛ ستون searchText به Product/Show/SellerProfile؛ migration 20261011075711 با backfill SQL معادل normalizeFa (translate) + pg_trgm + ایندکس GIN با resolve پویای اسکیمای اکستنشن (اولین اجرا با gin_trgm_ops در schema غیر-public شکست خورد — درست شد)؛ /search روی searchText با ILIKE
- ب-۲: پاسخ /search کالاها: showId/showTitle (LIVE اول، وگرنه نزدیک‌ترین SCHEDULED آینده) + sizes[] (واریانت با موجودی) + condition؛ enum Condition (NEW|USED) با migration و seed (جردن۱ USED)؛ فیلتر minPrice/maxPrice/size/brand/condition روی /search و /shows (قیمت روی کالای پین‌شده شوها؛ سایز با نرمال‌سازی رقم در SQL translate)
- ب-۳: /shows?sort=popular|newest|price_asc|price_desc واقعی با keyset cursor برحسب کلید هر مرتب‌سازی ( createdAt legacy حفظ شد)؛ باگ NULLS LAST در ادامهٔ cursor پیدا و رفع شد (ردیف‌های بی‌قیمت از صفحهٔ دوم می‌افتادند)؛ startsAt برای SCHEDULED از scheduledAt؛ isFollowed فقط با Bearer معتبر (بدون توکن فیلد موجود نیست؛ توکن بد → 401)
- ب-۴: ApiShowCard += startsAt/isFollowed → apiShowToUiShow به Show.startsAt و isFollowing (دنبال‌شده‌های خانه)؛ ProductResult از پاسخ API پر می‌شود («در لایوی فلان» + فیلتر سایز/وضعیت در حالت API)؛ useSearch فیلترها را در API به سرور می‌دهد؛ useExploreShows مرتب‌سازی را؛ UpcomingFooter از show.startsAt واقعی («۱۴ ساعت دیگر» در عکس API)؛ getStoredAccessToken (localStorage try/catch) برای وقتی لاگین بیاید
- ب-۵ تست‌ها: search-discovery.test.ts (۱۵) — تطبیق «پوكمون»/«پوکمون» و «۹.۵»/«9.5»، همهٔ فیلترها، ترتیب دقیق ۴ مرتب‌سازی + پیوستگی cursor ۳ صفحه‌ای، startsAt، isFollowed با/بدون توکن + 401، دو E2E fixtures→API→mapper→تایپ UI؛ migration.test.ts — migrate deploy + seed روی اسکیمای تازه + ستون‌ها/ایندکس‌ها؛ دو باگ خودِ تست فیکسچر هم رفع شد (sEnded پین‌شده و pPoke در شو LIVE — انتظارات غلط بود)
- مهاجرت دیتابیس dev: public reset → migrate deploy → seed (migration روی دیتابیس seed قبلی هم قبلاً بدون خطا اعمال شد)؛ یک migration هرزِ «workspace_agent…» که prisma migrate dev برای drop ایندکس‌های GIN ساخت حذف شد (مستند: migrate dev ایندکس‌های SQL خام را drift می‌بیند؛ migrate deploy امن است)
- عکس‌ها: ۶ عکس نتایج (۳ تب × موبایل/دسکتاپ) با agent-browser — هر عکس قبل از ذخیره assert محتوایی (تب فعال + متن کلیدی + «داغ») + ثبات کنارهم‌بودن کارت‌ها با مختصات (موبایل x=201/17، دسکتاپ x=865/646)؛ hash هر ۸ فایل یکتا؛ ۲ عکس API با NEXT_PUBLIC_USE_API=true روی دیتابیس seed (home-api-mobile/explore-api-mobile) — نکته: کش dev برای NEXT_PUBLIC_* invalid نمی‌شود → rm -rf .next لازم بود؛ سرورهای سرگردان پورت ۳۰۰۰ در ابتدای هر ران pkill می‌شوند
- مستندات: CHANGELOG [v1.6.3]، INDEX.md (۶ ردیف بازگیر شده + بخش ۸ عکس v1.6.3 + نکته‌های صادقانه)، api-spec §2 (پارامترها/فیلدهای جدید)، package.json + config.ts = 1.6.3
- verify: tsc صفر (پروژه)، lint پاک، ۳۸ تست سرور + ۲۳ تست hooks همه پاس، smoke مرورگری ۶ مرحله‌ای mock (خانه → نیت دسته → جستجو با نشان داغ → تب کالاها → تب فروشندگان → شیت فیلتر) با صفر خطای کنسول و dev.log تمیز

Stage Summary:
- v1.6.3 کامل: هر دو بخش الف و ب پیاده شد؛ علت گرید شکسته واقعاً پیدا شد (دو گرید جدا + max-w-md) نه پنهان؛ لایه API حالا نرمال‌سازی فارسی مشترک، فیلتر/مرتب‌سازی واقعی، isFollowed اختیاری و startsAt واقعی دارد و UI در حالت API هیچ فیلدی را نمی‌پوشاند
- صادقانه انجام‌نشده: لاگین UI نیست → isFollowed در عمل خالی (قرارداد تست شده)؛ endpoint ساخت/ویرایش کالا/شو وجود ندارد → searchText امروز فقط seed+backfill (helper مشترک آماده)؛ prisma migrate dev آینده ایندکس‌های GIN را drift می‌بیند (deploy امن)؛ گزینه‌های فیلتر شیت از mock می‌آیند؛ آفلاین قطع سرور واقعی تست نشد؛ E2E مرورگرِ حالت API فقط برای خانه/کاوش سطح «رندر + جستجو» بود نه کل فلوها

---
Task ID: v1.7.0
Agent: main (Z.ai Code)
Task: فقط بخش «فروش» (نمای فروشنده) — الف) ۶ اصلاح ظاهر؛ ب) ۴ قابلیت جدید mock با شکل §6 قرارداد API؛ ج) تست واحد + اسکرین‌شات + مستندات + push

Work Log:
- وضعیت شروع: آخرین کامیت `9a8f803` (بی‌پیام UUID) زیرساخت ناقص v1.7.0 داشت: tsc شکسته بود (`peakViewers`/`soldFeed` تعریف‌نشده در seller-live-dashboard، import پیش‌فرض غلط jalaali-js) و هیچ نمای UI‌ای ساخته نشده بود.
- رفع ۴ خطای tsc: import نام‌دار `jalaali-js` (toJalaali/toGregorian/jalaaliMonthLength)؛ تعریف `peakViewers` از live-store و `soldFeed` از آیتم‌های فروخته‌شده؛ حذف متن نمایشی «ابزارهای رشد پخش — فاز ۳» و جایگزینی با دکمهٔ «پایان پخش و مشاهدهٔ گزارش».
- جستجوی کل پروژه برای «فاز/Atlas/اطلس»: فقط کامنت‌ها باقی‌اند (مجاز)؛ تنها متن نمایشی همان خط داشبورد بود — حذف شد.
- SellerScheduleView بازطراحی کامل: تقویم شمسی (jalaali.ts: گرید این ماه/ماه بعد، هفته از شنبه، گذشته‌ها disabled) + ساعت گام ۱۵ دقیقه (۶۰ اسلات ۰۹:۰۰–۲۳:۴۵) + انتخاب چندتایی کالا از انبار با عکس و موجودی + ترتیب‌دادن (اولی پین) + توضیح کوتاه + validateSchedule (گذشته/بدون کالا) + ویرایش با دو تأیید (ورود به ویرایش + ذخیرهٔ تغییرات) + لغو با تأیید و پیام mock به فالوورها (pushNotification در inbox-store) — با useMounted ضد hydration mismatch.
- SellerInventoryView بازطراحی: منبع از seller-inventory-store (CRUD mock با شکل ShopItem/Variant §6)؛ عکس اصلی ITEM_PHOTO؛ ویرایش (دیالوگ با FaNumberInput)، کپی، حذف با AlertDialog؛ موجودی هر سایز جدا با +/− (جمع خودکار کل)؛ هشدار و فیلتر «موجودی کم» (<۳)؛ «قفل ویرایش» و وزن در دو خط جدا.
- SellerOnboardingView جدید: فرم (نام/slug/دسته/کد ملی/شبا/عکس مدرک placeholder/قوانین) با اعتبارسنجی زندهٔ seller-validate.ts؛ کارت‌های وضعیت pending/approved/rejected با دلیل/suspended با علت؛ کلید دموی ?seller= در استور و در useSellerGate ادغام شد؛ گیت: شروع لایو (هاب+اتاق آماده‌باش) و لیستینگ (انبار+فرم انتشار) قفل با نمایش علت.
- SellerLiveReportView جدید: مدت/اوج بیننده/فروش/سفارش جدید/پرفروش‌ترین کالا از live-store.endShow() + دکمه‌های «رفتن به سفارش‌ها» و «ساخت شوی بعدی»؛ مسیرها sellerOnboarding و sellerLiveReport در app-store و AppShell ثبت شدند.
- ظاهر: کارت «فروش هفته» عدد یک‌خطی (whitespace-nowrap، فونت واکنش‌گرا) + «تومان» کوچک زیرش؛ عکس کالا در سفارش‌های فروشنده و تب کالاها/فروش داشبورد؛ FaNumberInput (هزارگان + پسوند، ذخیرهٔ صحیح، فقط رقم) در قیمت/موجودی/وزن لیستینگ و دیالوگ ویرایش انبار.
- تب «فروش» داشبورد زنده اصلاح شد: آمار از شمارنده‌های همین پخش (sessionOrders/sessionSalesAmount/peakViewers) — نه کالاهای فروخته‌شدهٔ قبلی شو؛ ردیف‌ها با عکس + ×تعداد و برچسب «خارج از این پخش» برای فروختهٔ قبلی.
- ۴ عکس کالای جاافتاده it7..it10 با image-generation تولید شد (جوراب/کوله/تیشرت/کانورس).
- ۵۸ تست واحد جدید: seller-validate.test.ts (کد ملی رقم کنترل/شبا mod-97/ماسک اینورینت/slug)، jalali.test.ts (تبدیل، گرید، گام ۱۵، validateSchedule گذشته/بدون کالا)، fa-number.test.ts (هزارگان، رفت‌وبرگشت format↔parse). نتیجه: ۳۸ تست سرور (bun run test:server روی Postgres واقعی embedded) + ۸۱ تست lib/hooks — همه سبز؛ tsc و lint پاک.
- ۲۸ اسکرین‌شات (۳۹۰ موبایل + دسکتاپ برای وضعیت‌های جدید) با Playwright (scripts/v170-shots.mts) — هر عکس با snapshot محتوایی بررسی شد و با نامش تطبیق دارد؛ دو عکس «pending» ابتدا اشتباهاً فرم را نشان می‌دادند (کلید ?seller=none فرم را اجباری می‌کند) و با مسیر ?seller=pending بازگیری شدند؛ ۸ عکس قدیمی seller-schedule-* حذف شدند. تب «فروش» داشبورد واقعاً در قاب است.
- INDEX.md (بخش v1.7.0 + حذف ردیف‌های قدیمی + نکته‌های صادقانه)، CHANGELOG.md (ورودی کامل v1.7.0 با فهرست «صادقانه»)، package.json → 1.7.0.

Stage Summary:
- v1.7.0 کامل شد: ۶ اصلاح ظاهر + ۴ قابلیت جدید mock (شکل §6) + ۵۸ تست واحد + ۲۸ عکس تأییدشده — هیچ صفحهٔ غیر-فروشی تغییر نکرد و AUCTION_ENABLED دست‌نخورده ماند (همهٔ قابلیت‌های مزایده پشت همان فلگ).
- نکتهٔ مهم برای ایجنت‌های بعدی: seller-inventory-store نسخهٔ قابل‌ویرایش ITEMS_SH1 است (صفحات فروشنده آن را ویرایش می‌کنند؛ اتاق لایو از دیتای ثابت می‌خواند — با رفرش sync می‌شود)؛ اتصال به APIهای §6 فقط جایگزینی استورها با hookهاست.
- نشده (صادقانه): اتصال واقعی به API (همه mock در حافظه‌اند)؛ ادمین واقعی برای تأیید (دکمهٔ دموی «شبیه‌سازی تأیید ادمین»)؛ پیام واقعی به فالوورها (فقط اعلان mock در صندوق ورودی خود کاربر)؛ در جریان اسکرین‌شات خرید واقعی انجام نشد (کیف پول mock با رفرش reset می‌شود) — مسیر خرید→گزارش دستی در مرورگر کامل تست شد و پرفروش‌ترین کالا در گزارش دیده شد.

---
Task ID: v1.7.1
Agent: main (Z.ai Code)
Task: نسخهٔ v1.7.1 — ممیزی واژه‌های حراج در کل پروژه (نمایشی، AUCTION_ENABLED=false) + جزئیات ظاهر + ویرایش کامل کالا + fees.ts + تست grep + اسکرین‌شات

Work Log:
- git log: پایه v1.7.0 (commit 1f6e157) — درست بود.
- ممیزی کل src با grep (مزایده/حراج/بید/بیدگذار/پیش‌بید/Max Bid/برنده/برد/پله): تفکیک کامنت‌ها و کد پشت فلگ از متن نمایشی؛ هر متن نمایشی حالت حراج به «واریانت فلگ‌دار» تبدیل شد (پاک نشد).
- SellerAnalyticsView: قیف «بازدید شو ← تماشای +۱ دقیقه ← شروع خرید ← خریدار» (اعداد هم‌شکل) + «از بازدید شو تا خریدار».
- seller-marketing STOREFRONT: بیوی قیمت ثابت «خرید ساده است: کالا را در لایو ببین، همان لحظه بخر…» (ساعت از fees)؛ نظر «مزایدهٔ آخر هفته» → «شو آخر هفته».
- SellerRatesView: «کارمزد خریدار: صفر — قیمت نهایی همان قیمت ثابت کالاست» + حذف جملهٔ «بعضی پلتفرم‌ها».
- صندوق ورودی: INBOX_NOTIFICATIONS دو واریانته (ثابت بدون هیچ واژهٔ حراج) + فیلتر «مزایده‌ها» پشت فلگ + empty بدون «مزایده»؛ ActivityView: چیپ «برنده شدی» → «خرید موفق» در حالت ثابت + aria/empty تاریخچه؛ ریواردز: نشان/مأموریت/مزایا دو واریانته؛ raid-p1 sh3 هماهنگ با shows.ts؛ chat «بردم» → «خریدم»؛ listing hint بدون «مزایده»؛ NOTIF_PREFS «بید بالاتر» پشت فلگ (جایگزین: «کالای نایاب»)؛ STATUS_MAP/KIND_BADGE هم‌خط با فلگ؛ توست «نسخهٔ ۱٫۰» → «LiveShop — دمو».
- ظاهر: توست «پخش زنده شروع شد» با آیکون Radio (بدون 🔴) + حذف ایموجی از ۲۵ توست دیگر (چت/گیواوی 🍀 ماند)؛ «بعدی (UP NEXT)» → «بعدی»؛ دکمهٔ انبار «موجودی هر سایز» → «ویرایش موجودی» با Layers؛ عنوان انبار line-clamp-2 بدون «…».
- product-edit-dialog.tsx جدید: فرم کامل ویرایش (عکس mock با افزودن/حذف/تغییر اصلی، عنوان، برند، وضعیت، قیمت/وزن FaNumberInput، ابعاد، توضیح، سایز/رنگ با موجودی) با اعتبارسنجی لیستینگ؛ کالای در شو فعال قفل.
- src/lib/config/fees.ts: پلکان کمیسیون + درگاه + ارسال + مهلت اسکن + مهلت ارسال + واریز برداشت با کامنت «مقدار موقت — باید با درگاه و قوانین واقعی جایگزین شود» + calcNetIncome/commissionPctFor؛ مصرف‌کننده‌ها: SellerRatesView، SELLER_REVENUE (seller.ts)، orders.ts، SellerRevenueView، SellerStorefrontView، SellerSettingsView، SellerOrdersView.
- تست: src/lib/forbidden-words.test.ts (grep کل src با اسکنر کامنت + پنجرهٔ AUCTION_ENABLED ±۵ خط + فایل‌اجازهٔ کد حفظ‌شدهٔ حراج + اسنیپت‌های مستند + ۸ تست دیتای واقعی) و src/lib/config/fees.test.ts (۱۲ تست).
- اسکرین‌شات: ۶ عکس موبایل نام‌محتوا (funnel/storefront-bio/rates/product-edit-full/warehouse-stock-button/live-start-toast) + ۵ ازنو (ready-room ×4، queue) + حذف ۱۴ عکس ناسازگار؛ docs/screenshots/INDEX.md بخش v1.7.1.
- صحت‌سنجی: bun test src/lib src/hooks → ۸۳ سبز (۱۲ fees + ۹ ممیزی)؛ bash scripts/test-server.sh → ۳۸ سبز روی Postgres واقعی؛ tsc → صفر خطا در src؛ lint تمیز؛ جریان‌های مرورگر (انبار/ویرایش+ذخیره/آنالیتیکس/فروشگاه/نرخ‌ها/صندوق/فعالیت/ریواردز/toast پخش) با agent-browser تست شد.

Stage Summary:
- v1.7.1 کامل: با AUCTION_ENABLED=false هیچ متن نمایشی واژهٔ حراج ندارد (تست خودکارش هم هست)؛ کد حراج ۱۰۰٪ پشت فلگ حفظ شده.
- fees.ts تک منبع کارمزد است؛ ماشین‌حساب و UI از همان می‌خوانند (خالص شو تفکیک آخرین شو هم از همان فرمول: ۱۹٬۱۲۶٬۵۰۰).
- نسخه → 1.7.1، CHANGELOG و INDEX اسکرین‌شات به‌روز.
- ناکامل‌ها (صادقانه): عکس‌های اضافهٔ دیالوگ ویرایش mock و فقط در حافظهٔ دیالوگ؛ «خالص شو» از fees حساب می‌شود ولی دو فیلد نمایشی processingPct/Flat در lastShow مقدار ثابت دارند؛ grep «بید» بدون مرز واژه (بردها را نمی‌گیرد — دستی بررسی شد)؛ فقط موبایل برای صفحات جدید v1.7.1.

---
Task ID: v1.8.0
Agent: main (Z.ai Code)
Task: نسخهٔ v1.8.0 — فقط «سفارش‌ها» و «کیف پول» (نمای خریدار) و صفحهٔ تسویه — ماشین وضعیت هم‌نام enum OrderStatus پرisma (PAID_HELD, READY_TO_SHIP, SHIPPED, DELIVERED, RELEASED, DISPUTED, REFUNDED, CANCELED) + تست واحد کامل + اسکرین‌شات موبایل/دسکتاپ + نسخه/مستندات

Work Log:
- ماشین وضعیت خالص src/lib/order-state.ts: جدول ORDER_TRANSITIONS + transition با پیام فارسی (لغو فقط قبل از ارسال؛ تحویل فقط از SHIPPED؛ آزادسازی از DELIVERED/DISPUTED؛ نتیجهٔ اختلاف فقط REFUNDED/RELEASED؛ وضعیت‌های پایانی بسته) + مهلت‌ها با nowMs صریح (پنجرهٔ اختلاف ۷۲h از fees تا ۷۲ ساعت بعد از تحویل — مرز دقیق باز؛ آزادسازی خودکار ESCROW_AUTO_RELEASE_DAYS=3 روز) + refundAmount=کل مبلغ + آزادسازی idempotent + deriveTimeline (تک منبع تایم‌لاین: مسیر عادی/لغو با یادداشت بازگشت وجه/اختلاف با نتیجه) + availableActions (تک منبع دکمه‌های UI) + ORDER_TABS/برچسب‌های فارسی/نگاشت کلید دمو
- fees.ts: ESCROW_AUTO_RELEASE_DAYS، DISPUTE_WINDOW_HOURS، WALLET_CHARGE (۵۰k تا ۵۰M) و calcOrderTotal (منطق مشترک قیمت+ارسال با تست)
- استورها: orders-store بازنویسی (cancelOrder→بازگشت فوری مبلغ به کیف پول، confirmDelivery، releaseEscrow idempotent، openDispute، resolveDispute REFUND/RELEASE + تراکنش بازگشت، setRated با دادهٔ امتیاز، sendOrderMessage با پاسخ mock ۱٫۴s، autoReleaseTick؛ advance عمومی حذف شد)؛ wallet-store: refund + refId/atMs/orderId برای هر تراکنش + seed هماهنگ با سفارش‌ها
- دیتا: SEED_ORDERS جدید — ۸ سفارش پوشش همهٔ ۸ وضعیت با زمان ms واقعی، عکس ITEM_PHOTO، sellerId، dispute (باز/حل‌شده-بازپرداخت)، پیام‌های seed؛ دو عکس تولیدشده برای ct1/ct2 (پوکمون/فانکو) به ITEM_PHOTO اضافه شد؛ types.ts: Order با status/stamps/dispute/messages/rating + WalletTx با refId/status/orderId
- UI سفارش‌ها: OrdersView (عکس کالا، عنوان ۲ خط بدون «…»، تاریخ شمسی، ۴ تب با شمارش، جستجوی شماره/نام با نرمال‌سازی فارسی، بنر حالت دمو، EmptyState لوسید) + order-ui.tsx مشترک (بج وضعیت با آیکون، StepTime/DayLabel با suppressHydrationWarning، faDurationLeft)
- OrderDetailView بازنویسی: بج وضعیت همیشه بالای صفحه؛ دکمه‌های وضعیت‌محور (لغو/تحویل گرفتم/آزادسازی/گزارش مشکل با شمارش پنجره/امتیاز/سفارش دوباره)؛ قبل از ارسال اختلاف مخفی به‌جایش لغو؛ تایم‌لاین زمان‌دار با یادداشت؛ «پیگیری اختلاف»؛ بنر آزادسازی خودکار با شمارش معکوس؛ دریافت رسید → نمای چاپی جدید orderReceipt (کاغذ سفید + window.print + @media print .no-print)؛ تماس با فروشنده → order-contact-sheet (پیام در خود سفارش + پاسخ mock)؛ دیالوگ امتیاز order-rating-dialog (۵ ستاره + ۵ برچسب آماده + متن اختیاری) + خلاصهٔ امتیاز ثبت‌شده
- DisputeSheet به orders-store وصل شد (ثبت اختلاف → DISPUTED + پروندهٔ ضمانت مثل قبل)؛ ⚖️/🛡 → آیکون lucide
- WalletView: علامت امن RTL (signedToman با LRM داخل <bdi>) سبز/صورتی، عنوان ۲ خط، فیلترهای همه/شارژ/خرید/بازگشت وجه با شمارش، شیت wallet-tx-sheet (شناسهٔ مرجع کپی‌شدنی، وضعیت «موفق»، زمان شمسی، لینک مشاهدهٔ سفارش)، GatewayDialog با کف/سقف فارسی + چیپ ۵M + رسید موفق با شناسهٔ مرجع/درگاه/زمان/موجودی جدید
- CheckoutView + quick-checkout-sheet + live-store.purchaseItem همه از calcOrderTotal؛ live-store سفارش جدید را با مدل جدید می‌سازد (PAID_HELD + عکس + لینک تراکنش)؛ WinView سازگار ماند
- کلید دمو ?orderStage=paid|ready|shipped|delivered|released|disputed|canceled در forced-state (قفل فهرست+جزئیات با بنر دمو)؛ در حالت عادی هیچ پیشروی خودکاری نیست
- تست: order-state.test.ts — ۳۸ تست (هر انتقال مجاز/غیرمجاز، مرز ۷۲h±۱ms و ۳ روز با زمان mock، مبلغ بازپرداخت، idempotent آزادسازی، تایم‌لاین ۶ حالت، availableActions، تب‌ها و نگاشت کلید دمو) + ۷ تست calcOrderTotal/ثابت‌ها در fees.test.ts — جمع ۱۵۰ تست lib/hooks سبز؛ tsc صفر (پروژه)؛ lint پاک
- مرورگر واقعی: لغو → موجودی ۲٫۵M→۷٫۷۴۵M و تراکنش لینک‌دار؛ تحویل→آزادسازی→امتیاز→سفارش دوباره (صفحهٔ فروشنده)؛ اختلاف→DISPUTED+پیگیری؛ رسید؛ گفتگو با پاسخ mock؛ شارژ با خطا/رسید؛ خرید لایو→سفارش تازه PAID_HELD؛ دسکتاپ 1280 سالم — باگ واقعی getSnapshot-loop (آرایهٔ نو در selector شیت گفتگو) پیدا و با EMPTY_MESSAGES ثابت رفع شد
- اسکرین‌شات: scripts/v180-shots.mts — ۳۳ عکس (موبایل ۳۹۰: ۴ تب فهرست+جستجو+خالی+۶ مرحله+لغو/تحویل/امتیاز/اختلاف+رسید+گفتگو+کیف پول ۴ حالت+تسویه+خرید سریع؛ دسکتاپ ۱۲۸۰: فهرست/جزئیات/کیف پول/رسید/تسویه) — هر عکس با assert محتوایی (۱۰۰٪ سبز)؛ ۳۶ عکس قدیمی سفارش/کیف پول/تسویه حذف و INDEX.md (بخش v1.8.0 + نکته‌های صادقانه) به‌روز شد؛ CHANGELOG [v1.8.0]؛ نسخه → 1.8.0

Stage Summary:
- v1.8.0 کامل: وضعیت‌ها دقیقاً هم‌نام enum پرisma؛ تک منطق برای انتقال‌ها/تایم‌لاین/دکمه‌ها/جمع سفارش؛ پیشروی فقط با دکمه‌های واقعی + کلید دمو برای عکس
- نکته برای ایجنت‌های بعدی: وضعیت و زمان‌های سفارش در Order (stamps ms) است و تایم‌لاین هرگز دستی ساخته نمی‌شود — deriveTimeline منبع است؛ گذارهای فروشنده‌محور (READY_TO_SHIP/SHIPPED) در ماشین آماده‌اند ولی UI فروشنده هنوز به این استور وصل نیست (seller-store جدا)
- صادقانه: دیتا mock حافظه‌ای (رفرش=ریست)؛ نتیجهٔ اختلاف فقط از seed؛ آزادسازی خودکار ۳ روزه در دمو رخ نمی‌دهد؛ چاپ واقعی تست‌پذیر نبود؛ ادمین/کارشناس وجود ندارد

---
Task ID: v1.8.0-verify
Agent: main (Z.ai Code)
Task: صحت‌سنجی کامل v1.8.0 پس از ادامهٔ نشست (کامیت bb7137c) — تست‌ها، tsc/lint، مرور واقعی همهٔ جریان‌های سفارش/کیف پول/تسویه

Work Log:
- وضعیت شروع: v1.8.0 کامیت‌شده در HEAD (bb7137c)، کارت git تمیز، نسخه 1.8.0، ۳۳ عکس v180 موجود
- prisma generate لازم شد (sandbox نو — کلاینت ساخته نشده بود)؛ بعدش tsc روی src صفر خطا (بقیهٔ خطاها vendored/legacy: examples/websocket، seed و...)
- تست‌ها: ۱۵۰/۱۵۰ تست lib+hooks سبز؛ ۳۸/۳۸ تست سرور با scripts/test-server.sh روی Postgres embedded سبز؛ lint پاک؛ dev.log فقط ۲۰۰
- مرور واقعی (agent-browser، موبایل ۳۹۰): فهرست سفارش‌ها ۴ تب با شمارش درست (۸/۵/۲/۲)؛ جستجوی «جردن» و «پوکمون» (نرمال‌سازی) کار می‌کند
- لغو سفارش #۱۰۲۴۱: دیالوگ با مبلغ دقیق ۶٬۵۴۵٬۰۰۰ → CANCELED → موجودی ۲٬۵۰۰٬۰۰۰ → ۹٬۰۴۵٬۰۰۰ فوری + تراکنش «بازگشت وجه» لینک‌دار به سفارش
- کیف پول: فیلترها (همه/شارژ/خرید/بازگشت وجه ۷/۲/۲/۳)؛ شیت تراکنش (RF-485878، موفق، زمان شمسی، لینک سفارش #۱۰۲۴۱ که واقعاً می‌رود)؛ علامت‌های RTL «+‎۶٬۵۴۵٬۰۰۰ تومان»/«−‎۱۲٬۸۷۵٬۰۰۰ تومان»
- شارژ: زیر کف «حداقل مبلغ شارژ ۵۰٬۰۰۰ تومان است»، بالا سقف «حداکثر ۵۰٬۰۰۰٬۰۰۰»، ۲M موفق → رسید ZP-531093 با موجودی جدید ۱۱٬۰۴۵٬۰۰۰
- کلید دمو: ?orderStage=ready|shipped|delivered|released|disputed|canceled هر ۶ مرحله بررسی شد — دکمه‌های درست هر مرحله (ready بدون اختلاف؛ delivered با «آزادسازی ۱٬۴۹۵٬۰۰۰» + بنر شمارش معکوس «۲ روز و ۲۳ ساعت»)؛ دیالوگ تحویل توضیح امانی/برگشت‌ناپذیری دارد؛ آزادسازی → امتیاز (۵ ستاره + ۵ برچسب آماده + متن) → ثبت → سفارش دوباره → صفحهٔ فروشنده
- اختلاف از SHIPPED: شیت ۵ دلیل + توضیح → DISPUTED + بخش «پیگیری اختلاف» (در بررسی کارشناس، دلیل، مهلت)؛ رسید چاپی (شماره/تاریخ/وضعیت/اقلام + .no-print)
- خرید سریع لایو: بایندر ۸۵۰٬۰۰۰ + تیپاکس ۴۵٬۰۰۰ = «پرداخت ۸۹۵٬۰۰۰»، سوییچ به پست = ۸۸۰٬۰۰۰ → خرید موفق → سفارش تازه #۱۰۴۰۱ صدر فهرست، مجموع ذخیره‌شده درست، کسر کیف پول درست (۲٬۵۰۰٬۰۰۰→۱٬۶۲۰٬۰۰۰)
- تسویهٔ کامل: همان calcOrderTotal — ۹٬۰۴۵٬۰۰۰ (تیپاکس) و با پیک ۹٬۰۲۵٬۰۰۰
- صفر خطای کنسول مرورگر؛ dev.log تمیز؛ کارت git همچنان تمیز

Stage Summary:
- v1.8.0 تأیید نهایی شد: همهٔ جریان‌های خریدار (لغو/تحویل/آزادسازی/امتیاز/اختلاف/رسید/گفتگو/شارژ/خرید سریع/تسویه) در مرورگر واقعی پاس می‌شوند؛ منطق مشترک calcOrderTotal در هر دو مسیر یکسان رفتار می‌کند
- نکتهٔ ابزاری (نه باگ اپ): fill با رشتهٔ خالی در agent-browser رویداد input را به React نمی‌رساند — مسیر واقعی کاربر (Ctrl+A+Backspace و execCommand) هر دو درست کار می‌کنند
- نکتهٔ محیطی: در sandbox تازه prisma generate لازم است وگرنه tsc خطای @prisma/client می‌دهد

---
Task ID: v1.8.0-push
Agent: main (Z.ai Code)
Task: push دو کامیت bb7137c (v1.8.0) و 23cbf31 (worklog) به origin/main طبق درخواست کاربر

Work Log:
- push اول بدون توکن: «could not read Username» (هیچ منبع اعتبارنامه‌ای نبود)
- توکن ارسالی کاربر پیشوند دوگانه داشت (github_pat_github_pat_...) و 401 داد؛ با پیشوند تک‌صفری (github_pat_11CF77WSQ...) push موفق شد
- push با URL صریح و -c credential.helper= انجام شد: c2aaf84..23cbf31 main -> main
- توکن در هیچ فایل/کامیت ذخیره نشد (فقط inline در دستور، بعدش unset)
- نکتهٔ فنی: چون push با URL صریح بود نه نام remote، ref محلی origin/main آپدیت نشد و اولین git log origin/main خروجی قدیمی (v1.6.2) داد؛ با git fetch origin همگام شد
- تأیید: git ls-remote origin → HEAD و refs/heads/main هر دو 23cbf31ddb69ded08aa7dcd48e9d1292fa4c91ad

Stage Summary:
- origin/main = 23cbf31 (v1.8.0 + worklog) — مخزن گیت‌هاب همگام با محلی است؛ توکن نگهداری نشده و برای pushهای بعدی باید دوباره از کاربر گرفته شود
---
Task ID: 190-2c
Agent: general-purpose
Task: حذف اعلان در صندوق ورودی + اسکن واژه‌های حراج حالت ثابت

Work Log:
- قدم صفر: worklog (بخش‌های v1.7.1 و v1.8.0) + InboxView.tsx / inbox-store.ts / buyer-p1.ts (تایپ‌ها و دو واریانت INBOX_NOTIFICATIONS) / config.ts (AUCTION_ENABLED=false) / forbidden-words.test.ts (نگهبان) / نمونهٔ AlertDialog در SellerInventoryView و product-edit-dialog / ui/alert-dialog.tsx خوانده شد.
- الف) inbox-store.ts — فقط یک افزودن: اکشن deleteNotification(id) با فیلتر immutable (s.notifications.filter) + تایپش در InboxState؛ هیچ اکشن/seed/سلکتور دیگری تغییر نکرد.
- ب) InboxView.tsx — ردیف اعلان بازسازی شد: li شامل div flex (border و bg قبلی کارت روی خود div) با دو دکمهٔ برادر مجزا: دکمهٔ اصلی خواندن (flex-1، همان onClick={markRead} و aria-label قبلی) + دکمهٔ حذف با آیکون lucide Trash2، هدف لمسی h-11 w-11 (۴۴px)، text-white/35 hover:text-red-400، aria-label=`حذف اعلان: {n.title}` — چون برادر مجزاست کلیک حذف به خواندن نشت نمی‌کند.
- ب) دیالوگ تأیید shadcn AlertDialog کنترل‌شده با state محلی deleteTarget: عنوان «این اعلان حذف شود؟»، توضیح «اعلان حذف‌شده برگشت‌پذیر نیست.»، لغو «منصرف شدم»، دکمهٔ خطر «حذف کن» با buttonVariants({variant:"destructive"}) (توکن destructive تم)؛ تأیید → deleteNotification(id) + setDeleteTarget(null) + toast.success(«اعلان حذف شد»). الگو دقیقاً هم‌شکل دیالوگ حذف کالای SellerInventoryView (footer flex-row-reverse، rounded-2xl bg-ls-card).
- ب) EmptyState موجود برای «همهٔ اعلان‌های فیلتر حذف شد» دست نخورد (visible.length===0)؛ شمارنده‌های چیپ‌ها و «ناخوانده»ها از state می‌آیند و خودکار آپدیت می‌شوند؛ «خواندن همه» و خواندن تک‌تک بدون تغییر؛ ایموجی جدیدی اضافه نشد (فقط Trash2) و n.emoji دیتا دست‌نخورده ماند.
- ج) اسکن واژه‌های حراج: bun test src/lib/forbidden-words.test.ts از ابتدا سبز بود (۹/۹) — هیچ leakی در متن‌های نمایشی حالت ثابت نبود؛ بنابراین هیچ‌کدام از ۵ فایل مجاز بخش ج دست نخورد و واریانتهای فلگ‌دار حفظ شدند. رشته‌های جدید من (این اعلان حذف شود؟/اعلان حذف‌شده برگشت‌پذیر نیست./منصرف شدم/حذف کن/اعلان حذف شد) همه از واژه‌های ممنوع دورند و توسط همان تست دوباره تأیید شدند.
- صحت‌سنجی: bun test src/lib src/hooks → ۱۶۰ pass / ۹ fail که هر ۹ با baseline بدون تغییرات من (git stash) یکسان‌اند — سرور بدون Postgres/env: ۳ در auth.security + ۵ در otp.security + ۱ در search-discovery (تقسیم failهای شناخته‌شدهٔ محیطی؛ صفر مرتبط با این تسک)؛ bunx tsc --noEmit | grep 'InboxView|inbox-store' → صفر (تنها ۴ خطای vendored خارج src: examples/websocket و skills — پیش‌موجود)؛ bun run lint → exit 0. smoke مرورگری طبق دستور انجام نشد (dev روی ۳۰۰0 در حال اجراست).

Stage Summary:
- حذف تک‌اعلان با تأیید کامل شد: استور یک اکشن immutable اضافه کرد، ردیف‌ها به li>div با دو دکمهٔ مستقل (خواندن/حذف) بازسازی شدند و دیالوگ فارسی + توست موفقیت اضافه شد؛ رفتارهای قبلی (خواندن تک‌تک، خواندن همه، فیلترها/شمارنده‌ها، EmptyState) دست‌نخورده ماندند.
- اسکن حراج: مجموعه از قبل تمیز بود — leakی پیدا نشد و چیزی در بخش ج اصلاح نشد؛ فقط ۲ فایل مجاز (inbox-store.ts و InboxView.tsx) تغییر کرد.

---
Task ID: 190-1a
Agent: general-purpose
Task: ماژول خالص ماشین OTP + اعتبارسنجی موبایل/کدپستی + دیتای استان‌ها + تست

Work Log:
- قراردادهای پروژه خوانده شد (worklog تا v1.8.0-push) و الگوها برداشته شد: order-state.ts (توابع خالص با nowMs صریح)، order-state.test.ts (زمان mock با T0)، fa-number.ts (latinDigits)، normalize.ts، fees.ts و سرور src/lib/server/otp.ts (TTL=120s، MAX_ATTEMPTS=5، RATE=3/600s، پیام‌های فارسی خطا) — هیچ فایل موجودی تغییر نکرد (فقط ۵ فایل جدید + این append).
- src/lib/otp-state.ts: ماشین وضعیت خالص بدون هیچ import از React/zustand/سرور — فازهای idle/sending/sent/verifying/locked/authenticated (OTP_PHASES)؛ ثابت‌های CODE_TTL_SECONDS=120 و RESEND_COOLDOWN_SECONDS=120 و MAX_ATTEMPTS=5 و RATE_LIMIT=3 و RATE_WINDOW_SECONDS=600 با کامنت فارسی؛ OtpErrorCode + نقشهٔ OTP_ERROR_MESSAGE با ۵ پیام فارسی دقیق قرارداد؛ OtpState (phone/expectedCode دمو/sentAtMs/codeExpiresAtMs/resendAvailableAtMs/attemptsLeft/sentTimestampsMs/lockedUntilMs/error)؛ توابع خالص initialOtpState/withPhone/requestOtp/submitCode/resetToIdle/logout + helperهای codeSecondsLeft و resendSecondsLeft و lockedSecondsLeft و canSubmit و canResend — همه با nowMs صریح.
- منطق requestOtp: اول پنجرهٔ ۳/۶۰۰s (timestampهای قدیمی‌تر از پنجره از آرایه دور ریخته می‌شوند؛ سقف → RATE_LIMITED)، بعد cooldown ارسال دوباره (resendAvailableAtMs در آینده → همان RATE_LIMITED طبق تصمیم تسک؛ شمارش دقیق در UI با resendSecondsLeft)؛ درخواست ردشده timestamp اضافه نمی‌کند؛ موفق → phase=sent و همهٔ زمان‌ها از nowMs و تلاش‌ها صفر و قفل پاک (کد دمو از opts.expectedCode یا random ۶ رقمی — فقط ماک).
- منطق submitCode (ترتیب قواعد): قفل (phase=locked یا lockedUntilMs در آینده) → TOO_MANY_ATTEMPTS حتی با کد درست؛ فاز غیر sent یا انقضا → CODE_EXPIRED (شرط nowMs >= codeExpiresAtMs دقیقاً آینهٔ expiresAt > now سرور — مرز ۱۲۰٬۰۰۰ms منقضی است)؛ کد غلط → attemptsLeft−1 و INVALID_CODE؛ صفر شدن تلاش‌ها → phase=locked با lockedUntilMs=nowMs+600000 و TOO_MANY_ATTEMPTS؛ کد درست (مقایسهٔ رشته‌ای با expectedCode) → authenticated و error=null.
- src/lib/account-validate.ts: normalizePhoneFa آینهٔ سرور ولی بدون throw (latinDigits از fa-number + حذف فاصله/تیره/پرانتز + پسوندهای +98/0098/989 → 0 → فقط «09xxxxxxxxx» وگرنه null)؛ validatePhoneFa با پیام واحد «شمارهٔ موبایل معتبر نیست؛ نمونهٔ صحیح: ۰۹۱۲۱۲۳۴۵۶۷»؛ validatePostalCodeFa (فاصله/تیره نادیده، حروف → «کدپستی معتبر نیست»، طول ≠۱۰ → «کدپستی باید ۱۰ رقم باشد»، شروع با صفر → «کدپستی نمی‌تواند با صفر شروع شود»، همه یکسان → «کدپستی معتبر نیست»)؛ validateRequiredFa → «{label} را وارد کن» با خروجی trim.
- src/lib/data/provinces.ts: ۳۱ استان واقعی با مرکز اول + ۲ تا ۵ شهر واقعی هر استان (تهران: تهران/شهریار/ورامین/اسلامشهر/قدس؛ البرز: کرج/هشتگرد/نظرآباد/فردیس/ماهدشت؛ فارس: شیراز/مرودشت/جهرم/کازرون/لار و …) + تایپ Province + citiesOf با غلط‌گیری نام از normalizeFa (نام ناشناخته → []).
- تست: otp-state.test.ts — ۲۵ تست (مسیر خوش‌حال کامل، نقشهٔ پیام‌ها، مرز دقیق انقضا ۱۱۹٬۹۹۹/۱۲۰٬۰۰۰ms، قفل ۵ تلاش غلط + رد تلاش ششم با کد درست + پاک‌شدن قفل با کد جدید بعد از سررسید، سقف ۳/۶۰۰s و افتادن timestamp قدیمی در T0+600001، cooldown قبل/بعد ۱۲۰s، attemptsLeft، resetToIdle/logout، همهٔ helperها) و account-validate.test.ts — ۲۷ تست (موبایل ۱۱ + validatePhoneFa ۲ + کدپستی ۸ + required ۲ + استان‌ها ۴ شامل ۳۱تایی/یکتایی id و نام/مرکز اول/شهرهای نمونه/citiesOf با حروف عربی).
- صحت‌سنجی: bun test دو فایل → ۵۲ pass / ۰ fail (۲۳۴ expect)؛ bun test src/lib src/hooks → ۲۱۲ pass / ۹ fail که هر ۹ تست server است بدون Postgres (auth/otp/discovery — baseline قبلی، هیچ مورد تازه‌ای شکست نخورد)؛ bunx tsc --noEmit | grep 'otp-state|account-validate|provinces' → صفر خطا (فقط خطاهای vendored examples/skills پیش‌موجود)؛ bun run lint → exit 0.

Stage Summary:
- ۵ فایل جدید ساخته شد: src/lib/otp-state.ts و src/lib/otp-state.test.ts و src/lib/account-validate.ts و src/lib/account-validate.test.ts و src/lib/data/provinces.ts — هیچ فایل UI/استور/مشترک دیگری تغییر نکرد.
- ۵۲ تست جدید همگی سبز (otp-state: ۲۵، account-validate: ۲۷ شامل ۴ تست استان‌ها)؛ قراردادهای خطا و ثابت‌ها دقیقاً هم‌شکل سرور src/lib/server/otp.ts است.
- تصمیم‌های طراحی: ردشدن cooldown هم با همان OtpErrorCode=RATE_LIMITED (طبق تصمیم تسک؛ تفکیک نمایشی فقط با resendSecondsLeft)؛ مرز انقضا با nowMs >= codeExpiresAtMs تا با شرط gt سرور یکی باشد و تست ۱۲۰٬۰۰۰ms منقضی شود؛ ترتیب قواعد submitCode قفل را قبل از CODE_EXPIRED چک می‌کند تا تلاش ششم همیشه TOO_MANY_ATTEMPTS بدهد؛ باPhone برای ست‌کردن شمارهٔ نرمال اضافه شد چون requestOtp طبق امضا شماره نمی‌گیرد؛ فازهای sending/verifying فقط در تایپ‌اند (فازهای in-flight برای اتصال واقعی API) و ماشین ماک از آن‌ها عبور نمی‌کند.

---
Task ID: 190-2a
Agent: general-purpose
Task: صفحهٔ آدرس‌ها (استور CRUD + UI فهرست/فرم/حذف/پیش‌فرض)

Work Log:
- قدم صفر: worklog (v1.8.0 تا 190-1a) + account-validate.ts / provinces.ts / orders.ts (DEFAULT_ADDRESS) / ProfileView (MenuRow/کارت) / SellerInventoryView (AlertDialog حذف و فرم) / shared.tsx (PageHeader/EmptyState) / seller-inventory-store (الگوی CRUD) / ui: alert-dialog, select, textarea, switch / app-store (back) / sheet.tsx و filter-sheet (الگوی Sheet bottom) خوانده شد.
- الف) src/store/addresses-store.ts (فایل جدید): تایپ Address + AddressInput (Omit id/isDefault) + AddressErrors + AddressValidation؛ seed دو آدرس — addr-1 پیش‌فرض دقیقاً دموی فعلی (گیرنده «علی رضایی»، موبایل لاتین 09121234567، تهران/تهران، «خیابان ولیعصر، کوچهٔ یاس، پلاک ۶۴، واحد ۳»، کدپستی 1965843157) و addr-2 غیرپیش‌فرض اصفهان/اصفهان با گیرندهٔ دیگر؛ اکشن‌ها: addAddress (id از شمارندهٔ addr-user-N؛ اگر لیست خالی باشد خودکار پیش‌فرض)، updateAddress، deleteAddress (حذف پیش‌فرض → اولین باقی‌مانده = قدیمی‌ترین پیش‌فرض می‌شود)، setDefault (id ناموجود بی‌اثر تا همیشه یک پیش‌فرض بماند) + سلکتور خالص selectDefaultAddress(state) که هم به‌شکل useAddressesStore(selectDefaultAddress) و هم getState() مصرف می‌شود.
- الف) validateAddress تابع خالص خارج از استور: اجباری‌ها (گیرنده/استان/شهر/نشانی) با validateRequiredFa («{label} را وارد کن»)، موبایل با validatePhoneFa → نرمال لاتین 09xxxxxxxxx، کدپستی اختیاری (فقط اگر پر شده باشد validatePostalCodeFa → لاتین ۱۰ رقمی)، شهر باید از citiesOf(استان) باشد وگرنه «شهر را از فهرست استان انتخاب کن» (ثابت CITY_NOT_IN_PROVINCE_MESSAGE)؛ خروجی موفق همهٔ متن‌ها trim و موبایل/کدپستی نرمال لاتین.
- ب) AddressesView.tsx بازنویسی کامل: PageHeader «آدرس‌ها» + شمارنده + onBack={back} از useAppStore؛ کارت هر آدرس = گیرنده بولد + بج سبز «پیش‌فرض» (استایل StatusChip سبز bg-ls-green) + نشانی city + line با line-clamp-2 + موبایل dir=ltr با فاصله‌گذاری ۴-۳-۴ و ارقام فارسی (09121234567 → ۰۹۱۲ ۱۲۳ ۴۵۶۷) + دو دکمهٔ آیکونی ۴۴px (Pencil / Trash2 قرمز border-red-400/20) + دکمهٔ Star «انتخاب پیش‌فرض» فقط برای غیرپیش‌فرض با toast «آدرس پیش‌فرض شد»؛ دکمهٔ ثابت sticky bottom-4 «افزودن آدرس جدید» (Plus، h-12، bg-ls-purple)؛ حالت خالی = EmptyState با lucide MapPin + دکمهٔ افزودن.
- ب) فرم افزودن/ویرایش در Sheet side="bottom" (الگوی filter-sheet: rounded-t-3xl bg-ls-bg max-h-88dvh دستهٔ drag) با فیلدها: گیرنده (Input)، موبایل (dir=ltr، placeholder ۰۹۱۲۱۲۳۴۵۶۷، inputMode tel)، استان (Select از PROVINCES)، شهر (Select وابسته با citiesOf — تغییر استان city را ریست می‌کند و Select شهر تا انتخاب استان disabled با placeholder «اول استان را انتخاب کن»)، نشانی (Textarea سه‌ردیفی)، کدپستی (dir=ltr، inputMode numeric، اختیاری)؛ ذخیره → validateAddress → خطاها قرمز (text-red-400 role=alert) زیر هر فیلد + aria-invalid؛ موفق → toast «آدرس ذخیره شد» و بستن شیت (ویرایش همان id را update می‌کند).
- ب) حذف با AlertDialog کنترل‌شده (state محلی deleteTargetId): «این آدرس حذف شود؟» / «آدرس حذف‌شده برگشت‌پذیر نیست.» / لغو «منصرف شدم» / «حذف کن» با bg-destructive (توکن #ff3b5c تم) + toast «آدرس حذف شد» — الگوی footer flex-row-reverse هم‌شکل دیالوگ انبار.
- صحت‌سنجی: tsc --noEmit | grep 'AddressesView|addresses-store' → صفر خطا (خطاهای موجود src متعلق به فایل‌های نیمه‌کارهٔ تسک‌های موازی: AppShell→ProfileEdit/Settings/… و login-sheet/auth-store — پیش از تغییر من هم بودند)؛ bun run lint → exit 0؛ bun test src/lib src/hooks → ۲۱۲ pass / ۹ fail دقیقاً baseline بدون-Postgres (auth/otp/discovery — هیچ مورد تازه‌ای نه)؛ smoke اسکریپت موقت (bun، خارج از پروژه): seed، سلکتور، addAddress روی لیست خالی→پیش‌فرض خودکار، پیام‌های خطای فارسی، نرمال‌سازی +98/ارقام فارسی، حذف پیش‌فرض→قدیمی‌ترین، setDefault و بی‌اثری id ناموجود — همه درست؛ مرور مرورگر طبق دستور انجام نشد (dev روی ۳۰۰۰).

Stage Summary:
- دو فایل تحویل شد: src/store/addresses-store.ts (استور CRUD + validateAddress خالص + سلکتور پیش‌فرض) و src/components/liveshop/views/AddressesView.tsx (فهرست/فرم/حذف/پیش‌فرض/حالت خالی) — هیچ فایل دیگری تغییر نکرد؛ app-store/AppShell/Checkout دست‌نخورده.
- تصمیم‌های مهم: کدپستی اختیاری است چون فهرست اجباری‌ها در قرارداد فقط گیرنده/استان/شهر/نشانی بود؛ موبایل/کدپستی همیشه لاتین ذخیره و فقط در UI فارسی نمایش داده می‌شوند (۰۹۱۲ ۱۲۳ ۴۵۶۷)؛ ترتیب آرایه = قدیمی→جدید پس «قدیمی‌ترین» همان اول فهرست است؛ setDefault با id ناموجود عمداً بی‌اثر است تا هرگز حالت بدون پیش‌فرض رخ ندهد (بجز لحظهٔ خالی بودن لیست).
- یکپارچه‌سازی Checkout/quick-checkout با selectDefaultAddress عمداً به تسک بعدی واگذار شد.

---
Task ID: v1.9.0
Agent: main (Z.ai Code) + ۳ ایجنت موازی (190-1a، 190-2c، 190-2a)
Task: نسخهٔ v1.9.0 — فقط «حساب» و ورود — OTP طبق api-spec §1 + آدرس‌ها + پروفایل/تنظیمات + اعتماد/پشتیبانی + صندوق ورودی (حذف اعلان) + اسکرین‌شات + push

Work Log:
- recon: api-spec §1، سرور OTP موجود (otp.ts با نرخ ۳/۱۰m و ۵ تلاش و HMAC)، routeهای auth آماده، ProfileView/AppShell/InboxView
- 190-1a (ایجنت): otp-state.ts خالص (فازها + پنجرهٔ نرخ + انقضای ۱۲۰s مرز دقیق + cooldown + قفل ۵ تلاشی + پیام‌های فارسی) — ۲۵ تست با زمان mock؛ account-validate.ts (موبایل ۰۹/+989/۰۰۹۸۹/۹۸۹ با ارقام فارسی + کدپستی ۱۰ رقمی) — ۲۷ تست؛ provinces.ts (۳۱ استان واقعی) — ۵۲ تست سبز
- 190-2c (ایجنت): deleteNotification + دکمهٔ حذف ۴۴px با AlertDialog + toast؛ اسکن واژه‌های حراج — ۹/۹ نگهبان سبز، leak نبود
- 190-2a (ایجنت): addresses-store (CRUD + پیش‌فرض + validateAddress با پیام فارسی + seed هم‌راستای دموی قبلی) + AddressesView (فهرست/فرم شیت با استان→شهر وابسته/حذف با تأیید/خالی lucide)
- 1-b (من): auth-store (mock با کاربر seed علی رضایی + حالت API /auth/otp/request|verify|refresh|me — توکن‌ها فقط در حافظهٔ ماژول، هرگز localStorage) + useAuth واحد + requireAuth/pendingAction + LoginSheet (۶ ورودی جدا با paste و پرش، شمارش ۲:۰۰، ارسال دوباره، خطای inline، قفل با شمارش، کد دمو با برچسب) + mount سراسری در AppShell
- گیت مهمان در ۶ نقطه: پرداخت تسویه + پرداخت خرید سریع + خرید فوری/محصول (رفتن به تسویه) + فالو فروشگاه + چت لایو (نام/آواتار کاربر واقعی در پیام) + یادآوری شو — همه با ادامهٔ همان کار بعد از ورود
- ProfileView auth-aware (مهمان/لاگین + خروج با تأیید + منوی جدید: آدرس‌ها/FAQ/قوانین/حریم خصوصی/پشتیبانی/تنظیمات) + ProfileEditView (آواتارهای mock + قاعدهٔ username) + SettingsView (۴ اعلان + حریم خصوصی با localStorage + حذف حساب دومرحله‌ای) + FaqView/TermsView/PrivacyView/SupportView با بج «پیش‌نویس — نیاز به بازبینی حقوقی» + TrustBadgePlaceholder
- یکپارچه‌سازی: تسویه و خرید سریع از selectDefaultAddress می‌خوانند + دکمهٔ «تغییر» → صفحهٔ آدرس‌ها (DEFAULT_ADDRESS ثابت حذف شد)
- باگ‌های گرفته‌شده: شمارش معکوس فریز به‌خاطر snapshot mount (resync ناهمزمان بعد از خطای lint react-hooks/set-state-in-effect)، شکستن آکولاد pay هنگام requireAuth (tsc)، TS18047 فیلدهای nullable ماشین
- عکس: scripts/v190-shots.mts — ۲۹ عکس (۲۴ موبایل ۳۹۰ + ۵ دسکتاپ) با assert محتوایی — ۲۲ عکس قدیمی حساب حذف؛ نکتهٔ رانر: نام دسترس‌پذیری «ورود یا ثبت‌نام» ≠ متن «ورود / ثبت‌نام» (strict-mode)؛ ۲ مرور تکراری تا ۲۹/۲۹
- verify: ۲۱۲ تست lib/hooks سبز (۹ fail شناخته‌شدهٔ سرورِ بدون-Postgres) + ۳۸ سرور روی Postgres واقعی + tsc صفر + lint پاک + مرور واقعی: خروج→مهمان، خرید مهمان→شیت ورود→شمارهٔ نامعتبر/معتبر→کد دمو→کد غلط→کد درست→ادامهٔ خرید (خطای موجودی درست)، آدرس CRUD با خطاهای فرم، حذف اعلان، خواندن همه، حذف حساب دومرحله‌ای، FAQ آکاردئون، شمارش ۲:۰۰ بعد از فیکس
- docs: INDEX.md (بخش v1.9.0 + حذف ۲۲ ردیف)، CHANGELOG [v1.9.0] با بخش «صادقانه انجام‌نشده»، README (چرایی حافظه‌بودن refreshToken + راهکار httpOnly cookie + گام‌های سرور)، نسخه → 1.9.0

Stage Summary:
- v1.9.0 کامل: ورود OTP با همان قواعد سرور (نرخ/انقضا/قفل)، مهمان با ادامهٔ اقدام، آدرس‌ها واقعی مشترک بین تسویه/خرید سریع، تنظیمات با ماندگاری، اعتماد/پشتیبانی پیش‌نویس‌دار، حذف اعلان
- نکته برای ایجنت‌های بعدی: auth-store با کاربر seed شروع می‌شود تا صفحات قبلی بدون رگرسیون کار کنند — «خروج» مهمان واقعی می‌سازد؛ requireAuth تنها راه گیت است (pendingAction بعد از verify اجرا می‌شود)
- صادقانه: حالت API ورود E2E واقعی با SMS نشده (فقط مسیر/نقشه)؛ refreshToken با رفرش می‌پرد (README راهکار httpOnly)؛ عکس پروفایل آپلود واقعی نیست؛ حذف حساب mock است؛ متن‌های حقوقی پیش‌نویس‌اند؛ فیلتر «مزایده‌ها» صندوق پشت فلگ ماند

---
Task ID: v1.9.1
Agent: main (Z.ai Code)
Task: نسخهٔ v1.9.1 — الف) قفل‌کردن پنل فروشنده بر اساس ورود و وضعیت، ب) پنل ادمین (/admin، UI با دادهٔ mock مطابق api-spec §7)، ج) تست واحد گذار وضعیت + اسکرین‌شات + مستندات + push

Work Log:
- الف) ماژول خالص src/lib/seller-status.ts: جدول گذار (none→pending ثبت؛ pending→approved/rejected تصمیم ادمین؛ approved→suspended تعلیق؛ rejected→pending ارسال دوباره؛ rejected→none باز شدن فرم؛ suspended→approved رفع تعلیق — سه مورد اول/آخر علاوه بر موارد صریح درخواست، چون بدون آن‌ها ثبت اولیه/ارسال دوباره/رفع تعلیق غیرممکن بود؛ در گزارش صادقانه ثبت شد) + validateRejectReason/validateSuspendReason (خالی/کوتاه‌تر از ۳ حرف رد) + resolveSellerAccess (مهمان/شروع/در انتظار/رد/تعلیق/پنل).
- الف) بازنویسی seller-onboarding-store: پیش‌فرض status=none و application=null (قبلاً approved با seed کفش‌خانهٔ سینا)؛ کلید دموی ?seller=approved اضافه شد (فروشندهٔ نمونه فقط با آن)؛ همهٔ اکشن‌ها با گارد canTransition و خروجی ActionGuardResult؛ hardReset + hydrateFromSession (sessionStorage با try/catch برای mock مشترک / و /admin — فقط روی mount تا hydration سالم بماند).
- الف) اتصال به useAuth: logout/deleteAccount/ورود موفق در auth-store وضعیت فروشنده را پاک می‌کنند.
- الف) UI گیت: کارت‌های وضعیت به کامپوننت مشترک seller-status-cards.tsx منتقل شد (SellerStatusChip/SellerStatusCard/SellerGuestGate)؛ SellerDashboardView با resolveSellerAccess گیت تمام‌صفحه شد (مهمان←کارت ورود + شیت؛ none←شروع فروش؛ pending/rejected/suspended←کارت وضعیت؛ approved←پنل — گیت کهربایی قدیمی داخل پنل حذف چون غیرقابل‌دسترس شده بود)؛ SellerOnboardingView دکمهٔ دموی «شبیه‌سازی تأیید ادمین» حذف و جایش لینک «(دمو) باز کردن پنل ادمین» نشست؛ BottomNav تب «فروش» و ProfileView «فروشندهٔ من» برای مهمان requireAuth → شیت ورود با ادامهٔ اقدام.
- الف) کدپستی فرم آدرس اجباری شد (فرمول قبلی validatePostalCodeFa دست‌نخورده): validateAddress خالی را با POSTAL_REQUIRED_MESSAGE رد می‌کند؛ برچسب فرم «کد پستی (۱۰ رقم — اجباری)».
- ب) admin-store.ts: ۷ فروشندهٔ mock غیردمو (ترکیب همهٔ وضعیت‌ها) + گزارش فعالیت seed + buildDemoRequest (درخواست کاربر دمو از استور onboarding مشتق می‌شود) + decide با گارد گذار و ثبت لاگ + enqueue/drain صف اعلان ادمین (sessionStorage یک‌بارمصرف — bug اعلان تکراری در نشست نرم پیدا و با حذف push مستقیم رفع شد) + useAdminRole (?role=admin با الگوی useSyncExternalStore).
- ب) /admin (src/app/admin/page.tsx + components/admin/AdminApp.tsx): ۴۰۳ برای بدون‌نقش؛ هدر + دکمهٔ فروشگاه (Link نرم)؛ داشبورد ۳ کارتی (در انتظار/فعال/LIVE_SHOWS.length)؛ ۴ تب با «به‌زودی» ×۳؛ جدول (فیلتر وضعیت/جستجو/دسته/مرتب‌سازی تاریخ) + پنل جزئیات sticky (کد ملی/شبا فقط ماسک + SecretField «نمایش» با ثبت لاگ و توست + عکس مدرک placeholder)؛ دیالوگ تأیید/رد/تعلیق/رفع تعلیق (AlertDialogAction با preventDefault تا خطای اعتبارسنجی دیالوگ را باز نگه دارد)؛ گزارش فعالیت «چه کسی، چه چیزی، کی».
- ج) تست: seller-status.test.ts (۲۶: پیمایش کامل ۵×۵، دلیل خالی، ۵ وضعیت + مهمان، گاردهای استور، پاک شدن با خروج) + address-form.test.ts (۶) — مجموع ۲۵۳ lib/hook سبز، ۹ fail همان baseline بدون Postgres، ۳۸ سرور سبز؛ tsc + lint صفر.
- ج) E2E مرورگر: ثبت درخواست → pending (بدون دکمهٔ دمو) → رد ادمین با دلیل → نمایش دلیل واقعی به فروشنده → «اصلاح و ارسال مجدد» (فرم پیش‌پر) → تأیید ادمین → پنل فعال + اعلان یک‌باره در صندوق ورودی؛ خطای دلیل خالی؛ تعلیق/رفع تعلیق عطر و نگین؛ ۴۰۳؛ کدپستی اجباری؛ خروج ← شیت ورود روی تب فروش؛ ?seller=approved ← پنل نمونه.
- ج) اسکرین‌شات: ۱۴ عکس جدید (۸ موبایل ۳۹۰@2x + ۶ دسکتاپ ادمین) + حذف ۴ عکس قدیمی (pending-mobile/desktop با دکمهٔ دمو، form-mobile پیش‌پر، hub-gated با گیت قدیمی) — INDEX.md بخش v1.9.1 + نکته‌های صادقانه.
- مستندات: CHANGELOG بخش v1.9.1، APP_VERSION و package.json → 1.9.1.

Stage Summary:
- v1.9.1 کامل: گیت فروشنده ۵ وضعیت + مهمان با ماشین وضعیت تست‌شده، پنل ادمین دسکتاپی با mock مشترک و اعلان یک‌باره، کدپستی اجباری.
- نکتهٔ فنی مهم برای ایجنت‌های بعدی: مسیر /admin صفحهٔ جدا است — zustand با soft-nav (next/link) بین دو مسیر مشترک می‌ماند و برای hard-nav وضعیت فروشنده/اعلان در sessionStorage نشست است؛ report فعالیت ادمین فقط حافظهٔ ماژول است.
- نکتهٔ ابزار: agent-browser fill روی ورودی‌های کد OTP واکنش React نمی‌دهد (type با keyboard درست است)؛ click فیزیکی روی لینک زیر toast گیر می‌کند (eval .click() جایگزین).

---
Task ID: v1.9.1-push
Agent: main (Z.ai Code)
Task: push کامیت v1.9.1 روی main با توکن جدید (کاربر فراهم کرد)

Work Log:
- وضعیت ناسازگار کشف شد: commit قبلی b9966b3 (کامییت v1.9.1 جلسهٔ قبل) هیچ‌جا وجود نداشت — بعد از reset سندباکس، HEAD محلی به c2aaf84 (v1.7.1) برگشته بود ولی فایل‌های working tree (کار کامل v1.9.1) سالم مانده بودند؛ remote اصلی main = edb8989 (v1.9.0) بود.
- اصلاح: git reset --mixed روی origin/main (edb8989) + add -A؛ ۱۵۸ عکس resurrectedشده (حذف‌شده‌های قدیمی که restore سندباکس به دیسک برگردانده بود) + ۴ عکس حذف‌شدهٔ v1.9.1 (seller-onboarding-pending-mobile/desktop، seller-onboarding-form-mobile، seller-hub-gated-mobile) از دیسک پاک شدند — مجموعهٔ نهایی ۲۷۸ عکس دقیقاً مطابق ادعای INDEX.md (۲۶۸ remote − ۴ + ۱۴ v191).
- صحت‌سنجی قبل از کامیت: ۳۲ تست جدید v1.9.1 سبز؛ tsc صفر خطا در src (فقط ۴ خطای قدیمی examples/skills سندباکس)؛ دلتای stage شده فایل‌به‌فایل مرور شد: ۳۹ فایل = ۲۰ کد/داک + ۱۴ عکس v191 + ۴ حذف.
- کامیت 96dc0fd (hash جدید — بازتولید دقیق hash قبلی b9966b3 ناممکن است چون timestamp آن با reset سندباکس از بین رفته) و push موفق main: edb8989..96dc0fd (fast-forward).
- توکن فقط inline در URL push استفاده شد؛ در هیچ فایل/کامیت/config ذخیره نشد. پیشوند تکراری github_pat_github_pat_ دوباره رخ داد — با حذف تکرار (github_pat_…) کار کرد.

Stage Summary:
- main = origin/main = 96dc0fd؛ درخت کاری تمیز؛ v1.9.1 کامل روی GitHub.
- نکته برای آینده: بعد از هر reset سندباکس، قبل از هر کاری git log و git status را با remote مقایسه کن — refs محلی می‌توانند عقب بمانند ولی فایل‌های دیسک جدیدتر باشند.

---
Task ID: v2.0.0
Agent: main (Z.ai Code)
Task: نسخهٔ v2.0.0 — فقط بک‌اند: §4 تسویه + §5 کیف پول قرارداد api-spec (دفتر دوطرفه، امانت، idempotency)؛ UI دست‌نخورده

Work Log:
- recon: api-spec §4/§5، schema.prisma (مدل‌های Account/LedgerEntry/Order از قبل آماده)، auth.ts (Bearer JWT)، http.ts (قالب خطا)، fees.ts (پلکان کمیسیون + جدول ارسال)، order-state.ts (ماشین وضعیت UI — سرور با آن یکی شد)، test-server.sh (Postgres واقعی اسکیمای liveshop_test).
- ledger: postTransaction با چک مجموع صفر + ensureAccount lazy با مسیر سریع و قفل advisory فقط برای اولین ساختن (چون NULL در ایندکس unique متمایز است و P2002 داخل تراکنش تعاملی قابل retry نیست) + lockAccountForUpdate + getBalance.
- تریگر فقط-INSERT: ledger-ddl.ts (تک منبع) → migration 20261013000000 + scripts/apply-db-extras.ts (db:extras) + اعمال خودکار در test-server.sh؛ TRUNCATE از تریگر معاف است (seed سالم).
- checkout.ts: createOrder در یک تراکنش تعاملی — replay/conflict کلید idempotency (بازندهٔ P2002 دوباره می‌خواند)، LIVE بودن شو، تعلق واریانت به ShowItem، مالکیت آدرس، SELF_PURCHASE، پول فقط از سرور (قیمت/ارسال/کمیسیون پلکانی روی فروش RELEASED ماه جاری)، کسر موجودی شرطی با مرتب‌سازی id، قفل FOR UPDATE کیف پول، postTransaction (−total/+ESCROW)، سفارش PAID_HELD با shipDeadline+48h و snapshotها، soldCount++، hook خالی realtime.
- orders.ts: cancel (فقط قبل از ارسال، بازگشت کامل + برگشت موجودی و soldCount با GREATEST(0,…)، flip تک‌برنده)، confirm-delivery (SHIPPED→RELEASED، ESCROW→SELLER_PAYABLE+PLATFORM_REVENUE، idempotent با بازگشت alreadyReleased)، ship (فروشندهٔ همان سفارش، PAID_HELD→READY_TO_SHIP→SHIPPED، ردیف Shipment)، list/get خریدار (404 برای دیگران).
- wallet.ts: getWalletView (موجودی + تاریخچه cursor با take limit+1) + dev-topup با گیت سخت NODE_ENV!==production && DEV_TOPUP=true (production همیشه 404 قبل از بدنه/احراز).
- ۷ route جدید در src/app/api/v1 (orders، [id]، cancel، confirm-delivery، wallet، dev-topup، seller ship) — همهٔ نازک با handle/zod/requireUser.
- scripts/reconcile-ledger.ts (bun run reconcile): صفر بودن هر txnId + صفر بودن کل دفتر + برابری ESCROW با سفارش‌های در نگهداری؛ خروج non-zero برای cron.
- تست: ordering-helpers.ts (fixture کامل + fundWallet + invariantها) و checkout.test.ts — ۲۹ تست: happy path با snapshotها، ۶ خطای اعتبارسنجی، ۵۰ خریدار/موجودی ۵، ۱۰ سفارش/کیف برای ۳، idempotency ترتیبی و ۱۰تایی هم‌زمان، rollback شبیه‌سازی‌شدهٔ f/g، invariantهای دفتر، تریگر UPDATE/DELETE، چرخهٔ ship/confirm دوباره‌پرداخت‌نکردن، مجوزها، قیمت جعلی، cursor کیف پول، گیت dev-topup.
- باگ تست‌ها که گرفته شد: تست کیف پول اول روی یک واریانت مشترک بود و قفل ردیف واریانت تصادفی serialize می‌کرد — با واریانت‌های متمایز بازنویسی شد تا واقعاً مسابقهٔ کیف پول آزموده شود (موتاسیون M2 بدون این اصلاح fail نمی‌شد).
- تست‌ها بدون اسکیمای تست skip می‌شوند (گارد schema=liveshop_test + بی‌اثر شدن beforeAll) تا `bun test src/lib` گمراه نشود — ۹ fail شناخته‌شدهٔ قبلی دست‌نخورده ماند.
- موتاسیون (هر بار فقط تست هدف قرمز و بعد revert): M1 کسر بی‌شرط موجودی، M2 حذف FOR UPDATE، M3 حذف چک مالکیت کلید، M4 حذف چک تراز، M5 تریگر بی‌اثر (RETURN COALESCE)، M6 حذف گارد آزادسازی، M7 حذف فیلتر مالکیت، M8 پذیرش قیمت کلاینت.
- verify: ۶۷ تست سرور سبز (۳۸ قبلی + ۲۹ جدید)، ۲۴۴+ تست lib/hooks بدون رگرسیون (مجموع skipهای دیتابیس‌دار جدید: ۲۹)، tsc صفر خطا در src، lint پاک؛ seed و migration chain (تست migration.test روی اسکیمای تازه با migration جدید) سبز؛ README (db:extras/reconcile/تعداد تست) + CHANGELOG بخش v2.0.0 + نسخهٔ 2.0.0.

Stage Summary:
- v2.0.0 کامل: دفتر دوطرفهٔ فقط-INSERT با تریگر، تسویهٔ یک‌تراکنشی با idempotency/قفل کیف پول/کسر شرطی موجودی، امانت با آزادسازی یک‌باره، dev-topup gated، reconcile script؛ UI یک خط هم تغییر نکرد.
- صادقانه: تست‌ها ماژول‌سطح‌اند نه HTTP؛ پرگارهای PURCHASE_HOLD بدون orderId (ترتیب f قبل از g)؛ courier→peyk با fees.ts یکی شد؛ jobهای §8 و topup واقعی و dispute در فازهای بعد؛ UI هنوز به API وصل نیست.

---
Task ID: v2.0.1
Agent: main (Z.ai Code)
Task: شیت معرفی فروشندگی (SellerIntroSheet) — Drawer پایین برای مهمان/none با دو نقطهٔ ورود (تب «فروش» + ردیف «فروشندهٔ من»)، سه مزیت با آیکون lucide، دکمه‌های «شروع» و «سؤالات متداول فروشنده»، بدون ایموجی، عکس‌ها فقط از public پروژه + اسکرین‌شات موبایل (مهمان و کاربر none)

Work Log:
- recon: AppShell (تب «فروش» + گیت مهمان v1.9.1)، ProfileView (ردیف «فروشندهٔ من»)، seller-status.ts و seller-onboarding-store (گیت ۵ وضعیت + کلید دموی ‎?seller=‎)، ui/drawer.tsx (vaul آماده با دستگیره)، login-sheet.tsx (الگوی شیت سراسری)، FaqView.tsx (الگوی آکاردئون + DraftBadge)، media.ts/items.ts (نقشهٔ عکس‌ها و عنوان واقعی کالاها).
- فایل‌های جدید: src/store/seller-intro-store.ts (باز/بسته) و src/components/liveshop/seller-intro-sheet.tsx (Drawer + هوک useSellerEntry). گیت: شیت فقط برای مهمانِ بدون کلید دمو یا وضعیت none؛ pending/rejected/suspended/approved مستقیم (رفتار v1.9.1)؛ با کلید دموی صریح، مسیر قبلی حفظ می‌شود. «شروع»: مهمان ← شیت ورود → پس از ورود setRoot(sellerDashboard)+push(sellerOnboarding)؛ none ← مستقیم فرم. ردیف عکس: it1/ct1/it8/it3/ct2 از ITEM_PHOTO با alt عنوان واقعی — it5 کنار گذاشته شد چون عکس تولیدشدهٔ قدیمی آن (صندل) با عنوان داده («هودی اورسایز») نمی‌خواند (ناهم‌خوانی قدیمی داده/عکس — فقط گزارش شد).
- SellerFaqView.tsx جدید (۵ موضوع: شروع فروشندگی/کارمزد/تسویه امانی/ارسال/اختلاف؛ متن کارمزد با پلکان fees.ts هم‌راستا: ۸٪/۵٪/۳٪) + ViewName «sellerFaq» در app-store + ثبت در AppShell (خارج از NAV_VIEWS مثل FAQ خریدار).
- سیم‌کشی: AppShell — تب «فروش» → handleSellerEntry، سوارکردن SellerIntroSheet کنار LoginSheet، حذف useAuthStore بلااستفاده؛ ProfileView — ردیف «فروشندهٔ من» → handleSellerEntry (requireAuth از useAuth حذف شد چون دیگر استفاده نمی‌شد).
- راستی‌آزمایی مرورگر واقعی (agent-browser، موبایل 390×844 + دسکتاپ 1280×800): مهمان: تب «فروش» و ردیف «فروشندهٔ من» → شیت (نه شیت ورود)؛ شیت → «شروع» → ورود OTP → فرود مستقیم روی فرم «شروع فروش»؛ بازگشت → بخش شروع پنل. none: تب «فروش» → شیت → «شروع» → فرم؛ «سؤالات متداول فروشنده» → صفحهٔ جدید (آکاردئون باز/بسته هم تست شد). pending/approved/suspended/rejected (کلیدهای دمو): drawer_count=0 — بدون شیت، مستقیم کارت وضعیت/پنل. بسته‌شدن با درگ ~۴۰۰px ماوس روی دستگیره، ✕ و Escape هر سه تأیید شد. دسکتاپ: شیت وسط‌چین max-w-md؛ هم‌پوشانی ✕ با گوشهٔ ردیف عکس با pt-7 رفع و هر دو عکس رسمی دوباره گرفته شد.
- errors کنسول: فقط هشدار قدیمی LCP مربوط به live-sh1.jpg (پیش‌موجود، بی‌ربط) — بدون خطای جدید.
- docs و نسخه: CHANGELOG بخش [v2.0.1] (با تغییر رفتار مهمان و نکته‌های صادقانه)، INDEX.md (هدر به‌روزرسانی‌شده + ۳ ردیف در جدول الفبایی + بخش v2.0.1 با ۳ عکس و نکته‌های DPR=1/it5/بدون Whatnot)، نسخه v2.0.1 در src/lib/config.ts و package.json؛ tsc صفر خطای src؛ lint پاک.

Stage Summary:
- v2.0.1 کامل: شیت معرفی فروشندگی فقط برای مهمان/none (Drawer پایین با ردیف عکس، عنوان «می‌خواهی بفروشی؟»، سه مزیت lucide، «شروع» و «سؤالات متداول فروشنده»)، دو نقطهٔ ورود، صفحهٔ جدید FAQ فروشنده، ۳ اسکرین‌شات (seller-intro-guest-v201 / seller-intro-none-v201 / seller-faq-v201) — مجموع عکس‌ها ۲۸۱.
- تصمیم‌ها: شیت سراسری با استور کوچک (هم‌الگوی LoginSheet) تا دو نقطهٔ ورود مستقل باشند؛ عکس‌ها از تک‌منبع ITEM_PHOTO با alt صادقانه؛ حفظ رفتار کلیدهای دموی ‎?seller=‎.
- صادقانه: it5 ناهم‌خوانی داده/عکس قدیمی (فقط گزارش، اصلاح بیرون از محدوده)؛ عکس‌های این نسخه DPR=1 (۳۹۰px) نه DPR=2؛ «سلام علی» هاردکد خانه برای مهمان (میراث قبل از v1.9.0، دست نخورد)؛ تست واحد lib جدید برای این UI اضافه نشد — منطق گیت در هوک متصل به استورهاست و رفتارش end-to-end در مرورگر پوشش داده شد.
