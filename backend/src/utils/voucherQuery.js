// shared by getAllVouchers + getMyVouchers
const SORTABLE_COLUMNS = {
  created_at: 'v.created_at',
  voucher_date: 'v.voucher_date',
  expense_date: 'v.expense_date',
  amount: 'v.amount',
  voucher_number: 'v.voucher_number',
  status: 'v.status',
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function buildVoucherFilters(query) {
  const {
    search, department, category, status,
    dateFrom, dateTo, amountMin, amountMax,
    sortBy, sortOrder, page, pageSize,
  } = query;

  const clauses = [];
  const params = [];

  if (search) {
    clauses.push('(v.voucher_number LIKE ? OR u.name LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }
  if (department) {
    clauses.push('v.department_name LIKE ?');
    params.push(`%${department}%`);
  }
  if (category) {
    clauses.push('v.expense_category = ?');
    params.push(category);
  }
  if (status) {
    clauses.push('v.status = ?');
    params.push(status);
  }
  if (dateFrom) {
    clauses.push('v.expense_date >= ?');
    params.push(dateFrom);
  }
  if (dateTo) {
    clauses.push('v.expense_date <= ?');
    params.push(dateTo);
  }
  if (amountMin) {
    clauses.push('v.amount >= ?');
    params.push(amountMin);
  }
  if (amountMax) {
    clauses.push('v.amount <= ?');
    params.push(amountMax);
  }

  const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

  const column = SORTABLE_COLUMNS[sortBy] || 'v.created_at';
  const direction = String(sortOrder).toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const orderSql = `ORDER BY ${column} ${direction}`;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const sizeNum = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSize, 10) || DEFAULT_PAGE_SIZE));
  const offset = (pageNum - 1) * sizeNum;
  const limitSql = `LIMIT ${sizeNum} OFFSET ${offset}`;

  return { whereSql, params, orderSql, limitSql, page: pageNum, pageSize: sizeNum };
}

module.exports = { buildVoucherFilters };