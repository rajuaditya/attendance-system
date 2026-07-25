const { Op, fn, col, literal } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiResponse = require('../utils/ApiResponse');
const { User, Attendance, Leave, Department } = require('../models');
const { todayDateOnly } = require('../utils/attendanceRules.util');

/**
 * GET /api/dashboard/admin
 * Aggregated counts for the admin dashboard: totals, present/absent/late
 * today, and a month-to-date attendance breakdown per employee for the
 * calendar widget.
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  const today = todayDateOnly();

  const [totalEmployees, activeEmployees] = await Promise.all([
    User.count({ where: { role: { [Op.in]: ['employee', 'admin'] } } }),
    User.count({ where: { role: { [Op.in]: ['employee', 'admin'] }, is_active: true } }),
  ]);

  const todayRecords = await Attendance.findAll({ where: { attendance_date: today } });

  const present = todayRecords.filter((r) => r.status === 'present').length;
  const late = todayRecords.filter((r) => r.status === 'late').length;
  const halfDay = todayRecords.filter((r) => r.status === 'half_day').length;
  const onLeave = todayRecords.filter((r) => r.status === 'leave').length;
  const checkedInCount = todayRecords.filter((r) => r.check_in_time).length;
  const absent = Math.max(0, activeEmployees - checkedInCount - onLeave);

  const pendingLeaves = await Leave.count({ where: { status: 'pending' } });

  const departmentBreakdown = await User.findAll({
    attributes: ['department_id', [fn('COUNT', col('User.id')), 'count']],
    include: [{ model: Department, attributes: ['name'] }],
    where: { role: { [Op.in]: ['employee', 'admin'] } },
    group: ['department_id', 'Department.id'],
  });

  return new ApiResponse(200, {
    totalEmployees,
    activeEmployees,
    present,
    late,
    halfDay,
    absent,
    onLeave,
    pendingLeaves,
    departmentBreakdown,
    date: today,
  }).send(res);
});

/**
 * GET /api/dashboard/admin/calendar
 * Returns daily attendance summary counts for a given month, used to
 * render the admin attendance calendar heatmap.
 */
const getAdminCalendar = asyncHandler(async (req, res) => {
  const { year, month } = req.query; // month = 1-12
  const y = parseInt(year, 10) || new Date().getFullYear();
  const m = parseInt(month, 10) || new Date().getMonth() + 1;

  const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
  const endDate = new Date(y, m, 0).toISOString().slice(0, 10);

  const records = await Attendance.findAll({
    attributes: [
      'attendance_date',
      'status',
      [fn('COUNT', col('id')), 'count'],
    ],
    where: { attendance_date: { [Op.between]: [startDate, endDate] } },
    group: ['attendance_date', 'status'],
    order: [['attendance_date', 'ASC']],
  });

  return new ApiResponse(200, { records }).send(res);
});

/**
 * GET /api/dashboard/employee
 * Employee's own dashboard summary: today's attendance, MTD stats,
 * working hours, and leave balance.
 */
const getEmployeeDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const today = todayDateOnly();

  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

  const [todayRecord, monthRecords, user] = await Promise.all([
    Attendance.findOne({ where: { user_id: userId, attendance_date: today } }),
    Attendance.findAll({ where: { user_id: userId, attendance_date: { [Op.gte]: monthStart } } }),
    User.findByPk(userId, { attributes: ['leave_balance'] }),
  ]);

  const presentDays = monthRecords.filter((r) => ['present', 'late', 'half_day'].includes(r.status)).length;
  const lateDays = monthRecords.filter((r) => r.status === 'late').length;
  const leaveDays = monthRecords.filter((r) => r.status === 'leave').length;
  const absentDays = monthRecords.filter((r) => r.status === 'absent').length;
  const totalWorkingHours = monthRecords.reduce((sum, r) => sum + (parseFloat(r.working_hours) || 0), 0);

  return new ApiResponse(200, {
    today: todayRecord,
    monthToDate: {
      presentDays,
      lateDays,
      leaveDays,
      absentDays,
      totalWorkingHours: Math.round(totalWorkingHours * 100) / 100,
    },
    leaveBalance: user?.leave_balance ?? 0,
  }).send(res);
});

module.exports = { getAdminDashboard, getAdminCalendar, getEmployeeDashboard };
