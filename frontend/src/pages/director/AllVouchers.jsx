import { useEffect, useState } from 'react';
import api from '../../api/axios';
import VoucherTable from '../../components/VoucherTable';
import VoucherFilters from '../../components/VoucherFilters';
import Pagination from '../../components/Pagination';
import Papa from 'papaparse';

export default function DirectorAllVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load(page = 1) {
    setLoading(true);
    api.get('/vouchers', { params: { ...filters, page, pageSize: 10 } })
      .then(({ data }) => {
        setVouchers(data.data.items);
        setPagination(data.data.pagination);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }

  async function handleExport() {
    const { data } = await api.get('/vouchers', { params: { ...filters, page: 1, pageSize: 1000 } });
    const rows = data.data.items.map((v) => ({
      'Voucher #': v.voucher_number,
      'Employee': v.employee_name,
      'Department': v.department_name,
      'Title': v.expense_title,
      'Category': v.expense_category,
      'Expense Date': v.expense_date?.slice(0, 10),
      'Amount': v.amount,
      'Status': v.status,
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vouchers-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => { load(1); }, [filters]);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">All Vouchers</h1>
        <button
          onClick={handleExport}
          className="border border-brand-600 text-brand-600 hover:bg-brand-50 text-sm px-4 py-1.5 rounded-lg"
        >
          Export CSV
        </button>
      </div>
      <VoucherFilters
        filters={filters}
        onChange={setFilters}
        statusOptions={['draft', 'pending', 'approved', 'rejected']}
      />
      {loading ? <p className="text-slate-500">Loading…</p> : (
        <VoucherTable vouchers={vouchers} emptyText="No vouchers match your filters." />
      )}
      <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={load} />
    </div>
  );
}
