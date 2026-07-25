const router = require('express').Router();
const qrController = require('../controllers/qr.controller');
const authenticate = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');
const validate = require('../middleware/validate.middleware');
const { qrScanLimiter } = require('../middleware/rateLimiter');
const { qrScanValidator } = require('../validators/attendance.validator');

router.use(authenticate);

// Any authenticated device/kiosk account can submit a scan (in this system,
// employees scan their own QR at a kiosk logged in as an admin, or self-scan)
router.post('/scan', qrScanLimiter, qrScanValidator, validate, qrController.scanQr);
router.get('/scan-logs', authorize('admin', 'super_admin'), qrController.getScanLogs);

module.exports = router;
