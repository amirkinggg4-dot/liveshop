# LiveShop — API and Realtime Contract (v0.1)

Base: `/api/v1` · JSON · Auth: `Authorization: Bearer <jwt>` (access 15 min + refresh) · Money: integer Toman.
Errors: `{ "error": { "code": "OUT_OF_STOCK", "message": "فارسی برای کاربر" } }`

## 1. Auth
| Method | Path | Notes |
|---|---|---|
| POST | /auth/otp/request | `{phone}` → SMS code. Rate limit: 3 per 10 min per phone and per IP |
| POST | /auth/otp/verify | `{phone, code}` → `{accessToken, refreshToken, user}`; creates user on first login |
| POST | /auth/refresh | rotate refresh token |
| GET | /me | profile, wallet balance |
| PATCH | /me | name, avatar |
| GET/POST/PATCH/DELETE | /me/addresses | |

## 2. Discovery (public)
| GET | /categories | with live-show counts |
| GET | /shows?status=LIVE\|SCHEDULED&category=&cursor= | cards: pinned item price + stock |
| GET | /shows/:id | show + items + seller + pinned item |
| GET | /sellers/:slug | storefront |
| GET | /search?q= | shows, sellers, products |
| POST/DELETE | /sellers/:id/follow | |

## 3. Live room
| POST | /shows/:id/join | → `{livekitToken, wsTicket}` (viewer, subscribe-only) |
| GET | /shows/:id/messages?before= | last 50 |
| POST | /shows/:id/messages | `{body}`; rate limit 1 msg/sec; profanity filter |

### Realtime (WebSocket, channel `show:{id}`)
Server → client events:
- `viewers` `{count}` (throttled to 1/3s)
- `chat` `{id, user, kind, body}`
- `pin_changed` `{showItemId, product, price, stock}`
- `stock_changed` `{variantId, stock}`
- `purchase` `{userDisplay, productTitle}`  (shown as "علی ✅ خرید کرد")
- `show_ended`

Client → server: `chat`, `ping`. Purchases go through REST only (never WebSocket).

## 4. Checkout (the critical path)
| POST | /orders | headers: `Idempotency-Key` |
Body: `{ showId, items:[{variantId, qty}], addressId, shippingMethod }`

Server steps (ONE database transaction):
1. Check the idempotency key; if the order exists return it.
2. For each item: `UPDATE "Variant" SET stock = stock - $qty WHERE id = $id AND stock >= $qty` → 0 rows = `OUT_OF_STOCK` (rollback everything).
3. Compute `itemsTotal + shippingFee`; compute `commission` (seller tier).
4. Wallet check: balance = SUM of ledger for the buyer's `USER_WALLET`; insufficient → `INSUFFICIENT_FUNDS`.
5. Ledger: buyer wallet −total → `ESCROW` +total (kind `PURCHASE_HOLD`).
6. Insert Order (`PAID_HELD`, `shipDeadline = now + 48h`) + items + address snapshot.
7. After commit: publish `stock_changed` and `purchase` to the show channel; notify the seller.

| GET | /orders, /orders/:id | buyer |
| POST | /orders/:id/confirm-delivery | buyer confirms → release |
| POST | /orders/:id/dispute | `{reason}` within 72h of delivery |

## 5. Wallet
| GET | /wallet | balance + history |
| POST | /wallet/topup | `{amount}` → gateway redirect URL |
| GET | /wallet/topup/callback | gateway callback; **verify server-to-server**, then credit ledger once (idempotent on `gatewayRef`) |

## 6. Seller
| POST | /seller/apply | KYC form → status PENDING |
| CRUD | /seller/products, /seller/products/:id/variants | stock edits are blocked while the item is pinned |
| CRUD | /seller/shows | create/schedule, set item order |
| POST | /seller/shows/:id/start | creates LiveKit room → `{publisherToken}` |
| POST | /seller/shows/:id/pin | `{showItemId}` → emits `pin_changed` |
| POST | /seller/shows/:id/end | |
| GET | /seller/orders?status= | |
| POST | /seller/orders/:id/ship | `{carrier, trackingCode}` → status SHIPPED |
| GET | /seller/revenue | released vs held vs pending payout |
| POST | /seller/payouts | withdraw to IBAN (min amount, daily cap) |

## 7. Admin
| GET | /admin/sellers?status=PENDING | |
| POST | /admin/sellers/:id/approve \| suspend | |
| GET | /admin/disputes, POST /admin/disputes/:id/resolve | `{outcome: refund\|release}` |
| POST | /admin/shows/:id/force-end | |
| GET | /admin/reports | |

## 8. Background jobs (queue: BullMQ on Redis)
- Auto-cancel + refund orders not shipped by `shipDeadline`.
- Auto-release escrow N days after `DELIVERED` with no dispute.
- Expire OTP codes; clean old chat.
- Ledger reconciliation: nightly check that every `txnId` sums to 0 and gateway totals match.

## 9. Security checklist (must-have before real money)
- Never trust the client for price, stock, or totals.
- Idempotency keys on orders and wallet top-ups.
- Rate limits: OTP, chat, order creation.
- Row-level checks: a seller can only touch own products/orders.
- Payment callback: verify with the gateway directly, never from the redirect alone.
- Store the minimum of KYC data, encrypted; never log OTPs or tokens.
- Admin actions written to an audit log.
