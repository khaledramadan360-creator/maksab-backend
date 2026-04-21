import { Sequelize } from 'sequelize';

type ResolvedDatabaseConfig = {
  database: string;
  username: string;
  password: string;
  host: string;
  port: number;
  dialectOptions: {
    charset: string;
    ssl?: {
      rejectUnauthorized: boolean;
      servername?: string;
    };
  };
};

const DEFAULT_DB_PORT = 3306;

const parseBoolean = (value: string | undefined, fallback: boolean): boolean => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
};

const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const isSslEnabled = (value: string | undefined): boolean => {
  const normalized = String(value || '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'on', 'required', 'require', 'verify_ca', 'verify_identity'].includes(normalized);
};

const resolveDatabaseConfig = (): ResolvedDatabaseConfig => {
  const rawDatabaseUrl = String(process.env.DATABASE_URL || process.env.DB_URL || '').trim();

  let database = process.env.DB_NAME || 'mksab_db';
  let username = process.env.DB_USER || 'root';
  let password = process.env.DB_PASSWORD || '';
  let host = process.env.DB_HOST || 'localhost';
  let port = parsePositiveInt(process.env.DB_PORT, DEFAULT_DB_PORT);
  let sslMode = String(process.env.DB_SSL_MODE || process.env.DB_SSL || '').trim();

  if (rawDatabaseUrl) {
    const parsed = new URL(rawDatabaseUrl);
    if (parsed.pathname && parsed.pathname !== '/') {
      database = decodeURIComponent(parsed.pathname.replace(/^\/+/, '')) || database;
    }

    username = decodeURIComponent(parsed.username || username);
    password = decodeURIComponent(parsed.password || password);
    host = parsed.hostname || host;
    port = parsePositiveInt(parsed.port, port);
    sslMode =
      String(
        parsed.searchParams.get('ssl-mode') ||
          parsed.searchParams.get('sslmode') ||
          parsed.searchParams.get('ssl') ||
          sslMode
      ).trim() || sslMode;
  }

  const dialectOptions: ResolvedDatabaseConfig['dialectOptions'] = {
    charset: 'utf8mb4',
  };

  if (isSslEnabled(sslMode)) {
    dialectOptions.ssl = {
      rejectUnauthorized: parseBoolean(process.env.DB_SSL_REJECT_UNAUTHORIZED, false),
      ...(host ? { servername: host } : {}),
    };
  }

  return {
    database,
    username,
    password,
    host,
    port,
    dialectOptions,
  };
};

const databaseConfig = resolveDatabaseConfig();

export const sequelize = new Sequelize({
  database: databaseConfig.database,
  username: databaseConfig.username,
  password: databaseConfig.password,
  host: databaseConfig.host,
  port: databaseConfig.port,
  dialect: 'mysql',
  timezone: '+00:00',
  dialectOptions: databaseConfig.dialectOptions,
  define: {
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  logging: false,
});
