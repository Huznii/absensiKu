const router = require('express').Router();
const { generateQR, scanQR, manualAttendance, bulkAttendance, getToday, getHistory } = require('../controllers/attendance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);
router.post('/qr/generate', authorize('GURU', 'ADMIN'), generateQR);
router.post('/qr/scan', authorize('SISWA'), scanQR);
router.post('/manual', authorize('GURU', 'ADMIN'), manualAttendance);
router.post('/bulk', authorize('GURU', 'ADMIN'), bulkAttendance);
router.get('/today', getToday);
router.get('/history/:studentId', getHistory);

module.exports = router;
