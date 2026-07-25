const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Leave = sequelize.define(
    'Leave',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      start_date: { type: DataTypes.DATEONLY, allowNull: false },
      end_date: { type: DataTypes.DATEONLY, allowNull: false },
      reason: { type: DataTypes.STRING(500), allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      approved_by: { type: DataTypes.INTEGER, allowNull: true },
      approved_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'leaves',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['status'] },
        { fields: ['start_date', 'end_date'] },
      ],
    }
  );
  return Leave;
};
