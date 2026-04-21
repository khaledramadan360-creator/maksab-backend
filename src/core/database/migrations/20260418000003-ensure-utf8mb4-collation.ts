import { QueryInterface } from 'sequelize';

const TABLES_TO_CONVERT = [
  'users',
  'invites',
  'sessions',
  'password_resets',
  'audit_logs',
  'clients',
  'client_analyses',
  'client_platform_analyses',
  'client_analysis_screenshots',
  'client_reports',
] as const;

export async function up(queryInterface: QueryInterface): Promise<void> {
  const existingTables = await listExistingTables(queryInterface);
  const transaction = await queryInterface.sequelize.transaction();
  let committed = false;

  try {
    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { transaction });

    for (const tableName of TABLES_TO_CONVERT) {
      if (!existingTables.has(tableName.toLowerCase())) {
        continue;
      }

      await queryInterface.sequelize.query(
        `ALTER TABLE \`${tableName}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
        { transaction }
      );
    }

    await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
    await transaction.commit();
    committed = true;
  } finally {
    if (!committed) {
      try {
        await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { transaction });
      } finally {
        await transaction.rollback();
      }
    }
  }
}

export async function down(): Promise<void> {
  // Intentionally left as no-op: rollback should not downgrade character-set support for Arabic text.
}

async function listExistingTables(queryInterface: QueryInterface): Promise<Set<string>> {
  const [rows] = (await queryInterface.sequelize.query('SHOW TABLES')) as [
    Array<Record<string, unknown>>,
    unknown,
  ];

  const tableNames = rows
    .map(row => {
      const values = Object.values(row);
      return values.length > 0 ? String(values[0]) : '';
    })
    .filter(tableName => tableName !== '');

  return new Set(tableNames.map(tableName => tableName.toLowerCase()));
}
