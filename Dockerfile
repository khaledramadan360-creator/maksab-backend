FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends fonts-noto-core fonts-noto-extra \
  && rm -rf /var/lib/apt/lists/*

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV SKIP_PLAYWRIGHT_POSTINSTALL=1
ENV REPORTS_PDF_ARABIC_FONT_PATH=/usr/share/fonts/truetype/noto/NotoNaskhArabic-Regular.ttf

COPY package*.json ./
COPY scripts/install-playwright.js ./scripts/install-playwright.js
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
CMD ["npm", "run", "start"]
