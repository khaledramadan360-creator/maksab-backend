import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map(item => String(item).toLowerCase());
  if (normalized.includes('system_settings')) {
    return;
  }

  await queryInterface.createTable(
    'system_settings',
    {
      key: {
        type: DataTypes.STRING(100),
        primaryKey: true,
        allowNull: false,
      },
      value_text: {
        type: DataTypes.TEXT('long'),
        allowNull: true,
        defaultValue: null,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
    }
  );
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('system_settings');
}
