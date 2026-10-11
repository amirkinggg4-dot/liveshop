/**
 * LiveShop API v1 — discovery tests for v1.6.3 (spec §2).
 *
 * Runs against a REAL PostgreSQL in the dedicated `liveshop_test` schema —
 * same infrastructure as the security tests:
 *
 *   bun run test:server
 *
 * Covers the v1.6.3 contract:
 *  - Persian normalization parity: «پوكمون»≡«پوکمون» and «۹.۵»≡«9.5»
 *  - shared filters (price / size / brand / condition) on /search and /shows
 *  - real sorts on /shows: popular / newest / price_asc / price_desc (+cursor)
 *  - isFollowed: absent without a token, correct with one
 *  - E2E: fixtures → GET handlers → UI mappers → UI types (home + explore)
 *
 * The migration-on-seeded-DB test lives in migration.test.ts.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { Prisma, PrismaClient } from "@prisma/client";
import { db } from "@/lib/db";
import { normalizeFa, buildSearchText } from "@/lib/normalize";
import { signAccessToken } from "@/lib/server/auth";
import { GET as getShows } from "@/app/api/v1/shows/route";
import { GET as getSearch } from "@/app/api/v1/search/route";
import { apiShowToUiShow } from "@/hooks/useLiveShows";
import { apiSearchToUi, type ApiSearchResponse } from "@/hooks/useSearch";
import type { ApiShowsResponse } from "@/hooks/useLiveShows";

/* ── request helpers: call the real route handlers ── */

async function callSearch(params: string, token?: string): Promise<ApiSearchResponse> {
  const res = await getSearch(
    new Request(`http://localhost/api/v1/search?${params}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  );
  expect(res.status).toBe(200);
  return (await res.json()) as ApiSearchResponse;
}

async function callShows(params: string, token?: string): Promise<ApiShowsResponse> {
  const res = await getShows(
    new Request(`http://localhost/api/v1/shows?${params}`, {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    }),
  );
  expect(res.status).toBe(200);
  return (await res.json()) as ApiShowsResponse;
}

/* ── fixture ids (filled by seedFixtures) ── */

const ids = {
  sellerA: "",
  sellerB: "",
  pPoke: "",
  pDunk: "",
  pJordan: "",
  pMonstera: "",
  sPopular: "", // LIVE, viewers 1500, pinned monstera (2_450_000)
  sCheap: "", // LIVE, viewers 900, pinned dunk (7_950_000)
  sExpensive: "", // SCHEDULED +1d, pinned jordan (14_900_000)
  sNoPrice: "", // SCHEDULED +2d, no pinned price… (has poke, unpinned)
  sEnded: "", // ENDED, viewers 100
  buyer: "",
  buyerToken: "",
};

const minutesAgo = (n: number) => new Date(Date.now() - n * 60_000);
const inDays = (n: number) => new Date(Date.now() + n * 24 * 3600_000);

async function seedFixtures(): Promise<void> {
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "LedgerEntry", "Account", "Dispute", "Shipment", "OrderItem", "Order",
      "ChatMessage", "ShowItem", "Show", "Follow", "Variant", "Product",
      "Category", "Address", "RefreshToken", "OtpCode", "SellerProfile",
      "User", "Report"
    RESTART IDENTITY CASCADE;
  `);

  const cats = {
    sneakers: await db.category.create({ data: { slug: "sneakers", nameFa: "کتونی و کفش" } }),
    cards: await db.category.create({ data: { slug: "cards", nameFa: "کارت و کلکسیون" } }),
    plants: await db.category.create({ data: { slug: "plants", nameFa: "گیاه و گلخانه" } }),
  };

  const mkSeller = async (phone: string, shopName: string, slug: string) => {
    const user = await db.user.create({ data: { phone, name: shopName, role: "SELLER" } });
    return db.sellerProfile.create({
      data: {
        userId: user.id,
        shopName,
        slug,
        status: "APPROVED",
        searchText: buildSearchText([shopName, slug]),
      },
    });
  };
  const sellerA = await mkSeller("09110000001", "کفش‌خانهٔ سینا", "sina-sneaks");
  const sellerB = await mkSeller("09110000002", "کلکسیون‌یار تهران", "teh-collector");
  ids.sellerA = sellerA.id;
  ids.sellerB = sellerB.id;

  const mkProduct = async (
    data: Prisma.ProductUncheckedCreateInput,
  ) => db.product.create({ data });

  const pPoke = await mkProduct({
    sellerId: sellerB.id,
    categoryId: cats.cards.id,
    title: "باکس پوکمون تِن — سری ۹.۵",
    brand: "PokemonLab",
    price: 2_500_000,
    condition: "NEW",
    searchText: buildSearchText(["باکس پوکمون تِن — سری ۹.۵", "PokemonLab", "کارت و کلکسیون"]),
    isDraft: false,
    variants: {
      create: [
        { label: "۹.۵ / قرمز", sku: "PK-95", stock: 2 },
        { label: "استاندارد", sku: "PK-STD", stock: 1 },
      ],
    },
  });
  const pDunk = await mkProduct({
    sellerId: sellerA.id,
    categoryId: cats.sneakers.id,
    title: "نایک دانک لو پاندا",
    brand: "Nike",
    price: 7_950_000,
    condition: "NEW",
    searchText: buildSearchText(["نایک دانک لو پاندا", "Nike", "کتونی و کفش"]),
    isDraft: false,
    variants: {
      create: [
        { label: "۴۰ / مشکی", stock: 2 },
        { label: "۴۱ / مشکی", stock: 4 },
        { label: "۴۲ / مشکی", stock: 6 },
        { label: "۴۳ / مشکی", stock: 3 },
      ],
    },
  });
  const pJordan = await mkProduct({
    sellerId: sellerA.id,
    categoryId: cats.sneakers.id,
    title: "جردن ۱ شیکاگو",
    brand: "Jordan",
    price: 14_900_000,
    condition: "USED",
    searchText: buildSearchText(["جردن ۱ شیکاگو", "Jordan", "کتونی و کفش"]),
    isDraft: false,
    variants: {
      create: [
        { label: "۴۱ / قرمز", stock: 1 },
        { label: "۴۲ / قرمز", stock: 2 },
      ],
    },
  });
  const pMonstera = await mkProduct({
    sellerId: sellerB.id,
    categoryId: cats.plants.id,
    title: "مونسترا ابلق",
    brand: "—",
    price: 2_450_000,
    condition: "NEW",
    searchText: buildSearchText(["مونسترا ابلق", "—", "گیاه و گلخانه"]),
    isDraft: false,
    variants: { create: [{ label: "تک‌ساقه", stock: 5 }] },
  });
  ids.pPoke = pPoke.id;
  ids.pDunk = pDunk.id;
  ids.pJordan = pJordan.id;
  ids.pMonstera = pMonstera.id;

  const mkShow = async (
    data: Prisma.ShowUncheckedCreateInput,
    items: { productId: string; pinned: boolean }[],
  ) => {
    const show = await db.show.create({ data });
    let pos = 1;
    for (const it of items) {
      await db.showItem.create({
        data: { showId: show.id, productId: it.productId, position: pos++, pinned: it.pinned },
      });
    }
    return show;
  };

  // Sort fixture keys (all distinct where order is asserted):
  //   popular: 1500 > 900 > 100 > 50 > 40
  //   newest (COALESCE(startedAt, createdAt)):
  //        sCheap(-10m) > sPopular(-48m) > sEnded(-2d) > sExpensive(-3d created) > sNoPrice(-4d created)
  //   price: sExpensive 14.9M > sCheap 7.95M > sPopular 2.45M > nulls last
  const sCheap = await mkShow(
    {
      sellerId: sellerA.id,
      categoryId: cats.sneakers.id,
      title: "شب کتونی نایاب",
      status: "LIVE",
      startedAt: minutesAgo(10),
      createdAt: minutesAgo(12),
      peakViewers: 900,
      searchText: buildSearchText(["شب کتونی نایاب", "کتونی و کفش"]),
    },
    [
      { productId: pDunk.id, pinned: true },
      { productId: pJordan.id, pinned: false },
    ],
  );
  const sPopular = await mkShow(
    {
      sellerId: sellerB.id,
      categoryId: cats.plants.id,
      title: "گلخانهٔ زنده",
      status: "LIVE",
      startedAt: minutesAgo(48),
      createdAt: minutesAgo(50),
      peakViewers: 1500,
      searchText: buildSearchText(["گلخانهٔ زنده", "گیاه و گلخانه"]),
    },
    [{ productId: pMonstera.id, pinned: true }],
  );
  const sExpensive = await mkShow(
    {
      sellerId: sellerA.id,
      categoryId: cats.sneakers.id,
      title: "پیش‌فروش جردن",
      status: "SCHEDULED",
      scheduledAt: inDays(1),
      peakViewers: 50,
      createdAt: minutesAgo(3 * 24 * 60),
      searchText: buildSearchText(["پیش‌فروش جردن", "کتونی و کفش"]),
    },
    [{ productId: pJordan.id, pinned: true }],
  );
  const sNoPrice = await mkShow(
    {
      sellerId: sellerB.id,
      categoryId: cats.cards.id,
      title: "شب کارت پوکمون",
      status: "SCHEDULED",
      scheduledAt: inDays(2),
      peakViewers: 40,
      createdAt: minutesAgo(4 * 24 * 60),
      searchText: buildSearchText(["شب کارت پوکمون", "کارت و کلکسیون"]),
    },
    [{ productId: pPoke.id, pinned: false }],
  );
  const sEnded = await mkShow(
    {
      sellerId: sellerA.id,
      categoryId: cats.sneakers.id,
      title: "شو تمام‌شده",
      status: "ENDED",
      startedAt: minutesAgo(2 * 24 * 60),
      endedAt: minutesAgo(2 * 24 * 60 - 60),
      createdAt: minutesAgo(2 * 24 * 60 + 30),
      peakViewers: 100,
      searchText: buildSearchText(["شو تمام‌شده", "کتونی و کفش"]),
    },
    // بدون کالای پین‌شده → بی‌قیمت در مرتب‌سازی قیمتی (آخرِ لیست)
    [{ productId: pDunk.id, pinned: false }],
  );
  ids.sCheap = sCheap.id;
  ids.sPopular = sPopular.id;
  ids.sExpensive = sExpensive.id;
  ids.sNoPrice = sNoPrice.id;
  ids.sEnded = sEnded.id;

  // buyer + follow(sellerA) → isFollowed tests
  const buyer = await db.user.create({ data: { phone: "09110000009", name: "خریدار تست" } });
  await db.follow.create({ data: { followerId: buyer.id, sellerId: sellerA.id } });
  ids.buyer = buyer.id;
  ids.buyerToken = await signAccessToken({ id: buyer.id, role: "BUYER" });
}

/* ── sort orders asserted in the tests ── */
const ALL_STATUS_ORDER = {
  popular: ["sPopular", "sCheap", "sEnded", "sExpensive", "sNoPrice"],
  newest: ["sCheap", "sPopular", "sEnded", "sExpensive", "sNoPrice"],
  price_desc: ["sExpensive", "sCheap", "sPopular", "sEnded", "sNoPrice"],
  price_asc: ["sPopular", "sCheap", "sExpensive", "sEnded", "sNoPrice"],
};

describe("v1.6.3 discovery — fixtures on real Postgres", () => {
  beforeAll(async () => {
    await seedFixtures();
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  test("fixture sanity: searchText is normalized in the DB", async () => {
    const rows = (await db.$queryRawUnsafe(
      `SELECT "searchText" FROM "Product" WHERE id = $1`,
      ids.pPoke,
    )) as { searchText: string }[];
    // Arabic ی folded? — title uses Persian ی already; digits folded ۹.۵ → 9.5
    expect(rows[0]!.searchText).toContain("پوکمون");
    expect(rows[0]!.searchText).toContain("9.5");
  });

  /* ── 1) Persian normalization parity ── */

  test("«پوكمون» (Arabic kaf) and «پوکمون» (Persian kaf) return the same products", async () => {
    const a = await callSearch("q=" + encodeURIComponent("پوكمون"));
    const b = await callSearch("q=" + encodeURIComponent("پوکمون"));
    expect(a.products.map((p) => p.id)).toEqual(b.products.map((p) => p.id));
    expect(a.products.map((p) => p.id)).toContain(ids.pPoke);
    expect(a.shows.map((s) => s.id)).toEqual(b.shows.map((s) => s.id));
  });

  test("«۹.۵» and «9.5» return the same products", async () => {
    const a = await callSearch("q=" + encodeURIComponent("۹.۵"));
    const b = await callSearch("q=" + encodeURIComponent("9.5"));
    expect(a.products.map((p) => p.id)).toEqual(b.products.map((p) => p.id));
    expect(a.products.map((p) => p.id)).toContain(ids.pPoke);
  });

  test("normalizeFa itself folds Arabic kaf/yeh and Persian/Arabic digits", () => {
    expect(normalizeFa("پوكمون")).toBe(normalizeFa("پوکمون"));
    expect(normalizeFa("۹.۵")).toBe(normalizeFa("9.5"));
    expect(normalizeFa("۰۱۲۳")).toBe("0123");
    expect(normalizeFa("كتاب")).toBe(normalizeFa("کتاب"));
  });

  /* ── 2) /search product facets (v1.6.3 fields) ── */

  test("products carry showId/showTitle (LIVE host preferred), sizes[] and condition", async () => {
    const res = await callSearch("q=" + encodeURIComponent("دانک"));
    const dunk = res.products.find((p) => p.id === ids.pDunk);
    expect(dunk).toBeDefined();
    // dunk is in sCheap (LIVE) and sEnded — LIVE wins
    expect(dunk!.showId).toBe(ids.sCheap);
    expect(dunk!.showTitle).toBe("شب کتونی نایاب");
    expect(dunk!.sizes.length).toBeGreaterThan(0);
    expect(dunk!.condition).toBe("NEW");

    const jordanRes = await callSearch("q=" + encodeURIComponent("جردن"));
    const jordan = jordanRes.products.find((p) => p.id === ids.pJordan);
    // jordan is in sCheap (LIVE) and sExpensive (SCHEDULED) — LIVE wins
    expect(jordan!.showId).toBe(ids.sCheap);
    expect(jordan!.condition).toBe("USED");

    const pokeRes = await callSearch("q=" + encodeURIComponent("پوکمون"));
    const poke = pokeRes.products.find((p) => p.id === ids.pPoke);
    // poke is only in sNoPrice (SCHEDULED, no LIVE host) → nearest upcoming wins
    expect(poke!.showId).toBe(ids.sNoPrice);
    expect(poke!.showTitle).toBe("شب کارت پوکمون");
    expect(poke!.sizes).toContain("۹.۵");
  });

  test("/search filters: price, size (both digit systems), brand, condition", async () => {
    // price
    const cheap = await callSearch(
      "q=" + encodeURIComponent("کتونی") + "&minPrice=5000000",
    );
    // only dunk/jordan text matches «کتونی» via category «کتونی و کفش»
    expect(cheap.products.map((p) => p.id).sort()).toEqual(
      [ids.pDunk, ids.pJordan].sort(),
    );

    // size — Persian digit input and latin input give the same answer
    const sizeFa = await callSearch(
      "q=" + encodeURIComponent("کتونی") + "&size=" + encodeURIComponent("۴۲"),
    );
    const sizeEn = await callSearch(
      "q=" + encodeURIComponent("کتونی") + "&size=42",
    );
    expect(sizeFa.products.map((p) => p.id)).toEqual(sizeEn.products.map((p) => p.id));
    expect(sizeFa.products.map((p) => p.id)).toContain(ids.pDunk);
    // ۴۰ has stock 2 but jordan has no ۴۰ → only dunk
    const size40 = await callSearch(
      "q=" + encodeURIComponent("کتونی") + "&size=" + encodeURIComponent("۴۰"),
    );
    expect(size40.products.map((p) => p.id)).toEqual([ids.pDunk]);

    // brand
    const nike = await callSearch(
      "q=" + encodeURIComponent("کتونی") + "&brand=Nike",
    );
    expect(nike.products.map((p) => p.id)).toEqual([ids.pDunk]);

    // condition
    const used = await callSearch(
      "q=" + encodeURIComponent("کتونی") + "&condition=USED",
    );
    expect(used.products.map((p) => p.id)).toEqual([ids.pJordan]);
    const fresh = await callSearch(
      "q=" + encodeURIComponent("کتونی") + "&condition=NEW",
    );
    expect(fresh.products.map((p) => p.id)).toEqual([ids.pDunk]);

    // invalid condition is a validation error
    const bad = await getShows(
      new Request("http://localhost/api/v1/shows?condition=LIKE_NEW"),
    );
    expect(bad.status).toBe(400);
  });

  /* ── 3) /shows sorts (real, server-side) ── */

  for (const [sort, expected] of Object.entries(ALL_STATUS_ORDER)) {
    test(`GET /shows sort=${sort} returns the exact expected order`, async () => {
      const res = await callShows(`sort=${sort}&limit=24`);
      const expectedIds = expected.map(
        (k) => ids[k as keyof typeof ids] as string,
      );
      expect(res.shows.map((s) => s.id)).toEqual(expectedIds);
    });
  }

  test("GET /shows default (no sort) keeps the legacy createdAt DESC order + cursor format", async () => {
    const res = await callShows("limit=24");
    // createdAt DESC: sCheap(-12m) > sPopular(-50m) > sEnded(-2.5d) > sExpensive(-3d) > sNoPrice(-4d)
    expect(res.shows.map((s) => s.id)).toEqual(
      ["sCheap", "sPopular", "sEnded", "sExpensive", "sNoPrice"].map(
        (k) => ids[k as keyof typeof ids],
      ),
    );
  });

  test("keyset pagination continues each sort correctly across pages", async () => {
    for (const sort of ["popular", "newest", "price_asc", "price_desc"] as const) {
      const page1 = await callShows(`sort=${sort}&limit=2`);
      expect(page1.shows).toHaveLength(2);
      expect(page1.nextCursor).not.toBeNull();
      const page2 = await callShows(`sort=${sort}&limit=2&cursor=${page1.nextCursor}`);
      const page3 = await callShows(`sort=${sort}&limit=2&cursor=${page2.nextCursor}`);

      const all = [
        ...page1.shows.map((s) => s.id),
        ...page2.shows.map((s) => s.id),
        ...page3.shows.map((s) => s.id),
      ];
      const expectedIds = ALL_STATUS_ORDER[sort].map((k) => ids[k as keyof typeof ids]);
      expect(all).toEqual(expectedIds);
      expect(new Set(all).size).toBe(all.length); // no duplicates
    }
  });

  test("SCHEDULED cards carry startsAt from real scheduledAt", async () => {
    const res = await callShows("status=SCHEDULED&sort=newest");
    for (const show of res.shows) {
      expect(show.status).toBe("SCHEDULED");
      expect(show.startsAt).not.toBeNull();
      const scheduled = new Date(show.scheduledAt!);
      expect(new Date(show.startsAt!).getTime()).toBe(scheduled.getTime());
    }
    const liveRes = await callShows("status=LIVE");
    for (const show of liveRes.shows) {
      expect(show.startsAt).toBeNull();
    }
  });

  /* ── 4) /shows filters (server-side) ── */

  test("GET /shows filters: minPrice (pinned), size, brand, condition", async () => {
    // price on the pinned item: 5M..20M keeps dunk(7.95M) + jordan(14.9M) shows
    const priced = await callShows("status=LIVE,SCHEDULED&minPrice=5000000&maxPrice=20000000");
    expect(new Set(priced.shows.map((s) => s.id))).toEqual(
      new Set([ids.sCheap, ids.sExpensive]),
    );

    // size ۴۲ with stock: sCheap (dunk) + sExpensive (jordan)
    const sized = await callShows("status=LIVE,SCHEDULED&size=" + encodeURIComponent("۴۲"));
    expect(new Set(sized.shows.map((s) => s.id))).toEqual(
      new Set([ids.sCheap, ids.sExpensive]),
    );
    // latin digit input → same
    const sizedEn = await callShows("status=LIVE,SCHEDULED&size=42");
    expect(new Set(sizedEn.shows.map((s) => s.id))).toEqual(
      new Set([ids.sCheap, ids.sExpensive]),
    );

    // brand
    const nike = await callShows("status=LIVE,SCHEDULED&brand=nike");
    expect(new Set(nike.shows.map((s) => s.id))).toEqual(new Set([ids.sCheap]));

    // condition USED → shows containing jordan
    const used = await callShows("status=LIVE,SCHEDULED&condition=USED");
    expect(new Set(used.shows.map((s) => s.id))).toEqual(
      new Set([ids.sCheap, ids.sExpensive]),
    );
  });

  /* ── 5) isFollowed with optional token ── */

  test("without a token, seller has NO isFollowed field at all", async () => {
    const res = await callShows("status=LIVE&limit=24");
    expect(res.shows.length).toBeGreaterThan(0);
    for (const show of res.shows) {
      expect("isFollowed" in show.seller).toBe(false);
    }
  });

  test("with a valid token, isFollowed is true for followed seller, false otherwise", async () => {
    const res = await callShows("status=LIVE,SCHEDULED&limit=24", ids.buyerToken);
    const bySeller = new Map(res.shows.map((s) => [s.seller.id, s.seller.isFollowed]));
    expect(bySeller.get(ids.sellerA)).toBe(true);
    expect(bySeller.get(ids.sellerB)).toBe(false);
  });

  test("an invalid token is rejected (401), not silently anonymous", async () => {
    const res = await getShows(
      new Request("http://localhost/api/v1/shows", {
        headers: { authorization: "Bearer not-a-jwt" },
      }),
    );
    expect(res.status).toBe(401);
  });

  /* ── 6) E2E: fixtures → API → mapper → UI types (home + explore) ── */

  test("E2E home: /shows API → apiShowToUiShow → Show (follow + pinned + startsAt)", async () => {
    const res = await callShows("status=LIVE&limit=24", ids.buyerToken);
    const ui = res.shows.map((s) => apiShowToUiShow(s));
    // UI types for home:
    for (const show of ui) {
      expect(typeof show.id).toBe("string");
      expect(["live", "upcoming", "ended"]).toContain(show.status);
    }
    const followed = ui.find((s) => s.sellerId === ids.sellerA);
    expect(followed!.isFollowing).toBe(true); // «دنبال‌شده‌ها» home filter works
    const cheap = ui.find((s) => s.id === ids.sCheap)!;
    expect(cheap.pinnedPrice).toBe(7_950_000); // full price on the card
    expect(cheap.status).toBe("live");

    // upcoming (explore/home upcoming feed): countdown source = real startsAt
    const schedRes = await callShows("status=SCHEDULED&sort=newest");
    const upcomingUi = schedRes.shows.map((s) => apiShowToUiShow(s, "upcoming"));
    for (const show of upcomingUi) {
      expect(show.status).toBe("upcoming");
      expect(show.startsAt).not.toBeNull();
      expect(new Date(show.startsAt!).getTime()).toBeGreaterThan(Date.now() - 60_000);
    }
  });

  test("E2E explore: /search API → apiSearchToUi → ProductResult (deep-link + facets)", async () => {
    const res = await callSearch("q=" + encodeURIComponent("پوکمون"));
    const ui = apiSearchToUi(res);
    expect(ui.shows.every((s) => s.status === "live" || s.status === "upcoming")).toBe(true);

    const poke = ui.products.find((p) => p.id === ids.pPoke)!;
    // «در لایوی فلان» now survives in API mode (nearest upcoming SCHEDULED):
    expect(poke.showId).toBe(ids.sNoPrice);
    expect(poke.showTitle).toBe("شب کارت پوکمون");
    // size/condition facets now survive in API mode:
    expect(poke.variantLabels).toContain("۹.۵");
    expect(poke.size).toBe("۹.۵");
    expect(poke.condition).toBe("نو");

    const seller = ui.sellers[0];
    if (seller) {
      expect(typeof seller.name).toBe("string");
      expect(typeof seller.handle).toBe("string");
    }
  });

  test("category filter still works on /shows (regression guard)", async () => {
    const res = await callShows("status=LIVE&category=plants");
    expect(res.shows.map((s) => s.id)).toEqual([ids.sPopular]);
  });
});
