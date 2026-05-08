import { DataTypes, QueryInterface } from 'sequelize';

const TABLE_OPTIONS = {
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
};

const hasIndex = async (queryInterface: QueryInterface, tableName: string, indexName: string): Promise<boolean> => {
  const indexes = (await queryInterface.showIndex(tableName)) as Array<{ name?: string }>;
  return indexes.some(index => index.name === indexName);
};

export async function up(queryInterface: QueryInterface): Promise<void> {
  const tables = (await queryInterface.showAllTables()).map(item => String(item).toLowerCase());

  if (tables.includes('client_email_campaigns')) {
    const columns = await queryInterface.describeTable('client_email_campaigns');

    if (!columns['reply_to_email']) {
      await queryInterface.addColumn('client_email_campaigns', 'reply_to_email', {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
      });
    }

    if (!(await hasIndex(queryInterface, 'client_email_campaigns', 'client_email_campaigns_provider_campaign_id_idx'))) {
      await queryInterface.addIndex('client_email_campaigns', ['provider_campaign_id'], {
        name: 'client_email_campaigns_provider_campaign_id_idx',
      });
    }
  }

  if (tables.includes('client_email_campaign_recipients')) {
    const columns = await queryInterface.describeTable('client_email_campaign_recipients');
    const recipientColumns: Array<[string, any]> = [
      ['delivered_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['first_opened_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['last_opened_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['open_count', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }],
      ['proxy_opened_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['proxy_open_count', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }],
      ['first_clicked_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['last_clicked_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['click_count', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }],
      ['last_clicked_url', { type: DataTypes.TEXT, allowNull: true, defaultValue: null }],
      ['replied_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['reply_count', { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 }],
      ['latest_reply_text', { type: DataTypes.TEXT, allowNull: true, defaultValue: null }],
      ['latest_reply_subject', { type: DataTypes.STRING(255), allowNull: true, defaultValue: null }],
      ['latest_reply_from_email', { type: DataTypes.STRING(255), allowNull: true, defaultValue: null }],
      ['bounced_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['last_bounce_type', { type: DataTypes.STRING(50), allowNull: true, defaultValue: null }],
      ['unsubscribed_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['complained_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['last_event_at', { type: DataTypes.DATE, allowNull: true, defaultValue: null }],
      ['last_event_type', { type: DataTypes.STRING(50), allowNull: true, defaultValue: null }],
    ];

    for (const [columnName, definition] of recipientColumns) {
      if (!columns[columnName]) {
        await queryInterface.addColumn('client_email_campaign_recipients', columnName, definition);
      }
    }

    if (!(await hasIndex(queryInterface, 'client_email_campaign_recipients', 'client_email_campaign_recipients_last_event_at_idx'))) {
      await queryInterface.addIndex('client_email_campaign_recipients', ['last_event_at'], {
        name: 'client_email_campaign_recipients_last_event_at_idx',
      });
    }
  }

  if (!tables.includes('client_email_campaign_recipient_events')) {
    await queryInterface.createTable('client_email_campaign_recipient_events', {
      id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
      campaign_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: { model: 'client_email_campaigns', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      recipient_id: {
        type: DataTypes.CHAR(36),
        allowNull: false,
        references: { model: 'client_email_campaign_recipients', key: 'id' },
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
      provider: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'brevo' },
      source: { type: DataTypes.STRING(50), allowNull: false },
      provider_event_key: { type: DataTypes.STRING(255), allowNull: false },
      provider_campaign_id: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      provider_message_id: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      event_type: { type: DataTypes.STRING(50), allowNull: false },
      event_at: { type: DataTypes.DATE, allowNull: false },
      link_url: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      reason: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      reply_text: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
      reply_subject: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      reply_from_email: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
      payload: { type: DataTypes.TEXT('long'), allowNull: true, defaultValue: null },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    }, TABLE_OPTIONS);

    await queryInterface.addIndex('client_email_campaign_recipient_events', ['campaign_id'], {
      name: 'client_email_campaign_recipient_events_campaign_id_idx',
    });
    await queryInterface.addIndex('client_email_campaign_recipient_events', ['recipient_id'], {
      name: 'client_email_campaign_recipient_events_recipient_id_idx',
    });
    await queryInterface.addIndex('client_email_campaign_recipient_events', ['event_at'], {
      name: 'client_email_campaign_recipient_events_event_at_idx',
    });
    await queryInterface.addIndex('client_email_campaign_recipient_events', ['event_type'], {
      name: 'client_email_campaign_recipient_events_event_type_idx',
    });
    await queryInterface.addIndex('client_email_campaign_recipient_events', ['provider_event_key'], {
      name: 'client_email_campaign_recipient_events_provider_event_key_unique',
      unique: true,
    });
  }
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  const tables = (await queryInterface.showAllTables()).map(item => String(item).toLowerCase());

  if (tables.includes('client_email_campaign_recipient_events')) {
    await queryInterface.dropTable('client_email_campaign_recipient_events');
  }

  if (tables.includes('client_email_campaign_recipients')) {
    const columns = await queryInterface.describeTable('client_email_campaign_recipients');
    const removableColumns = [
      'delivered_at',
      'first_opened_at',
      'last_opened_at',
      'open_count',
      'proxy_opened_at',
      'proxy_open_count',
      'first_clicked_at',
      'last_clicked_at',
      'click_count',
      'last_clicked_url',
      'replied_at',
      'reply_count',
      'latest_reply_text',
      'latest_reply_subject',
      'latest_reply_from_email',
      'bounced_at',
      'last_bounce_type',
      'unsubscribed_at',
      'complained_at',
      'last_event_at',
      'last_event_type',
    ];

    if (await hasIndex(queryInterface, 'client_email_campaign_recipients', 'client_email_campaign_recipients_last_event_at_idx')) {
      await queryInterface.removeIndex('client_email_campaign_recipients', 'client_email_campaign_recipients_last_event_at_idx');
    }

    for (const columnName of removableColumns) {
      if (columns[columnName]) {
        await queryInterface.removeColumn('client_email_campaign_recipients', columnName);
      }
    }
  }

  if (tables.includes('client_email_campaigns')) {
    const columns = await queryInterface.describeTable('client_email_campaigns');

    if (await hasIndex(queryInterface, 'client_email_campaigns', 'client_email_campaigns_provider_campaign_id_idx')) {
      await queryInterface.removeIndex('client_email_campaigns', 'client_email_campaigns_provider_campaign_id_idx');
    }

    if (columns['reply_to_email']) {
      await queryInterface.removeColumn('client_email_campaigns', 'reply_to_email');
    }
  }
}
