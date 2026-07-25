const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QrScanLog = sequelize.define(
    'QrScanLog',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'Null if token could not be resolved to a user' },
      scanned_by: { type: DataTypes.INTEGER, allowNull: true, comment: 'Admin/kiosk account that performed the scan, if applicable' },
      scan_type: { type: DataTypes.ENUM('check_in', 'check_out'), allowNull: false },
      result: {
        type: DataTypes.ENUM('success', 'invalid_token', 'expired_token', 'duplicate', 'inactive_user', 'error'),
        allowNull: false,
      },
      ip_address: { type: DataTypes.STRING(45), allowNull: true },
      device_info: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'qr_scan_logs',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['result'] },
        { fields: ['created_at'] },
      ],
    }
  );
  return QrScanLog;
};
