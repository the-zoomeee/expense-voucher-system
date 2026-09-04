import { useEffect, useState } from 'react';
import api from '../../api/axios';
import VoucherTable from '../../components/VoucherTable';
import VoucherFilters from '../../components/VoucherFilters';
import Pagination from '../../components/Pagination';

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

  useEffect(() => { load(1); }, [filters]);

  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">All Vouchers</h1>
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
