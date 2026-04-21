import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../../../../core/database/sequelize.config';

interface ClientReportAttributes {
  id: string;
  clientId: string;
  analysisId: string;
  ownerUserId: string;
  templateKey: string;
  status: string;
  format: string;
  pdfPath: string | null;
  pdfUrl: string | null;
  generatedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type ClientReportCreationAttributes = Optional<ClientReportAttributes, 'createdAt' | 'updatedAt'>;

export class ClientReportModel
  extends Model<ClientReportAttributes, ClientReportCreationAttributes>
  implements ClientReportAttributes
{
  declare id: string;
  declare clientId: string;
  declare analysisId: string;
  declare ownerUserId: string;
  declare templateKey: string;
  declare status: string;
  declare format: string;
  declare pdfPath: string | null;
  declare pdfUrl: string | null;
  declare generatedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ClientReportModel.init(
  {
    id: { type: DataTypes.CHAR(36), primaryKey: true, allowNull: false },
    clientId: { type: DataTypes.CHAR(36), allowNull: false },
    analysisId: { type: DataTypes.CHAR(36), allowNull: false },
    ownerUserId: { type: DataTypes.CHAR(36), allowNull: false },
    templateKey: { type: DataTypes.STRING(100), allowNull: false, defaultValue: 'default_client_report' },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'generating' },
    format: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pdf' },
    pdfPath: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    pdfUrl: { type: DataTypes.TEXT, allowNull: true, defaultValue: null },
    generatedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'client_reports',
    underscored: true,
    timestamps: true,
    indexes: [
      { name: 'client_reports_client_id_unique', fields: ['client_id'], unique: true },
      { name: 'client_reports_owner_user_id_idx', fields: ['owner_user_id'] },
      { name: 'client_reports_status_idx', fields: ['status'] },
      { name: 'client_reports_generated_at_idx', fields: ['generated_at'] },
    ],
  }
);
