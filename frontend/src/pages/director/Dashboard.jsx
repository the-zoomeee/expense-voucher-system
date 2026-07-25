import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';

const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;

export default function DirectorDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vouchers/dashboard/director')
      .then(({ data }) => setStats(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Director Dashboard</h1>
        <Link to="/director/pending" className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg">
          Review Pending
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending Approval" value={stats.pendingApprovalCount} tone="amber" />
        <StatCard label="Approved Today" value={stats.approvedToday} tone="emerald" />
        <StatCard label="Rejected Today" value={stats.rejectedToday} tone="red" />
        <StatCard label="Total Pending Amount" value={currency(stats.totalPendingAmount)} tone="brand" />
      </div>

      <h2 className="text-sm font-semibold mb-2">Recent Voucher Activity</h2>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Voucher #</th>
              <th className="px-4 py-2">Employee</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {stats.recentActivity.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-2 font-medium">{v.voucher_number}</td>
                <td className="px-4 py-2">{v.employee_name}</td>
                <td className="px-4 py-2">{v.expense_title}</td>
                <td className="px-4 py-2">{currency(v.amount)}</td>
                <td className="px-4 py-2"><StatusBadge status={v.status} /></td>
                <td className="px-4 py-2">
                  <Link to={`/vouchers/${v.id}`} className="text-brand-600 hover:underline">View</Link>
                </td>
              </tr>
            ))}
            {stats.recentActivity.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-4 text-slate-400 text-center">No activity yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
