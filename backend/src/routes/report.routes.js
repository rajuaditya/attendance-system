const router = require('express').Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(authenticate, authorize('admin', 'super_admin'));

router.get('/', reportController.getReport);
router.get('/export/excel', reportController.exportExcelReport);
router.get('/export/pdf', reportController.exportPdfReport);
router.get('/employee/:id', reportController.getEmployeeReport);

module.exports = router;
