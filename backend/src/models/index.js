const { sequelize } = require('../config/db');

const User = require('./User')(sequelize);
const Department = require('./Department')(sequelize);
const Designation = require('./Designation')(sequelize);
const RefreshToken = require('./RefreshToken')(sequelize);
const PasswordResetToken = require('./PasswordResetToken')(sequelize);
const QrToken = require('./QrToken')(sequelize);
const QrScanLog = require('./QrScanLog')(sequelize);
const Attendance = require('./Attendance')(sequelize);
const Leave = require('./Leave')(sequelize);
const AuditLog = require('./AuditLog')(sequelize);

/* ---------------------- Associations ---------------------- */

// Department <-> User
Department.hasMany(User, { foreignKey: 'department_id', onDelete: 'SET NULL' });
User.belongsTo(Department, { foreignKey: 'department_id' });

// Designation <-> User
Designation.hasMany(User, { foreignKey: 'designation_id', onDelete: 'SET NULL' });
User.belongsTo(Designation, { foreignKey: 'designation_id' });

// User <-> RefreshToken
User.hasMany(RefreshToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'user_id' });

// User <-> PasswordResetToken
User.hasMany(PasswordResetToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
PasswordResetToken.belongsTo(User, { foreignKey: 'user_id' });

// User <-> QrToken (one active token conceptually, but keep history)
User.hasMany(QrToken, { foreignKey: 'user_id', onDelete: 'CASCADE' });
QrToken.belongsTo(User, { foreignKey: 'user_id' });

// User <-> QrScanLog
User.hasMany(QrScanLog, { foreignKey: 'user_id', onDelete: 'SET NULL' });
QrScanLog.belongsTo(User, { foreignKey: 'user_id' });

// User <-> Attendance
User.hasMany(Attendance, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Attendance.belongsTo(User, { foreignKey: 'user_id' });

// User <-> Leave
User.hasMany(Leave, { foreignKey: 'user_id', onDelete: 'CASCADE' });
Leave.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(Leave, { foreignKey: 'approved_by', as: 'ApprovedLeaves' });
Leave.belongsTo(User, { foreignKey: 'approved_by', as: 'Approver' });

// User <-> AuditLog
User.hasMany(AuditLog, { foreignKey: 'actor_id', onDelete: 'SET NULL' });
AuditLog.belongsTo(User, { foreignKey: 'actor_id' });

module.exports = {
  sequelize,
  User,
  Department,
  Designation,
  RefreshToken,
  PasswordResetToken,
  QrToken,
  QrScanLog,
  Attendance,
  Leave,
  AuditLog,
};
