FROM mcr.microsoft.com/playwright:v1.59.1-jammy

WORKDIR /app

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV SKIP_PLAYWRIGHT_POSTINSTALL=1

COPY package*.json ./
COPY scripts/install-playwright.js ./scripts/install-playwright.js
RUN npm ci

COPY . .
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
CMD ["npm", "run", "start"]
