const router = require('express').Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(authenticate);

router.get('/admin', authorize('admin', 'super_admin'), dashboardController.getAdminDashboard);
router.get('/admin/calendar', authorize('admin', 'super_admin'), dashboardController.getAdminCalendar);
router.get('/employee', dashboardController.getEmployeeDashboard);

module.exports = router;
