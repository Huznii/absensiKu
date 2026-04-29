const router = require('express').Router();
const { login, getMe, changePassword, resetPassword } = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.put('/change-password', authenticate, changePassword);
router.post('/reset-password', authenticate, authorize('ADMIN'), resetPassword);

module.exports = router;
