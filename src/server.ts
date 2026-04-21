import './env'; // ← MUST be first: loads .env before any other module evaluates

import { createApp } from './app';

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`[SERVER] 🚀 Server running locally on port ${PORT}`);
      console.log(`[SERVER] Auth Module endpoints mapped at /api/v1/auth`);
    });
  } catch (error) {
    console.error('[SERVER] Fatal error during startup:', error);
    process.exit(1);
  }
}

bootstrap();
