/**
 * v1.6.1 — تست لایهٔ دادهٔ خانه
 * پاسخ نمونهٔ API seed (قرارداد docs/api-spec.md §2 — خروجی GET /api/v1/shows
 * با serializer ‏showCard و GET /api/v1/categories) به تایپ UI تبدیل می‌شود
 * و نباید هیچ خطایی بدهد — همچنین صفحه‌بندی cursor در حالت mock.
 */
import { describe, expect, test } from "bun:test";
import {
  apiShowToUiShow,
  fetchMockLiveShowsPage,
  type ApiShowsResponse,
} from "../useLiveShows";
import {
  apiCategoryToUiCategory,
  type ApiCategoriesResponse,
} from "../useCategories";

/* ── نمونهٔ seed — دقیقاً با شکل serializer ‏showCard (src/lib/server/shows.ts) ── */
const SAMPLE_SEED_RESPONSE: ApiShowsResponse = {
  shows: [
    {
      id: "clx9f2show0001",
      title: "شب کتونی‌های کمیاب",
      coverUrl: "https://cdn.example.com/covers/sh1.jpg",
      status: "LIVE",
      scheduledAt: null,
      startedAt: "2025-01-10T18:00:00.000Z",
      startsAt: null,
      viewers: 248,
      category: { slug: "sneakers", nameFa: "کتونی و کفش" },
      seller: {
        id: "clx9f2seller01",
        slug: "sina-sneaks",
        shopName: "کفش‌خانهٔ سینا",
        avatarUrl: "https://cdn.example.com/avatars/s1.jpg",
        verified: true,
      },
      pinnedItem: {
        showItemId: "clx9f2item001",
        productTitle: "نایک دَنک لو «پاندا»",
        image: "https://cdn.example.com/items/it1.jpg",
        price: 6500000,
        stock: 5,
      },
    },
    {
      id: "clx9f2show0002",
      title: "گلخانهٔ زنده — تک‌گیاه‌های نادر",
      coverUrl: null,
      status: "LIVE",
      scheduledAt: null,
      startedAt: "2025-01-10T19:30:00.000Z",
      startsAt: null,
      viewers: 139,
      category: null,
      seller: {
        id: "clx9f2seller02",
        slug: "mina-plants",
        shopName: "گلخانهٔ مینا",
        avatarUrl: null,
        verified: false,
      },
      pinnedItem: null,
    },
  ],
  nextCursor: "1736515200000_clx9f2show0002",
};

const SAMPLE_CATEGORIES_RESPONSE: ApiCategoriesResponse = {
  categories: [
    {
      id: "clx9f2cat0001",
      slug: "sneakers",
      nameFa: "کتونی و کفش",
      liveShowCount: 3,
      showCount: 12,
      productCount: 48,
    },
    {
      id: "clx9f2cat0002",
      slug: "books",
      nameFa: "کتاب و کامیک",
      liveShowCount: 0,
      showCount: 4,
      productCount: 9,
    },
  ],
};

describe("apiShowToUiShow — پاسخ نمونهٔ API seed به تایپ UI", () => {
  test("کل پاسخ seed بدون خطا تبدیل می‌شود", () => {
    const ui = SAMPLE_SEED_RESPONSE.shows.map((s) => apiShowToUiShow(s));
    expect(ui).toHaveLength(2);
  });

  test("فیلدهای اصلی کارت درست map می‌شوند", () => {
    const [s1] = SAMPLE_SEED_RESPONSE.shows.map((s) => apiShowToUiShow(s));
    expect(s1.id).toBe("clx9f2show0001");
    expect(s1.title).toBe("شب کتونی‌های کمیاب");
    expect(s1.status).toBe("live");
    expect(s1.viewers).toBe(248);
    expect(s1.category).toBe("کتونی و کفش");
    expect(s1.sellerName).toBe("کفش‌خانهٔ سینا");
    expect(s1.sellerVerified).toBe(true);
    expect(s1.pinnedPrice).toBe(6500000);
    expect(s1.pinnedStock).toBe(5);
    expect(s1.photoUrl).toBe("https://cdn.example.com/covers/sh1.jpg");
  });

  test("فیلدهای null امن map می‌شوند (بدون pinnedItem و بدون category)", () => {
    const [, s2] = SAMPLE_SEED_RESPONSE.shows.map((s) => apiShowToUiShow(s));
    expect(s2.category).toBe("");
    expect(s2.pinnedPrice).toBeNull();
    expect(s2.pinnedStock).toBeNull();
    expect(s2.sellerAvatar).toBeNull();
    expect(s2.photoUrl).toBeNull();
    expect(s2.cover.from).toBeTruthy();
    expect(s2.cover.emoji).toBeTruthy();
  });

  test("خروجی همهٔ فیلدهای اجباری Show را دارد (نوع خروجی = تایپ UI)", () => {
    for (const ui of SAMPLE_SEED_RESPONSE.shows.map((s) => apiShowToUiShow(s))) {
      for (const key of [
        "id",
        "title",
        "sellerId",
        "category",
        "status",
        "cover",
        "itemsTotal",
        "itemsSold",
        "isFollowing",
        "tags",
      ] as const) {
        expect(ui[key]).toBeDefined();
      }
    }
  });
});

describe("apiCategoryToUiCategory — پاسخ نمونهٔ /categories به تایپ UI", () => {
  test("بدون خطا map می‌شود و فیلدها درست‌اند", () => {
    const ui = SAMPLE_CATEGORIES_RESPONSE.categories.map(apiCategoryToUiCategory);
    expect(ui).toHaveLength(2);
    expect(ui[0]).toEqual({
      id: "clx9f2cat0001",
      label: "کتونی و کفش",
      emoji: "",
      liveCount: 3,
    });
    expect(ui[1].liveCount).toBe(0);
    expect(ui[1].label).toBe("کتاب و کامیک");
  });
});

describe("صفحه‌بندی cursor در حالت mock (fetchMockLiveShowsPage)", () => {
  test("صفحهٔ اول با cursor خالی + nextCursor برای صفحهٔ بعد", async () => {
    const page1 = await fetchMockLiveShowsPage(undefined);
    expect(page1.shows.length).toBeGreaterThan(0);
    expect(page1.nextCursor).not.toBeNull();
  });

  test("صفحه‌های بعدی ادامهٔ همان لیست‌اند و در انتها nextCursor=null", async () => {
    const all: Awaited<ReturnType<typeof fetchMockLiveShowsPage>>["shows"] = [];
    let cursor: string | undefined = undefined;
    let pages = 0;
    for (;;) {
      const page = await fetchMockLiveShowsPage(cursor);
      all.push(...page.shows);
      pages += 1;
      if (!page.nextCursor) break;
      cursor = page.nextCursor;
      expect(pages).toBeLessThan(20); // محافظ حلقهٔ بی‌نهایت
    }
    const ids = all.map((s) => s.id);
    expect(new Set(ids).size).toBe(all.length); // بدون تکرار
    expect(pages).toBeGreaterThanOrEqual(2);
  });

  test("cursor نامعتبر خطا نمی‌دهد — صفحهٔ خالی برمی‌گرداند", async () => {
    const page = await fetchMockLiveShowsPage("not-a-number");
    expect(page.shows).toHaveLength(0);
    expect(page.nextCursor).toBeNull();
  });
});
