import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface ClientPlatformAnalysisAttributes {
  id: string;
  clientAnalysisId: string;
  platform: string;
  platformUrl: string;
  platformScore: string | number | null;
  summary: string | null;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  createdAt: Date;
  updatedAt: Date;
}

type ClientPlatformAnalysisCreationAttributes = Optional<ClientPlatformAnalysisAttributes, 'createdAt' | 'updatedAt'>;

export class ClientPlatformAnalysisModel
  extends Model<ClientPlatformAnalysisAttributes, ClientPlatformAnalysisCreationAttributes>
  implements ClientPlatformAnalysisAttributes
{
  declare id: string;
  declare clientAnalysisId: string;
  declare platform: string;
  declare platformUrl: string;
  declare platformScore: string | number | null;
  declare summary: string | null;
  declare strengths: string[];
  declare weaknesses: string[];
  declare recommendations: string[];
  declare createdAt: Date;
  declare updatedAt: Date;
}

ClientPlatformAnalysisModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    clientAnalysisId: { type: DataTypes.CHAR(36), allowNull: false },
    platform: { type: DataTypes.STRING(20), allowNull: false },
    platformUrl: { type: DataTypes.TEXT, allowNull: false },
    platformScore: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: null },
    summary: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    strengths: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    weaknesses: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    recommendations: { type: DataTypes.JSON, allowNull: false, defaultValue: [] },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'client_platform_analyses',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'client_platform_analyses_analysis_id_idx', fields: ['client_analysis_id'] },
      { name: 'client_platform_analyses_platform_idx', fields: ['platform'] },
    ],
  }
);
