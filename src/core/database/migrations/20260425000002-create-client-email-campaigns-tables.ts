import { DataTypes, QueryInterface } from 'sequelize';

const TABLE_OPTIONS = {
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
};

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = (await queryInterface.showAllTables()).map(item => String(item).toLowerCase());

  if (!tables.includes('client_email_campaigns')) {
    await queryInterface.createTable('client_email_campaigns', {
      id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      subject: { type: DataTypes.STRING(255), allowNull: false },
      html_content: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      text_content: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      sender_name: { type: DataTypes.STRING(255), allowNull: false },
      sender_email: { type: DataTypes.STRING(255), allowNull: false },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'draft' },
      provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'brevo' },
      provider_campaign_id: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      provider_list_id: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      total_selected: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      sendable_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      warning_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      blocked_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      sent_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      failed_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      skipped_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      override_count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      requested_by_user_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      failure_reason: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      sent_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, TABLE_OPTIONS);

    await queryInterface.addIndex('client_email_campaigns', ['status'], {
      name: 'client_email_campaigns_status_idx',
    });
    await queryInterface.addIndex('client_email_campaigns', ['requested_by_user_id'], {
      name: 'client_email_campaigns_requested_by_user_id_idx',
    });
    await queryInterface.addIndex('client_email_campaigns', ['created_at'], {
      name: 'client_email_campaigns_created_at_idx',
    });
  }

  if (!tables.includes('client_email_campaign_recipients')) {
    await queryInterface.createTable('client_email_campaign_recipients', {
      id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
      campaign_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: { model: 'client_email_campaigns', key: 'id' },
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
      email: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      name: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      status: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'pending' },
      eligibility_level: { type: DataTypes.STRING(50), allowNull: false },
      eligibility_reason: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
      skip_reason: { type: DataTypes.STRING(100), allowNull: true, defaultValue: null },
      provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'brevo' },
      provider_contact_id: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      provider_message_id: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      failure_reason: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      override_used: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      override_reason: { type: DataTypes.STRING(500), allowNull: true, defaultValue: null },
      override_by_user_id: {
        type: DataTypes.CHAR(36),
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE',
      },
      override_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      sent_at: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, TABLE_OPTIONS);

    await queryInterface.addIndex('client_email_campaign_recipients', ['campaign_id'], {
      name: 'client_email_campaign_recipients_campaign_id_idx',
    });
    await queryInterface.addIndex('client_email_campaign_recipients', ['client_id'], {
      name: 'client_email_campaign_recipients_client_id_idx',
    });
    await queryInterface.addIndex('client_email_campaign_recipients', ['campaign_id', 'email'], {
      name: 'client_email_campaign_recipients_campaign_email_idx',
    });
    await queryInterface.addIndex('client_email_campaign_recipients', ['status'], {
      name: 'client_email_campaign_recipients_status_idx',
    });
  }

  if (!tables.includes('email_suppressions')) {
    await queryInterface.createTable('email_suppressions', {
      id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
      email: { type: DataTypes.STRING(255), allowNull: false },
      reason: { type: DataTypes.STRING(100), allowNull: false },
      level: { type: DataTypes.STRING(50), allowNull: false },
      source: { type: DataTypes.STRING(100), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, TABLE_OPTIONS);

    await queryInterface.addIndex('email_suppressions', ['email'], {
      name: 'email_suppressions_email_unique',
      unique: true,
    });
    await queryInterface.addIndex('email_suppressions', ['level'], {
      name: 'email_suppressions_level_idx',
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('client_email_campaign_recipients');
  await queryInterface.dropTable('client_email_campaigns');
  await queryInterface.dropTable('email_suppressions');
}
