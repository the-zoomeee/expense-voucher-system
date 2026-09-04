const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400);
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];

  if (!user) {
    throw new AppError('Invalid email or password.', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401);
  }

  if (!user.is_active) {
    throw new AppError('Your account has been deactivated. Contact HR.', 403);
  }

  const token = signToken(user);

  return success(res, 200, 'Login successful.', {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentName: user.department_name,
    },
  });
});

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, department_name, employee_code FROM users WHERE id = ?',
    [req.user.id]
  );
  if (!rows[0]) throw new AppError('User not found.', 404);
  return success(res, 200, 'Current user fetched.', rows[0]);
});

module.exports = { login, getMe };