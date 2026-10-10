# LiveShop — بک‌اند فاز ۱ (Postgres + ورود با OTP + API کالا و شو)

> قرارداد کامل API در [`docs/api-spec.md`](./api-spec.md) است. این سند راه‌اندازی و محدودهٔ تحویل‌شدهٔ «فاز ۱» را توضیح می‌دهد.
> **UI دست نخورده است** — کل فرانت‌اند (۱۳ استور zustand + دیتای mock در `src/lib/data`) دقیقاً مثل v1.4.1 کار می‌کند؛ فاز ۱ فقط زیرساخت سرور است تا فازهای بعد (چک‌اوت، لایو، ...) روی آن ساخته شود.

## چه چیزی در فاز ۱ تحویل شد

| بخش | مسیرها | وضعیت |
| --- | --- | --- |
| سلامت سرویس | `GET /api` | ✅ ping دیتابیس |
| احراز هویت | `POST /api/v1/auth/otp/request` · `POST /api/v1/auth/otp/verify` · `POST /api/v1/auth/refresh` | ✅ JWT ۱۵ دقیقه + refresh ۳۰ روزه با چرخش و تشخیص reuse |
| پروفایل | `GET /api/v1/me` · `PATCH /api/v1/me` | ✅ به‌همراه موجودی کیف پول (از دفترکل دوبل) |
| کشف (Discovery) | `GET /api/v1/categories` · `GET /api/v1/shows` · `GET /api/v1/shows/:id` · `GET /api/v1/sellers/:slugOrId` · `GET /api/v1/search?q=` · `POST/DELETE /api/v1/sellers/:id/follow` | ✅ کارت شوها شامل «قیمت + موجودیِ کالای پین‌شده» |

بخش‌های ۳ تا ۹ اسپک (اتاق لایو/Realtime، چک‌اوت امانی، درگاه کیف پول، پنل فروشنده، ادمین، jobs، چک‌لیست نهایی امنیت) **عمداً برای فازهای بعد** مانده‌اند.

## دیتابیس — PostgreSQL واقعی

اسکیمای Prisma به `postgresql` مهاجرت کرد (`prisma/schema.prisma`). دو قید بیزینسی به‌صورت raw SQL در همان migration اول اعمال شده‌اند:

```sql
ALTER TABLE "Variant" ADD CONSTRAINT stock_nonneg CHECK (stock >= 0);
CREATE UNIQUE INDEX "one_pinned_per_show" ON "ShowItem" ("showId") WHERE "pinned";
```

### راه‌اندازی محلی (بدون نصب PostgreSQL روی سیستم)

```bash
bun install
cp .env.example .env            # AUTH_SECRET را با «openssl rand -hex 32» پر کنید

bun run postgres                # PostgreSQL 17 واقعی روی localhost:5432 (باینری از پیش ساخته‌شده، داده‌ها در db/postgres/)
bun run db:deploy               # اعمال migrationها
bun run db:seed                 # دادهٔ دموی فارسی (همان دنیای mock اپ)
bun run dev                     # Next.js روی :3000
```

اسکریپت `scripts/dev-postgres.ts` یک سرور Postgres واقعی (بستهٔ `embedded-postgres`) را در `db/postgres/` بالا می‌آورد و idempotent است. برای production فقط `DATABASE_URL` را به یک Postgres واقعی (Neon/Supabase/RDS/…) بدهید و `bun run db:deploy` بزنید.

## جریان ورود (OTP)

```
POST /api/v1/auth/otp/request  { "phone": "09121234567" }
  ← { "delivery": "console", "expiresInSeconds": 120, "devCode": "482913" }   (بدون سرویس SMS)
POST /api/v1/auth/otp/verify   { "phone": "09121234567", "code": "482913" }
  ← { "accessToken", "refreshToken", "expiresIn": 900, "user", "isNewUser" }
GET  /api/v1/me                Authorization: Bearer <accessToken>
POST /api/v1/auth/refresh      { "refreshToken": "…" }   → جفت تازه؛ توکن قبلی باطل
```

- کدها ۶ رقمی، هش‌شده با HMAC-SHA256، عمر ۲ دقیقه، حداکثر ۵ تلاش، یک‌بارمصرف.
- محدودیت نرخ طبق اسپک: **۳ درخواست در ۱۰ دقیقه به‌ازای هر شماره و هر IP** (`429 RATE_LIMITED`).
- SMS واقعی: `KAVENEGAR_API_KEY` را در `.env` بگذارید؛ تا آن زمان کد به کنسول سرور چاپ و به‌صورت `devCode` در پاسخ (فقط در حالت بدون provider) برگردانده می‌شود.
- چرخش refresh: هر بار توکن جدید صادر می‌شود؛ استفادهٔ دوباره از توکن چرخیده/منقضی، **تمام نشست‌های آن کاربر** را باطل می‌کند (`401 INVALID_REFRESH_TOKEN`).

## نمونه‌های پاسخ

```jsonc
// GET /api/v1/shows?status=LIVE
{
  "shows": [{
    "id": "…", "title": "شب کتونی نایاب — همه با قیمت ثابت",
    "status": "LIVE", "viewers": 1240,
    "category": { "slug": "sneakers", "nameFa": "کتونی و کفش" },
    "seller": { "shopName": "کفش‌خانهٔ سینا", "slug": "sina-sneaks", "verified": true },
    "pinnedItem": { "productTitle": "نایک دانک لو پاندا", "price": 7950000, "stock": 16 }
  }],
  "nextCursor": "1760000000000_cmv2…"
}

// خطا (قرارداد اسپک)
{ "error": { "code": "NOT_FOUND", "message": "شو پیدا نشد" } }
```

## معماری و امنیت فاز ۱

- `src/lib/server/http.ts` — قرارداد خطا (`{ error: { code, message } }` با پیام فارسی)، wrapper یکسان برای همهٔ هندلرها، zod برای اعتبارسنجی ورودی.
- `src/lib/server/auth.ts` — امضا/راستی‌آزمایی JWT (jose، HS256، issuer `liveshop`)، چرخش refresh (هش SHA-256 در دیتابیس؛ مقدار خام فقط نزد کلاینت)، محاسبهٔ موجودی کیف پول از `SUM(LedgerEntry)`.
- `src/lib/server/otp.ts` — نرمال‌سازی شماره (`09…` / `+98…` / `0098…`)، هش کد، محدودیت نرخ، ارسال با کاوه‌نگار یا کنسول.
- `src/lib/server/shows.ts` — include مشترک و سریالایز «کارت شو» (کالای پین‌شده + موجودی جمع واریانت‌ها).
- هرگز قیمت/موجودی/تعداد به کلاینت واگذار نمی‌شود؛ ورودی‌ها zod؛ خطاهای داخلی log و پیام ۵۰۰ عمومی.
- افزوده‌های کوچک نسبت به اسکیمای داده‌شده (همگی برای نیاز واقعی فاز ۱ و در کامنت schema ذکر شده): `RefreshToken` (چرخش اسپک §1)، `OtpCode.requestIp` (محدودیت per-IP اسپک §1)، `SellerProfile.avatarUrl` (فروشگاه/کارت‌های لایو)، `Show.createdAt` (مرتب‌سازی و cursor پایدار فید `/shows`).

## دادهٔ دمو (seed)

۵ فروشندهٔ تأییدشده (همان‌های mock: سینا/مینا/کلکسیون‌یار/گجت‌بازار/عطر و نگین)، ۱۰ دسته، ۱۰ کالا با ۲۸ واریانت سایز، ۳ شو LIVE + ۱ SCHEDULED + ۱ ENDED (هر شو یک کالای پین‌شده)، و خریدار دمو **۰۹۱۲۱۲۳۴۵۶۷** با کیف پول ۵٬۰۰۰٬۰۰۰ تومانی (دو ردیف دفترکل با `txnId` که جمعشان صفر است).
