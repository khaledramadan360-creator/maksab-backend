import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map(item => String(item).toLowerCase());
  if (normalized.includes('client_reports')) {
    return;
  }

  await queryInterface.createTable('client_reports', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    client_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'clients', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    analysis_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'client_analyses', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    owner_user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    template_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'default_client_report',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'generating',
    },
    format: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pdf',
    },
    pdf_path: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    pdf_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    generated_at: {
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

  await queryInterface.addIndex('client_reports', ['client_id'], {
    name: 'client_reports_client_id_unique',
    unique: true,
  });
  await queryInterface.addIndex('client_reports', ['owner_user_id'], {
    name: 'client_reports_owner_user_id_idx',
  });
  await queryInterface.addIndex('client_reports', ['status'], {
    name: 'client_reports_status_idx',
  });
  await queryInterface.addIndex('client_reports', ['generated_at'], {
    name: 'client_reports_generated_at_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('client_reports');
}
