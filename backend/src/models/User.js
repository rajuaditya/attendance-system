const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      employee_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Human-readable employee ID e.g. EMP-0001',
      },
      full_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: true, len: [2, 100] },
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: { is: /^[0-9+\-\s()]{7,20}$/ },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('super_admin', 'admin', 'employee'),
        allowNull: false,
        defaultValue: 'employee',
      },
      department_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      designation_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      profile_photo_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      date_of_joining: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      leave_balance: {
        type: DataTypes.DECIMAL(5, 1),
        allowNull: false,
        defaultValue: 12.0,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      password_changed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      indexes: [
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['employee_code'] },
        { fields: ['role'] },
        { fields: ['department_id'] },
        { fields: ['is_active'] },
      ],
      defaultScope: {
        attributes: { exclude: ['password_hash'] },
      },
      scopes: {
        withPassword: { attributes: { include: ['password_hash'] } },
      },
    }
  );

  return User;
};
