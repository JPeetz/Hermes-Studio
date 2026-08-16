# --- Build stage ---
FROM node:22-alpine AS builder
WORKDIR /app

ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# better-sqlite3 ships no musl prebuild, so on alpine it always falls back to
# building from source with node-gyp. Without these the install fails.
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml .npmrc ./
# Pin the pnpm major: package.json's `pnpm.onlyBuiltDependencies` is what lets
# better-sqlite3 run its build script, and an unpinned `npm install -g pnpm`
# would silently reintroduce ERR_PNPM_IGNORED_BUILDS (issue #11) the next time
# pnpm changes how those settings are read.
RUN npm install -g pnpm@10 && pnpm install --no-frozen-lockfile

COPY . .
RUN pnpm build

# --- Production stage ---
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S hermes && adduser -S hermes -G hermes

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/server-entry.js ./

EXPOSE 3000

USER hermes

CMD ["node", "server-entry.js"]

