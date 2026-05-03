FROM node:22-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

FROM base AS deps

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY patches/ patches/

COPY packages/common/package.json packages/common/
COPY apps/extractor/package.json apps/extractor/

RUN pnpm install --frozen-lockfile --prod --ignore-scripts

FROM base AS runner
RUN groupadd -r pptruser && useradd -r -g pptruser -G audio,video pptruser \
    && mkdir -p /home/pptruser/Downloads /app \
    && chown -R pptruser:pptruser /home/pptruser /app

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/extractor/node_modules ./apps/extractor/node_modules
COPY --from=deps /app/packages/common/node_modules ./packages/common/node_modules

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY packages/common/ packages/common/

COPY apps/extractor/package.json apps/extractor/
COPY apps/extractor/src/ apps/extractor/src/
COPY apps/extractor/tsconfig.json apps/extractor/

ENV CHROME_PATH=/usr/bin/chromium
ENV NODE_ENV=production

USER pptruser

WORKDIR /app/apps/extractor

EXPOSE 3001

CMD ["node", "--import", "tsx", "src/index.ts"]
