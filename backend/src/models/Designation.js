const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Designation = sequelize.define(
    'Designation',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      title: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    },
    {
      tableName: 'designations',
      indexes: [{ unique: true, fields: ['title'] }],
    }
  );
  return Designation;
};
