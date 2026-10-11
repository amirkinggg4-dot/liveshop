/**
 * v1.7.0 — اسکرین‌شات‌های نمای فروشنده
 * Playwright روی dev server (پورت ۳۰۰۰) — موبایل ۳۹۰ + دسکتاپ ۱۲۸۰
 * قانون: هر عکس دقیقاً همان چیزی است که نامش می‌گوید — بدون تکرار.
 */
import { chromium, type Browser, type Page } from "playwright";

const OUT = "docs/screenshots";
const BASE = "http://localhost:3000";

const results: { name: string; ok: boolean; note?: string }[] = [];

async function shot(page: Page, name: string, fullPage = false) {
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  results.push({ name, ok: true });
  console.log(`✓ ${name}`);
}

/* ناوبری SPA با کلیک — از خانه به پنل فروشنده */
async function gotoSellerHub(page: Page) {
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "فروش", exact: true }).click();
  await page.waitForTimeout(600);
}

async function openInventory(page: Page) {
  await gotoSellerHub(page);
  await page.getByRole("button", { name: "انبار کالا" }).first().click();
  await page.waitForTimeout(700);
}

async function openSchedule(page: Page) {
  await gotoSellerHub(page);
  await page.getByRole("button", { name: "شوها" }).first().click();
  await page.waitForTimeout(900);
}

/* ═══════════ main ═══════════ */
async function run() {
  const browser: Browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: "fa-IR",
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.error("PAGEERROR:", e.message));

  /* ── ۱) onboarding — فرم (?seller=none) ── */
  await page.goto(`${BASE}/?seller=none`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "فروش", exact: true }).click();
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "شروع فروش — ثبت درخواست فروشندگی" }).click();
  await page.waitForTimeout(700);
  /* فرم را با داده پر کن تا اسکرین‌شات «فرم پرشده» معنادار باشد */
  await page.getByRole("button", { name: "دستهٔ اصلی گیاه و گلخانه" }).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "دستهٔ اصلی گیاه و گلخانه" }).click();
  await shot(page, "seller-onboarding-form-mobile");

  /* پر کردن فرم + ارسال → در انتظار تأیید */
  await page.getByRole("textbox", { name: "نام فروشگاه" }).fill("گلخانهٔ مینا");
  await page.getByRole("textbox", { name: "شناسهٔ فروشگاه به لاتین" }).fill("mina-garden");
  await page.getByRole("textbox", { name: "کد ملی — ده رقم" }).fill("0451234561");
  await page.getByRole("textbox", { name: "شماره شبا — آی‌آر و بیست‌وچهار رقم" }).fill("IR580540105180021273113007");
  /* عکس مدرک و پذیرش قوانین از seed فعال‌اند — کلیک آنها را خاموش می‌کند */
  await page.waitForTimeout(250);
  await shot(page, "seller-onboarding-form-filled-mobile");
  /* در انتظار تأیید — با کلید وضعیت (چون ?seller=none فرم را اجباری نشان می‌دهد) */
  await page.goto(`${BASE}/?seller=pending`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "فروش", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "مشاهدهٔ وضعیت درخواست فروشندگی" }).click();
  await page.waitForTimeout(600);
  await shot(page, "seller-onboarding-pending-mobile");

  /* ── ۲) onboarding — رد شده و تعلیق (?seller=rejected|suspended) ── */
  await page.goto(`${BASE}/?seller=rejected`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "فروش", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "مشاهدهٔ وضعیت درخواست فروشندگی" }).click();
  await page.waitForTimeout(600);
  await shot(page, "seller-onboarding-rejected-mobile");

  await page.goto(`${BASE}/?seller=suspended`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "فروش", exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole("button", { name: "مشاهدهٔ وضعیت درخواست فروشندگی" }).click();
  await page.waitForTimeout(600);
  await shot(page, "seller-onboarding-suspended-mobile");

  /* ── ۳) پنل فروشنده با گیت قفل (?seller=pending) ── */
  await page.goto(`${BASE}/?seller=pending`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "فروش", exact: true }).click();
  await page.waitForTimeout(700);
  await shot(page, "seller-hub-gated-mobile");

  /* ── ۴) زمان‌بندی — تقویم + ساعت ── */
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "فروش", exact: true }).click();
  await page.getByRole("button", { name: "شوها" }).first().click();
  await page.waitForTimeout(1000);
  await shot(page, "seller-schedule-calendar-mobile");

  /* انتخاب روز + ساعت + دو کالا */
  await page.getByRole("button", { name: "ماه بعد" }).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "ماه قبل" }).click();
  await page.waitForTimeout(300);
  const dayBtn = page.getByRole("button", { name: "۲۱ قابل انتخاب" });
  if (await dayBtn.count()) {
    await dayBtn.click();
  } else {
    await page.getByRole("button", { name: "۲۲ قابل انتخاب" }).click();
  }
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "ساعت ۲۱:۱۵" }).click();
  await page.waitForTimeout(300);
  await shot(page, "seller-schedule-datetime-mobile");

  /* ── ۵) انتخاب کالا با عکس ── */
  await page.getByRole("button", { name: "افزودن نایک دَنک لو «پاندا» به شو" }).click();
  await page.getByRole("button", { name: "افزودن ادیداس سامبا اورجینال به شو" }).click();
  await page.getByRole("button", { name: "افزودن جردن ۱ مید «شیکاگو» به شو" }).click();
  await page.waitForTimeout(400);
  await page.getByRole("list", { name: "ترتیب کالاهای شو" }).scrollIntoViewIfNeeded();
  await shot(page, "seller-schedule-item-select-mobile");

  /* ── ۶) لغو شو — دیالوگ تأیید ── */
  const cancelBtn = page.getByRole("button", { name: /^لغو شو شب کتونی ۳/ });
  await cancelBtn.scrollIntoViewIfNeeded();
  await cancelBtn.click();
  await page.waitForTimeout(500);
  await shot(page, "seller-schedule-cancel-show-mobile");
  await page.getByRole("button", { name: "انصراف" }).click();
  await page.waitForTimeout(300);

  /* ── ۷) انبار — با عکس کالا ── */
  await openInventory(page);
  await shot(page, "seller-warehouse-with-images-mobile");

  /* ── ۸) موجودی هر سایز ── */
  await page.getByRole("button", { name: "نمایش موجودی گزینه‌های نایک دَنک لو «پاندا»" }).click();
  await page.waitForTimeout(400);
  await shot(page, "seller-inventory-per-size-stock-mobile");

  /* ── ۹) ویرایش کالا — دیالوگ با ورودی عددی فارسی ── */
  await page.getByRole("button", { name: "ویرایش ادیداس سامبا اورجینال" }).click();
  await page.waitForTimeout(500);
  await shot(page, "seller-inventory-product-edit-mobile");
  await page.getByRole("button", { name: "بستن" }).click();
  await page.waitForTimeout(300);

  /* ── ۱۰) هشدار موجودی کم + فیلتر ── */
  await page.getByRole("button", { name: /^موجودی کم/ }).click();
  await page.waitForTimeout(400);
  await shot(page, "seller-inventory-low-stock-mobile");

  /* ── ۱۱) اتاق آماده‌باش — صف شو با عکس ── */
  await gotoSellerHub(page);
  await page.getByRole("button", { name: "شروع لایو — اتاق آماده‌به‌پخش" }).click();
  await page.waitForTimeout(800);
  await page.getByRole("region", { name: "صف شو" }).scrollIntoViewIfNeeded();
  await shot(page, "seller-queue-with-images-mobile");

  /* ── ۱۲) داشبورد زنده — تب فروش با آمار همین پخش ── */
  await page.getByRole("button", { name: "شروع پخش زنده" }).click();
  await page.waitForTimeout(2000);
  /* تب «فروش» — آمار همین پخش (اوج بینندهٔ زنده) + ردیف فروش ثبت‌شده با عکس */
  await page.getByRole("button", { name: "داشبورد فروشنده — پشت دوربین" }).click();
  await page.waitForTimeout(900);
  await shot(page, "seller-live-dashboard-sales-tab-mobile");

  /* پایان پخش → گزارش پایان لایو */
  await page.getByRole("button", { name: "پایان پخش و مشاهدهٔ گزارش" }).click();
  await page.waitForTimeout(1000);
  await shot(page, "seller-live-end-report-mobile");

  await ctx.close();

  /* ═══════════ دسکتاپ — هر صفحهٔ جدید ═══════════ */
  const dctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
    locale: "fa-IR",
  });
  const dp = await dctx.newPage();
  dp.on("pageerror", (e) => console.error("PAGEERROR-DESKTOP:", e.message));

  /* onboarding فرم */
  await dp.goto(`${BASE}/?seller=none`, { waitUntil: "networkidle" });
  await dp.getByRole("button", { name: "فروش", exact: true }).click();
  await dp.waitForTimeout(600);
  await dp.getByRole("button", { name: "شروع فروش — ثبت درخواست فروشندگی" }).click();
  await dp.waitForTimeout(700);
  await dp.getByRole("textbox", { name: "نام فروشگاه" }).fill("گلخانهٔ مینا");
  await dp.getByRole("textbox", { name: "شناسهٔ فروشگاه به لاتین" }).fill("mina-garden");
  await dp.getByRole("textbox", { name: "کد ملی — ده رقم" }).fill("0451234561");
  await dp.getByRole("textbox", { name: "شماره شبا — آی‌آر و بیست‌وچهار رقم" }).fill("IR580540105180021273113007");
  await dp.waitForTimeout(300);
  await shot(dp, "seller-onboarding-form-filled-desktop");

  /* در انتظار */
  await dp.goto(`${BASE}/?seller=pending`, { waitUntil: "networkidle" });
  await dp.getByRole("button", { name: "فروش", exact: true }).click();
  await dp.waitForTimeout(500);
  await dp.getByRole("button", { name: "مشاهدهٔ وضعیت درخواست فروشندگی" }).click();
  await dp.waitForTimeout(600);
  await shot(dp, "seller-onboarding-pending-desktop");

  /* رد شده */
  await dp.goto(`${BASE}/?seller=rejected`, { waitUntil: "networkidle" });
  await dp.getByRole("button", { name: "فروش", exact: true }).click();
  await dp.waitForTimeout(500);
  await dp.getByRole("button", { name: "مشاهدهٔ وضعیت درخواست فروشندگی" }).click();
  await dp.waitForTimeout(600);
  await shot(dp, "seller-onboarding-rejected-desktop");

  /* تقویم زمان‌بندی */
  await dp.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await dp.getByRole("button", { name: "فروش", exact: true }).click();
  await dp.getByRole("button", { name: "شوها" }).first().click();
  await dp.waitForTimeout(1000);
  const dday = dp.getByRole("button", { name: "۲۱ قابل انتخاب" });
  if (await dday.count()) await dday.click();
  else await dp.getByRole("button", { name: "۲۲ قابل انتخاب" }).click();
  await dp.waitForTimeout(300);
  await dp.getByRole("button", { name: "ساعت ۲۱:۱۵" }).click();
  await dp.waitForTimeout(300);
  await shot(dp, "seller-schedule-calendar-desktop");

  /* انتخاب کالا */
  await dp.getByRole("button", { name: "افزودن نایک دَنک لو «پاندا» به شو" }).click();
  await dp.getByRole("button", { name: "افزودن ادیداس سامبا اورجینال به شو" }).click();
  await dp.waitForTimeout(400);
  await dp.getByRole("list", { name: "ترتیب کالاهای شو" }).scrollIntoViewIfNeeded();
  await shot(dp, "seller-schedule-item-select-desktop");

  /* لغو شو */
  const dcancel = dp.getByRole("button", { name: /^لغو شو شب کتونی ۳/ });
  await dcancel.scrollIntoViewIfNeeded();
  await dcancel.click();
  await dp.waitForTimeout(500);
  await shot(dp, "seller-schedule-cancel-show-desktop");
  await dp.getByRole("button", { name: "انصراف" }).click();

  /* انبار با عکس */
  await dp.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await dp.getByRole("button", { name: "فروش", exact: true }).click();
  await dp.getByRole("button", { name: "انبار کالا" }).first().click();
  await dp.waitForTimeout(800);
  await shot(dp, "seller-warehouse-with-images-desktop");

  /* موجودی هر سایز */
  await dp.getByRole("button", { name: "نمایش موجودی گزینه‌های نایک دَنک لو «پاندا»" }).click();
  await dp.waitForTimeout(400);
  await shot(dp, "seller-inventory-per-size-stock-desktop");

  /* ویرایش کالا */
  await dp.getByRole("button", { name: "ویرایش ادیداس سامبا اورجینال" }).click();
  await dp.waitForTimeout(500);
  await shot(dp, "seller-inventory-product-edit-desktop");
  await dp.getByRole("button", { name: "بستن" }).click();

  /* موجودی کم */
  await dp.getByRole("button", { name: /^موجودی کم/ }).click();
  await dp.waitForTimeout(400);
  await shot(dp, "seller-inventory-low-stock-desktop");

  /* گزارش پایان لایو (دسکتاپ) */
  await dp.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await dp.getByRole("button", { name: "فروش", exact: true }).click();
  await dp.getByRole("button", { name: "شروع لایو — اتاق آماده‌به‌پخش" }).click();
  await dp.waitForTimeout(800);
  await dp.getByRole("button", { name: "شروع پخش زنده" }).click();
  await dp.waitForTimeout(1800);
  await dp.getByRole("button", { name: "داشبورد فروشنده — پشت دوربین" }).click();
  await dp.waitForTimeout(800);
  await dp.getByRole("button", { name: "پایان پخش و مشاهدهٔ گزارش" }).click();
  await dp.waitForTimeout(1000);
  await shot(dp, "seller-live-end-report-desktop");

  await dctx.close();
  await browser.close();

  console.log(`\n${results.length} screenshots captured.`);
}

run().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
