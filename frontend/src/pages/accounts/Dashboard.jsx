import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';

const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;

export default function AccountsDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vouchers/dashboard/accounts')
      .then(({ data }) => setStats(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">Accounts Dashboard</h1>
        <Link to="/accounts/vouchers" className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg">
          View All Vouchers
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Vouchers" value={stats.totalVouchers} />
        <StatCard label="Pending Approval" value={stats.pendingApproval} tone="amber" />
        <StatCard label="Approved" value={stats.approvedVouchers} tone="emerald" />
        <StatCard label="Rejected" value={stats.rejectedVouchers} tone="red" />
        <StatCard label="Total Approved Expense Amount" value={currency(stats.totalApprovedExpenseAmount)} tone="brand" />
      </div>

      <h2 className="text-sm font-semibold mb-2">Recent Approved Vouchers</h2>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Voucher #</th>
              <th className="px-4 py-2">Employee</th>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Approved On</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {stats.recentApprovedVouchers.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="px-4 py-2 font-medium">{v.voucher_number}</td>
                <td className="px-4 py-2">{v.employee_name}</td>
                <td className="px-4 py-2">{v.expense_title}</td>
                <td className="px-4 py-2">{currency(v.amount)}</td>
                <td className="px-4 py-2">{v.approval_date?.slice(0, 10)}</td>
                <td className="px-4 py-2">
                  <Link to={`/vouchers/${v.id}`} className="text-brand-600 hover:underline">View</Link>
                </td>
              </tr>
            ))}
            {stats.recentApprovedVouchers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-4 text-slate-400 text-center">No approved vouchers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
