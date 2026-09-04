import { useEffect, useState } from 'react';
import api from '../../api/axios';

const ROLES = ['employee', 'director', 'accounts', 'hr'];

const emptyForm = {
    name: '', email: '', password: '', role: 'employee',
    departmentName: '', employeeCode: '',
};

export default function Employees() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState({ role: '', search: '', status: '' });

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', departmentName: '', employeeCode: '' });

    function load() {
        setLoading(true);
        const params = {};
        if (filters.role) params.role = filters.role;
        if (filters.search) params.search = filters.search;
        if (filters.status) params.status = filters.status;

        api.get('/users', { params })
            .then(({ data }) => setUsers(data.data))
            .catch((err) => setError(err.response?.data?.message || 'Failed to load users.'))
            .finally(() => setLoading(false));
    }

    useEffect(() => { load(); }, [filters]);

    async function handleCreate(e) {
        e.preventDefault();
        setFormError('');
        setSaving(true);
        try {
            await api.post('/users', form);
            setForm(emptyForm);
            setShowForm(false);
            load();
        } catch (err) {
            setFormError(err.response?.data?.message || 'Could not register employee.');
        } finally {
            setSaving(false);
        }
    }

    function startEdit(u) {
        setEditingId(u.id);
        setEditForm({
            name: u.name,
            departmentName: u.department_name || '',
            employeeCode: u.employee_code || '',
        });
    }

    async function saveEdit(id) {
        try {
            await api.put(`/users/${id}`, editForm);
            setEditingId(null);
            load();
        } catch (err) {
            alert(err.response?.data?.message || 'Could not update user.');
        }
    }

    async function toggleActive(u) {
        const label = u.is_active ? 'deactivate' : 'reactivate';
        if (!confirm(`Are you sure you want to ${label} ${u.name}?`)) return;
        try {
            await api.patch(`/users/${u.id}/status`, { isActive: !u.is_active });
            load();
        } catch (err) {
            alert(err.response?.data?.message || `Could not ${label} user.`);
        }
    }

    async function handleResetPassword(u) {
        const newPassword = prompt(`Enter a new temporary password for ${u.name} (min. 6 characters):`);
        if (!newPassword) return;
        if (newPassword.length < 6) {
            alert('Password must be at least 6 characters.');
            return;
        }
        try {
            await api.patch(`/users/${u.id}/password`, { newPassword });
            alert(`Password reset for ${u.name}. Share it with them securely — they should change it after logging in.`);
        } catch (err) {
            alert(err.response?.data?.message || 'Could not reset password.');
        }
    }

    if (error) return <p className="text-red-600">{error}</p>;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-lg font-semibold">Employees</h1>
                <button
                    onClick={() => setShowForm((s) => !s)}
                    className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg"
                >
                    {showForm ? 'Cancel' : '+ Register Employee'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleCreate} className="bg-white rounded-xl shadow p-5 mb-6 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Full Name *</label>
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Email *</label>
                        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Temporary Password *</label>
                        <input required type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2" placeholder="min. 6 characters" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Role *</label>
                        <select required value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2">
                            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Department</label>
                        <input value={form.departmentName} onChange={(e) => setForm({ ...form, departmentName: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2" placeholder="e.g. Engineering" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Employee Code</label>
                        <input value={form.employeeCode} onChange={(e) => setForm({ ...form, employeeCode: e.target.value })}
                            className="w-full border rounded-lg px-3 py-2" placeholder="e.g. EMP014" />
                    </div>

                    {formError && <p className="col-span-2 text-sm text-red-600">{formError}</p>}

                    <div className="col-span-2">
                        <button type="submit" disabled={saving}
                            className="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60">
                            {saving ? 'Registering…' : 'Register'}
                        </button>
                    </div>
                </form>
            )}

            <div className="flex gap-3 mb-4">
                <input
                    placeholder="Search name or email…"
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="border rounded-lg px-3 py-2 text-sm flex-1"
                />
                <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    className="border rounded-lg px-3 py-2 text-sm">
                    <option value="">All roles</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="border rounded-lg px-3 py-2 text-sm">
                    <option value="">All statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                </select>
            </div>

            {loading ? <p className="text-slate-500">Loading…</p> : (
                <div className="bg-white rounded-xl shadow overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-left text-slate-500">
                            <tr>
                                <th className="px-4 py-2">Name</th>
                                <th className="px-4 py-2">Email</th>
                                <th className="px-4 py-2">Role</th>
                                <th className="px-4 py-2">Department</th>
                                <th className="px-4 py-2">Code</th>
                                <th className="px-4 py-2">Status</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length === 0 && (
                                <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">No users found.</td></tr>
                            )}
                            {users.map((u) => (
                                <tr key={u.id} className="border-t">
                                    {editingId === u.id ? (
                                        <>
                                            <td className="px-4 py-2">
                                                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    className="border rounded px-2 py-1 w-full" />
                                            </td>
                                            <td className="px-4 py-2 text-slate-400">{u.email}</td>
                                            <td className="px-4 py-2 capitalize">{u.role}</td>
                                            <td className="px-4 py-2">
                                                <input value={editForm.departmentName} onChange={(e) => setEditForm({ ...editForm, departmentName: e.target.value })}
                                                    className="border rounded px-2 py-1 w-full" />
                                            </td>
                                            <td className="px-4 py-2">
                                                <input value={editForm.employeeCode} onChange={(e) => setEditForm({ ...editForm, employeeCode: e.target.value })}
                                                    className="border rounded px-2 py-1 w-full" />
                                            </td>
                                            <td className="px-4 py-2">{u.is_active ? 'Active' : 'Inactive'}</td>
                                            <td className="px-4 py-2 space-x-2">
                                                <button onClick={() => saveEdit(u.id)} className="text-emerald-600 hover:underline">Save</button>
                                                <button onClick={() => setEditingId(null)} className="text-slate-500 hover:underline">Cancel</button>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td className="px-4 py-2 font-medium">{u.name}</td>
                                            <td className="px-4 py-2">{u.email}</td>
                                            <td className="px-4 py-2 capitalize">{u.role}</td>
                                            <td className="px-4 py-2">{u.department_name || '—'}</td>
                                            <td className="px-4 py-2">{u.employee_code || '—'}</td>
                                            <td className="px-4 py-2">
                                                <span className={u.is_active ? 'text-emerald-600' : 'text-red-500'}>
                                                    {u.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 space-x-2">
                                                <button onClick={() => startEdit(u)} className="text-brand-600 hover:underline">Edit</button>
                                                <button onClick={() => handleResetPassword(u)} className="text-amber-600 hover:underline">Reset Password</button>
                                                <button onClick={() => toggleActive(u)} className="text-red-600 hover:underline">
                                                    {u.is_active ? 'Deactivate' : 'Reactivate'}
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}