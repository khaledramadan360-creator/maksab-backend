import './env'; // ← MUST be first: loads .env before any other module evaluates

import { createApp } from './app';
import { sequelize } from './core/database/sequelize.config';

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('[SERVER] Database connection established');

    const app = createApp();

    app.listen(PORT, HOST, () => {
      console.log(`[SERVER] 🚀 Server running locally on port ${PORT}`);
      console.log(`[SERVER] Auth Module endpoints mapped at /api/v1/auth`);
      console.log(`[SERVER] Health endpoint mapped at /healthz`);
      console.log(`[SERVER] Bound to ${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error('[SERVER] Fatal error during startup:', error);
    process.exit(1);
  }
}

bootstrap();
