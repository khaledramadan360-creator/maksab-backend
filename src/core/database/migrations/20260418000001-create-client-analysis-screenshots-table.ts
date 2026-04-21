import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map(item => String(item).toLowerCase());
  if (normalized.includes('client_analysis_screenshots')) {
    return;
  }

  await queryInterface.createTable('client_analysis_screenshots', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    client_analysis_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'client_analyses', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    platform_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    supabase_path: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    public_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    capture_status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    },
    captured_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('client_analysis_screenshots', ['client_analysis_id'], {
    name: 'client_analysis_screenshots_analysis_id_idx',
  });
  await queryInterface.addIndex('client_analysis_screenshots', ['platform'], {
    name: 'client_analysis_screenshots_platform_idx',
  });
  await queryInterface.addIndex('client_analysis_screenshots', ['capture_status'], {
    name: 'client_analysis_screenshots_status_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('client_analysis_screenshots');
}
