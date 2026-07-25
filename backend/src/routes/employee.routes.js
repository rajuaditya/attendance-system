const router = require('express').Router();
const employeeController = require('../controllers/employee.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const uploadProfilePhoto = require('../middleware/upload.middleware');
const {
  createEmployeeValidator,
  updateEmployeeValidator,
  idParamValidator,
} = require('../validators/employee.validator');

router.use(authenticate);

// Admin & Super Admin manage employees
router.post('/', authorize('admin', 'super_admin'), createEmployeeValidator, validate, employeeController.createEmployee);
router.get('/', authorize('admin', 'super_admin'), employeeController.getEmployees);
router.get('/:id', idParamValidator, validate, employeeController.getEmployeeById);
router.put('/:id', authorize('admin', 'super_admin'), updateEmployeeValidator, validate, employeeController.updateEmployee);
router.delete('/:id', authorize('super_admin'), idParamValidator, validate, employeeController.deleteEmployee);
router.patch('/:id/status', authorize('admin', 'super_admin'), idParamValidator, validate, employeeController.toggleEmployeeStatus);

// QR code (employees can view their own; admins can view/rotate any)
router.get('/:id/qrcode', idParamValidator, validate, employeeController.getEmployeeQrCode);
router.post('/:id/qrcode/rotate', authorize('admin', 'super_admin'), idParamValidator, validate, employeeController.rotateEmployeeQrCode);

// Profile photo
router.post('/:id/photo', idParamValidator, validate, uploadProfilePhoto.single('photo'), employeeController.uploadProfilePhoto);

module.exports = router;
