import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface ClientAttributes {
  id: string;
  name: string;
  clientType: string;
  mobile: string | null;
  whatsapp: string | null;
  email: string | null;
  saudiCity: string;
  notes: string | null;
  primaryPlatform: string;
  status: string;
  sourceModule: string;
  sourcePlatform: string;
  sourceUrl: string;
  ownerUserId: string;
  websiteUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  snapchatUrl: string | null;
  linkedinUrl: string | null;
  xUrl: string | null;
  tiktokUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ClientCreationAttributes = Optional<ClientAttributes, 'createdAt' | 'updatedAt'>;

export class ClientModel extends Model<ClientAttributes, ClientCreationAttributes> implements ClientAttributes {
  declare id: string;
  declare name: string;
  declare clientType: string;
  declare mobile: string | null;
  declare whatsapp: string | null;
  declare email: string | null;
  declare saudiCity: string;
  declare notes: string | null;
  declare primaryPlatform: string;
  declare status: string;
  declare sourceModule: string;
  declare sourcePlatform: string;
  declare sourceUrl: string;
  declare ownerUserId: string;
  declare websiteUrl: string | null;
  declare facebookUrl: string | null;
  declare instagramUrl: string | null;
  declare snapchatUrl: string | null;
  declare linkedinUrl: string | null;
  declare xUrl: string | null;
  declare tiktokUrl: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ClientModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    clientType: { type: DataTypes.STRING(20), allowNull: false },
    mobile: { type: DataTypes.STRING(30), allowNull: true, defaultValue: null },
    whatsapp: { type: DataTypes.STRING(30), allowNull: true, defaultValue: null },
    email: { type: DataTypes.STRING(255), allowNull: true, defaultValue: null },
    saudiCity: { type: DataTypes.STRING(100), allowNull: false },
    notes: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    primaryPlatform: { type: DataTypes.STRING(20), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'new' },
    sourceModule: { type: DataTypes.STRING(30), allowNull: false },
    sourcePlatform: { type: DataTypes.STRING(20), allowNull: false },
    sourceUrl: { type: DataTypes.TEXT, allowNull: false },
    ownerUserId: { type: DataTypes.CHAR(36), allowNull: false },
    websiteUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    facebookUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    instagramUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    snapchatUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    linkedinUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    xUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    tiktokUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'clients',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'clients_owner_user_id_idx', fields: ['owner_user_id'] },
      { name: 'clients_status_idx', fields: ['status'] },
      { name: 'clients_primary_platform_idx', fields: ['primary_platform'] },
      { name: 'clients_saudi_city_idx', fields: ['saudi_city'] },
      { name: 'clients_created_at_idx', fields: ['created_at'] },
      { name: 'clients_mobile_idx', fields: ['mobile'] },
      { name: 'clients_email_idx', fields: ['email'] },
    ],
  }
);
