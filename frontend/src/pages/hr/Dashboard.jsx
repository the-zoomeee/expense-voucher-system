import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import StatCard from '../../components/StatCard';

export default function HrDashboard() {
  const [users, setUsers] = useState(null);
  const [roleCounts, setRoleCounts] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/users/role-counts'),
    ])
      .then(([usersRes, countsRes]) => {
        setUsers(usersRes.data.data);
        setRoleCounts(countsRes.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load dashboard.'));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!users || !roleCounts) return <p className="text-slate-500">Loading…</p>;

  const total = users.length;
  const active = users.filter((u) => u.is_active).length;
  const inactive = total - active;
  const byRole = { employee: 0, accounts: 0 };
  users.forEach((u) => { byRole[u.role] = (byRole[u.role] || 0) + 1; });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold">HR Dashboard</h1>
        <Link to="/hr/employees" className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg">
          Manage Employees
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Managed Users" value={total} />
        <StatCard label="Active" value={active} tone="emerald" />
        <StatCard label="Inactive" value={inactive} tone="red" />
        <StatCard label="Employees" value={byRole.employee} tone="brand" />
        <StatCard label="Accounts" value={byRole.accounts} tone="brand" />
        <StatCard label="HR Staff" value={roleCounts.hr} tone="brand" />
      </div>

      <Link to="/hr/employees" className="text-brand-600 hover:underline text-sm">
        View and manage all employees →
      </Link>
    </div>
  );
}