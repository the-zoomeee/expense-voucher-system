import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';

const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;

export default function EmployeeDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/vouchers/dashboard/employee')
      .then(({ data }) => setStats(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!stats) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">My Dashboard</h1>
        <Link to="/employee/vouchers/new" className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg">
          + New Voucher
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Vouchers" value={stats.totalVouchers} />
        <StatCard label="Draft" value={stats.draftVouchers} />
        <StatCard label="Pending Approval" value={stats.pendingApproval} tone="amber" />
        <StatCard label="Approved" value={stats.approvedVouchers} tone="emerald" />
        <StatCard label="Rejected" value={stats.rejectedVouchers} tone="red" />
        <StatCard label="Total Amount Claimed" value={currency(stats.totalAmountClaimed)} tone="brand" />
      </div>

      <Link to="/employee/vouchers" className="text-brand-600 hover:underline text-sm">
        View all my vouchers →
      </Link>
    </div>
  );
}
