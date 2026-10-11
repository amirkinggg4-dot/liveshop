/**
 * v1.8.0 — اسکرین‌شات‌های «سفارش‌ها + کیف پول + تسویه»
 * Playwright روی dev server (پورت ۳۰۰۰) — موبایل ۳۹۰ + دسکتاپ ۱۲۸۰
 * قانون: هر عکس دقیقاً همان چیزی است که نامش می‌گوید — assert محتوایی قبل از ذخیره.
 */
import { chromium, type Browser, type Page } from "playwright";
import fs from "node:fs";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";

const results: { name: string; ok: boolean; note?: string }[] = [];

async function shot(page: Page, name: string, expect: string[], fullPage = false) {
  await page.waitForTimeout(420);
  const text = await page.evaluate(() => document.body.innerText);
  for (const e of expect) {
    if (!text.includes(e)) {
      results.push({ name, ok: false, note: `missing: ${e}` });
      console.error(`✗ ${name} — missing «${e}»`);
      return;
    }
  }
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  results.push({ name, ok: true });
  console.log(`✓ ${name}`);
}

async function gotoOrders(page: Page) {
  await page.getByRole("navigation").getByRole("button", { name: "سفارش‌ها" }).click();
  await page.waitForTimeout(700);
}

async function openFirstOrder(page: Page) {
  await page.getByRole("button", { name: /مشاهدهٔ سفارش/ }).first().click();
  await page.waitForTimeout(800);
}

/* ═══════════ main ═══════════ */
async function run() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser: Browser = await chromium.launch();

  /* ═════════ موبایل ۳۹۰ ═════════ */
  const mctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "fa-IR",
  });
  const m = await mctx.newPage();
  m.on("pageerror", (e) => console.error("PAGEERROR:", e.message));

  /* ── ۱) فهرست — هر ۴ تب ── */
  await m.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await gotoOrders(m);
  await shot(m, "orders-list-all-v180", ["سفارش‌های من", "در انتظار ارسال", "لغو و مسترد"]);
  await m.getByRole("tab", { name: /جاری/ }).click();
  await shot(m, "orders-list-active-v180", ["ارسال‌شده", "در انتظار ارسال"]);
  await m.getByRole("tab", { name: /تحویل‌شده/ }).click();
  await shot(m, "orders-list-delivered-v180", ["تحویل‌شده", "مبلغ آزاد شد"]);
  await m.getByRole("tab", { name: /لغو و مسترد/ }).click();
  await shot(m, "orders-list-closed-v180", ["لغو شد", "مسترد شد"]);

  /* ── ۲) جستجو + حالت خالی ── */
  await m.getByRole("tab", { name: /همه/ }).click();
  await m.getByRole("textbox", { name: "جستجو در سفارش‌ها" }).fill("جردن");
  await shot(m, "orders-search-v180", ["جردن ۱ مید"]);
  await m.getByRole("textbox", { name: "جستجو در سفارش‌ها" }).fill("zzzz");
  await shot(m, "orders-search-empty-v180", ["چیزی پیدا نشد"]);

  /* ── ۳) جزئیات در ۶ مرحله (?orderStage=) ── */
  const stages: { key: string; name: string; expect: string[] }[] = [
    { key: "ready", name: "order-stage-ready-v180", expect: ["در انتظار ارسال", "لغو سفارش", "پرداخت امانی"] },
    { key: "shipped", name: "order-stage-shipped-v180", expect: ["ارسال‌شده", "تحویل گرفتم", "گزارش مشکل"] },
    { key: "delivered", name: "order-stage-delivered-v180", expect: ["تحویل‌شده", "آزادسازی مبلغ به فروشنده", "گزارش مشکل"] },
    { key: "released", name: "order-stage-released-v180", expect: ["مبلغ آزاد شد", "امتیاز به فروشنده", "سفارش دوباره"] },
    { key: "disputed", name: "order-stage-disputed-v180", expect: ["پیگیری اختلاف", "در بررسی کارشناس"] },
    { key: "canceled", name: "order-stage-canceled-v180", expect: ["لغو سفارش", "به کیف پول بازگشت"] },
  ];
  for (const st of stages) {
    await m.goto(`${BASE}/?orderStage=${st.key}`, { waitUntil: "networkidle" });
    await gotoOrders(m);
    await openFirstOrder(m);
    await shot(m, st.name, st.expect);
  }

  /* ── ۴) دیالوگ لغو + نتیجه ── */
  await m.goto(`${BASE}/?orderStage=ready`, { waitUntil: "networkidle" });
  await gotoOrders(m);
  await openFirstOrder(m);
  await m.getByRole("button", { name: /لغو سفارش — بازگشت مبلغ/ }).click();
  await shot(m, "order-cancel-dialog-v180", ["سفارش لغو شود؟", "بله، لغو کن"]);
  await m.getByRole("button", { name: "تأیید لغو سفارش" }).click();
  await shot(m, "order-cancel-result-v180", ["لغو سفارش", "به کیف پول بازگشت"]);

  /* ── ۵) دیالوگ تأیید تحویل ── */
  await m.goto(`${BASE}/?orderStage=shipped`, { waitUntil: "networkidle" });
  await gotoOrders(m);
  await openFirstOrder(m);
  await m.getByRole("button", { name: /تحویل گرفتم — ثبت تحویل/ }).click();
  await shot(m, "order-deliver-dialog-v180", ["مرسوله را تحویل گرفتی؟", "بله، تحویل گرفتم"]);
  await m.getByRole("button", { name: "تأیید — تحویل گرفتم" }).click();

  /* ── ۶) دیالوگ امتیاز (released) ── */
  await m.goto(`${BASE}/?orderStage=released`, { waitUntil: "networkidle" });
  await gotoOrders(m);
  await openFirstOrder(m);
  await m.getByRole("button", { name: "امتیاز به فروشنده" }).click();
  await shot(m, "order-rating-dialog-v180", ["امتیاز به فروشنده", "بسته‌بندی عالی", "اصل بود"]);
  /* امتیاز ثبت‌شده — با برچسب + متن */
  await m.getByRole("radio", { name: "۵ ستاره" }).click();
  await m.getByRole("button", { name: "بسته‌بندی عالی" }).click();
  await m.getByRole("button", { name: "ارسال سریع" }).click();
  await m.getByRole("textbox", { name: "متن اختیاری نظر" }).fill("بسته‌بندی خیلی مرتب بود، ممنون.");
  await m.getByRole("button", { name: /ثبت امتیاز/ }).click();
  await shot(m, "order-rated-v180", ["امتیاز تو ثبت شد", "بسته‌بندی عالی", "ارسال سریع"]);

  /* ── ۷) شیت اختلاف + بخش پیگیری ── */
  await m.goto(`${BASE}/?orderStage=shipped`, { waitUntil: "networkidle" });
  await gotoOrders(m);
  await openFirstOrder(m);
  await m.getByRole("button", { name: /گزارش مشکل/ }).click();
  await shot(m, "order-dispute-sheet-v180", ["ضمانت خریدار", "دلیل اختلاف"]);
  await m.getByRole("radio", { name: /مطابقت نداشتن/ }).click();
  const disputeBox = m.getByRole("textbox", { name: "توضیح اختلاف" });
  await disputeBox.fill("رنگ کالا با عکس لایو فرق داشت.");
  if ((await disputeBox.inputValue()).indexOf("رنگ کالا") === -1) {
    results.push({ name: "order-dispute-filled-v180", ok: false, note: "textarea not filled" });
    console.error("✗ order-dispute-filled-v180 — textarea not filled");
  } else {
    await shot(m, "order-dispute-filled-v180", ["ضمانت خریدار", "دلیل اختلاف"]);
  }

  /* پیگیری اختلاف سفارش seed */
  await m.goto(`${BASE}/?orderStage=disputed`, { waitUntil: "networkidle" });
  await gotoOrders(m);
  await openFirstOrder(m);
  await shot(m, "order-dispute-tracking-v180", ["پیگیری اختلاف", "در بررسی کارشناس"]);

  /* ── ۸) رسید چاپی ── */
  await m.goto(`${BASE}/?orderStage=released`, { waitUntil: "networkidle" });
  await gotoOrders(m);
  await openFirstOrder(m);
  await m.getByRole("button", { name: /دریافت رسید/ }).click();
  await shot(m, "order-receipt-v180", ["رسید سفارش", "مجموع پرداخت", "چاپ رسید"]);

  /* ── ۹) تماس با فروشنده (سفارش paid — پیام‌های seed دارد) ── */
  await m.goto(`${BASE}/?orderStage=paid`, { waitUntil: "networkidle" });
  await gotoOrders(m);
  await openFirstOrder(m);
  await m.getByRole("button", { name: /تماس با فروشنده/ }).click();
  await shot(m, "order-contact-v180", ["گفتگو با", "بسته‌بندی ضدضربه"]);

  /* ── ۱۰) کیف پول — اصلی + شارژ + شیت تراکنش ── */
  await m.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await m.getByRole("button", { name: /موجودی کیف پول/ }).click();
  await shot(m, "wallet-main-v180", ["موجودی قابل استفاده", "تاریخچهٔ تراکنش‌ها", "بازگشت وجه"]);

  /* شارژ — خطای کف + رسید */
  await m.getByRole("button", { name: "شارژ کیف پول", exact: true }).click();
  await m.getByRole("button", { name: "ادامه" }).click();
  await m.getByRole("textbox", { name: "مبلغ شارژ به تومان" }).fill("۲۰٬۰۰۰");
  await shot(m, "wallet-charge-min-v180", ["حداقل مبلغ شارژ"]);
  await m.getByRole("textbox", { name: "مبلغ شارژ به تومان" }).fill("۸۰۰٬۰۰۰");
  await m.getByRole("button", { name: /از طریق درگاه/ }).click();
  await m.waitForTimeout(1700);
  await shot(m, "wallet-charge-receipt-v180", ["پرداخت موفق!", "شناسهٔ مرجع", "موجودی جدید"]);
  await m.getByRole("button", { name: "بازگشت به کیف پول" }).click();
  await m.waitForTimeout(600);
  await m.getByRole("button", { name: /جزئیات تراکنش/ }).first().click();
  await shot(m, "wallet-tx-sheet-v180", ["شناسهٔ مرجع", "وضعیت", "موفق"]);

  /* ── ۱۱) تسویه + خرید سریع ── */
  await m.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await m.getByRole("button", { name: "ورود به شو زندهٔ کفش‌خانهٔ سینا" }).click();
  await m.waitForTimeout(1500);
  await m.getByRole("button", { name: /مشاهدهٔ محصول: نایک دَنک/ }).first().click();
  await m.waitForTimeout(900);
  await m.getByRole("button", { name: /خرید فوری به مبلغ|خرید به قیمت/ }).first().click();
  await m.waitForTimeout(900);
  await shot(m, "checkout-v180", ["تسویهٔ سفارش", "قابل پرداخت", "روش ارسال"]);

  await m.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await m.getByRole("button", { name: "ورود به شو زندهٔ کفش‌خانهٔ سینا" }).click();
  await m.waitForTimeout(1500);
  await m.getByRole("button", { name: /خرید نایک دَنک/ }).first().click();
  await m.waitForTimeout(900);
  await shot(m, "quick-checkout-v180", ["خرید سریع", "قابل پرداخت", "روش ارسال"]);

  await mctx.close();

  /* ═════════ دسکتاپ ۱۲۸۰ — یک عکس از هر صفحه ═════════ */
  const dctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
    locale: "fa-IR",
  });
  const d = await dctx.newPage();
  d.on("pageerror", (e) => console.error("PAGEERROR-D:", e.message));

  await d.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await gotoOrders(d);
  await shot(d, "orders-list-desktop-v180", ["سفارش‌های من", "در انتظار ارسال"]);

  await d.goto(`${BASE}/?orderStage=delivered`, { waitUntil: "networkidle" });
  await gotoOrders(d);
  await openFirstOrder(d);
  await shot(d, "order-detail-desktop-v180", ["آزادسازی مبلغ به فروشنده", "وضعیت سفارش"]);

  await d.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await d.getByRole("button", { name: /موجودی کیف پول/ }).click();
  await shot(d, "wallet-desktop-v180", ["موجودی قابل استفاده", "تاریخچهٔ تراکنش‌ها"]);

  await d.goto(`${BASE}/?orderStage=released`, { waitUntil: "networkidle" });
  await gotoOrders(d);
  await openFirstOrder(d);
  await d.getByRole("button", { name: /دریافت رسید/ }).click();
  await shot(d, "order-receipt-desktop-v180", ["رسید سفارش", "مجموع پرداخت"]);

  await d.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await d.getByRole("button", { name: "ورود به شو زندهٔ کفش‌خانهٔ سینا" }).click();
  await d.waitForTimeout(1500);
  await d.getByRole("button", { name: /مشاهدهٔ محصول: نایک دَنک/ }).first().click();
  await d.waitForTimeout(900);
  await d.getByRole("button", { name: /خرید فوری به مبلغ|خرید به قیمت/ }).first().click();
  await d.waitForTimeout(900);
  await shot(d, "checkout-desktop-v180", ["تسویهٔ سفارش", "قابل پرداخت"]);

  await dctx.close();
  await browser.close();

  /* ── گزارش ── */
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} shots OK`);
  if (failed.length) {
    for (const f of failed) console.error(`FAIL ${f.name}: ${f.note}`);
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
