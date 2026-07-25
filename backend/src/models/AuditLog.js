const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      actor_id: { type: DataTypes.INTEGER, allowNull: true, comment: 'User who performed the action; null for system/anonymous' },
      action: { type: DataTypes.STRING(100), allowNull: false, comment: 'e.g. LOGIN_SUCCESS, EMPLOYEE_CREATED, ATTENDANCE_MANUAL_EDIT' },
      entity_type: { type: DataTypes.STRING(50), allowNull: true },
      entity_id: { type: DataTypes.INTEGER, allowNull: true },
      details: { type: DataTypes.JSON, allowNull: true },
      ip_address: { type: DataTypes.STRING(45), allowNull: true },
      user_agent: { type: DataTypes.STRING(255), allowNull: true },
    },
    {
      tableName: 'audit_logs',
      indexes: [
        { fields: ['actor_id'] },
        { fields: ['action'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['created_at'] },
      ],
    }
  );
  return AuditLog;
};
