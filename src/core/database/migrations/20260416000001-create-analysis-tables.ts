import { DataTypes, QueryInterface } from 'sequelize';

export async function up(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.createTable('client_analyses', {
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
    owner_user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    overall_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    strengths: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    weaknesses: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    recommendations: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    analyzed_at: {
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

  await queryInterface.addIndex('client_analyses', ['client_id'], {
    name: 'client_analyses_client_id_unique',
    unique: true,
  });
  await queryInterface.addIndex('client_analyses', ['owner_user_id'], {
    name: 'client_analyses_owner_user_id_idx',
  });
  await queryInterface.addIndex('client_analyses', ['status'], {
    name: 'client_analyses_status_idx',
  });
  await queryInterface.addIndex('client_analyses', ['analyzed_at'], {
    name: 'client_analyses_analyzed_at_idx',
  });

  await queryInterface.createTable('client_platform_analyses', {
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
    platform_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    strengths: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    weaknesses: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    recommendations: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
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

  await queryInterface.addIndex('client_platform_analyses', ['client_analysis_id'], {
    name: 'client_platform_analyses_analysis_id_idx',
  });
  await queryInterface.addIndex('client_platform_analyses', ['platform'], {
    name: 'client_platform_analyses_platform_idx',
  });
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  await queryInterface.dropTable('client_platform_analyses');
  await queryInterface.dropTable('client_analyses');
}
