import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('clients', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    client_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    mobile: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    whatsapp: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    saudi_city: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    primary_platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'new',
    },
    source_module: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    source_platform: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    source_url: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    owner_user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    website_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    facebook_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    instagram_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    snapchat_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    linkedin_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    x_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    tiktok_url: {
      type: DataTypes.TEXT,
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

  await queryInterface.addIndex('clients', ['owner_user_id'], { name: 'clients_owner_user_id_idx' });
  await queryInterface.addIndex('clients', ['status'], { name: 'clients_status_idx' });
  await queryInterface.addIndex('clients', ['primary_platform'], { name: 'clients_primary_platform_idx' });
  await queryInterface.addIndex('clients', ['saudi_city'], { name: 'clients_saudi_city_idx' });
  await queryInterface.addIndex('clients', ['created_at'], { name: 'clients_created_at_idx' });
  await queryInterface.addIndex('clients', ['mobile'], { name: 'clients_mobile_idx' });
  await queryInterface.addIndex('clients', ['email'], { name: 'clients_email_idx' });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('clients');
}
