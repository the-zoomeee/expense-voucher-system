import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import VoucherFilters from '../../components/VoucherFilters';
import Pagination from '../../components/Pagination';
import { useToast } from '../../context/ToastContext';

export default function MyVouchers() {
  const toast = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load(page = 1) {
    setLoading(true);
    try {
      const { data } = await api.get('/vouchers/mine', { params: { ...filters, page, pageSize: 10 } });

      // handles both the paginated shape ({items, pagination}) and a plain
      // array, in case backend/frontend ever drift out of sync again
      const payload = data.data;
      if (Array.isArray(payload)) {
        setVouchers(payload);
        setPagination({ page: 1, totalPages: 1 });
      } else {
        setVouchers(payload?.items || []);
        setPagination(payload?.pagination || { page: 1, totalPages: 1 });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vouchers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(1); }, [filters]);

  async function handleSubmit(id) {
    setBusyId(id);
    try {
      await api.post(`/vouchers/${id}/submit`);
      await load(pagination.page);
      toast.success('Voucher submitted for approval.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not submit voucher.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this draft voucher?')) return;
    setBusyId(id);
    try {
      await api.delete(`/vouchers/${id}`);
      await load(pagination.page);
      toast.success('Voucher deleted.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete voucher.');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">My Vouchers</h1>
        <Link to="/employee/vouchers/new" className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg">
          + New Voucher
        </Link>
      </div>

      <VoucherFilters
        filters={filters}
        onChange={setFilters}
        statusOptions={['draft', 'pending', 'approved', 'rejected']}
      />

      {loading ? <p className="text-slate-500">Loading vouchers…</p> : error ? (
        <p className="text-red-600">{error}</p>
      ) : vouchers.length === 0 ? (
        <p className="text-slate-500 text-sm">No vouchers match your filters.</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-2">Voucher #</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {vouchers.map((v) => (
                  <tr key={v.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{v.voucher_number}</td>
                    <td className="px-4 py-2">{v.expense_title}</td>
                    <td className="px-4 py-2">₹{Number(v.amount).toFixed(2)}</td>
                    <td className="px-4 py-2"><StatusBadge status={v.status} /></td>
                    <td className="px-4 py-2 space-x-3">
                      <Link to={`/vouchers/${v.id}`} className="text-brand-600 hover:underline">View</Link>
                      {v.status === 'draft' && (
                        <>
                          <Link to={`/employee/vouchers/${v.id}/edit`} className="text-brand-600 hover:underline">Edit</Link>
                          <button
                            disabled={busyId === v.id}
                            onClick={() => handleSubmit(v.id)}
                            className="text-emerald-600 hover:underline disabled:opacity-50"
                          >
                            Submit
                          </button>
                          <button
                            disabled={busyId === v.id}
                            onClick={() => handleDelete(v.id)}
                            className="text-red-600 hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={pagination.page} totalPages={pagination.totalPages} onChange={load} />
        </>
      )}
    </div>
  );
}