const pool = require('../config/db');
const { success } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { generateVoucherNumber } = require('../utils/voucherNumber');
const { buildVoucherFilters } = require('../utils/voucherQuery');

const REQUIRED_FIELDS = [
  'departmentName',
  'expenseTitle',
  'expenseDate',
  'expenseCategory',
  'amount',
];

function validateVoucherFields(body) {
  const missing = REQUIRED_FIELDS.filter((f) => !body[f] || String(body[f]).trim() === '');
  if (missing.length) {
    throw new AppError(`Missing required field(s): ${missing.join(', ')}.`, 400);
  }
  if (Number(body.amount) <= 0) {
    throw new AppError('Amount must be greater than zero.', 400);
  }
}

function relativePath(file) {
  return file ? `/uploads/signatures/${file.filename}` : null;
}

async function findVoucherOr404(id) {
  const [rows] = await pool.query('SELECT * FROM vouchers WHERE id = ?', [id]);
  if (!rows[0]) throw new AppError('Voucher not found.', 404);
  return rows[0];
}

function assertCanView(voucher, user) {
  if (user.role === 'employee' && voucher.employee_id !== user.id) {
    throw new AppError('You can only view vouchers you created.', 403);
  }
}

// always created as draft
const createVoucher = asyncHandler(async (req, res) => {
  validateVoucherFields(req.body);
  const {
    voucherDate, expenseDate, departmentName, expenseTitle,
    expenseCategory, expenseDescription, amount,
  } = req.body;

  const voucherNumber = await generateVoucherNumber();
  const signaturePath = relativePath(req.file);

  const [result] = await pool.query(
    `INSERT INTO vouchers
      (voucher_number, voucher_date, expense_date, department_name, expense_title,
       expense_category, expense_description, amount, employee_id, employee_signature_path, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
    [
      voucherNumber,
      voucherDate || new Date().toISOString().slice(0, 10),
      expenseDate,
      departmentName,
      expenseTitle,
      expenseCategory,
      expenseDescription || null,
      amount,
      req.user.id,
      signaturePath,
    ]
  );

  const voucher = await findVoucherOr404(result.insertId);
  return success(res, 201, 'Voucher saved as draft.', voucher);
});

const updateVoucher = asyncHandler(async (req, res) => {
  const voucher = await findVoucherOr404(req.params.id);

  if (voucher.employee_id !== req.user.id) {
    throw new AppError('You can only edit vouchers you created.', 403);
  }
  if (voucher.status !== 'draft') {
    throw new AppError('Only draft vouchers can be edited.', 400);
  }

  validateVoucherFields(req.body);
  const {
    voucherDate, expenseDate, departmentName, expenseTitle,
    expenseCategory, expenseDescription, amount,
  } = req.body;

  const signaturePath = req.file ? relativePath(req.file) : voucher.employee_signature_path;

  await pool.query(
    `UPDATE vouchers SET
      voucher_date = ?, expense_date = ?, department_name = ?, expense_title = ?,
      expense_category = ?, expense_description = ?, amount = ?, employee_signature_path = ?
     WHERE id = ?`,
    [
      voucherDate || voucher.voucher_date,
      expenseDate,
      departmentName,
      expenseTitle,
      expenseCategory,
      expenseDescription || null,
      amount,
      signaturePath,
      voucher.id,
    ]
  );

  const updated = await findVoucherOr404(voucher.id);
  return success(res, 200, 'Voucher updated.', updated);
});

const deleteVoucher = asyncHandler(async (req, res) => {
  const voucher = await findVoucherOr404(req.params.id);

  if (voucher.employee_id !== req.user.id) {
    throw new AppError('You can only delete vouchers you created.', 403);
  }
  if (voucher.status !== 'draft') {
    throw new AppError('Only draft vouchers can be deleted.', 400);
  }

  await pool.query('DELETE FROM vouchers WHERE id = ?', [voucher.id]);
  return success(res, 200, 'Voucher deleted.');
});

const submitVoucher = asyncHandler(async (req, res) => {
  const voucher = await findVoucherOr404(req.params.id);

  if (voucher.employee_id !== req.user.id) {
    throw new AppError('You can only submit vouchers you created.', 403);
  }
  if (voucher.status !== 'draft') {
    throw new AppError('Only draft vouchers can be submitted.', 400);
  }
  if (!voucher.employee_signature_path) {
    throw new AppError('Employee signature is mandatory before submission.', 400);
  }

  await pool.query(`UPDATE vouchers SET status = 'pending' WHERE id = ?`, [voucher.id]);
  const updated = await findVoucherOr404(voucher.id);
  return success(res, 200, 'Voucher submitted for approval.', updated);
});

const getMyVouchers = asyncHandler(async (req, res) => {
  const { whereSql, params, orderSql } = buildVoucherFilters(req.query);
  const scopedWhere = whereSql
    ? `${whereSql} AND v.employee_id = ?`
    : 'WHERE v.employee_id = ?';

  const [rows] = await pool.query(
    `SELECT v.*, u.name AS employee_name
     FROM vouchers v JOIN users u ON u.id = v.employee_id
     ${scopedWhere} ${orderSql}`,
    [...params, req.user.id]
  );
  return success(res, 200, 'Your vouchers fetched.', rows);
});

const getAllVouchers = asyncHandler(async (req, res) => {
  const { whereSql, params, orderSql } = buildVoucherFilters(req.query);

  const [rows] = await pool.query(
    `SELECT v.*, u.name AS employee_name
     FROM vouchers v JOIN users u ON u.id = v.employee_id
     ${whereSql} ${orderSql}`,
    params
  );
  return success(res, 200, 'Vouchers fetched.', rows);
});

const getPendingVouchers = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT v.*, u.name AS employee_name
     FROM vouchers v JOIN users u ON u.id = v.employee_id
     WHERE v.status = 'pending' ORDER BY v.created_at ASC`
  );
  return success(res, 200, 'Pending approvals fetched.', rows);
});

const getVoucherById = asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT v.*, u.name AS employee_name, u.department_name AS employee_department,
            d.name AS director_name
     FROM vouchers v
     JOIN users u ON u.id = v.employee_id
     LEFT JOIN users d ON d.id = v.director_id
     WHERE v.id = ?`,
    [req.params.id]
  );
  const voucher = rows[0];
  if (!voucher) throw new AppError('Voucher not found.', 404);

  assertCanView(voucher, req.user);
  return success(res, 200, 'Voucher fetched.', voucher);
});

const approveVoucher = asyncHandler(async (req, res) => {
  const voucher = await findVoucherOr404(req.params.id);

  if (voucher.status !== 'pending') {
    throw new AppError('Only vouchers pending approval can be approved.', 400);
  }
  if (!req.file) {
    throw new AppError('Director signature is mandatory before approval.', 400);
  }

  const signaturePath = relativePath(req.file);
  await pool.query(
    `UPDATE vouchers SET
      status = 'approved', director_id = ?, director_signature_path = ?,
      approval_date = NOW(), rejection_reason = NULL
     WHERE id = ?`,
    [req.user.id, signaturePath, voucher.id]
  );

  const updated = await findVoucherOr404(voucher.id);
  return success(res, 200, 'Voucher approved.', updated);
});

const rejectVoucher = asyncHandler(async (req, res) => {
  const voucher = await findVoucherOr404(req.params.id);
  const { rejectionReason } = req.body;

  if (voucher.status !== 'pending') {
    throw new AppError('Only vouchers pending approval can be rejected.', 400);
  }
  if (!rejectionReason || !rejectionReason.trim()) {
    throw new AppError('A rejection reason is required.', 400);
  }

  await pool.query(
    `UPDATE vouchers SET
      status = 'rejected', director_id = ?, rejection_reason = ?, approval_date = NOW()
     WHERE id = ?`,
    [req.user.id, rejectionReason.trim(), voucher.id]
  );

  const updated = await findVoucherOr404(voucher.id);
  return success(res, 200, 'Voucher rejected.', updated);
});

module.exports = {
  createVoucher,
  updateVoucher,
  deleteVoucher,
  submitVoucher,
  getMyVouchers,
  getAllVouchers,
  getPendingVouchers,
  getVoucherById,
  approveVoucher,
  rejectVoucher,
};
