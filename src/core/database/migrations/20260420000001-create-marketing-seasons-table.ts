import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map(item => String(item).toLowerCase());
  if (normalized.includes('marketing_seasons')) {
    return;
  }

  await queryInterface.createTable(
    'marketing_seasons',
    {
      id: {
        type: DataTypes.CHAR(36),
        primaryKey: true,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'inactive',
      },
      owner_user_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
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

  await queryInterface.addIndex('marketing_seasons', ['status'], {
    name: 'marketing_seasons_status_idx',
  });
  await queryInterface.addIndex('marketing_seasons', ['owner_user_id'], {
    name: 'marketing_seasons_owner_user_id_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('marketing_seasons');
}
