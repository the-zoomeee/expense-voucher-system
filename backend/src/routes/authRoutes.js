const express = require('express');
const { login, getMe, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/password', authenticate, changePassword);

module.exports = router;