import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface SessionAttributes {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date;
  createdAt: Date;
}

type SessionCreationAttributes = Optional<SessionAttributes, 'createdAt' | 'revokedAt'>;

export class SessionModel extends Model<SessionAttributes, SessionCreationAttributes> implements SessionAttributes {
  declare id: string;
  declare userId: string;
  declare refreshTokenHash: string;
  declare expiresAt: Date;
  declare revokedAt: Date | null;
  declare lastUsedAt: Date;
  declare createdAt: Date;
}

SessionModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    userId: { type: DataTypes.CHAR(36), allowNull: false },
    refreshTokenHash: { type: DataTypes.STRING(255), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    revokedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    lastUsedAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'sessions',
    underscored: true,
    timestamps: true,
    updatedAt: false, // sessions table has no updated_at
    createdAt: 'created_at',
  }
);
