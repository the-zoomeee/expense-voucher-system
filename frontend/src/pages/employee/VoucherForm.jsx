import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import { CATEGORIES } from '../../constants/categories';

const emptyForm = {
  voucherDate: new Date().toISOString().slice(0, 10),
  expenseDate: '',
  departmentName: '',
  expenseTitle: '',
  expenseCategory: CATEGORIES[0],
  expenseDescription: '',
  amount: '',
};

export default function VoucherForm({ mode }) {
  const isEdit = mode === 'edit';
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyForm);
  const [signatureFile, setSignatureFile] = useState(null);
  const [existingSignature, setExistingSignature] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/vouchers/${id}`).then(({ data }) => {
      const v = data.data;
      setForm({
        voucherDate: v.voucher_date?.slice(0, 10) || '',
        expenseDate: v.expense_date?.slice(0, 10) || '',
        departmentName: v.department_name,
        expenseTitle: v.expense_title,
        expenseCategory: v.expense_category,
        expenseDescription: v.expense_description || '',
        amount: v.amount,
      });
      setExistingSignature(v.employee_signature_path);
      setLoading(false);
    }).catch((err) => {
      setError(err.response?.data?.message || 'Failed to load voucher.');
      setLoading(false);
    });
  }, [id, isEdit]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSave(e, andSubmit = false) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (signatureFile) fd.append('employeeSignature', signatureFile);

      let voucherId = id;
      if (isEdit) {
        await api.put(`/vouchers/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        const { data } = await api.post('/vouchers', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        voucherId = data.data.id;
      }

      if (andSubmit) {
        await api.post(`/vouchers/${voucherId}/submit`);
      }

      navigate('/employee/vouchers');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save voucher.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-slate-500">Loading…</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-semibold mb-4">{isEdit ? 'Edit Draft Voucher' : 'Create Voucher'}</h1>

      <form onSubmit={(e) => handleSave(e, false)} className="bg-white rounded-xl shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Voucher Date</label>
            <input type="date" name="voucherDate" value={form.voucherDate} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Expense Date *</label>
            <input type="date" name="expenseDate" value={form.expenseDate} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Department *</label>
          <input name="departmentName" value={form.departmentName} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2" required placeholder="e.g. Engineering" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Expense Title *</label>
          <input name="expenseTitle" value={form.expenseTitle} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2" required placeholder="e.g. Client visit travel" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category *</label>
            <select name="expenseCategory" value={form.expenseCategory} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
            <input type="number" min="0.01" step="0.01" name="amount" value={form.amount} onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2" required />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea name="expenseDescription" value={form.expenseDescription} onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2" rows={3} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Signature (image) {!existingSignature && '*'}</label>
          <input type="file" accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setSignatureFile(e.target.files[0])}
            className="w-full text-sm" />
          {existingSignature && !signatureFile && (
            <p className="text-xs text-slate-500 mt-1">Existing signature on file. Upload a new image only to replace it.</p>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving}
            className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60">
            Save as Draft
          </button>
          <button type="button" disabled={saving} onClick={(e) => handleSave(e, true)}
            className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60">
            Save & Submit for Approval
          </button>
        </div>
      </form>
    </div>
  );
}
