import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = {
  employee: '/employee/dashboard',
  director: '/director/dashboard',
  accounts: '/accounts/dashboard',
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="no-print bg-brand-700 text-white px-4 py-3 flex items-center justify-between shadow">
      <Link to={roleHome[user.role]} className="font-semibold tracking-tight">
        Expense Voucher System
      </Link>
      <div className="flex items-center gap-4 text-sm">
        {user.role === 'employee' && (
          <>
            <Link to="/employee/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/employee/vouchers" className="hover:underline">My Vouchers</Link>
            <Link to="/employee/vouchers/new" className="hover:underline">+ New Voucher</Link>
          </>
        )}
        {user.role === 'director' && (
          <>
            <Link to="/director/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/director/pending" className="hover:underline">Pending</Link>
            <Link to="/director/all" className="hover:underline">All Vouchers</Link>
          </>
        )}
        {user.role === 'accounts' && (
          <>
            <Link to="/accounts/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/accounts/vouchers" className="hover:underline">All Vouchers</Link>
          </>
        )}
        <span className="opacity-80">{user.name} ({user.role})</span>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          className="bg-brand-600 hover:bg-brand-500 px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
