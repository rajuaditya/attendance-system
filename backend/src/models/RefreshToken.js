const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      token_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'SHA-256 hash of the opaque refresh token; raw value never stored',
      },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
      ip_address: { type: DataTypes.STRING(45), allowNull: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'refresh_tokens',
      indexes: [
        { unique: true, fields: ['token_hash'] },
        { fields: ['user_id'] },
        { fields: ['expires_at'] },
      ],
    }
  );
  return RefreshToken;
};
