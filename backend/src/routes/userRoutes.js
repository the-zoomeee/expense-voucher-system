const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/userController');

const router = express.Router();

router.use(authenticate, authorize('hr'));

router.post('/', ctrl.createUser);
router.get('/', ctrl.listUsers);
router.get('/role-counts', ctrl.getRoleCounts);
router.put('/:id', ctrl.updateUser);
router.patch('/:id/status', ctrl.setUserActive);
router.patch('/:id/password', ctrl.resetPassword);

module.exports = router;