# --- Build stage: install everything and compile TypeScript ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first so npm install is cached until dependencies change.
COPY package*.json ./
RUN npm ci

COPY . .

# prisma.config.ts insists on DATABASE_URL even though `generate` only reads
# the schema and never connects, so a placeholder keeps the build free of any
# dependency on a running database. The real URL arrives at runtime.
RUN DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder" \
    npx prisma generate && npm run build

# The seed is compiled too, so the runtime image needs no TypeScript loader.
RUN npx tsc prisma/seed.ts \
    --outDir dist-seed \
    --module commonjs \
    --moduleResolution node \
    --target ES2021 \
    --esModuleInterop \
    --skipLibCheck


# --- Runtime stage: carry over only what the server needs to run ---
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-seed ./dist-seed
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Apply migrations and seed the admin before the API accepts traffic.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist-seed/seed.js && node dist/main"]
