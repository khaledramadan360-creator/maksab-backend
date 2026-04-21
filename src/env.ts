/**
 * MUST be the very first import in server.ts.
 * Loads .env before ANY other module is evaluated.
 */
import * as dotenv from 'dotenv';
dotenv.config();
