/**
 * LiveShop — seed for the real PostgreSQL backend (phase 1).
 *
 * Mirrors the mock data (src/lib/data) so the API returns familiar Persian
 * demo content: 10 categories, 5 approved sellers, products with size
 * variants, live/scheduled/ended shows with pinned items, and a demo buyer
 * with a topped-up wallet (double-entry ledger).
 *
 * Run:  bun run db:seed   (requires a reachable DATABASE_URL)
 */
import { PrismaClient } from "@prisma/client";
import { buildSearchText } from "../src/lib/normalize";

const db = new PrismaClient();

const now = Date.now();
const minutes = (n: number) => new Date(now + n * 60_000);
const days = (n: number) => new Date(now + n * 24 * 60 * 60_000);

async function main() {
  console.log("→ wiping tables …");
  await db.$executeRawUnsafe(`
    TRUNCATE TABLE
      "LedgerEntry", "Account", "Dispute", "Shipment", "OrderItem", "Order",
      "ChatMessage", "ShowItem", "Show", "Follow", "Variant", "Product",
      "Category", "Address", "RefreshToken", "OtpCode", "SellerProfile",
      "User", "Report"
    RESTART IDENTITY CASCADE;
  `);

  // ───────── Categories (same slugs as the mock UI) ─────────
  console.log("→ categories …");
  const categories = await Promise.all(
    (
      [
        ["sneakers", "کتونی و کفش"],
        ["plants", "گیاه و گلخانه"],
        ["cards", "کارت و کلکسیون"],
        ["tech", "دیجیتال و گجت"],
        ["fashion", "مد و پوشاک"],
        ["beauty", "زیبایی و عطر"],
        ["home", "خانه و آشپزخانه"],
        ["toys", "عروسک و اسباب‌بازی"],
        ["books", "کتاب و کامیک"],
        ["art", "هنر و دست‌ساز"],
      ] as const
    ).map(([slug, nameFa]) => db.category.create({ data: { slug, nameFa } })),
  );
  const cat = Object.fromEntries(categories.map((c) => [c.slug, c.id]));
  const catName = Object.fromEntries(categories.map((c) => [c.slug, c.nameFa]));

  // ───────── Sellers (mirrors src/lib/data/shows.ts) ─────────
  console.log("→ sellers & users …");
  const sellerSeeds = [
    {
      phone: "09120000001",
      shopName: "کفش‌خانهٔ سینا",
      slug: "sina-sneaks",
      avatarUrl: "/liveshop/seller-s1.jpg",
      bio: "کتونی‌های کمیاب، اورجینال و گارانتی اصالت. لایو خرید هر شب ساعت ۲۱ — همه‌چیز با قیمت ثابت.",
      ratingAvg: 4.9,
      ratingCount: 2341,
    },
    {
      phone: "09120000002",
      shopName: "گلخانهٔ مینا",
      slug: "mina-plants",
      avatarUrl: "/liveshop/seller-s2.jpg",
      bio: "تک‌گیاه‌های نادر، ساکولنت و تجهیزات گلخانه. ارسال با بسته‌بندی ویژهٔ گیاه.",
      ratingAvg: 4.8,
      ratingCount: 1840,
    },
    {
      phone: "09120000003",
      shopName: "کلکسیون‌یار تهران",
      slug: "teh-collector",
      avatarUrl: "/liveshop/seller-s3.jpg",
      bio: "کارت‌های کلکسیونی، فیگور و یادگاری‌های نایاب. بسته‌بندی ضدضربه.",
      ratingAvg: 5.0,
      ratingCount: 968,
    },
    {
      phone: "09120000004",
      shopName: "گجت‌بازار",
      slug: "gadget-bazaar",
      avatarUrl: "/liveshop/seller-s4.jpg",
      bio: "گجت، هدفون و لوازم جانبی با قیمت ثابت کارخانه. ضمانت سلامت کالا.",
      ratingAvg: 4.7,
      ratingCount: 1204,
    },
    {
      phone: "09120000005",
      shopName: "عطر و نگین",
      slug: "atr-o-negin",
      avatarUrl: "/liveshop/seller-s5.jpg",
      bio: "عطرهای اورجینال و زیورآلات دست‌ساز؛ لایو جمع‌بندی هر هفته.",
      ratingAvg: 4.6,
      ratingCount: 764,
    },
  ];

  const sellers: { sellerId: string; slug: string }[] = [];
  for (const s of sellerSeeds) {
    const user = await db.user.create({
      data: { phone: s.phone, name: s.shopName, role: "SELLER" },
    });
    const profile = await db.sellerProfile.create({
      data: {
        userId: user.id,
        shopName: s.shopName,
        slug: s.slug,
        bio: s.bio,
        avatarUrl: s.avatarUrl,
        status: "APPROVED",
        ratingAvg: s.ratingAvg,
        ratingCount: s.ratingCount,
        // v1.6.3 — ستون جستجو با همان normalizeFa مشترک UI/سرور پر می‌شود
        searchText: buildSearchText([s.shopName, s.slug]),
      },
    });
    sellers.push({ sellerId: profile.id, slug: profile.slug });
  }
  const [sina, mina, collector, gadget] = sellers.map((s) => s.sellerId);

  // ───────── Products with size variants ─────────
  console.log("→ products & variants …");
  const sizes = ["۴۰", "۴۱", "۴۲", "۴۳", "۴۴"];
  const shoeVariants = (baseSku: string, stock: number[]) =>
    sizes.map((label, i) => ({
      label: `${label} / مشکی`,
      sku: `${baseSku}-${i + 1}`,
      stock: stock[i] ?? 0,
    }));

  const products: Record<string, string> = {};

  const p = async (key: string, data: Parameters<typeof db.product.create>[0]["data"]) => {
    const row = await db.product.create({ data });
    products[key] = row.id;
    return row;
  };

  await p("dunkPanda", {
    sellerId: sina,
    categoryId: cat.sneakers,
    title: "نایک دانک لو پاندا",
    brand: "Nike",
    description: "رنگ‌بندی مشکی‌وسفید محبوب‌ترین دانک چند سال اخیر؛ اورجینال با جعبهٔ سالم.",
    images: ["/liveshop/item-it1.jpg"],
    price: 7_950_000,
    condition: "NEW",
    searchText: buildSearchText(["نایک دانک لو پاندا", "Nike", catName.sneakers]),
    weightGram: 1100,
    isDraft: false,
    variants: {
      create: shoeVariants("DK-PANDA", [2, 4, 6, 3, 1]),
    },
  });

  await p("samba", {
    sellerId: sina,
    categoryId: cat.sneakers,
    title: "آدیداس سامبا اوگ",
    brand: "adidas",
    description: "سامبا اوگ با زیرهٔ صمغی؛ کلاسیک همیشه‌جوان.",
    images: ["/liveshop/item-it2.jpg"],
    price: 6_480_000,
    condition: "NEW",
    searchText: buildSearchText(["آدیداس سامبا اوگ", "adidas", catName.sneakers]),
    weightGram: 980,
    isDraft: false,
    variants: { create: shoeVariants("SMB-OG", [1, 3, 5, 2, 0]) },
  });

  await p("jordan1", {
    sellerId: sina,
    categoryId: cat.sneakers,
    title: "جردن ۱ شیکاگو",
    brand: "Jordan",
    description: "نسخهٔ شیکاگو با پچ قرمز؛ یکی‌درمیان.",
    images: ["/liveshop/item-it3.jpg"],
    price: 14_900_000,
    // v1.6.3 — یکی‌درمیان → دست‌دوم (برای فیلتر وضعیت و تست‌ها)
    condition: "USED",
    searchText: buildSearchText(["جردن ۱ شیکاگو", "Jordan", catName.sneakers]),
    weightGram: 1200,
    isDraft: false,
    variants: { create: shoeVariants("AJ1-CHI", [0, 1, 2, 1, 0]) },
  });

  await p("nb530", {
    sellerId: sina,
    categoryId: cat.sneakers,
    title: "نیوبالانس ۵۳۰",
    brand: "New Balance",
    description: "سبک و راحت برای استفادهٔ روزمره؛ مش نقره‌ای.",
    images: ["/liveshop/item-it4.jpg"],
    price: 5_890_000,
    condition: "NEW",
    searchText: buildSearchText(["نیوبالانس ۵۳۰", "New Balance", catName.sneakers]),
    weightGram: 850,
    isDraft: false,
    variants: { create: shoeVariants("NB-530", [3, 4, 4, 2, 1]) },
  });

  await p("monstera", {
    sellerId: mina,
    categoryId: cat.plants,
    title: "مونسترا وراگتهٔ ابلق",
    brand: "—",
    description: "بوتهٔ پنج‌برگی با ریشهٔ هوایی؛ با خزانهٔ ویژهٔ گیاه ارسال می‌شود.",
    images: ["/liveshop/item-it5.jpg"],
    price: 2_450_000,
    condition: "NEW",
    searchText: buildSearchText(["مونسترا وراگتهٔ ابلق", "—", catName.plants]),
    weightGram: 2500,
    isDraft: false,
    variants: {
      create: [
        { label: "تک‌ساقهٔ ۶۰ سانتی", sku: "MNST-A", stock: 5 },
        { label: "دوساقهٔ ۸۰ سانتی", sku: "MNST-B", stock: 2 },
      ],
    },
  });

  await p("fiddleLeaf", {
    sellerId: mina,
    categoryId: cat.plants,
    title: "فیکوس بنجامین تاج‌دار",
    brand: "—",
    description: "ارتفاع ۱۲۰ سانتی؛ مناسب نور غیرمستقیم پنجره.",
    images: ["/liveshop/item-it6.jpg"],
    price: 1_850_000,
    condition: "NEW",
    searchText: buildSearchText(["فیکوس بنجامین تاج‌دار", "—", catName.plants]),
    weightGram: 4200,
    isDraft: false,
    variants: { create: [{ label: "تک‌تنه ۱۲۰ سانتی", sku: "FIC-120", stock: 3 }] },
  });

  await p("pikachuCard", {
    sellerId: collector,
    categoryId: cat.cards,
    title: "کارت پیکاچو وَو — پرمیوم",
    brand: "Pokémon TCG",
    description: "گرید PSA ۹؛ همراه قاب ضد UV.",
    images: ["/liveshop/cat-cards.jpg"],
    price: 9_800_000,
    condition: "NEW",
    searchText: buildSearchText(["کارت پیکاچو وَو — پرمیوم", "Pokémon TCG", catName.cards]),
    weightGram: 120,
    isDraft: false,
    variants: { create: [{ label: "تک‌کارت قاب‌دار", sku: "PKM-001", stock: 1 }] },
  });

  await p("ironManFigure", {
    sellerId: collector,
    categoryId: cat.toys,
    title: "فیگور آیرون‌من مارک ۸۵",
    brand: "Hot Toys",
    description: "مقیاس ۱:۶ با قطعات جایگزین؛ جعبهٔ اوریجینال.",
    images: ["/liveshop/cat-toys.jpg"],
    price: 18_500_000,
    condition: "NEW",
    searchText: buildSearchText(["فیگور آیرون‌من مارک ۸۵", "Hot Toys", catName.toys]),
    weightGram: 1900,
    isDraft: false,
    variants: { create: [{ label: "استاندارد", sku: "HT-IM85", stock: 2 }] },
  });

  await p("ancHeadphone", {
    sellerId: gadget,
    categoryId: cat.tech,
    title: "هدفون بی‌سیم نویزکنسلینگ X7",
    brand: "SoundPeak",
    description: "۴۰ ساعت شارژدهی؛ ضمانت ۱۸ماههٔ گجت‌بازار.",
    images: ["/liveshop/cat-tech.jpg"],
    price: 4_320_000,
    condition: "NEW",
    searchText: buildSearchText(["هدفون بی‌سیم نویزکنسلینگ X7", "SoundPeak", catName.tech]),
    weightGram: 520,
    isDraft: false,
    variants: {
      create: [
        { label: "مشکی", sku: "X7-BLK", stock: 6 },
        { label: "کرم", sku: "X7-CRM", stock: 3 },
      ],
    },
  });

  await p("oudPerfume", {
    sellerId: sellers[4].sellerId,
    categoryId: cat.beauty,
    title: "ادکلن عود سلطنتی ۱۰۰ میلی",
    brand: "Royal Oud",
    description: "رایحهٔ چوبی گرم با ماندگاری ۱۲ ساعت؛ اورجینال با سیل.",
    images: ["/liveshop/cat-beauty.jpg"],
    price: 3_650_000,
    condition: "NEW",
    searchText: buildSearchText(["ادکلن عود سلطنتی ۱۰۰ میلی", "Royal Oud", catName.beauty]),
    weightGram: 400,
    isDraft: false,
    variants: { create: [{ label: "۱۰۰ میلی‌لیتر", sku: "RO-100", stock: 4 }] },
  });

  // ───────── Shows ─────────
  console.log("→ shows & show items …");
  const addItems = async (
    showId: string,
    list: { productId: string; pinned: boolean; soldCount: number }[],
  ) => {
    let position = 1;
    for (const it of list) {
      await db.showItem.create({
        data: { showId, productId: it.productId, position: position++, pinned: it.pinned, soldCount: it.soldCount },
      });
    }
  };

  const sh1 = await db.show.create({
    data: {
      sellerId: sina,
      categoryId: cat.sneakers,
      title: "شب کتونی نایاب — همه با قیمت ثابت",
      coverUrl: "/liveshop/live-sh1.jpg",
      status: "LIVE",
      startedAt: minutes(-48),
      peakViewers: 1240,
      searchText: buildSearchText(["شب کتونی نایاب — همه با قیمت ثابت", catName.sneakers]),
    },
  });
  await addItems(sh1.id, [
    { productId: products.dunkPanda, pinned: true, soldCount: 6 },
    { productId: products.samba, pinned: false, soldCount: 3 },
    { productId: products.jordan1, pinned: false, soldCount: 1 },
    { productId: products.nb530, pinned: false, soldCount: 0 },
  ]);

  const sh2 = await db.show.create({
    data: {
      sellerId: mina,
      categoryId: cat.plants,
      title: "گلخانهٔ زندهٔ مینا — تک‌گیاه‌های نادر",
      coverUrl: "/liveshop/live-sh2.jpg",
      status: "LIVE",
      startedAt: minutes(-22),
      peakViewers: 862,
      searchText: buildSearchText(["گلخانهٔ زندهٔ مینا — تک‌گیاه‌های نادر", catName.plants]),
    },
  });
  await addItems(sh2.id, [
    { productId: products.monstera, pinned: true, soldCount: 2 },
    { productId: products.fiddleLeaf, pinned: false, soldCount: 0 },
  ]);

  const sh3 = await db.show.create({
    data: {
      sellerId: collector,
      categoryId: cat.cards,
      title: "کلکسیون‌یار تهران — کارت و فیگور",
      coverUrl: "/liveshop/live-sh3.jpg",
      status: "LIVE",
      startedAt: minutes(-95),
      peakViewers: 521,
      searchText: buildSearchText(["کلکسیون‌یار تهران — کارت و فیگور", catName.cards]),
    },
  });
  await addItems(sh3.id, [
    { productId: products.pikachuCard, pinned: true, soldCount: 0 },
    { productId: products.ironManFigure, pinned: false, soldCount: 1 },
  ]);

  const sh4 = await db.show.create({
    data: {
      sellerId: sina,
      categoryId: cat.sneakers,
      title: "پیش‌فروش آخر هفته — جردن و نیوبالانس",
      coverUrl: "/liveshop/live-sh1.jpg",
      status: "SCHEDULED",
      scheduledAt: days(1),
      searchText: buildSearchText(["پیش‌فروش آخر هفته — جردن و نیوبالانس", catName.sneakers]),
    },
  });
  await addItems(sh4.id, [
    { productId: products.jordan1, pinned: true, soldCount: 0 },
    { productId: products.nb530, pinned: false, soldCount: 0 },
  ]);

  const sh5 = await db.show.create({
    data: {
      sellerId: gadget,
      categoryId: cat.tech,
      title: "گجت‌بازار — هدفون و لوازم جانبی",
      coverUrl: "/liveshop/cat-tech.jpg",
      status: "ENDED",
      startedAt: days(-2),
      endedAt: days(-2),
      peakViewers: 934,
      searchText: buildSearchText(["گجت‌بازار — هدفون و لوازم جانبی", catName.tech]),
    },
  });
  await addItems(sh5.id, [{ productId: products.ancHeadphone, pinned: true, soldCount: 9 }]);

  // ───────── Demo buyer with a topped-up wallet (ledger) ─────────
  console.log("→ demo buyer + wallet ledger …");
  const buyer = await db.user.create({
    data: { phone: "09121234567", name: "علی" },
  });
  const [wallet, clearing] = await Promise.all([
    db.account.create({ data: { type: "USER_WALLET", userId: buyer.id } }),
    db.account.create({ data: { type: "GATEWAY_CLEARING", userId: null } }),
  ]);
  await db.ledgerEntry.createMany({
    data: [
      {
        txnId: "seed-topup-0001",
        accountId: wallet.id,
        amount: BigInt(5_000_000),
        kind: "TOPUP",
        gatewayRef: "seed-gw-0001",
      },
      {
        txnId: "seed-topup-0001",
        accountId: clearing.id,
        amount: BigInt(-5_000_000),
        kind: "TOPUP",
        gatewayRef: "seed-gw-0001",
      },
    ],
  });

  console.log("✓ seed complete");
  console.log(`  shows: ${[sh1.id, sh2.id, sh3.id, sh4.id, sh5.id].join(", ")}`);
  console.log(`  sellers: ${sellers.map((s) => s.slug).join(", ")}`);
  console.log(`  demo buyer: 09121234567 (wallet 5,000,000 Toman)`);
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
