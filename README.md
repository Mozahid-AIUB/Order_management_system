# Order Management System

Order management with a promotion engine supporting percentage, fixed, and weight-based (slab) discounts.

**Live demo:** http://194.233.85.160:3001 · `admin@mozahid.com` / `admin123`

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | JWT (Passport) with bcrypt hashing |

## Features

**Authentication** — sign-in with email and password; every product, promotion, and order endpoint is guarded by JWT.

**Products** — list, create, edit every field, and enable/disable. Disabled products stay in past orders but never appear at the counter.

**Promotions** — list, create, pause/resume, and edit. Editing is limited to title and dates, as specified. Three types:

- **Percentage** — a share of the line total
- **Fixed** — a flat amount per unit
- **Weighted** — slab-based, driven by the cart's total weight

**Orders** — list and create. The cart shows each product's discount, subtotal, total discount, and grand total. Opening a past order reveals its line items.

## Weighted promotions

A weighted promotion holds slabs. Each slab is a weight range with a discount per unit.

| Slab | Weight range | Discount per 500g |
|---|---|---|
| 1 | 1kg – 5.5kg | 2 tk |
| 2 | 6kg – 8.5kg | 3 tk |
| 3 | 9kg – 11.5kg | 4 tk |
| 4 | 12kg and above | 5 tk |

Twelve units of a 500g product weigh 6000g, which lands in slab 2: `3 × 12 = 36 tk`.

A promotion may define any number of slabs with arbitrary ranges. Omitting the last slab's maximum means unlimited.

## Setup

Requires Node.js 20+, PostgreSQL 16, npm.

**1. Install**

```bash
git clone https://github.com/Mozahid-AIUB/Order_management_system.git
cd Order_management_system
cd backend && npm install
cd ../frontend && npm install
```

**2. Create a database** named `order_management`.

**3. Configure** `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/order_management?schema=public"
JWT_SECRET="any-long-random-string"
```

URL-encode special characters in the password — `@` becomes `%40`.

**4. Migrate and seed**

```bash
cd backend
npx prisma migrate dev
npm run seed          # admin account
npm run seed:demo     # optional demo catalogue
```

`seed` creates `admin@mozahid.com` / `admin123`.

`seed:demo` adds 68 products across nine categories and six promotions covering every type and state — weighted with four slabs, weighted with three, percentage, fixed, one paused, one expired. It skips itself if products already exist.

**5. Run**

```bash
cd backend && npm run start:dev     # :3000
cd frontend && npm run dev          # :3001
```

If 3001 is busy, Next.js takes the next port and the app still works: outside production the API accepts whichever origin asks, and the frontend calls the API on the host it was opened from.

## Docker

```bash
docker compose up --build
```

Starts PostgreSQL, the API, and the web app. Migrations and the admin seed run on first boot. Postgres is published on **5433** to avoid clashing with a local instance.

```bash
docker compose down -v      # stop and wipe the volume
```

### On a server

Two addresses are compiled into the browser bundle, so they must name the server. Copy `.env.example` to `.env`:

```env
JWT_SECRET=a-long-random-string
POSTGRES_PASSWORD=something-private
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3000
CORS_ORIGIN=http://YOUR_SERVER_IP:3001
```

```bash
docker compose up --build -d
```

Open ports 3000 and 3001 on the firewall. Changing `NEXT_PUBLIC_API_URL` later requires rebuilding the frontend image.

The live demo runs this way on a Contabo VPS via [Coolify](https://coolify.io), using this same compose file. Pushing to `main` triggers a rebuild.

## API

Runnable requests: [`api.http`](api.http) — open in VS Code with the [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension. Signing in stores the token for every request after it. Point `@host` at the live demo to skip local setup. Rejected cases are covered too: missing token, wrong password, oversized quantity, empty cart.

All endpoints except `POST /auth/login` need `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Sign in, returns an access token |
| GET | `/auth/profile` | The authenticated admin |
| GET | `/products` | All products |
| GET | `/products?enabled=true` | Only enabled products |
| POST | `/products` | Create |
| PATCH | `/products/:id` | Update fields or toggle status |
| GET | `/promotions` | Promotions with their slabs |
| POST | `/promotions` | Create, slabs included for weighted |
| PATCH | `/promotions/:id` | Title, dates, or status |
| GET | `/orders` | Orders with their items |
| POST | `/orders` | Create; discounts calculated server-side |

## Structure

```
backend/
  prisma/
    schema.prisma        data model
    seed.ts              admin account
    demo-seed.ts         demo catalogue
  src/
    auth/                login, JWT strategy, guard
    products/
    promotions/
    orders/              discount calculation
    prisma/              shared Prisma service

frontend/src/
  app/
    login/
    products/
    promotions/
    orders/              the counter
      history/           past orders
  components/            sidebar
  lib/api.ts             API client

docs/
  ARCHITECTURE.md        design notes
  INFRASTRUCTURE.md      server and deployment notes

api.http                 REST Client requests
docker-compose.yml
```

## Design notes

**Discounts are calculated server-side.** The cart previews them for instant feedback, but `POST /orders` ignores anything the client sends and recalculates from the database.

**Order items store a price snapshot.** Each `OrderItem` records the unit price and discount applied at purchase time, so past orders stay accurate when prices change. That is also why `productId` there is a plain column rather than a foreign key — deleting a product must not cascade into order history.

**Order creation avoids N+1 queries.** Products and active promotions for the whole cart are fetched in two queries and matched in memory, so a twenty-line cart costs two round trips rather than forty.

**Slabs live in their own table.** `PromotionSlab` is a model rather than a JSON column, which keeps the relationship enforced and the slab count unbounded. Deleting a promotion cascades to its slabs.

**Weights are integers in grams.** Slab matching is exact integer comparison, with no floating-point drift. Money uses `Decimal` for the same reason.
