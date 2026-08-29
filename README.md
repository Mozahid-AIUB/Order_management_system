# Order Management System

A full-stack order management system with a promotion engine supporting percentage, fixed, and weight-based (slab) discounts.

**Live demo:** http://194.233.85.160:3001 — sign in with `admin@mozahid.com` / `admin123`

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS 11, TypeScript |
| Database | PostgreSQL 16 with Prisma ORM |
| Auth | JWT (Passport.js) with bcrypt password hashing |

## Features

**Authentication**
- Sign-in page with email and password
- JWT-based authentication; all product, promotion, and order endpoints are guarded

**Product Management**
- List, create, and edit products (name, description, price, weight)
- Enable/disable products — disabled products do not appear on the order page

**Promotion Management**
- List, create, enable/disable, and edit promotions
- Editing is restricted to title and dates, as specified
- Three discount types:
  - **Percentage** — a percentage off the line total
  - **Fixed** — a flat amount off per unit
  - **Weighted** — slab-based, driven by the total weight in the cart
- Weighted promotions accept any number of slabs, each with its own min/max weight and discount

**Order Management**
- List orders and create new ones
- Cart shows per-product discounts, subtotal, total discount, and grand total
- Discounts are always recalculated on the server when an order is placed; the frontend calculation is a preview only

## How the Weighted Promotion Works

A weighted promotion holds a list of slabs. Each slab defines a weight range and a discount per unit.

Example — a 500g product with these slabs:

| Slab | Weight range | Discount per 500g |
|---|---|---|
| 1 | 1kg – 5.5kg | 2 tk |
| 2 | 6kg – 8.5kg | 3 tk |
| 3 | 9kg – 11.5kg | 4 tk |
| 4 | 12kg and above | 5 tk |

Adding 12 units of the 500g product gives a total weight of 6000g, which falls into slab 2. The discount is `3 × 12 = 36 tk`.

The slab lookup is fully dynamic — a promotion may define any number of slabs with arbitrary ranges, and the final slab may omit its maximum weight to mean "unlimited".

## Prerequisites

- Node.js 20 or later
- PostgreSQL 16 running locally
- npm

## Setup

### 1. Clone and install

```bash
git clone https://github.com/Mozahid-AIUB/Order_management_system.git
cd Order_management_system

cd backend && npm install
cd ../frontend && npm install
```

### 2. Create the database

Create a PostgreSQL database named `order_management` (via pgAdmin or `createdb order_management`).

### 3. Configure backend environment

Create `backend/.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/order_management?schema=public"
JWT_SECRET="any-long-random-string"
```

If your PostgreSQL password contains special characters, URL-encode them (for example `@` becomes `%40`).

### 4. Run migrations and seed the admin

```bash
cd backend
npx prisma migrate dev
npx ts-node prisma/seed.ts
```

This creates all tables and seeds one admin account:

- **Email:** `admin@mozahid.com`
- **Password:** `admin123`

### 5. Start both servers

In one terminal:

```bash
cd backend
npm run start:dev     # http://localhost:3000
```

In another terminal:

```bash
cd frontend
npm run dev           # http://localhost:3001
```

Open http://localhost:3001 and sign in with the seeded admin credentials.

> The backend enables CORS for `http://localhost:3001`. If Next.js starts on a different port, update `app.enableCors` in `backend/src/main.ts`.

## Running with Docker

The compose file starts PostgreSQL, the API, and the web app together. Migrations run and the admin is seeded automatically on the first boot.

```bash
docker compose up --build
```

Then open http://localhost:3001 and sign in with `admin@mozahid.com` / `admin123`.

Postgres is published on port **5433** so it does not clash with a PostgreSQL instance already running on 5432.

To stop everything and wipe the database volume:

```bash
docker compose down -v
```

### Deploying to a server

Two addresses are baked in for the browser, so they must point at the server rather than localhost. Copy `.env.example` to `.env` and set:

```env
JWT_SECRET=a-long-random-string
POSTGRES_PASSWORD=something-private
NEXT_PUBLIC_API_URL=http://YOUR_SERVER_IP:3000
CORS_ORIGIN=http://YOUR_SERVER_IP:3001
```

Then build and start:

```bash
docker compose up --build -d
```

Open ports 3000 and 3001 on the server's firewall. `NEXT_PUBLIC_API_URL` is compiled into the client bundle, so changing it later means rebuilding the frontend image.

## API Endpoints

All endpoints except `POST /auth/login` require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Sign in, returns an access token |
| GET | `/auth/profile` | Returns the authenticated admin |
| GET | `/products` | List all products |
| GET | `/products?enabled=true` | List only enabled products |
| POST | `/products` | Create a product |
| PATCH | `/products/:id` | Update a product or toggle its status |
| GET | `/promotions` | List promotions with their slabs |
| POST | `/promotions` | Create a promotion (slabs included for weighted) |
| PATCH | `/promotions/:id` | Update title, dates, or status |
| GET | `/orders` | List orders with their items |
| POST | `/orders` | Create an order; discounts are calculated server-side |

## Project Structure

```
.
├── backend/                 # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma    # Data model
│   │   ├── migrations/
│   │   └── seed.ts          # Seeds the admin account
│   └── src/
│       ├── auth/            # Login, JWT strategy, guard
│       ├── products/
│       ├── promotions/
│       ├── orders/          # Includes the discount calculation
│       └── prisma/          # Shared Prisma service
│
├── frontend/                # Next.js app
│   └── src/
│       ├── app/
│       │   ├── login/
│       │   ├── products/
│       │   ├── promotions/
│       │   └── orders/
│       ├── components/
│       └── lib/api.ts       # API client
│
└── docs/                    # Architecture notes
```

## Design Notes

**Discounts are calculated on the server.** The cart previews discounts client-side for immediate feedback, but `POST /orders` ignores any amounts sent by the client and recalculates everything from the database.

**Order items store a price snapshot.** Each `OrderItem` records the unit price at the time of purchase, so past orders remain accurate when product prices change.

**Order creation avoids N+1 queries.** Products and active promotions for the whole cart are fetched in two queries and looked up in memory, rather than querying per cart line.

**Slabs live in their own table.** `PromotionSlab` is a separate model rather than a JSON column, which keeps slabs queryable and lets the database enforce the relationship. Deleting a promotion cascades to its slabs.
