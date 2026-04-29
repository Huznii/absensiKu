const router = require('express').Router();
const ctrl = require('../controllers/teacher.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.use(authenticate);
router.get('/', authorize('ADMIN', 'KEPALA_SEKOLAH'), ctrl.getAll);
router.get('/:id', authorize('ADMIN', 'KEPALA_SEKOLAH'), ctrl.getById);
router.post('/', authorize('ADMIN'), ctrl.create);
router.put('/:id', authorize('ADMIN'), ctrl.update);
router.delete('/:id', authorize('ADMIN'), ctrl.remove);

module.exports = router;
