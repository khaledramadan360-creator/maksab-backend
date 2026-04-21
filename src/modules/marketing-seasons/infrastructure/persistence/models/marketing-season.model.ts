import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface MarketingSeasonAttributes {
  id: string;
  title: string;
  description: string | null;
  status: string;
  ownerUserId: string;
  createdAt: Date;
  updatedAt: Date;
}

type MarketingSeasonCreationAttributes = Optional<
  MarketingSeasonAttributes,
  'description' | 'createdAt' | 'updatedAt'
>;

export class MarketingSeasonModel
  extends Model<MarketingSeasonAttributes, MarketingSeasonCreationAttributes>
  implements MarketingSeasonAttributes
{
  declare id: string;
  declare title: string;
  declare description: string | null;
  declare status: string;
  declare ownerUserId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

MarketingSeasonModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'inactive' },
    ownerUserId: { type: DataTypes.CHAR(36), allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'marketing_seasons',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'marketing_seasons_status_idx', fields: ['status'] },
      { name: 'marketing_seasons_owner_user_id_idx', fields: ['owner_user_id'] },
    ],
  }
);

