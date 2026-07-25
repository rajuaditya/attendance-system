const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Attendance = sequelize.define(
    'Attendance',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: { type: DataTypes.INTEGER, allowNull: false },
      attendance_date: { type: DataTypes.DATEONLY, allowNull: false },
      check_in_time: { type: DataTypes.DATE, allowNull: true },
      check_out_time: { type: DataTypes.DATE, allowNull: true },
      working_hours: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: true,
        comment: 'Auto-computed from check_in/check_out',
      },
      status: {
        type: DataTypes.ENUM('present', 'late', 'half_day', 'absent', 'leave', 'holiday'),
        allowNull: false,
        defaultValue: 'absent',
      },
      check_in_method: { type: DataTypes.ENUM('qr', 'manual', 'system'), allowNull: true },
      check_out_method: { type: DataTypes.ENUM('qr', 'manual', 'system'), allowNull: true },
      remarks: { type: DataTypes.STRING(255), allowNull: true },
      marked_by: { type: DataTypes.INTEGER, allowNull: true, comment: 'Admin who manually adjusted this record' },
    },
    {
      tableName: 'attendances',
      indexes: [
        { unique: true, fields: ['user_id', 'attendance_date'] },
        { fields: ['attendance_date'] },
        { fields: ['status'] },
      ],
    }
  );
  return Attendance;
};
