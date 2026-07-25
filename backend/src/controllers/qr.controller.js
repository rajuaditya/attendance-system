const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { QrToken, QrScanLog, Attendance, User } = require('../models');
const { verifyQrPayload } = require('../utils/qr.util');
const { isLateCheckIn, computeWorkingHours, computeFinalStatus, todayDateOnly } = require('../utils/attendanceRules.util');
const { recordAudit } = require('../utils/audit.util');

const logScan = (data) => QrScanLog.create(data).catch(() => {});

/**
 * POST /api/qr/scan
 * Body: { payload: "<token>.<signature>", scanType: "check_in" | "check_out" }
 *
 * This is the single entry point for QR-based attendance. It:
 *  1. Verifies the HMAC signature on the payload (rejects tampered QR codes)
 *  2. Resolves the opaque token to an active, non-expired DB record
 *  3. Confirms the linked employee is active
 *  4. Enforces exactly one check-in and one check-out per calendar day
 *  5. Computes working hours / late / half-day status automatically
 *  6. Logs every scan attempt (success or failure) for audit purposes
 */
const scanQr = asyncHandler(async (req, res) => {
  const { payload, scanType } = req.body;
  const ip = req.ip;
  const device = req.headers['user-agent'] || null;

  const token = verifyQrPayload(payload);
  if (!token) {
    await logScan({ scan_type: scanType, result: 'invalid_token', ip_address: ip, device_info: device });
    throw ApiError.badRequest('Invalid or tampered QR code');
  }

  const qrToken = await QrToken.findOne({ where: { token } });
  if (!qrToken || !qrToken.is_active) {
    await logScan({ scan_type: scanType, result: 'invalid_token', ip_address: ip, device_info: device });
    throw ApiError.badRequest('QR code is not recognized');
  }

  if (qrToken.expires_at < new Date()) {
    await logScan({
      user_id: qrToken.user_id,
      scan_type: scanType,
      result: 'expired_token',
      ip_address: ip,
      device_info: device,
    });
    throw ApiError.badRequest('QR code has expired. Please request an updated QR code.');
  }

  const user = await User.findByPk(qrToken.user_id);
  if (!user || !user.is_active) {
    await logScan({
      user_id: qrToken.user_id,
      scan_type: scanType,
      result: 'inactive_user',
      ip_address: ip,
      device_info: device,
    });
    throw ApiError.forbidden('Employee account is inactive');
  }

  const today = todayDateOnly();
  const now = new Date();

  let attendance = await Attendance.findOne({ where: { user_id: user.id, attendance_date: today } });

  if (scanType === 'check_in') {
    if (attendance && attendance.check_in_time) {
      await logScan({ user_id: user.id, scan_type: scanType, result: 'duplicate', ip_address: ip, device_info: device });
      throw ApiError.conflict('You have already checked in today');
    }

    const late = isLateCheckIn(now);

    if (attendance) {
      await attendance.update({
        check_in_time: now,
        check_in_method: 'qr',
        status: late ? 'late' : 'present',
      });
    } else {
      attendance = await Attendance.create({
        user_id: user.id,
        attendance_date: today,
        check_in_time: now,
        check_in_method: 'qr',
        status: late ? 'late' : 'present',
      });
    }

    await logScan({ user_id: user.id, scan_type: scanType, result: 'success', ip_address: ip, device_info: device });
    await recordAudit({ req, actorId: user.id, action: 'CHECK_IN', entityType: 'Attendance', entityId: attendance.id });

    return new ApiResponse(200, {
      attendance,
      employee: { fullName: user.full_name, employeeCode: user.employee_code },
      late,
    }, late ? 'Checked in (marked late)' : 'Checked in successfully').send(res);
  }

  if (scanType === 'check_out') {
    if (!attendance || !attendance.check_in_time) {
      await logScan({ user_id: user.id, scan_type: scanType, result: 'error', ip_address: ip, device_info: device });
      throw ApiError.badRequest('You must check in before checking out');
    }
    if (attendance.check_out_time) {
      await logScan({ user_id: user.id, scan_type: scanType, result: 'duplicate', ip_address: ip, device_info: device });
      throw ApiError.conflict('You have already checked out today');
    }

    const workingHours = computeWorkingHours(attendance.check_in_time, now);
    const wasLate = attendance.status === 'late';
    const finalStatus = computeFinalStatus(workingHours, wasLate);

    await attendance.update({
      check_out_time: now,
      check_out_method: 'qr',
      working_hours: workingHours,
      status: finalStatus,
    });

    await logScan({ user_id: user.id, scan_type: scanType, result: 'success', ip_address: ip, device_info: device });
    await recordAudit({ req, actorId: user.id, action: 'CHECK_OUT', entityType: 'Attendance', entityId: attendance.id });

    return new ApiResponse(200, {
      attendance,
      employee: { fullName: user.full_name, employeeCode: user.employee_code },
      workingHours,
    }, 'Checked out successfully').send(res);
  }

  throw ApiError.badRequest('Invalid scanType');
});

/**
 * GET /api/qr/scan-logs
 * Admin: view recent scan logs (for security/audit review).
 */
const getScanLogs = asyncHandler(async (req, res) => {
  const { result, page = 1, limit = 50 } = req.query;
  const where = {};
  if (result) where.result = result;

  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const { rows, count } = await QrScanLog.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'employee_code', 'full_name'] }],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit, 10),
    offset,
  });

  return new ApiResponse(200, {
    logs: rows,
    pagination: { total: count, page: parseInt(page, 10), limit: parseInt(limit, 10) },
  }).send(res);
});

module.exports = { scanQr, getScanLogs };
