import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import VoucherDetails from './pages/VoucherDetails';
import MyVouchers from './pages/employee/MyVouchers';
import VoucherForm from './pages/employee/VoucherForm';

const roleHome = {
  employee: '/employee/vouchers',
};

function Home() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={roleHome[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <div>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />

          <Route path="/employee/vouchers" element={
            <ProtectedRoute roles={['employee']}><MyVouchers /></ProtectedRoute>
          } />
          <Route path="/employee/vouchers/new" element={
            <ProtectedRoute roles={['employee']}><VoucherForm mode="create" /></ProtectedRoute>
          } />
          <Route path="/employee/vouchers/:id/edit" element={
            <ProtectedRoute roles={['employee']}><VoucherForm mode="edit" /></ProtectedRoute>
          } />

          <Route path="/vouchers/:id" element={
            <ProtectedRoute><VoucherDetails /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
