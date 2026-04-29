const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);
router.get('/daily', authorize('GURU', 'ADMIN', 'KEPALA_SEKOLAH'), ctrl.daily);
router.get('/monthly', authorize('GURU', 'ADMIN', 'KEPALA_SEKOLAH'), ctrl.monthly);
router.get('/student/:id', authorize('GURU', 'ADMIN', 'KEPALA_SEKOLAH'), ctrl.studentReport);
router.get('/dashboard', ctrl.dashboard);

module.exports = router;
