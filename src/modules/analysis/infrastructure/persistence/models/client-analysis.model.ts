import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface ClientAnalysisAttributes {
  id: string;
  clientId: string;
  ownerUserId: string;
  status: string;
  summary: string | null;
  overallScore: string | number | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analyzedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type ClientAnalysisCreationAttributes = Optional<ClientAnalysisAttributes, 'createdAt' | 'updatedAt'>;

export class ClientAnalysisModel
  extends Model<ClientAnalysisAttributes, ClientAnalysisCreationAttributes>
  implements ClientAnalysisAttributes
{
  declare id: string;
  declare clientId: string;
  declare ownerUserId: string;
  declare status: string;
  declare summary: string | null;
  declare overallScore: string | number | null;
  declare strengths: string[];
  declare weaknesses: string[];
  declare recommendations: string[];
  declare analyzedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ClientAnalysisModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    clientId: { type: DataTypes.CHAR(36), allowNull: false },
    ownerUserId: { type: DataTypes.CHAR(36), allowNull: false },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
    summary: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    overallScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: null },
    strengths: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    weaknesses: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    recommendations: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    analyzedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'client_analyses',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'client_analyses_client_id_unique', fields: ['client_id'], unique: true },
      { name: 'client_analyses_owner_user_id_idx', fields: ['owner_user_id'] },
      { name: 'client_analyses_status_idx', fields: ['status'] },
      { name: 'client_analyses_analyzed_at_idx', fields: ['analyzed_at'] },
    ],
  }
);
