import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import VoucherDetails from './pages/VoucherDetails';

import EmployeeDashboard from './pages/employee/Dashboard';
import MyVouchers from './pages/employee/MyVouchers';
import VoucherForm from './pages/employee/VoucherForm';

import DirectorDashboard from './pages/director/Dashboard';
import PendingApprovals from './pages/director/PendingApprovals';
import DirectorAllVouchers from './pages/director/AllVouchers';

import AccountsDashboard from './pages/accounts/Dashboard';
import AccountsAllVouchers from './pages/accounts/AllVouchers';

const roleHome = {
  employee: '/employee/dashboard',
  director: '/director/dashboard',
  accounts: '/accounts/dashboard',
};

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome[user.role]} replace />;
}

export default function App() {
  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />

          {/* Employee */}
          <Route path="/employee/dashboard" element={
            <ProtectedRoute roles={['employee']}><EmployeeDashboard /></ProtectedRoute>
          } />
          <Route path="/employee/vouchers" element={
            <ProtectedRoute roles={['employee']}><MyVouchers /></ProtectedRoute>
          } />
          <Route path="/employee/vouchers/new" element={
            <ProtectedRoute roles={['employee']}><VoucherForm mode="create" /></ProtectedRoute>
          } />
          <Route path="/employee/vouchers/:id/edit" element={
            <ProtectedRoute roles={['employee']}><VoucherForm mode="edit" /></ProtectedRoute>
          } />

          {/* Director */}
          <Route path="/director/dashboard" element={
            <ProtectedRoute roles={['director']}><DirectorDashboard /></ProtectedRoute>
          } />
          <Route path="/director/pending" element={
            <ProtectedRoute roles={['director']}><PendingApprovals /></ProtectedRoute>
          } />
          <Route path="/director/all" element={
            <ProtectedRoute roles={['director']}><DirectorAllVouchers /></ProtectedRoute>
          } />

          {/* Accounts */}
          <Route path="/accounts/dashboard" element={
            <ProtectedRoute roles={['accounts']}><AccountsDashboard /></ProtectedRoute>
          } />
          <Route path="/accounts/vouchers" element={
            <ProtectedRoute roles={['accounts']}><AccountsAllVouchers /></ProtectedRoute>
          } />

          {/* Shared voucher details, access-checked by the backend */}
          <Route path="/vouchers/:id" element={
            <ProtectedRoute><VoucherDetails /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
