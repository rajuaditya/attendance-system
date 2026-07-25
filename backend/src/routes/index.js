const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/employees', require('./employee.routes'));
router.use('/attendance', require('./attendance.routes'));
router.use('/qr', require('./qr.routes'));
router.use('/dashboard', require('./dashboard.routes'));
router.use('/reports', require('./report.routes'));
router.use('/meta', require('./department.routes'));

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy', timestamp: new Date() }));

module.exports = router;
