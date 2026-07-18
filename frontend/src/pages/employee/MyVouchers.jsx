import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';
import VoucherFilters from '../../components/VoucherFilters';

export default function MyVouchers() {
  const [vouchers, setVouchers] = useState([]);
  const [filters, setFilters] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/vouchers/mine', { params: filters });
      setVouchers(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load vouchers.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [filters]);

  async function handleSubmit(id) {
    setBusyId(id);
    try {
      await api.post(`/vouchers/${id}/submit`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not submit voucher.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this draft voucher?')) return;
    setBusyId(id);
    try {
      await api.delete(`/vouchers/${id}`);
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete voucher.');
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
      )}
    </div>
  );
}
