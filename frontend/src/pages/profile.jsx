import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function initials(name) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function Profile() {
  const { user } = useAuth();
  const toast = useToast();

  const [me, setMe] = useState(null);
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwError, setPwError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setMe(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile.'));
  }, []);

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError('');

    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/auth/password', { currentPassword, newPassword });
      toast.success('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPwError(err.response?.data?.message || 'Could not update password.');
    } finally {
      setSaving(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!me) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="max-w-lg space-y-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-full bg-brand-600 text-white flex items-center justify-center text-lg font-semibold shrink-0">
            {initials(user.name)}
          </div>
          <div>
            <h1 className="text-lg font-semibold">{me.name}</h1>
            <p className="text-sm text-slate-500 capitalize">{me.role}</p>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-xs text-slate-400">Email</dt>
            <dd className="font-medium">{me.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Department</dt>
            <dd className="font-medium">{me.department_name || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-400">Employee Code</dt>
            <dd className="font-medium">{me.employee_code || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-sm font-semibold mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Current Password</label>
            <input
              type="password" required value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">New Password</label>
            <input
              type="password" required value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="min. 6 characters"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirm New Password</label>
            <input
              type="password" required value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          {pwError && <p className="text-sm text-red-600">{pwError}</p>}

          <button
            type="submit" disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
}