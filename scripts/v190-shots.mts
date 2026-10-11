/**
 * v1.9.0 — اسکرین‌شات‌های «حساب و ورود»
 * Playwright روی dev server (پورت ۳۰۰۰) — موبایل ۳۹۰ + دسکتاپ ۱۲۸۰
 * قانون: هر عکس دقیقاً همان چیزی است که نامش می‌گوید — assert محتوایی قبل از ذخیره.
 * جریان ورود با دکمه‌های واقعی UI رانده می‌شود (بدون کلید دمو — کد دمو از خود شیت خوانده می‌شود).
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

async function gotoAccount(page: Page) {
  await page.getByRole("navigation").getByRole("button", { name: "حساب", exact: true }).click();
  await page.waitForTimeout(700);
}

/** کلیک مقاوم: تلاش عادی کوتاه، بعد fallback با dispatchEvent (بایپس hit-test) */
async function hardClick(page: Page, locator: ReturnType<Page["getByRole"]>) {
  try {
    await locator.click({ timeout: 6000 });
  } catch {
    await locator.dispatchEvent("click");
  }
  await page.waitForTimeout(350);
}

/** خروج از حساب (دمو با کاربر seed لاگین شروع می‌شود) */
async function logout(page: Page) {
  await gotoAccount(page);
  await page.getByRole("button", { name: "خروج از حساب" }).click();
  await page.waitForTimeout(700);
  if ((await page.locator("[role=alertdialog]").count()) === 0) {
    // retry یک بار
    await page.getByRole("button", { name: "خروج از حساب" }).click();
    await page.waitForTimeout(700);
  }
  try {
    await page
      .locator("[role=alertdialog]")
      .getByRole("button", { name: "بله، خارج شو" })
      .click({ timeout: 5000 });
  } catch {
    /* fallback — کلیک مستقیم DOM (فقط بستن دیالوگ دمو) */
    await page.evaluate(() => {
      const btn = [...document.querySelectorAll("[role=alertdialog] button")].find(
        (b) => b.textContent?.includes("خارج شو")
      );
      btn?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      btn?.click();
    });
  }
  await page.waitForTimeout(700);
}

/** بازکردن شیت ورود از حالت مهمان تا گام کد — خروجی: کد دمو */
async function loginFlow(page: Page, phone: string) {
  await gotoAccount(page);
  await page.getByRole("button", { name: "ورود / ثبت‌نام" }).click();
  await page.waitForTimeout(600);
  await page.getByRole("textbox", { name: "شمارهٔ موبایل" }).fill(phone);
  await page.getByRole("button", { name: "دریافت کد تأیید" }).click();
  await page.waitForTimeout(700);
  const hint = await page.getByText(/کد دمو:/).innerText();
  return hint.match(/[۰-۹]{6}/)?.[0] ?? "";
}

/** پرکردن ۶ خانهٔ کد با کد فارسی/لاتین */
async function fillCode(page: Page, codeFa: string) {
  const latin = codeFa.replace(/[۰-۹]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x06f0 + 0x30)
  );
  const inputs = page.locator('input[aria-label^="رقم"]');
  for (let i = 0; i < 6; i++) {
    await inputs.nth(i).fill(latin[i]);
  }
  await page.waitForTimeout(500);
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

  /* ── ۱) پروفایل لاگین‌شده ── */
  await m.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await gotoAccount(m);
  await shot(m, "profile-main-v190", ["علی رضایی", "@ali_rezaei", "آدرس‌ها", "نماد اعتماد الکترونیکی"]);

  /* ── ۲) ویرایش پروفایل ── */
  await m.getByRole("button", { name: "ویرایش پروفایل" }).click();
  await shot(m, "profile-edit-v190", ["ویرایش پروفایل", "نام کاربری", "ذخیره"]);

  /* ── ۳) آدرس‌ها: فهرست / فرم / خطا ── */
  await m.getByRole("button", { name: "بازگشت", exact: true }).click();
  await m.waitForTimeout(500);
  await m.getByRole("button", { name: "آدرس‌ها" }).click();
  await shot(m, "addresses-list-v190", ["علی رضایی", "پیش‌فرض", "افزودن آدرس جدید"]);
  await m.getByRole("button", { name: "افزودن آدرس جدید" }).click();
  await m.waitForTimeout(900);
  await shot(m, "addresses-form-v190", ["نام گیرنده", "انتخاب استان", "نشانی کامل", "ذخیره آدرس"]);  await m.getByRole("button", { name: "ذخیرهٔ آدرس" }).click();
  await shot(m, "addresses-error-v190", ["نام گیرنده را وارد کن", "شمارهٔ موبایل معتبر نیست"]);
  await m.getByRole("button", { name: "منصرف شدم" }).click().catch(() => {});
  await m.keyboard.press("Escape");
  await m.waitForTimeout(400);

  /* ── ۴) تنظیمات + حذف حساب ── */
  await m.getByRole("button", { name: "بازگشت", exact: true }).click();
  await m.waitForTimeout(500);
  await m.getByRole("button", { name: "تنظیمات" }).click();
  await shot(m, "settings-v190", ["اعلان‌ها", "شروع لایو فروشنده‌های دنبال‌شده", "حذف حساب"]);
  await m.getByRole("button", { name: "حذف حساب" }).click();
  await shot(m, "delete-account-v190", ["حساب تو حذف شود؟", "برگشت‌پذیر نیست", "متوجه‌ام، ادامه بده"]);
  await m.getByRole("button", { name: "منصرف شدم" }).click();
  await m.waitForTimeout(400);

  /* ── ۵) سؤالات متداول / قوانین / حریم خصوصی / پشتیبانی ── */
  await m.getByRole("button", { name: "بازگشت", exact: true }).click();
  await m.waitForTimeout(500);
  await m.getByRole("button", { name: "سؤالات متداول" }).click();
  await m.getByRole("button", { name: /پرداخت امانی یعنی چه/ }).click();
  await shot(m, "faq-v190", ["سؤالات متداول", "پرداخت امانی", "پیش‌نویس — نیاز به بازبینی حقوقی"]);

  await m.getByRole("button", { name: "بازگشت", exact: true }).click();
  await m.waitForTimeout(500);
  await m.getByRole("button", { name: "قوانین و مقررات" }).click();
  await shot(m, "terms-v190", ["قوانین و مقررات", "پرداخت امانی و آزادسازی", "پیش‌نویس"]);

  await m.getByRole("button", { name: "بازگشت", exact: true }).click();
  await m.waitForTimeout(500);
  await m.getByRole("button", { name: "حریم خصوصی" }).click();
  await shot(m, "privacy-v190", ["حریم خصوصی", "حقوق تو", "پیش‌نویس"]);

  await m.getByRole("button", { name: "بازگشت", exact: true }).click();
  await m.waitForTimeout(500);
  await m.getByRole("button", { name: "تماس با پشتیبانی" }).click();
  await shot(m, "support-v190", ["تماس با پشتیبانی", "درخواست پشتیبانی", "ارسال درخواست"]);

  /* ── ۶) صندوق ورودی — هر فیلتر ── */
  await m.getByRole("button", { name: "بازگشت", exact: true }).click();
  await m.waitForTimeout(500);
  await m.getByRole("button", { name: "صندوق ورودی" }).click();
  await shot(m, "inbox-all-v190", ["صندوق ورودی", "خواندن همه", "کالای محبوب دارد تمام می‌شود"]);
  await m.getByRole("tab", { name: /سفارش‌ها/ }).click();
  await shot(m, "inbox-orders-v190", ["صندوق ورودی", "سفارش"]);
  await m.getByRole("tab", { name: /فالو/ }).click();
  await shot(m, "inbox-follow-v190", ["صندوق ورودی", "فالو"]);
  await m.getByRole("tab", { name: /سیستم/ }).click();
  await shot(m, "inbox-system-v190", ["صندوق ورودی", "سیستم"]);

  /* ── ۷) فعالیت‌ها و ریواردز ── */
  await m.getByRole("button", { name: "بازگشت", exact: true }).click();
  await m.waitForTimeout(500);
  await m.getByRole("button", { name: "فعالیت‌ها" }).click();
  await shot(m, "activity-v190", ["فعالیت‌ها"]);
  await m.getByRole("button", { name: "بازگشت", exact: true }).click();
  await m.waitForTimeout(500);
  await m.getByRole("button", { name: "باشگاه ریواردز" }).click();
  await shot(m, "rewards-v190", ["ریواردز", "امتیاز"]);

  /* ── ۸) خروج → پروفایل مهمان (رفرش = ریست mock به کاربر لاگین seed) ── */
  await m.reload({ waitUntil: "networkidle" });
  await m.waitForTimeout(800);
  await logout(m);
  await shot(m, "profile-guest-v190", ["وارد نشدی", "ورود / ثبت‌نام"]);

  /* ── ۹) ورود: شماره → کد → خطا → قفل ── */
  await gotoAccount(m);
  await hardClick(m, m.getByRole("button", { name: "ورود یا ثبت‌نام" }));
  await m.waitForTimeout(700);
  await m.getByRole("textbox", { name: "شمارهٔ موبایل" }).fill("08123456789");
  await hardClick(m, m.getByRole("button", { name: "دریافت کد تأیید" }));
  await shot(m, "login-phone-error-v190", ["شمارهٔ موبایل معتبر نیست"]);
  await m.getByRole("textbox", { name: "شمارهٔ موبایل" }).fill("09121234567");
  await shot(m, "login-phone-v190", ["ورود به LiveShop", "دریافت کد تأیید"]);
  await hardClick(m, m.getByRole("button", { name: "دریافت کد تأیید" }));
  await m.waitForTimeout(800);
  await shot(m, "login-code-v190", ["کد تأیید را وارد کن", "کد دمو:", "اعتبار کد"]);

  /* کد غلط → خطا */
  await fillCode(m, "000000");
  await shot(m, "login-error-v190", ["کد واردشده اشتباه است"]);

  /* قفل: ۴ تلاش غلط دیگر (جمعاً ۵) */
  for (let i = 0; i < 4; i++) {
    await fillCode(m, "000000");
    await m.waitForTimeout(350);
  }
  await shot(m, "login-locked-v190", ["قفل شد", "کد جدید بگیر"]);

  /* ── ۱۰) مهمان هنگام خرید → شیت ورود (رفرش = لاگین seed → اول خروج) ── */
  await m.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await logout(m);
  await m.getByRole("navigation").getByRole("button", { name: "خانه" }).click();
  await m.waitForTimeout(700);
  await m.getByRole("button", { name: "ورود به شو زندهٔ کفش‌خانهٔ سینا" }).click();
  await m.waitForTimeout(1400);
  await m.getByRole("button", { name: /خرید نایک دَنک/ }).first().click();
  await m.waitForTimeout(900);
  await hardClick(m, m.getByRole("button", { name: /پرداخت .* از کیف پول/ }));
  await m.waitForTimeout(800);
  await shot(m, "guest-buy-login-v190", ["ورود به LiveShop", "خرید سریع"]);

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
  await gotoAccount(d);
  await shot(d, "profile-desktop-v190", ["علی رضایی", "آدرس‌ها", "نماد اعتماد"]);

  await d.getByRole("button", { name: "آدرس‌ها" }).click();
  await shot(d, "addresses-desktop-v190", ["پیش‌فرض", "افزودن آدرس جدید"]);

  await d.getByRole("button", { name: "بازگشت", exact: true }).click();
  await d.waitForTimeout(500);
  await d.getByRole("button", { name: "تنظیمات" }).click();
  await shot(d, "settings-desktop-v190", ["اعلان‌ها", "حذف حساب"]);

  await d.getByRole("button", { name: "بازگشت", exact: true }).click();
  await d.waitForTimeout(500);
  await d.getByRole("button", { name: "سؤالات متداول" }).click();
  await shot(d, "faq-desktop-v190", ["پرداخت امانی", "پیش‌نویس"]);

  await d.getByRole("button", { name: "بازگشت", exact: true }).click();
  await d.waitForTimeout(500);
  await d.getByRole("button", { name: "تماس با پشتیبانی" }).click();
  await shot(d, "support-desktop-v190", ["درخواست پشتیبانی", "ارسال درخواست"]);

  await dctx.close();
  await browser.close();

  /* ── گزارش ── */
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} shots OK`);
  if (failed.length) {
    console.error("FAILED:", JSON.stringify(failed, null, 2));
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
