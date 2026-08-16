FROM node:22-slim

# Pin the pnpm major — see the note in the root Dockerfile. The glibc prebuild
# is what keeps better-sqlite3 green here, so also carry the toolchain in case
# the prebuild download is unavailable.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@10

WORKDIR /app

COPY package.json pnpm-lock.yaml* ./

RUN pnpm install --no-frozen-lockfile

COPY . .

ENV HERMES_API_URL=http://hermes-agent:8642

EXPOSE 3000

CMD ["pnpm", "dev", "--host", "0.0.0.0", "--port", "3000"]
