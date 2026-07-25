const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { Attendance, User, Leave, Department, Designation } = require('../models');
const { computeWorkingHours, isLateCheckIn, computeFinalStatus, todayDateOnly } = require('../utils/attendanceRules.util');
const { recordAudit } = require('../utils/audit.util');

/**
 * GET /api/attendance/today
 * Current user's attendance record for today.
 */
const getTodayAttendance = asyncHandler(async (req, res) => {
  const record = await Attendance.findOne({
    where: { user_id: req.user.id, attendance_date: todayDateOnly() },
  });
  return new ApiResponse(200, { attendance: record }).send(res);
});

/**
 * GET /api/attendance/history
 * Current user's attendance history with optional date range.
 */
const getMyHistory = asyncHandler(async (req, res) => {
  const { startDate, endDate, page = 1, limit = 31 } = req.query;
  const where = { user_id: req.user.id };
  if (startDate && endDate) {
    where.attendance_date = { [Op.between]: [startDate, endDate] };
  }
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { rows, count } = await Attendance.findAndCountAll({
    where,
    order: [['attendance_date', 'DESC']],
    limit: parseInt(limit, 10),
    offset,
  });

  return new ApiResponse(200, {
    records: rows,
    pagination: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) },
  }).send(res);
});

/**
 * GET /api/attendance
 * Admin: list attendance across all employees with filters (date, dept, status).
 */
const getAllAttendance = asyncHandler(async (req, res) => {
  const { date, startDate, endDate, departmentId, status, userId, page = 1, limit = 50 } = req.query;
  const where = {};
  const userWhere = {};

  if (date) where.attendance_date = date;
  else if (startDate && endDate) where.attendance_date = { [Op.between]: [startDate, endDate] };

  if (status) where.status = status;
  if (userId) where.user_id = userId;
  if (departmentId) userWhere.department_id = departmentId;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  const { rows, count } = await Attendance.findAndCountAll({
    where,
    include: [
      {
        model: User,
        where: Object.keys(userWhere).length ? userWhere : undefined,
        attributes: ['id', 'employee_code', 'full_name', 'email', 'department_id'],
        include: [{ model: Department, attributes: ['id', 'name'] }],
      },
    ],
    order: [['attendance_date', 'DESC']],
    limit: parseInt(limit, 10),
    offset,
  });

  return new ApiResponse(200, {
    records: rows,
    pagination: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10), pages: Math.ceil(count / limit) },
  }).send(res);
});

/**
 * POST /api/attendance/manual
 * Admin: manually create/adjust an attendance record (e.g. correcting a
 * missed punch, marking a public holiday, etc.)
 */
const manualMarkAttendance = asyncHandler(async (req, res) => {
  const { userId, attendanceDate, status, checkInTime, checkOutTime, remarks } = req.body;

  const user = await User.findByPk(userId);
  if (!user) throw ApiError.notFound('Employee not found');

  const workingHours = checkInTime && checkOutTime ? computeWorkingHours(checkInTime, checkOutTime) : null;

  const [record, created] = await Attendance.findOrCreate({
    where: { user_id: userId, attendance_date: attendanceDate },
    defaults: {
      status,
      check_in_time: checkInTime || null,
      check_out_time: checkOutTime || null,
      working_hours: workingHours,
      check_in_method: checkInTime ? 'manual' : null,
      check_out_method: checkOutTime ? 'manual' : null,
      remarks: remarks || null,
      marked_by: req.user.id,
    },
  });

  if (!created) {
    await record.update({
      status,
      check_in_time: checkInTime ?? record.check_in_time,
      check_out_time: checkOutTime ?? record.check_out_time,
      working_hours: workingHours ?? record.working_hours,
      remarks: remarks ?? record.remarks,
      marked_by: req.user.id,
    });
  }

  await recordAudit({
    req,
    action: 'ATTENDANCE_MANUAL_EDIT',
    entityType: 'Attendance',
    entityId: record.id,
    details: { userId, attendanceDate, status },
  });

  return new ApiResponse(created ? 201 : 200, { attendance: record }, 'Attendance record saved').send(res);
});

/**
 * POST /api/attendance/leave
 * Employee: submit a leave request.
 */
const requestLeave = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason } = req.body;
  if (new Date(endDate) < new Date(startDate)) {
    throw ApiError.badRequest('endDate cannot be before startDate');
  }

  const leave = await Leave.create({
    user_id: req.user.id,
    start_date: startDate,
    end_date: endDate,
    reason: reason || null,
  });

  await recordAudit({ req, action: 'LEAVE_REQUESTED', entityType: 'Leave', entityId: leave.id });

  return new ApiResponse(201, { leave }, 'Leave request submitted').send(res);
});

/**
 * GET /api/attendance/leave
 * List leave requests (own for employees, all for admins).
 */
const getLeaves = asyncHandler(async (req, res) => {
  const where = {};
  if (req.user.role === 'employee') where.user_id = req.user.id;
  else if (req.query.userId) where.user_id = req.query.userId;
  if (req.query.status) where.status = req.query.status;

  const leaves = await Leave.findAll({
    where,
    include: [{ model: User, attributes: ['id', 'employee_code', 'full_name', 'email'] }],
    order: [['created_at', 'DESC']],
  });

  return new ApiResponse(200, { leaves }).send(res);
});

/**
 * PATCH /api/attendance/leave/:id/decision
 * Admin: approve or reject a leave request. Approving marks the date
 * range as 'leave' in the attendance table and decrements leave balance.
 */
const decideLeave = asyncHandler(async (req, res) => {
  const { decision } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) {
    throw ApiError.badRequest('decision must be approved or rejected');
  }

  const leave = await Leave.findByPk(req.params.id);
  if (!leave) throw ApiError.notFound('Leave request not found');
  if (leave.status !== 'pending') throw ApiError.badRequest('Leave request already decided');

  await leave.update({ status: decision, approved_by: req.user.id, approved_at: new Date() });

  if (decision === 'approved') {
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    const days = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d).toISOString().slice(0, 10));
    }

    for (const day of days) {
      await Attendance.findOrCreate({
        where: { user_id: leave.user_id, attendance_date: day },
        defaults: { status: 'leave', remarks: 'Approved leave', marked_by: req.user.id },
      });
    }

    const user = await User.findByPk(leave.user_id);
    const newBalance = Math.max(0, parseFloat(user.leave_balance) - days.length);
    await user.update({ leave_balance: newBalance });
  }

  await recordAudit({ req, action: `LEAVE_${decision.toUpperCase()}`, entityType: 'Leave', entityId: leave.id });

  return new ApiResponse(200, { leave }, `Leave ${decision}`).send(res);
});

module.exports = {
  getTodayAttendance,
  getMyHistory,
  getAllAttendance,
  manualMarkAttendance,
  requestLeave,
  getLeaves,
  decideLeave,
};
