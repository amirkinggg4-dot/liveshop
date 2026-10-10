/**
 * v1.6.2 — تست لایهٔ دادهٔ کاوش
 * ۱) پاسخ نمونهٔ API ‏/search (قرارداد docs/api-spec.md §2 و route
 *    ‏src/app/api/v1/search/route.ts) به تایپ UI تبدیل می‌شود و نباید خطا بدهد
 * ۲) نرمال‌سازی فارسی: ی/ي، ک/ك و ارقام فارسی/عربی/لاتین
 * ۳) جستجوی mock و فهرست شوهای کاوش (mock + وضعیت SCHEDULED → upcoming)
 */
import { describe, expect, test } from "bun:test";
import {
  apiSearchToUi,
  searchMock,
  type ApiSearchResponse,
} from "../useSearch";
import {
  fetchMockExploreShows,
} from "../useExploreShows";
import { apiShowToUiShow, type ApiShowsResponse } from "../useLiveShows";
import { faEquals, faIncludes, normalizeFa } from "@/lib/persian";

/* ── نمونهٔ seed — دقیقاً با شکل پاسخ GET /api/v1/search ── */
const SAMPLE_SEARCH_RESPONSE: ApiSearchResponse = {
  query: "کتونی",
  shows: [
    {
      id: "clx9f2show0001",
      title: "شب کتونی‌های کمیاب",
      coverUrl: "https://cdn.example.com/covers/sh1.jpg",
      status: "LIVE",
      scheduledAt: null,
      startedAt: "2025-01-10T18:00:00.000Z",
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
      title: "شب کتونی ۲ — نسخهٔ ویژه",
      coverUrl: null,
      status: "SCHEDULED",
      scheduledAt: "2025-01-12T21:00:00.000Z",
      startedAt: null,
      viewers: 0,
      category: { slug: "sneakers", nameFa: "کتونی و کفش" },
      seller: {
        id: "clx9f2seller01",
        slug: "sina-sneaks",
        shopName: "کفش‌خانهٔ سینا",
        avatarUrl: null,
        verified: true,
      },
      pinnedItem: null,
    },
    {
      id: "clx9f2show0003",
      title: "شو تمام‌شده",
      coverUrl: null,
      status: "ENDED",
      scheduledAt: null,
      startedAt: "2025-01-01T18:00:00.000Z",
      viewers: 0,
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
  sellers: [
    {
      id: "clx9f2seller01",
      shopName: "کفش‌خانهٔ سینا",
      slug: "sina-sneaks",
      avatarUrl: null,
      verified: true,
      followersCount: 12400,
    },
  ],
  products: [
    {
      id: "clx9f2prod001",
      title: "نایک دَنک لو «پاندا»",
      brand: "نایک",
      image: "https://cdn.example.com/items/it1.jpg",
      price: 6500000,
      seller: { shopName: "کفش‌خانهٔ سینا", slug: "sina-sneaks" },
      totalStock: 5,
    },
    {
      id: "clx9f2prod002",
      title: "کالای بی‌عکس و بی‌برند",
      brand: null,
      image: null,
      price: 900000,
      seller: { shopName: "گجت‌بازار", slug: "gadget-bazaar" },
      totalStock: 0,
    },
  ],
};

/* ── نمونهٔ seed برای /shows?status=SCHEDULED (کاوش) ── */
const SAMPLE_SCHEDULED_RESPONSE: ApiShowsResponse = {
  shows: [SAMPLE_SEARCH_RESPONSE.shows[1]],
  nextCursor: null,
};

describe("apiSearchToUi — پاسخ نمونهٔ /search به تایپ UI", () => {
  test("کل پاسخ seed بدون خطا تبدیل می‌شود", () => {
    const ui = apiSearchToUi(SAMPLE_SEARCH_RESPONSE);
    expect(ui.shows).toHaveLength(2); /* ENDED حذف می‌شود */
    expect(ui.products).toHaveLength(2);
    expect(ui.sellers).toHaveLength(1);
  });

  test("وضعیت‌ها درست map می‌شوند (LIVE→live، SCHEDULED→upcoming)", () => {
    const ui = apiSearchToUi(SAMPLE_SEARCH_RESPONSE);
    expect(ui.shows[0]?.status).toBe("live");
    expect(ui.shows[1]?.status).toBe("upcoming");
  });

  test("کالاها: فیلدهای null امن‌اند و قیمت/موجودی کامل می‌آید", () => {
    const ui = apiSearchToUi(SAMPLE_SEARCH_RESPONSE);
    const [p1, p2] = ui.products;
    expect(p1.price).toBe(6500000);
    expect(p1.stock).toBe(5);
    expect(p1.brand).toBe("نایک");
    expect(p1.image).toBe("https://cdn.example.com/items/it1.jpg");
    /* API فعلی showId برگشت نمی‌دهد */
    expect(p1.showId).toBeNull();
    expect(p1.showTitle).toBeNull();
    expect(p2.brand).toBe("");
    expect(p2.image).toBeNull();
    expect(p2.size).toBeNull();
    expect(p2.condition).toBeNull();
  });

  test("فروشندگان: rating ناموجود → null و handle از slug می‌آید", () => {
    const ui = apiSearchToUi(SAMPLE_SEARCH_RESPONSE);
    const s1 = ui.sellers[0];
    expect(s1?.name).toBe("کفش‌خانهٔ سینا");
    expect(s1?.handle).toBe("sina-sneaks");
    expect(s1?.verified).toBe(true);
    expect(s1?.followers).toBe(12400);
    expect(s1?.rating).toBeNull();
  });
});

describe("normalizeFa — نرمال‌سازی فارسی برای جستجو", () => {
  test("ي عربی → ی و ك عربی → ک", () => {
    expect(normalizeFa("پوكمون")).toBe(normalizeFa("پوکمون"));
    expect(normalizeFa("كتاب")).toBe(normalizeFa("کتاب"));
    expect(faEquals("كتونی", "کتونی")).toBe(true);
  });

  test("ارقام فارسی/عربی → لاتین", () => {
    expect(normalizeFa("۹.۵")).toBe("9.5");
    expect(normalizeFa("٩٥")).toBe("95");
    expect(normalizeFa("۴۲")).toBe("42");
  });

  test("faIncludes روی ی/ي و ک/ك و ارقام حساس نیست", () => {
    expect(faIncludes("پوکمون کارت اولترا رِیر BGS 9.5", "پوكمون")).toBe(true);
    expect(faIncludes("شب كتونی‌های کمیاب", "کتونی")).toBe(true);
    expect(faIncludes("گرید BGS ۹.۵ با قاب", "9.5")).toBe(true);
    expect(faIncludes("سایز ۴۲", "42")).toBe(true);
    expect(faIncludes("مونسترا", "فیل")).toBe(false);
  });
});

describe("searchMock — جستجوی mock با نرمال‌سازی", () => {
  test("«پوكمون» با ك عربی، کارت پوکمون را پیدا می‌کند", () => {
    const r = searchMock("پوكمون");
    expect(r.products.some((p) => p.id === "ct1")).toBe(true);
    expect(r.shows.length + r.products.length + r.sellers.length).toBeGreaterThan(0);
  });

  test("«کتونی» شو و کالاهای مرتبط را می‌آورد و شو میزبان دارد", () => {
    const r = searchMock("کتونی");
    expect(r.shows.some((s) => s.id === "sh1")).toBe(true);
    expect(r.shows.some((s) => s.id === "sh7")).toBe(true); /* به‌زودی */
    for (const p of r.products) {
      expect(p.showId).toBeTruthy();
      expect(p.showTitle).toBeTruthy();
    }
  });

  test("«۹.۵» با ارقام فارسی، کالای BGS 9.5 را می‌یابد", () => {
    const r = searchMock("۹.۵");
    expect(r.products.some((p) => p.id === "ct1")).toBe(true);
  });

  test("نتیجهٔ خالی برای عبارت بی‌ربط", () => {
    const r = searchMock("zzzqqq");
    expect(r.shows).toHaveLength(0);
    expect(r.products).toHaveLength(0);
    expect(r.sellers).toHaveLength(0);
  });

  test("فروشنده با دستهٔ لاتین هم پیدا می‌شود (handle)", () => {
    const r = searchMock("mina_plants");
    expect(r.sellers.some((s) => s.handle === "mina_plants")).toBe(true);
  });
});

describe("useExploreShows — mock و نگاشت وضعیت SCHEDULED", () => {
  test("بدون دسته: همهٔ زنده‌ها و به‌زودی‌ها برمی‌گردند", async () => {
    const page = await fetchMockExploreShows(null);
    expect(page.live.length).toBeGreaterThan(0);
    expect(page.upcoming.length).toBeGreaterThan(0);
  });

  test("با دسته: فقط شوهای همان دسته (کتاب و کامیک → فقط به‌زودی)", async () => {
    const page = await fetchMockExploreShows("کتاب و کامیک");
    expect(page.live).toHaveLength(0);
    expect(page.upcoming.some((s) => s.id === "sh6")).toBe(true);
  });

  test("apiShowToUiShow با وضعیت SCHEDULED → upcoming (بدون خطا روی seed)", () => {
    const ui = SAMPLE_SCHEDULED_RESPONSE.shows.map((s) =>
      apiShowToUiShow(s, "upcoming")
    );
    expect(ui).toHaveLength(1);
    expect(ui[0]?.status).toBe("upcoming");
    expect(ui[0]?.pinnedPrice).toBeNull();
  });
});
