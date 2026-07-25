const { body, query } = require('express-validator');

const qrScanValidator = [
  body('payload').notEmpty().withMessage('QR payload is required'),
  body('scanType').isIn(['check_in', 'check_out']).withMessage('scanType must be check_in or check_out'),
];

const manualAttendanceValidator = [
  body('userId').isInt().withMessage('Valid userId is required'),
  body('attendanceDate').isISO8601().withMessage('Valid attendanceDate is required'),
  body('status')
    .isIn(['present', 'late', 'half_day', 'absent', 'leave', 'holiday'])
    .withMessage('Invalid status'),
  body('checkInTime').optional({ checkFalsy: true }).isISO8601(),
  body('checkOutTime').optional({ checkFalsy: true }).isISO8601(),
  body('remarks').optional({ checkFalsy: true }).isLength({ max: 255 }),
];

const dateRangeValidator = [
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
];

const leaveRequestValidator = [
  body('startDate').isISO8601().withMessage('Valid startDate is required'),
  body('endDate').isISO8601().withMessage('Valid endDate is required'),
  body('reason').optional({ checkFalsy: true }).isLength({ max: 500 }),
];

module.exports = {
  qrScanValidator,
  manualAttendanceValidator,
  dateRangeValidator,
  leaveRequestValidator,
};
