# --- Build stage: install everything and compile TypeScript ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first so npm install is cached until dependencies change.
COPY package*.json ./
RUN npm ci

COPY . .

# Prisma Client is generated from the schema, then Nest compiles to dist/.
RUN npx prisma generate && npm run build


# --- Runtime stage: carry over only what the server needs to run ---
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Apply migrations and seed the admin before the API accepts traffic.
CMD ["sh", "-c", "npx prisma migrate deploy && npx ts-node prisma/seed.ts && node dist/main"]
