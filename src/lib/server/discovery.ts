/**
 * LiveShop API v1 — shared discovery engine for GET /shows and GET /search
 * (spec §2). v1.6.3.
 *
 * Everything user-typed passes through the SHARED normalizeFa
 * (src/lib/normalize.ts) — the same function the UI and the seed use — so
 * «پوكمون» and «پوکمون», or «۹.۵» and «9.5», are the same query.
 *
 * Sorts (GET /shows?sort=):
 *   popular     → peakViewers DESC            (seeded LIVE shows carry viewers)
 *   newest      → COALESCE(startedAt, createdAt) DESC
 *   price_asc   → pinned item price ASC  NULLS LAST
 *   price_desc  → pinned item price DESC NULLS LAST
 *   (no param)  → createdAt DESC — the pre-1.6.3 default, cursor unchanged
 *
 * All sorts use keyset pagination; the opaque cursor is `<key>_<id>` where
 * `<key>` is the sort key of the last row of the previous page.
 */
import { Prisma, type ShowStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { errors } from "./http";
import { showCardInclude, type ShowCardRow } from "./shows";
import { normalizeFa } from "@/lib/normalize";

export type ShowSort = "popular" | "newest" | "price_asc" | "price_desc";

export const SHOW_SORTS: ShowSort[] = [
  "popular",
  "newest",
  "price_asc",
  "price_desc",
];

/** Item-level filters shared by /shows and /search. */
export interface DiscoveryFilters {
  minPrice: number | null;
  maxPrice: number | null;
  /** normalized size token, e.g. "42" (matches variant "۴۲ / مشکی") */
  size: string | null;
  /** normalized brand fragment (matches product searchText) */
  brand: string | null;
  condition: "NEW" | "USED" | null;
}

export const EMPTY_DISCOVERY_FILTERS: DiscoveryFilters = {
  minPrice: null,
  maxPrice: null,
  size: null,
  brand: null,
  condition: null,
};

/**
 * Parses + normalizes the shared filter params.
 *   minPrice=… maxPrice=… size=… brand=… condition=NEW|USED
 * Unknown condition values are a validation error (explicit contract).
 */
export function parseDiscoveryFilters(
  params: URLSearchParams,
): DiscoveryFilters {
  const num = (key: string): number | null => {
    const raw = params.get(key);
    if (raw == null || raw.trim() === "") return null;
    const n = Number(normalizeFa(raw).replace(/[^\d.]/g, ""));
    if (Number.isNaN(n) || n < 0) {
      throw errors.validation(`مقدار ${key} نامعتبر است`);
    }
    return Math.round(n);
  };

  const conditionRaw = params.get("condition");
  let condition: "NEW" | "USED" | null = null;
  if (conditionRaw) {
    const c = conditionRaw.trim().toUpperCase();
    if (c !== "NEW" && c !== "USED") {
      throw errors.validation("وضعیت کالا فقط NEW یا USED است");
    }
    condition = c;
  }

  return {
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    size: params.get("size") ? normalizeFa(params.get("size")!) : null,
    brand: params.get("brand") ? normalizeFa(params.get("brand")!) : null,
    condition,
  };
}

/** All non-empty filter fragments as one SQL chunk ("" when nothing set). */
export function discoveryFilterSql(f: DiscoveryFilters): Prisma.Sql {
  const parts: Prisma.Sql[] = [];

  if (f.minPrice != null) {
    parts.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ShowItem" fsi
      JOIN "Product" fp ON fp.id = fsi."productId"
      WHERE fsi."showId" = s.id AND fsi.pinned AND fp.price >= ${f.minPrice}
    )`);
  }
  if (f.maxPrice != null) {
    parts.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ShowItem" fsi
      JOIN "Product" fp ON fp.id = fsi."productId"
      WHERE fsi."showId" = s.id AND fsi.pinned AND fp.price <= ${f.maxPrice}
    )`);
  }
  if (f.brand) {
    // brand (or any product title/brand containing it) among the show items
    parts.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ShowItem" fsb
      JOIN "Product" fb ON fb.id = fsb."productId"
      WHERE fsb."showId" = s.id AND fb."searchText" LIKE ${`%${f.brand}%`}
    )`);
  }
  if (f.size) {
    // a variant label whose size part (before " /") equals the token, in stock
    // (Persian/Arabic digits folded to latin on BOTH sides via normalizeFa)
    parts.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ShowItem" fss
      JOIN "Product" fpp ON fpp.id = fss."productId"
      JOIN "Variant" fv ON fv."productId" = fpp.id
      WHERE fss."showId" = s.id AND fv.stock > 0
        AND btrim(translate(lower(split_part(fv."label", '/', 1)),
              '۰۱۲۳۴۵۶۷۸۹٠١٢٣٤٥٦٧٨٩', '0123456789')) = ${f.size}
    )`);
  }
  if (f.condition) {
    parts.push(Prisma.sql`EXISTS (
      SELECT 1 FROM "ShowItem" fsc
      JOIN "Product" fc ON fc.id = fsc."productId"
      WHERE fsc."showId" = s.id AND fc."condition" = ${f.condition}::"Condition"
    )`);
  }

  return parts.length > 0
    ? Prisma.sql` AND ${Prisma.join(parts, " AND ")}`
    : Prisma.empty;
}

/** Status WHERE chunk: explicit list, or the default "not CANCELED". */
export function showStatusSql(statuses: ShowStatus[] | undefined): Prisma.Sql {
  if (statuses && statuses.length > 0) {
    return Prisma.sql`s.status IN (${Prisma.join(
      statuses.map((st) => Prisma.sql`${st}::"ShowStatus"`),
      ", "
    )})`;
  }
  return Prisma.sql`s.status <> 'CANCELED'`;
}

export interface ShowKeysetPage {
  ids: string[];
  nextCursor: string | null;
}

type RawRow = {
  id: string;
  created_at: Date;
  peakviewers: number;
  newest_key: Date;
  price_key: number | null;
};

/**
 * Keyset page of show ids for the given sort — the heart of GET /shows.
 * `cursor` is the opaque value returned as nextCursor (or undefined).
 */
export async function fetchShowIdPage(opts: {
  statuses: ShowStatus[] | undefined;
  categoryId: string | null;
  sort: string | undefined; // undefined = legacy default (createdAt DESC)
  filters: DiscoveryFilters;
  cursor?: string;
  limit: number;
}): Promise<ShowKeysetPage> {
  const { statuses, categoryId, sort, filters, cursor, limit } = opts;

  // ── cursor: "<key>_<id>" (opaque) ──
  let cursorPredicate: Prisma.Sql = Prisma.empty;
  if (cursor) {
    const idx = cursor.lastIndexOf("_");
    const key = idx >= 0 ? cursor.slice(0, idx) : "";
    const id = idx >= 0 ? cursor.slice(idx + 1) : "";
    if (!id) throw errors.validation("cursor نامعتبر است");

    if (sort == null) {
      // legacy: createdAt DESC, id DESC
      const ts = new Date(Number(key));
      if (Number.isNaN(ts.getTime())) throw errors.validation("cursor نامعتبر است");
      cursorPredicate = Prisma.sql` AND (s."createdAt" < ${ts} OR (s."createdAt" = ${ts} AND s.id < ${id}))`;
    } else if (sort === "popular") {
      const v = Number(key);
      if (!Number.isInteger(v)) throw errors.validation("cursor نامعتبر است");
      cursorPredicate = Prisma.sql` AND (s."peakViewers" < ${v} OR (s."peakViewers" = ${v} AND s.id < ${id}))`;
    } else if (sort === "newest") {
      const ts = new Date(Number(key));
      if (Number.isNaN(ts.getTime())) throw errors.validation("cursor نامعتبر است");
      cursorPredicate = Prisma.sql` AND (COALESCE(s."startedAt", s."createdAt") < ${ts} OR (COALESCE(s."startedAt", s."createdAt") = ${ts} AND s.id < ${id}))`;
    } else if (sort === "price_asc" || sort === "price_desc") {
      // ASC/DESC both use NULLS LAST, so the continuation must ALSO pick up
      // the NULL-priced rows that follow the keyed ones (price >/< k skips
      // NULLs in SQL) — otherwise pages after a keyed row lose the tail.
      const cmp = sort === "price_asc" ? Prisma.sql`>` : Prisma.sql`<`;
      cursorPredicate =
        key === "null"
          ? // last page ended in a NULL-priced row → remaining NULL-priced ids
            Prisma.sql` AND (pp.price IS NULL AND s.id < ${id})`
          : (() => {
              const n = Number(key);
              if (Number.isNaN(n)) throw errors.validation("cursor نامعتبر است");
              return Prisma.sql` AND ((pp.price ${cmp} ${n}) OR (pp.price = ${n} AND s.id < ${id}) OR (pp.price IS NULL))`;
            })();
    } else {
      throw errors.validation(
        "مرتب‌سازی نامعتبر است؛ مقادیر مجاز: popular, newest, price_asc, price_desc",
      );
    }
  }

  const orderBy =
    sort == null
      ? Prisma.sql`ORDER BY s."createdAt" DESC, s.id DESC`
      : sort === "popular"
        ? Prisma.sql`ORDER BY s."peakViewers" DESC, s.id DESC`
        : sort === "newest"
          ? Prisma.sql`ORDER BY COALESCE(s."startedAt", s."createdAt") DESC, s.id DESC`
          : sort === "price_asc"
            ? Prisma.sql`ORDER BY pp.price ASC NULLS LAST, s.id DESC`
            : Prisma.sql`ORDER BY pp.price DESC NULLS LAST, s.id DESC`;

  const rows = (await db.$queryRaw(
    Prisma.sql`SELECT s.id, s."createdAt" AS created_at, s."peakViewers" AS peakviewers,
                      COALESCE(s."startedAt", s."createdAt") AS newest_key,
                      pp.price AS price_key
               FROM "Show" s
               LEFT JOIN "ShowItem" si ON si."showId" = s.id AND si.pinned
               LEFT JOIN "Product" pp ON pp.id = si."productId"
               WHERE ${showStatusSql(statuses)}
                 ${categoryId ? Prisma.sql`AND s."categoryId" = ${categoryId}` : Prisma.empty}
                 ${discoveryFilterSql(filters)}
                 ${cursorPredicate}
               ${orderBy}
               LIMIT ${limit + 1}`,
  )) as RawRow[];

  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;

  let nextCursor: string | null = null;
  if (hasMore && page.length > 0) {
    const last = page[page.length - 1];
    const key =
      sort == null
        ? String(last.created_at.getTime())
        : sort === "popular"
          ? String(last.peakviewers)
          : sort === "newest"
            ? String(last.newest_key.getTime())
            : last.price_key == null
              ? "null"
              : String(last.price_key);
    nextCursor = `${key}_${last.id}`;
  }

  return { ids: page.map((r) => r.id), nextCursor };
}

/** Load full show cards for a page of ids, preserving the keyset order. */
export async function loadShowRowsInOrder(ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await db.show.findMany({
    where: { id: { in: ids } },
    include: showCardInclude,
  });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids
    .map((id) => byId.get(id))
    .filter((r): r is ShowCardRow => r != null);
}
