import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface ClientAnalysisScreenshotAttributes {
  id: string;
  clientAnalysisId: string;
  platform: string;
  platformUrl: string;
  supabasePath: string | null;
  publicUrl: string | null;
  captureStatus: string;
  capturedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type ClientAnalysisScreenshotCreationAttributes = Optional<
  ClientAnalysisScreenshotAttributes,
  'createdAt' | 'updatedAt'
>;

export class ClientAnalysisScreenshotModel
  extends Model<ClientAnalysisScreenshotAttributes, ClientAnalysisScreenshotCreationAttributes>
  implements ClientAnalysisScreenshotAttributes
{
  declare id: string;
  declare clientAnalysisId: string;
  declare platform: string;
  declare platformUrl: string;
  declare supabasePath: string | null;
  declare publicUrl: string | null;
  declare captureStatus: string;
  declare capturedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ClientAnalysisScreenshotModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    clientAnalysisId: { type: DataTypes.CHAR(36), allowNull: false },
    platform: { type: DataTypes.STRING(20), allowNull: false },
    platformUrl: { type: DataTypes.TEXT, allowNull: false },
    supabasePath: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    publicUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    captureStatus: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
    capturedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'client_analysis_screenshots',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'client_analysis_screenshots_analysis_id_idx', fields: ['client_analysis_id'] },
      { name: 'client_analysis_screenshots_platform_idx', fields: ['platform'] },
      { name: 'client_analysis_screenshots_status_idx', fields: ['capture_status'] },
    ],
  }
);
