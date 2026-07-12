const pool = require('../config/db');

// VCH-2026-0007 style numbering
async function generateVoucherNumber() {
  const year = new Date().getFullYear();
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count FROM vouchers WHERE YEAR(created_at) = ?`,
    [year]
  );
  const nextSeq = rows[0].count + 1;
  return `VCH-${year}-${String(nextSeq).padStart(4, '0')}`;
}

module.exports = { generateVoucherNumber };
