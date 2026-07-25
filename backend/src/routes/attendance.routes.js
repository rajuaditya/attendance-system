const router = require('express').Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const {
  manualAttendanceValidator,
  dateRangeValidator,
  leaveRequestValidator,
} = require('../validators/attendance.validator');

router.use(authenticate);

// Employee self-service
router.get('/today', attendanceController.getTodayAttendance);
router.get('/history', dateRangeValidator, validate, attendanceController.getMyHistory);
router.post('/leave', leaveRequestValidator, validate, attendanceController.requestLeave);
router.get('/leave', attendanceController.getLeaves);

// Admin
router.get('/', authorize('admin', 'super_admin'), attendanceController.getAllAttendance);
router.post('/manual', authorize('admin', 'super_admin'), manualAttendanceValidator, validate, attendanceController.manualMarkAttendance);
router.patch('/leave/:id/decision', authorize('admin', 'super_admin'), attendanceController.decideLeave);

module.exports = router;
