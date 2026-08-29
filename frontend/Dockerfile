# --- Build stage: compile the Next.js app ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* values are inlined into the client bundle at build time,
# so the API address has to be known here rather than at startup.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build


# --- Runtime stage ---
FROM node:20-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3001

CMD ["npm", "run", "start"]
