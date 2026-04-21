import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  // ─── users ────────────────────────────────────────────────────────────────
  await queryInterface.createTable('users', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'active',
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

  await queryInterface.addIndex('users', ['email'], { unique: true, name: 'users_email_unique' });
  await queryInterface.addIndex('users', ['role'], { name: 'users_role_idx' });
  await queryInterface.addIndex('users', ['status'], { name: 'users_status_idx' });

  // ─── invites ──────────────────────────────────────────────────────────────
  await queryInterface.createTable('invites', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    invited_by_user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    accepted_user_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revoked_at: {
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

  await queryInterface.addIndex('invites', ['token_hash'], { unique: true, name: 'invites_token_hash_unique' });
  await queryInterface.addIndex('invites', ['email'], { name: 'invites_email_idx' });
  await queryInterface.addIndex('invites', ['status'], { name: 'invites_status_idx' });
  await queryInterface.addIndex('invites', ['expires_at'], { name: 'invites_expires_at_idx' });
  await queryInterface.addIndex('invites', ['invited_by_user_id'], { name: 'invites_invited_by_user_id_idx' });

  // ─── sessions ─────────────────────────────────────────────────────────────
  await queryInterface.createTable('sessions', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    refresh_token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_used_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('sessions', ['refresh_token_hash'], { unique: true, name: 'sessions_refresh_token_hash_unique' });
  await queryInterface.addIndex('sessions', ['user_id'], { name: 'sessions_user_id_idx' });
  await queryInterface.addIndex('sessions', ['expires_at'], { name: 'sessions_expires_at_idx' });
  await queryInterface.addIndex('sessions', ['revoked_at'], { name: 'sessions_revoked_at_idx' });

  // ─── password_resets ──────────────────────────────────────────────────────
  await queryInterface.createTable('password_resets', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('password_resets', ['token_hash'], { unique: true, name: 'password_resets_token_hash_unique' });
  await queryInterface.addIndex('password_resets', ['user_id'], { name: 'password_resets_user_id_idx' });
  await queryInterface.addIndex('password_resets', ['expires_at'], { name: 'password_resets_expires_at_idx' });
  await queryInterface.addIndex('password_resets', ['used_at'], { name: 'password_resets_used_at_idx' });

  // ─── audit_logs ───────────────────────────────────────────────────────────
  await queryInterface.createTable('audit_logs', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      allowNull: false,
    },
    actor_user_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    metadata_json: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('audit_logs', ['actor_user_id'], { name: 'audit_logs_actor_user_id_idx' });
  await queryInterface.addIndex('audit_logs', ['action'], { name: 'audit_logs_action_idx' });
  await queryInterface.addIndex('audit_logs', ['entity_type'], { name: 'audit_logs_entity_type_idx' });
  await queryInterface.addIndex('audit_logs', ['entity_id'], { name: 'audit_logs_entity_id_idx' });
  await queryInterface.addIndex('audit_logs', ['created_at'], { name: 'audit_logs_created_at_idx' });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('audit_logs');
  await queryInterface.dropTable('password_resets');
  await queryInterface.dropTable('sessions');
  await queryInterface.dropTable('invites');
  await queryInterface.dropTable('users');
}
