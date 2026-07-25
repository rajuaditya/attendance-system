const router = require('express').Router();
const deptController = require('../controllers/department.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

router.use(authenticate);

// Any authenticated user can list (needed for dropdowns); only admins can mutate
router.get('/departments', deptController.getDepartments);
router.post('/departments', authorize('admin', 'super_admin'), deptController.createDepartment);
router.put('/departments/:id', authorize('admin', 'super_admin'), deptController.updateDepartment);
router.delete('/departments/:id', authorize('super_admin'), deptController.deleteDepartment);

router.get('/designations', deptController.getDesignations);
router.post('/designations', authorize('admin', 'super_admin'), deptController.createDesignation);
router.put('/designations/:id', authorize('admin', 'super_admin'), deptController.updateDesignation);
router.delete('/designations/:id', authorize('super_admin'), deptController.deleteDesignation);

module.exports = router;
