import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface AuditLogAttributes {
  id: string;
  actorUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  metadataJson: Record<string, any> | null;
  createdAt: Date;
}

type AuditLogCreationAttributes = Optional<AuditLogAttributes, 'createdAt' | 'actorUserId' | 'metadataJson'>;

export class AuditLogModel extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  declare id: string;
  declare actorUserId: string | null;
  declare action: string;
  declare entityType: string;
  declare entityId: string;
  declare metadataJson: Record<string, any> | null;
  declare createdAt: Date;
}

AuditLogModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    actorUserId: { type: DataTypes.CHAR(36), allowNull: true, defaultValue: null },
    action: { type: DataTypes.STRING(100), allowNull: false },
    entityType: { type: DataTypes.STRING(50), allowNull: false },
    entityId: { type: DataTypes.STRING(100), allowNull: false },
    metadataJson: { type: DataTypes.JSON, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
    indexes: [
      // Single-column indexes (match migration 20260413000001)
      { name: 'audit_logs_actor_user_id_idx',  fields: ['actor_user_id'] },
      { name: 'audit_logs_action_idx',          fields: ['action'] },
      { name: 'audit_logs_entity_type_idx',     fields: ['entity_type'] },
      { name: 'audit_logs_entity_id_idx',       fields: ['entity_id'] },
      { name: 'audit_logs_created_at_idx',      fields: ['created_at'] },
      // Composite indexes (match migration 20260414000001)
      { name: 'audit_logs_action_entity_type_idx',      fields: ['action', 'entity_type'] },
      { name: 'audit_logs_actor_created_at_idx',        fields: ['actor_user_id', 'created_at'] },
      { name: 'audit_logs_entity_type_created_at_idx',  fields: ['entity_type', 'created_at'] },
    ],
  }
);
