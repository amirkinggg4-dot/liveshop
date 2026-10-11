/* ─────────────────────────────────────────────────────────────
   v1.7.1 — تست خودکار ممیزی واژه‌های حراج
   وقتی AUCTION_ENABLED=false است، هیچ «متن نمایشی» (UI و دادهٔ mock)
   نباید این واژه‌ها را داشته باشد:
   مزایده · حراج · بید · بیدگذار · پیش‌بید · Max Bid · برنده/برد (حراج) · پله

   روش (grep-based):
   ۱) همهٔ فایل‌های ts/tsx زیر src خط‌به‌خط اسکن می‌شوند.
   ۲) خطوط کامنت نادیده گرفته می‌شوند (کامنت متن نمایشی نیست).
   ۳) خطی که خودش یا همسایه‌های نزدیکش (±۵ خط) AUCTION_ENABLED دارند
      «کد پشت فلگ» است و مجاز است.
   ۴) فایل‌هایی که به‌طور کامل «کد حفظ‌شدهٔ حراج»اند (فقط پشت فلگ
      مانت/اجرا می‌شوند — در v1.7.1 بازبینی دستی شد) فایل‌اجازه دارند.
   ۵) چند رشتهٔ دقیقِ شناخته‌شده که فقط داخل بلوک‌های
      {AUCTION_ENABLED && …} رندر می‌شوند، در فهرست اجازهٔ خطی‌اند.
   ۶) به‌علاوه، داده‌های mock واقعی (import شده) مستقیم تست می‌شوند تا
      هیچ واژهٔ ممنوعی در متن‌های نمایشیِ حالت قیمت ثابت نباشد.

   اگر واژهٔ ممنوعی بیرون از این محدوده‌ها پیدا شود تست شکست می‌خورد.
   اجرا: bun test src/lib/forbidden-words.test.ts
   ───────────────────────────────────────────────────────────── */

import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/* ── واژه‌های ممنوع ──
   «برد» و «بید» با مرز واژه تا برداشت/برندهای… و بیدار خطا نشود؛
   «بید» و «پله» و «برنده» و «مزایده» و «حراج» جست‌وجوی ساده‌اند. */
const FORBIDDEN: Array<{ re: RegExp; word: string }> = [
  { re: /مزایده/u, word: "مزایده" },
  { re: /حراج/u, word: "حراج" },
  { re: /بید/u, word: "بید (بیدگذار/پیش‌بید/بیدها)" },
  { re: /max\s?bid/iu, word: "Max Bid" },
  { re: /برنده/u, word: "برنده" },
  /* مرز واژه با احتساب نیم‌فاصله — تا «می‌برد» (بردن) خطا نشود */
  { re: /(^|[^\p{L}\u200c])برد([^\p{L}\u200c]|$)/u, word: "برد" },
  { re: /پله/u, word: "پله" },
];

/* ── فایل‌های «کد حفظ‌شدهٔ حراج» — همهٔ واژه‌هایشان پشت AUCTION_ENABLED است ──
   بازبینی دستی v1.7.1: LiveView/ProductView/shop-tab (کارت مزایده)،
   WinView (فقط از مودال پایان مزایده)، شیت‌های بید/پیش‌بید،
   موتورها و داده‌های دو-واریانته (حراج/ثابت). */
const AUCTION_FILES: Array<{ path: string; reason: string }> = [
  { path: "src/components/liveshop/bid-sheet.tsx", reason: "شیت بید — فقط پشت فلگ مانت می‌شود" },
  { path: "src/components/liveshop/pre-bid-sheet.tsx", reason: "شیت پیش‌بید — فقط پشت فلگ مانت می‌شود" },
  { path: "src/components/liveshop/views/WinView.tsx", reason: "صفحهٔ برد — فقط از مودال پایان مزایده" },
  { path: "src/components/liveshop/views/LiveView.tsx", reason: "کارت/پیل/مودال مزایده داخل فلگ" },
  { path: "src/components/liveshop/views/ProductView.tsx", reason: "کارت مزایدهٔ محصول داخل فلگ" },
  { path: "src/components/liveshop/shop-tab.tsx", reason: "کارت مزایدهٔ تب Shop داخل فلگ" },
  { path: "src/store/live-store.ts", reason: "موتور مزایده (applyBid/finishItem/Max Bid)" },
  { path: "src/store/activity-store.ts", reason: "اکشن‌های بید — فقط از UI حراج" },
  { path: "src/store/prebid-store.ts", reason: "استور پیش‌بید — فقط از شیت پیش‌بید" },
  { path: "src/lib/data/buyer-p1.ts", reason: "واریانت حراج اعلان‌ها + MY_BIDS (فقط UI حراج)" },
  { path: "src/lib/data/rewards-p1.ts", reason: "واریانت حراج نشان‌ها/مأموریت‌ها + PREBID_ITEMS" },
  { path: "src/lib/config.ts", reason: "کامنت مستندات کلید" },
  { path: "src/lib/data/types.ts", reason: "کامنت فیلدهای حراج" },
  { path: "src/lib/data/items.ts", reason: "کامنت + فیلدهای حراج حفظ‌شده" },
];

/* ── رشته‌های دقیقِ داخل بلوک‌های {AUCTION_ENABLED && …} ── */
const GATED_SNIPPETS: Array<{ file: string; includes: string; reason: string }> = [
  {
    file: "SellerScheduleView.tsx",
    includes: "پیش‌بید",
    reason: "تاگل و بج پیش‌بید فقط در بلوک {AUCTION_ENABLED && …}",
  },
  {
    file: "SellerScheduleView.tsx",
    includes: "بید ثبت می‌کنند",
    reason: "توضیح تاگل پیش‌بید — همان بلوک فلگ",
  },
  {
    file: "ActivityView.tsx",
    includes: "بید",
    reason: "تب بیدها/ActiveBidCard فقط در بلوک {AUCTION_ENABLED && …} رندر می‌شود",
  },
  {
    file: "ActivityView.tsx",
    includes: "پلهٔ مزایده",
    reason: "ActiveBidCard — فقط حالت حراج",
  },
  {
    file: "ActivityView.tsx",
    includes: "+ یک پله",
    reason: "ActiveBidCard — فقط حالت حراج",
  },
  {
    file: "ActivityView.tsx",
    includes: "مزایده",
    reason: "empty-state تب بیدها — فقط حالت حراج",
  },
  {
    file: "home/upcoming-card.tsx",
    includes: "پیش‌بید",
    reason: "دکمهٔ پیش‌بید با AUCTION_ENABLED && hidden مخفی می‌شود",
  },
  {
    file: "shared.tsx",
    includes: "بید فعلی {toman(auction",
    reason: "کارت مزایدهٔ LiveGridCard — شاخهٔ AUCTION_ENABLED",
  },
  {
    file: "SellerCreateListingView.tsx",
    includes: "شروع مزایده",
    reason: "فیلدهای قیمت‌گذاری حراج در بلوک {AUCTION_ENABLED && …}",
  },
  {
    file: "SellerCreateListingView.tsx",
    includes: "حین مزایده",
    reason: "راهنمای خرید فوری — همان بلوک فلگ",
  },
];

const SRC_ROOT = join(import.meta.dir, "..");
const PROJECT_ROOT = join(SRC_ROOT, "..");

/* فایل‌هایی که «برنده/برد» در آن‌ها معنای گیواوی دارد (نه مزایده) */
const GIVEAWAY_CONTEXT_FILES = ["src/components/liveshop/giveaway-modal.tsx"];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === "node_modules" || name === ".next") continue;
    if (p.endsWith(".test.ts") || p.endsWith(".test.tsx")) continue; // خود تست‌ها
    try {
      if (readdirSync(p)) {
        out.push(...walk(p));
        continue;
      }
    } catch {
      /* فایل است */
    }
    if (p.endsWith(".ts") || p.endsWith(".tsx")) out.push(p);
  }
  return out;
}

/** حذف بخش‌های کامنت‌شده از یک خط با وضعیت بلوک‌کامنت بین خطوط */
function makeCommentScanner(lines: string[]) {
  let inBlock = false;
  return (i: number): { code: string; commentOnly: boolean } => {
    const raw = lines[i];
    let out = "";
    let j = 0;
    while (j < raw.length) {
      if (!inBlock) {
        if (raw.startsWith("//", j)) break; // کامنت تا آخر خط
        if (raw.startsWith("/*", j)) {
          inBlock = true;
          j += 2;
          continue;
        }
        out += raw[j];
        j += 1;
      } else {
        if (raw.startsWith("*/", j)) {
          inBlock = false;
          j += 2;
          continue;
        }
        j += 1;
      }
    }
    return { code: out, commentOnly: out.trim() === "" };
  };
}

function isAllowedByGating(lines: string[], i: number): boolean {
  /* خود خط یا همسایه‌های ±۵ خط AUCTION_ENABLED دارند؟ */
  for (let j = Math.max(0, i - 5); j <= Math.min(lines.length - 1, i + 5); j++) {
    if (lines[j].includes("AUCTION_ENABLED")) return true;
  }
  return false;
}

function collectMatches(): Array<{ file: string; line: number; word: string; text: string }> {
  const hits: Array<{ file: string; line: number; word: string; text: string }> = [];
  const files = walk(SRC_ROOT);
  for (const file of files) {
    const rel = file.replace(PROJECT_ROOT + "/", "");
    if (AUCTION_FILES.some((f) => rel.endsWith(f.path))) continue; // کد حفظ‌شدهٔ حراج
    const raw = readFileSync(file, "utf8");
    const lines = raw.split("\n");
    const scan = makeCommentScanner(lines);
    for (let i = 0; i < lines.length; i++) {
      const { code, commentOnly } = scan(i);
      if (commentOnly || !code.trim()) continue;
      for (const { re, word } of FORBIDDEN) {
        if (re.test(code)) {
          if (isAllowedByGating(lines, i)) continue;
          const snippet = GATED_SNIPPETS.find(
            (g) => rel.endsWith(g.file) && code.includes(g.includes)
          );
          if (snippet) continue;
          /* «برنده» در بافت گیواوی مجاز است */
          if (
            word.startsWith("برنده") &&
            GIVEAWAY_CONTEXT_FILES.some((f) => rel.endsWith(f))
          )
            continue;
          hits.push({ file: rel, line: i + 1, word, text: code.trim() });
        }
      }
    }
  }
  return hits;
}

/* ── ۱) اسکن grep کل سورس ── */
describe("ممیزی واژه‌های حراج (AUCTION_ENABLED=false)", () => {
  it("هیچ واژهٔ ممنوعی در متن‌های نمایشی بیرون از کد پشت فلگ نیست", () => {
    const hits = collectMatches();
    if (hits.length > 0) {
      console.error(
        "واژه‌های ممنوع در متن نمایشی:\n" +
          hits
            .map((h) => `${h.file}:${h.line} [${h.word}] ← ${h.text}`)
            .join("\n")
      );
    }
    expect(hits).toHaveLength(0);
  });
});

/* ── ۲) داده‌های mock واقعیِ حالت قیمت ثابت — مستقیم از ماژول ── */
import { INBOX_NOTIFICATIONS } from "@/lib/data/buyer-p1";
import { NOTIF_PREFS, STOREFRONT, NOTE_BUYER_FEE } from "@/lib/data/seller-marketing";
import { FUNNEL } from "@/lib/data/seller-analytics";
import { REWARD_BADGES, REWARD_TASKS, REWARD_TIERS } from "@/lib/data/rewards-p1";
import { RAID_TARGETS } from "@/lib/data/raid-p1";
import { COMMISSION_NOTE, SELLER_REVENUE } from "@/lib/data/seller";

function expectClean(text: string, ctx: string) {
  for (const { re } of FORBIDDEN) {
    if (re.test(text)) {
      /* پیام بدون خودِ واژه تا تست خودش را خطا نگیرد */
      expect(`${ctx} واژهٔ ممنوع در موقعیت ${text.search(re)}`).toBe("");
    }
    expect(text).not.toMatch(re);
  }
}

describe("داده‌های نمایشی mock — حالت قیمت ثابت", () => {
  it("اعلان‌های صندوق ورودی پاک‌اند", () => {
    for (const n of INBOX_NOTIFICATIONS) {
      expectClean(n.title, `inbox.title (${n.id})`);
      expectClean(n.body, `inbox.body (${n.id})`);
    }
  });

  it("تنظیمات اعلان فروشنده پاک است", () => {
    for (const p of NOTIF_PREFS) {
      expectClean(p.title, `notif.title (${p.id})`);
      expectClean(p.desc, `notif.desc (${p.id})`);
    }
  });

  it("داستان و نظرات صفحهٔ فروشنده پاک است", () => {
    expectClean(STOREFRONT.story, "storefront.story");
    for (const r of STOREFRONT.reviews) {
      expectClean(r.text, `review (${r.name})`);
    }
  });

  it("قیف آنالیتیکس پاک است", () => {
    for (const s of FUNNEL) expectClean(s.label, `funnel (${s.label})`);
  });

  it("کارت کارمزد خریدار پاک است", () => {
    expectClean(NOTE_BUYER_FEE, "note-buyer-fee");
  });

  it("ریواردز (نشان/مأموریت/مزایا) پاک است", () => {
    for (const b of REWARD_BADGES) {
      expectClean(b.label, `badge (${b.id})`);
      if (b.howToEarn) expectClean(b.howToEarn, `badge.how (${b.id})`);
    }
    for (const t of REWARD_TASKS) {
      expectClean(t.title, `task (${t.id})`);
      expectClean(t.desc, `task.desc (${t.id})`);
      if (t.progressLabel) expectClean(t.progressLabel, `task.progress (${t.id})`);
    }
    for (const tier of REWARD_TIERS) {
      for (const perk of tier.perks) expectClean(perk, `tier (${tier.label})`);
    }
  });

  it("عناوین شوهای مقصد Raid هماهنگ‌اند", () => {
    for (const t of RAID_TARGETS) expectClean(t.title, `raid (${t.showId})`);
  });

  it("یادداشت کارمزد و پلکان‌های تسویه پاک‌اند", () => {
    expectClean(COMMISSION_NOTE, "commission-note");
    for (const t of SELLER_REVENUE.tiers) expectClean(t.label, `revenue.tier (${t.label})`);
  });
});
