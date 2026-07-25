const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const QrToken = sequelize.define(
    'QrToken',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Random opaque token embedded (signed) in the QR image',
      },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      rotated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      tableName: 'qr_tokens',
      indexes: [
        { unique: true, fields: ['token'] },
        { fields: ['user_id'] },
        { fields: ['is_active'] },
        { fields: ['expires_at'] },
      ],
    }
  );
  return QrToken;
};
