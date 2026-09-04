const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

const VALID_ROLES = ['employee', 'director', 'accounts', 'hr'];
const SAFE_COLUMNS = 'id, name, email, role, is_active, employee_code, department_name, created_at';

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, departmentName, employeeCode } = req.body;

  if (!name || !email || !password || !role) {
    throw new AppError('name, email, password, and role are required.', 400);
  }
  if (!VALID_ROLES.includes(role)) {
    throw new AppError(`Role must be one of: ${VALID_ROLES.join(', ')}.`, 400);
  }
  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400);
  }

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length) {
    throw new AppError('A user with this email already exists.', 409);
  }

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    `INSERT INTO users (name, email, password_hash, role, employee_code, department_name)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name.trim(), email.trim(), hash, role, employeeCode || null, departmentName || null]
  );

  const [rows] = await pool.query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`, [result.insertId]);
  return success(res, 201, 'Employee registered.', rows[0]);
});

const listUsers = asyncHandler(async (req, res) => {
  const { role, search, status } = req.query;
  const clauses = [];
  const params = [];

  if (role) {
    clauses.push('role = ?');
    params.push(role);
  }
  if (status === 'active') clauses.push('is_active = 1');
  if (status === 'inactive') clauses.push('is_active = 0');
  if (search) {
    clauses.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT ${SAFE_COLUMNS} FROM users ${whereSql} ORDER BY created_at DESC`,
    params
  );
  return success(res, 200, 'Users fetched.', rows);
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, departmentName, employeeCode } = req.body;
  if (!name || !name.trim()) {
    throw new AppError('Name is required.', 400);
  }

  const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!rows[0]) throw new AppError('User not found.', 404);

  await pool.query(
    `UPDATE users SET name = ?, department_name = ?, employee_code = ? WHERE id = ?`,
    [name.trim(), departmentName || null, employeeCode || null, req.params.id]
  );

  const [updated] = await pool.query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`, [req.params.id]);
  return success(res, 200, 'User updated.', updated[0]);
});

const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  if (typeof isActive !== 'boolean') {
    throw new AppError('isActive must be true or false.', 400);
  }
  if (Number(req.params.id) === req.user.id) {
    throw new AppError('You cannot deactivate your own account.', 400);
  }

  const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!rows[0]) throw new AppError('User not found.', 404);

  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, req.params.id]);

  const [updated] = await pool.query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`, [req.params.id]);
  return success(res, 200, isActive ? 'User reactivated.' : 'User deactivated.', updated[0]);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters.', 400);
  }

  const [rows] = await pool.query('SELECT id FROM users WHERE id = ?', [req.params.id]);
  if (!rows[0]) throw new AppError('User not found.', 404);

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);

  return success(res, 200, 'Password reset. Share the new password with the employee securely.');
});

module.exports = { createUser, listUsers, updateUser, setUserActive, resetPassword };