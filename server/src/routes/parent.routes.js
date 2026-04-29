const router = require('express').Router();
const ctrl = require('../controllers/parent.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);
router.use(authorize('ORANG_TUA'));
router.get('/children', ctrl.getChildren);
router.get('/children/:childId/attendance', ctrl.getChildAttendance);

module.exports = router;
