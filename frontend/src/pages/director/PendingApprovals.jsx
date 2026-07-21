import { useEffect, useState } from 'react';
import api from '../../api/axios';
import VoucherTable from '../../components/VoucherTable';

export default function PendingApprovals() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vouchers/pending')
      .then(({ data }) => setVouchers(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-slate-500">Loading…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h1 className="text-lg font-semibold mb-4">Pending Approvals</h1>
      <VoucherTable vouchers={vouchers} emptyText="No vouchers awaiting approval." />
    </div>
  );
}
