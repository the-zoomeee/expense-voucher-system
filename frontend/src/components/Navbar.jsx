import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleHome = {
  employee: '/employee/dashboard',
  director: '/director/dashboard',
  accounts: '/accounts/dashboard',
  hr: '/hr/dashboard',
};

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

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
        {user.role === 'hr' && (
          <>
            <Link to="/hr/dashboard" className="hover:underline">Dashboard</Link>
            <Link to="/hr/employees" className="hover:underline">Employees</Link>
          </>
        )}
        <Link
          to="/profile"
          className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-full hover:bg-brand-600 transition-colors"
        >
          <span className="h-8 w-8 rounded-full bg-white text-brand-700 flex items-center justify-center text-xs font-semibold shrink-0">
            {initials(user.name)}
          </span>
          <span className="leading-tight text-left">
            <span className="block text-sm font-medium">{user.name}</span>
            <span className="block text-xs opacity-75 capitalize">{user.role}</span>
          </span>
        </Link>
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