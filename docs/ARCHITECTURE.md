# Order Management System — Architecture Design

Stack: **Next.js** (frontend) + **NestJS** (backend) + **PostgreSQL + Prisma** (database)
Structure: **Monorepo** — `frontend/` + `backend/` in one GitHub repo.

এই ডকুমেন্টে পুরো সিস্টেমের architecture ব্যাখ্যা করা হলো — Auth, Database schema, API design, আর সবচেয়ে গুরুত্বপূর্ণ Promotion calculation logic।

---

## 1. Folder Structure (Monorepo)


```
order-management-system/
├── frontend/                   # Next.js app
│   ├── app/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx        # Product list
│   │   │   └── [id]/edit/page.tsx
│   │   ├── promotions/
│   │   │   ├── page.tsx        # Promotion list
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/edit/page.tsx
│   │   ├── orders/
│   │   │   ├── page.tsx        # Order list
│   │   │   └── new/page.tsx    # Create order (cart page)
│   │   └── layout.tsx
│   ├── lib/
│   │   ├── api-client.ts       # fetch wrapper, attaches JWT
│   │   └── auth.ts             # token storage helpers
│   └── components/
│       └── Navbar.tsx          # nav + sign out (hidden on /login)
│
├── backend/                     # NestJS app
│   ├── src/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── jwt-auth.guard.ts
│   │   ├── admin/                  # Admin এর জন্য (সিস্টেমে কোনো আলাদা "user"/customer role নেই)
│   │   ├── products/
│   │   │   ├── products.module.ts
│   │   │   ├── products.controller.ts
│   │   │   └── products.service.ts
│   │   ├── promotions/
│   │   │   ├── promotions.module.ts
│   │   │   ├── promotions.controller.ts
│   │   │   ├── promotions.service.ts
│   │   │   └── strategies/
│   │   │       ├── percentage.strategy.ts
│   │   │       ├── fixed.strategy.ts
│   │   │       └── weighted.strategy.ts
│   │   ├── orders/
│   │   │   ├── orders.module.ts
│   │   │   ├── orders.controller.ts
│   │   │   └── orders.service.ts
│   │   ├── prisma/
│   │   │   └── prisma.service.ts
│   │   └── main.ts
│   └── prisma/
│       ├── schema.prisma
│       └── migrations/
│
├── docker-compose.yml           # bonus: postgres + backend + frontend
├── README.md
└── docs/
    └── ARCHITECTURE.md          # এই ফাইল
```

**কেন এভাবে?** প্রতিটা feature (products, promotions, orders) নিজের module-এ আলাদা — NestJS-এর সাথে এটাই সবচেয়ে প্রচলিত ও maintainable প্যাটার্ন। প্রতিটা module স্বাধীন — future এ আলাদা microservice এ split করাও সহজ হবে যদি কখনো দরকার হয় (যদিও এখন দরকার নেই)।

---

## 2. High-Level Flow Diagram

```
┌─────────────┐       JWT in Header        ┌──────────────┐
│  Next.js    │ ─────────────────────────► │   NestJS     │
│  Frontend   │ ◄───────────────────────── │   Backend    │
└─────────────┘         JSON response      └──────┬───────┘
                                                    │
                                                    │ Prisma Client
                                                    ▼
                                            ┌──────────────┐
                                            │  PostgreSQL  │
                                            └──────────────┘
```

- Frontend কখনো সরাসরি DB ছোঁবে না। সব সময় NestJS API-এর মাধ্যমে data আসবে/যাবে।
- Authentication ছাড়া কোনো protected route (Products/Promotions/Orders) access করা যাবে না — আসল সুরক্ষা backend এর `JwtAuthGuard`, আর প্রতিটা frontend পেজ লোড হওয়ার সময় token আছে কিনা দেখে `/login` এ পাঠিয়ে দেয়।

---

## 3. Authentication Design

### Flow

```
1. Admin → POST /auth/login { email, password }
2. Backend → password যাচাই (bcrypt.compare)
3. Backend → JWT sign করে পাঠায় { accessToken }
4. Frontend → token কে localStorage / httpOnly cookie তে রাখে
5. প্রতিটা পরের request → Header: Authorization: Bearer <token>
6. Backend → JwtAuthGuard token verify করে, invalid হলে 401
```

**নোট:** এই সিস্টেমে আলাদা "User" role বা Customer login নেই — শুধু একটাই role, **Admin**। Admin-ই লগইন করে Product/Promotion/Order সব ব্যবস্থাপনা করে। Customer শুধু Order ফর্মের একটা তথ্য (নাম/ফোন), তার নিজস্ব লগইন নেই।

### Backend (NestJS)

- `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt` ব্যবহার করুন
- Password হ্যাশ করতে `bcrypt`
- `JwtStrategy` — token থেকে payload (`adminId`, `email`) বের করে `request.user` এ বসায়
- `JwtAuthGuard` — `@UseGuards(JwtAuthGuard)` দিয়ে প্রতিটা protected controller/route এ লাগান

```ts
// auth.service.ts (concept)
async login(email: string, password: string) {
  const admin = await this.adminService.findByEmail(email);
  if (!admin || !(await bcrypt.compare(password, admin.password))) {
    throw new UnauthorizedException();
  }
  const payload = { sub: admin.id, email: admin.email };
  return { accessToken: this.jwtService.sign(payload) };
}
```

### Frontend (Next.js)

- Login পেজ থেকে `/auth/login` কল করবে, response এর token রাখবে
- Token রাখার জন্য সবচেয়ে ভালো: **httpOnly cookie** (XSS থেকে সুরক্ষিত) — Next.js এ এটা Route Handler দিয়ে সেট করা যায়। সহজ approach হিসেবে localStorage ও গ্রহণযোগ্য এই assignment এ scope অনুযায়ী।
- `middleware.ts` দিয়ে: token না থাকলে `/login` এ redirect করে দিন — এভাবে Products/Promotions/Orders পেজ protect হবে।

**Recommendation:** simple রাখুন — localStorage + Next.js middleware token existence check। Enterprise-grade refresh token rotation এই assignment এর scope এর বাইরে, দরকার নেই।

---

## 4. Database Schema (Prisma)

```prisma
// schema.prisma

model Admin {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  password  String   // bcrypt hash
  createdAt DateTime @default(now())
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  price       Decimal  @db.Decimal(10, 2)
  weight      Int      // gram একক ধরে নেওয়া হয়েছে — consistency এর জন্য
  isEnabled   Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  promotions  Promotion[]
  orderItems  OrderItem[]
}

enum PromotionType {
  PERCENTAGE
  FIXED
  WEIGHTED
}

model Promotion {
  id         String        @id @default(uuid())
  title      String
  type       PromotionType
  startDate  DateTime
  endDate    DateTime
  isEnabled  Boolean       @default(true)

  // PERCENTAGE হলে ব্যবহার হবে, যেমন 10 মানে 10%
  percentageValue Decimal? @db.Decimal(5, 2)

  // FIXED হলে ব্যবহার হবে, flat আমাউন্ট
  fixedValue      Decimal? @db.Decimal(10, 2)

  productId  String
  product    Product       @relation(fields: [productId], references: [id])

  slabs      PromotionSlab[]  // শুধু WEIGHTED type হলে থাকবে

  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt
}

model PromotionSlab {
  id             String    @id @default(uuid())
  promotionId    String
  promotion      Promotion @relation(fields: [promotionId], references: [id], onDelete: Cascade)

  minWeight      Int       // gram এ, e.g. 1000
  maxWeight      Int?      // null মানে "unlimited" (Slab 4 এর মতো)
  discountPerUnit Decimal  @db.Decimal(10, 2) // প্রতি 500gm এ কত টাকা ছাড়
  unitWeight     Int       @default(500) // discount কত gm এর ভিত্তিতে হিসাব হবে (default 500gm)
}

model Order {
  id             String      @id @default(uuid())
  customerName   String
  customerPhone  String
  subtotal       Decimal     @db.Decimal(10, 2)
  totalDiscount  Decimal     @db.Decimal(10, 2)
  grandTotal     Decimal     @db.Decimal(10, 2)
  createdAt      DateTime    @default(now())

  items          OrderItem[]
}

model OrderItem {
  id              String   @id @default(uuid())
  orderId         String
  order           Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  productId       String
  product         Product  @relation(fields: [productId], references: [id])

  quantity        Int
  unitPrice       Decimal  @db.Decimal(10, 2) // order করার সময়ের দাম (snapshot)
  discountApplied Decimal  @db.Decimal(10, 2) @default(0)
  lineTotal       Decimal  @db.Decimal(10, 2) // (unitPrice * quantity) - discountApplied
}
```

### গুরুত্বপূর্ণ ডিজাইন সিদ্ধান্ত ও কেন

1. **`unitPrice` কে `OrderItem` এ snapshot হিসেবে রাখা হয়েছে** — কারণ ভবিষ্যতে product এর দাম বদলে গেলেও পুরনো অর্ডারের হিসাব যেন ঠিক থাকে (historical accuracy)।

2. **`PromotionSlab` আলাদা টেবিল** — কারণ একটা weighted promotion এ **dynamic সংখ্যক slab** থাকতে হবে (assignment এ স্পষ্ট বলা আছে)। এটাকে JSON column হিসেবেও রাখা যেত, কিন্তু আলাদা টেবিল রাখলে query করা, validate করা সহজ হয় এবং relational integrity বজায় থাকে।

3. **`maxWeight` nullable** — কারণ শেষ slab এ "12kg onwards, max unlimited" এর মতো ক্ষেত্র থাকে (ছবির Slab 4)।

4. **Promotion সরাসরি এক Product এর সাথে যুক্ত (`productId`)** — assignment এ promotion কে "product এর discount" হিসেবে বর্ণনা করা হয়েছে, তাই এই সম্পর্ক (Promotion → Product) most straightforward। (যদি ভবিষ্যতে এক promotion একাধিক product এ apply করতে হয়, তখন many-to-many junction table বানানো যাবে — কিন্তু এখন YAGNI, দরকার নেই।)

5. **Edit promotion এ শুধু title/date বদলানো যাবে** — তাই backend এর update endpoint এ শুধু এই দুইটা field allow করবে, বাকি field ignore/reject করবে (validation দিয়ে)।

---

## 5. Promotion Calculation Logic (সবচেয়ে গুরুত্বপূর্ণ অংশ)

এখানে একটা **Strategy Pattern** ব্যবহার করা ভালো — কারণ ৩ ধরনের discount আছে, প্রতিটার হিসাব আলাদা রকম। এতে কোড clean থাকে, নতুন promotion type যোগ করাও সহজ হবে ভবিষ্যতে।

```ts
// promotions/strategies/discount-strategy.interface.ts
interface DiscountStrategy {
  calculate(product: Product, quantity: number, promotion: Promotion): number; // returns total discount amount
}
```

### Percentage Strategy
```ts
calculate(product, quantity, promotion) {
  const lineTotal = product.price * quantity;
  return lineTotal * (promotion.percentageValue / 100);
}
```

### Fixed Strategy
```ts
calculate(product, quantity, promotion) {
  // প্রতি ইউনিটে fixed discount ধরে নেওয়া হলো
  return promotion.fixedValue * quantity;
}
```

### Weighted Strategy (slab logic)
```ts
calculate(product, quantity, promotion) {
  const totalWeight = product.weight * quantity; // gram এ মোট ওজন

  // সঠিক slab খুঁজে বের করা — dynamic, যত slab থাকুক
  const matchedSlab = promotion.slabs.find(slab =>
    totalWeight >= slab.minWeight &&
    (slab.maxWeight === null || totalWeight <= slab.maxWeight)
  );

  if (!matchedSlab) return 0; // কোনো slab এ না পড়লে discount নেই

  // কতগুলো "unit" (যেমন 500gm ব্লক) আছে তার উপর ভিত্তি করে discount
  const units = quantity; // কারণ প্রতিটা প্রোডাক্ট ইউনিট নিজেই unitWeight এর
  return matchedSlab.discountPerUnit * units;
}
```

> মিল্ক পাউডার উদাহরণ দিয়ে verify: weight=500gm, quantity=12 → totalWeight=6000gm → Slab 2 (6000-8500 match) → discountPerUnit=3 → discount = 3 × 12 = 36 ✅ ঠিক assignment এর example এর সাথে মিলছে।

### Orchestrator (Order তৈরির সময় ব্যবহার হবে)

```ts
// promotions.service.ts
async calculateDiscountForItem(product: Product, quantity: number): Promise<number> {
  const activePromotion = await this.findActivePromotionForProduct(product.id);
  // active মানে: isEnabled=true, startDate <= now <= endDate

  if (!activePromotion) return 0;

  const strategy = this.strategyFactory.getStrategy(activePromotion.type);
  return strategy.calculate(product, quantity, activePromotion);
}
```

এই design এর সুবিধা: `OrdersService` কে জানতেই হবে না promotion কীভাবে হিসাব হয় — শুধু `calculateDiscountForItem()` কল করলেই হবে। এটাই **separation of concerns**।

---

## 6. API Endpoints (সংক্ষিপ্ত)

| Method | Endpoint | কাজ | Auth লাগবে? |
|--------|----------|-----|------|
| POST | `/auth/login` | লগইন, JWT ফেরত দেয় | না |
| GET | `/products` | সব প্রোডাক্ট লিস্ট | হ্যাঁ |
| GET | `/products?enabled=true` | Order পেজের জন্য শুধু enabled প্রোডাক্ট | হ্যাঁ |
| POST | `/products` | নতুন প্রোডাক্ট তৈরি | হ্যাঁ |
| PATCH | `/products/:id` | প্রোডাক্ট এডিট/enable-disable | হ্যাঁ |
| GET | `/promotions` | সব promotion লিস্ট | হ্যাঁ |
| POST | `/promotions` | নতুন promotion (slabs সহ, যদি weighted হয়) | হ্যাঁ |
| PATCH | `/promotions/:id` | শুধু title/date/isEnabled আপডেট | হ্যাঁ |
| GET | `/orders` | সব অর্ডার লিস্ট | হ্যাঁ |
| POST | `/orders` | নতুন অর্ডার — backend discount হিসাব করে, item সহ সেভ করে | হ্যাঁ |
| GET | `/orders/:id` | একটা অর্ডারের বিস্তারিত | হ্যাঁ |

**গুরুত্বপূর্ণ security নিয়ম:** Discount হিসাব সবসময় **backend এ** হবে, frontend থেকে discount amount পাঠিয়ে বিশ্বাস করা যাবে না (কেউ request tamper করে ফাঁকি দিতে পারে)। Frontend শুধু preview দেখানোর জন্য calculate করতে পারে (instant UI feedback), কিন্তু order save করার সময় backend আবার নিজে হিসাব করে চূড়ান্ত amount বসাবে।

---

## 7. Order তৈরির Flow (Sequence)

```
Frontend (Cart page)                Backend                          DB
      │                                │                               │
      │ GET /products?enabled=true    │                               │
      │───────────────────────────────►│──── SELECT enabled products ─►│
      │◄───────────────────────────────│◄──────────────────────────────│
      │ (user cart এ product যোগ করে)  │                               │
      │                                │                               │
      │ POST /orders                   │                               │
      │  { customerName, phone,        │                               │
      │    items: [{productId, qty}] } │                               │
      │───────────────────────────────►│                               │
      │                                │ প্রতিটা item এর জন্য:          │
      │                                │  1. product খুঁজে বের করা      │
      │                                │  2. active promotion খুঁজা     │
      │                                │  3. discount calculate করা     │
      │                                │  4. subtotal/total/grand total │
      │                                │     হিসাব করা                  │
      │                                │  5. Order + OrderItems সেভ     │
      │                                │───────────────────────────────►│
      │◄─── { order with totals } ─────│◄────────────────────────────── │
```

---

## 8. Docker Setup (Bonus অংশের জন্য)

```yaml
# docker-compose.yml (concept)
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: order_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  backend:
    build: ./backend
    env_file: ./backend/.env
    ports: ["4000:4000"]
    depends_on: [postgres]

  frontend:
    build: ./frontend
    env_file: ./frontend/.env
    ports: ["3000:3000"]
    depends_on: [backend]

volumes:
  pgdata:
```

প্রতিটা service এর জন্য নিজস্ব environment-based Dockerfile (multi-stage build — build stage + slim runtime stage) থাকবে, যেমন assignment এ চাওয়া হয়েছে।

---

## 9. কাজের ধাপ (Suggested build order)

1. **Setup**: Monorepo structure, Prisma schema লিখে migration চালানো
2. **Auth**: Admin seed, login endpoint, JWT guard, Next.js login পেজ + middleware
3. **Products**: CRUD backend + frontend list/create/edit পেজ
4. **Promotions**: CRUD backend (percentage/fixed সহজ প্রথমে বানান) + slab logic পরে
5. **Orders**: Cart UI + backend calculation logic + order save
6. **Polish**: UI স্টাইলিং, README লেখা, ডেমো ভিডিও রেকর্ড
7. **Bonus**: Docker

এই ক্রমে করলে প্রতিটা ধাপ আগেরটার উপর build হবে, আর সবচেয়ে জটিল অংশ (weighted promotion) শেষের দিকে করবেন যখন বাকি সব piece রেডি থাকবে টেস্ট করার জন্য।
