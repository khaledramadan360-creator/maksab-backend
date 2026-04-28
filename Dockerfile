FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
COPY scripts/install-playwright.js ./scripts/install-playwright.js
ENV SKIP_PLAYWRIGHT_POSTINSTALL=1
RUN npm ci --ignore-scripts

COPY . .
RUN npm run build
RUN npm prune --omit=dev

FROM mcr.microsoft.com/playwright:v1.59.1-jammy AS runtime

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-noto-core \
  && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV REPORTS_PDF_ARABIC_FONT_PATH=/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/logo.png ./logo.png

CMD ["node", "dist/server.js"]
