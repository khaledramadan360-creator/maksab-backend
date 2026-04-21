import { Sequelize } from 'sequelize';

// TODO: Load from environment variables (e.g., dotenv)
const database = process.env.DB_NAME || 'mksab_db';
const username = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const host = process.env.DB_HOST || 'localhost';

export const sequelize = new Sequelize(database, username, password, {
  host: host,
  dialect: 'mysql',
  timezone: '+00:00', // Enforce UTC globally
  dialectOptions: {
    charset: 'utf8mb4',
  },
  define: {
    underscored: true, // snake_case in db, camelCase in JS
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  logging: false, // Turn off query logging by default
});
