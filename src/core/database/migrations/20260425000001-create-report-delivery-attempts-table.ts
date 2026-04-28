import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = await queryInterface.showAllTables();
  const normalized = tables.map(item => String(item).toLowerCase());
  if (normalized.includes('report_delivery_attempts')) {
    return;
  }

  await queryInterface.createTable('report_delivery_attempts', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    report_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'client_reports', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    client_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'clients', key: 'id' },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    provider: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'whatchimp',
    },
    recipient_phone: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    recipient_source: {
      type: DataTypes.STRING(32),
      allowNull: true,
      defaultValue: null,
    },
    recipient_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    message_text: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'pending',
    },
    provider_message_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
      defaultValue: null,
    },
    provider_status_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    failure_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    requested_by_user_id: {
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
  }, {
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  });

  await queryInterface.addIndex('report_delivery_attempts', ['report_id'], {
    name: 'report_delivery_attempts_report_id_idx',
  });
  await queryInterface.addIndex('report_delivery_attempts', ['client_id'], {
    name: 'report_delivery_attempts_client_id_idx',
  });
  await queryInterface.addIndex('report_delivery_attempts', ['requested_by_user_id'], {
    name: 'report_delivery_attempts_requested_by_user_id_idx',
  });
  await queryInterface.addIndex('report_delivery_attempts', ['provider', 'status'], {
    name: 'report_delivery_attempts_provider_status_idx',
  });
  await queryInterface.addIndex('report_delivery_attempts', ['created_at'], {
    name: 'report_delivery_attempts_created_at_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('report_delivery_attempts');
}
