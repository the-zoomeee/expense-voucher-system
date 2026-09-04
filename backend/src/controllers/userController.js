const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// HR can only create/edit/deactivate/reset-password for these roles.
// Director and HR accounts are managed some other way (direct DB access,
// a future super-admin role, etc.) — not through this panel.
const MANAGEABLE_ROLES = ['employee', 'accounts'];
const SAFE_COLUMNS = 'id, name, email, role, is_active, employee_code, department_name, created_at';

async function findManageableUserOr403(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  const user = rows[0];
  if (!user) throw new AppError('User not found.', 404);
  if (!MANAGEABLE_ROLES.includes(user.role)) {
    throw new AppError('HR cannot modify Director or HR accounts.', 403);
  }
  return user;
}

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, departmentName, employeeCode } = req.body;

  if (!name || !email || !password || !role) {
    throw new AppError('name, email, password, and role are required.', 400);
  }
  if (!MANAGEABLE_ROLES.includes(role)) {
    throw new AppError(`HR can only register: ${MANAGEABLE_ROLES.join(', ')}.`, 403);
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
  // regardless of what's asked for, HR only ever sees employee/accounts users
  const clauses = ['role IN (?)'];
  const params = [MANAGEABLE_ROLES];

  if (role && MANAGEABLE_ROLES.includes(role)) {
    clauses.push('role = ?');
    params.push(role);
  }
  if (status === 'active') clauses.push('is_active = 1');
  if (status === 'inactive') clauses.push('is_active = 0');
  if (search) {
    clauses.push('(name LIKE ? OR email LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereSql = `WHERE ${clauses.join(' AND ')}`;
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

  await findManageableUserOr403(req.params.id);

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

  await findManageableUserOr403(req.params.id);

  await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, req.params.id]);

  const [updated] = await pool.query(`SELECT ${SAFE_COLUMNS} FROM users WHERE id = ?`, [req.params.id]);
  return success(res, 200, isActive ? 'User reactivated.' : 'User deactivated.', updated[0]);
});

const resetPassword = asyncHandler(async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new AppError('New password must be at least 6 characters.', 400);
  }

  await findManageableUserOr403(req.params.id);

  const hash = await bcrypt.hash(newPassword, 10);
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id]);

  return success(res, 200, 'Password reset. Share the new password with the employee securely.');
});

const getRoleCounts = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT role, COUNT(*) AS count FROM users WHERE role IN ('director', 'hr') GROUP BY role`
  );
  const counts = { director: 0, hr: 0 };
  rows.forEach((r) => { counts[r.role] = r.count; });
  return success(res, 200, 'Role counts fetched.', counts);
});

module.exports = { createUser, listUsers, updateUser, setUserActive, resetPassword, getRoleCounts };