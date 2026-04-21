import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface InviteAttributes {
  id: string;
  email: string;
  role: string;
  status: string;
  tokenHash: string;
  expiresAt: Date;
  invitedByUserId: string;
  acceptedUserId: string | null;
  acceptedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type InviteCreationAttributes = Optional<InviteAttributes, 'createdAt' | 'updatedAt' | 'acceptedUserId' | 'acceptedAt' | 'revokedAt'>;

export class InviteModel extends Model<InviteAttributes, InviteCreationAttributes> implements InviteAttributes {
  declare id: string;
  declare email: string;
  declare role: string;
  declare status: string;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare invitedByUserId: string;
  declare acceptedUserId: string | null;
  declare acceptedAt: Date | null;
  declare revokedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

InviteModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false },
    role: { type: DataTypes.STRING(20), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
    tokenHash: { type: DataTypes.STRING(255), allowNull: false },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    invitedByUserId: { type: DataTypes.CHAR(36), allowNull: false },
    acceptedUserId: { type: DataTypes.CHAR(36), allowNull: true, defaultValue: null },
    acceptedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    revokedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'invites',
    underscored: true,
    timestamps: true,
  }
);
