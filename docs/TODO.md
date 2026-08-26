# TODO — Order Management System (3-Day Plan)

নিয়ম: প্রতিটা sub-task শুরুর আগে concept বুঝে নেব, তারপর নিজে হাতে কোড লিখব। টাস্ক শেষ হলে `[ ]` কে `[x]` করে দেব।

---

## DAY 1 — Setup + Authentication

### 1.1 Environment & Tooling Check
- [ ] Node.js version check করা (`node -v`, LTS হওয়া উচিত)
- [ ] PostgreSQL install/running আছে কিনা check করা
- [ ] VS Code + দরকারি extension (Prisma, ESLint) ঠিক আছে কিনা

### 1.2 Project Scaffolding
- [ ] Monorepo root folder বানানো (`frontend/`, `backend/`)
- [ ] NestJS নতুন প্রজেক্ট বানানো (`backend/`)
- [ ] Next.js নতুন প্রজেক্ট বানানো (`frontend/`, App Router, TypeScript)
- [ ] Git init + প্রথম commit + GitHub এ public repo বানানো

### 1.3 Database Setup
- [ ] PostgreSQL এ database বানানো (`order_management`)
- [ ] Backend এ Prisma install ও init করা
- [ ] `.env` এ `DATABASE_URL` সেট করা
- [ ] Concept: Prisma schema কী, migration কী, `prisma migrate dev` কী করে — বোঝা

### 1.4 Admin Model + Seed
- [ ] `schema.prisma` এ `Admin` model লেখা
- [ ] Migration চালিয়ে টেবিল বানানো
- [ ] একটা seed script লেখা যা bcrypt দিয়ে hash করা password সহ একজন Admin ইনসার্ট করে
- [ ] Concept: bcrypt hashing কেন লাগবে, plain text password কেন বিপজ্জনক — বোঝা

### 1.5 Auth Backend (NestJS)
- [ ] `AuthModule`, `AuthController`, `AuthService` বানানো
- [ ] `POST /auth/login` endpoint — email/password validate করে JWT ফেরত দেওয়া
- [ ] Concept: JWT কী, payload/signature/secret কীভাবে কাজ করে — বোঝা
- [ ] `JwtStrategy` + `JwtAuthGuard` বানানো
- [ ] একটা protected test route বানিয়ে guard যাচাই করা (Postman/curl দিয়ে টেস্ট)
- [ ] Concept: Guard, Strategy, Decorator (`@UseGuards`) NestJS এ কীভাবে কাজ করে — বোঝা

### 1.6 Auth Frontend (Next.js)
- [ ] Login পেজ UI বানানো (email/password form)
- [ ] API client (`fetch` wrapper) বানানো যেটা backend কল করে
- [ ] Login সফল হলে token সংরক্ষণ করা
- [ ] `middleware.ts` বানানো — token না থাকলে protected পেজ থেকে `/login` এ redirect
- [ ] Concept: Next.js middleware কীভাবে প্রতিটা request এ চলে — বোঝা

### Day 1 Checkpoint
- [ ] নিজে মুখে ব্যাখ্যা করতে পারা: "Login করলে ভেতরে ভেতরে কী কী ঘটে, ধাপে ধাপে"
- [ ] নিজে মুখে ব্যাখ্যা করতে পারা: "JWT কীভাবে security দেয়, কেউ token চুরি করলে কী হয়"

---

## DAY 2 — Product + Promotion CRUD

### 2.1 Product Backend
- [ ] `schema.prisma` এ `Product` model যোগ করা, migration চালানো
- [ ] `ProductsModule/Controller/Service` বানানো
- [ ] `GET /products` (সব), `GET /products?enabled=true` (শুধু enabled)
- [ ] `POST /products` (create)
- [ ] `PATCH /products/:id` (edit + enable/disable)
- [ ] DTO + validation (`class-validator`) বোঝা ও লেখা
- [ ] সব route এ `JwtAuthGuard` লাগানো

### 2.2 Product Frontend
- [ ] Product list পেজ (table view, fetch করে দেখানো)
- [ ] Create Product ফর্ম
- [ ] Edit Product ফর্ম (enable/disable টগল সহ)
- [ ] Concept: Next.js এ client component vs server component পার্থক্য — বোঝা

### 2.3 Promotion Backend (Percentage + Fixed প্রথমে)
- [ ] `schema.prisma` এ `Promotion` + `PromotionSlab` model যোগ করা, migration
- [ ] `PromotionsModule/Controller/Service` বানানো
- [ ] `POST /promotions` — type অনুযায়ী validation (percentage হলে percentageValue লাগবে, ইত্যাদি)
- [ ] `GET /promotions` (list)
- [ ] `PATCH /promotions/:id` — শুধু title/date/isEnabled আপডেট করতে দেওয়া (backend এ enforce করা)
- [ ] Concept: Strategy Pattern কী, কেন percentage/fixed/weighted আলাদা class এ রাখা হচ্ছে — বোঝা

### 2.4 Promotion Frontend
- [ ] Promotion list পেজ (table, active/expired দেখানো)
- [ ] Create Promotion ফর্ম (type select করলে সংশ্লিষ্ট fields দেখানো — percentage/fixed/weighted slabs)
- [ ] Edit Promotion ফর্ম (শুধু title/date এডিটেবল)
- [ ] Enable/Disable টগল

### Day 2 Checkpoint
- [ ] নিজে ব্যাখ্যা করতে পারা: "Percentage আর Fixed discount এর হিসাব কীভাবে আলাদা"
- [ ] নিজে ব্যাখ্যা করতে পারা: "কেন Promotion edit এ শুধু title/date allow করা হচ্ছে, backend এ কীভাবে সেটা enforce হয়"

---

## DAY 3 — Weighted Promotion + Orders + Polish

### 3.1 Weighted Promotion Logic (সবচেয়ে গুরুত্বপূর্ণ অংশ)
- [ ] Concept: Slab কী, min/max weight range কীভাবে match হয় — আবার ঝালাই
- [ ] `PromotionSlab` create ফর্ম (dynamic — যত ইচ্ছা slab যোগ করা যাবে)
- [ ] Backend এ weighted discount calculate করার ফাংশন লেখা (loop করে সঠিক slab খুঁজে বের করা)
- [ ] মিল্ক পাউডার উদাহরণ (500gm × 12 = 6kg → Slab 2 → 3tk×12=36tk) দিয়ে নিজে হাতে টেস্ট করে verify করা

### 3.2 Order Backend
- [ ] `schema.prisma` এ `Order` + `OrderItem` model যোগ করা, migration
- [ ] `OrdersModule/Controller/Service` বানানো
- [ ] `POST /orders` — প্রতিটা item এর জন্য active promotion খুঁজে discount calculate করা, subtotal/totalDiscount/grandTotal হিসাব করে সেভ করা
- [ ] `GET /orders` (list), `GET /orders/:id` (detail)
- [ ] Concept: কেন discount calculation backend এ হওয়া উচিত, frontend থেকে পাঠানো amount বিশ্বাস না করা — বোঝা

### 3.3 Order Frontend (সবচেয়ে জটিল UI)
- [ ] Order list পেজ
- [ ] Create Order পেজ:
  - [ ] Enabled product এর লিস্ট দেখানো, কার্টে যোগ করার বাটন
  - [ ] Customer info ফর্ম (নাম, ফোন)
  - [ ] Cart component — প্রতিটা item এর quantity বদলানো যাবে
  - [ ] প্রতিটা item এর পাশে discount preview দেখানো (instant feedback এর জন্য, চূড়ান্ত হিসাব backend করবে)
  - [ ] Subtotal / Total Discount / Grand Total দেখানো
  - [ ] Submit করলে অর্ডার সেভ হওয়া

### 3.4 Polish & Documentation
- [ ] সব পেজের UI ঠিকঠাক স্টাইল করা (দেখতে পরিষ্কার/professional)
- [ ] Error handling (ফর্ম validation message, API error দেখানো)
- [ ] `README.md` লেখা (setup instructions, env variables, কীভাবে চালাতে হবে)
- [ ] Concept ঝালাই — পুরো flow একবার নিজে মুখে ব্যাখ্যা করা (end-to-end)

### 3.5 Bonus (সময় থাকলে)
- [ ] Backend Dockerfile
- [ ] Frontend Dockerfile
- [ ] `docker-compose.yml` (postgres + backend + frontend)
- [ ] Docker দিয়ে পুরো সিস্টেম একসাথে চালিয়ে টেস্ট করা

### 3.6 Submission
- [ ] GitHub repo public আছে কিনা নিশ্চিত করা
- [ ] ডেমো ভিডিও রেকর্ড করা (সব ফিচার দেখিয়ে, weighted promotion example সহ)
- [ ] ভিডিও YouTube এ unlisted আপলোড করা
- [ ] Recruiter কে email — GitHub link + video link সহ

---

## Interview-Ready Self-Check (শেষে নিজেকে যাচাই করার জন্য)
- [ ] JWT authentication পুরো flow ব্যাখ্যা করতে পারি
- [ ] Prisma schema আর relations (Product ↔ Promotion ↔ Order) ব্যাখ্যা করতে পারি
- [ ] তিন ধরনের discount calculation logic কোড না দেখে মুখে বলতে পারি
- [ ] Slab matching logic এর edge case (min/max boundary, no match হলে কী হয়) ব্যাখ্যা করতে পারি
- [ ] কেন backend এ discount recalculate করা জরুরি (security angle) ব্যাখ্যা করতে পারি
