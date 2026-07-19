import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const fileUrl = (p) => (p ? `${API_BASE}${p}` : null);

export default function VoucherDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [voucher, setVoucher] = useState(null);
  const [error, setError] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [directorSignature, setDirectorSignature] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  async function load() {
    try {
      const { data } = await api.get(`/vouchers/${id}`);
      setVoucher(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load voucher.');
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleApprove(e) {
    e.preventDefault();
    if (!directorSignature) {
      setActionError('Director signature is mandatory before approval.');
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      const fd = new FormData();
      fd.append('directorSignature', directorSignature);
      await api.post(`/vouchers/${id}/approve`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not approve voucher.');
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(e) {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setActionError('A rejection reason is required.');
      return;
    }
    setBusy(true);
    setActionError('');
    try {
      await api.post(`/vouchers/${id}/reject`, { rejectionReason });
      await load();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not reject voucher.');
    } finally {
      setBusy(false);
    }
  }

  if (error) return <p className="text-red-600">{error}</p>;
  if (!voucher) return <p className="text-slate-500">Loading…</p>;

  const canAct = user.role === 'director' && voucher.status === 'pending';

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate(-1)} className="text-sm text-brand-600 hover:underline mb-4">← Back</button>

      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold">{voucher.voucher_number}</h1>
            <p className="text-sm text-slate-500">{voucher.expense_title}</p>
          </div>
          <StatusBadge status={voucher.status} />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <Field label="Employee" value={voucher.employee_name} />
          <Field label="Department" value={voucher.department_name} />
          <Field label="Voucher Date" value={voucher.voucher_date?.slice(0, 10)} />
          <Field label="Expense Date" value={voucher.expense_date?.slice(0, 10)} />
          <Field label="Category" value={voucher.expense_category} />
          <Field label="Amount" value={`₹${Number(voucher.amount).toFixed(2)}`} />
          <div className="col-span-2">
            <Field label="Description" value={voucher.expense_description || '—'} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <SignatureBlock label="Employee Signature" src={fileUrl(voucher.employee_signature_path)} />
          <SignatureBlock label="Director Signature" src={fileUrl(voucher.director_signature_path)} />
        </div>

        {voucher.status === 'approved' && (
          <div className="text-sm bg-emerald-50 text-emerald-700 rounded-lg p-3 mb-4">
            Approved by {voucher.director_name} on {voucher.approval_date?.slice(0, 10)}
          </div>
        )}

        {voucher.status === 'rejected' && (
          <div className="text-sm bg-red-50 text-red-700 rounded-lg p-3 mb-4">
            <p className="font-medium">Rejected by {voucher.director_name}</p>
            <p>Reason: {voucher.rejection_reason}</p>
          </div>
        )}

        {canAct && (
          <div className="border-t pt-4 mt-2 space-y-6">
            <form onSubmit={handleApprove} className="space-y-2">
              <h2 className="text-sm font-semibold">Approve Voucher</h2>
              <input type="file" accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setDirectorSignature(e.target.files[0])}
                className="text-sm" />
              <button type="submit" disabled={busy}
                className="block bg-emerald-600 hover:bg-emerald-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60">
                Approve
              </button>
            </form>

            <form onSubmit={handleReject} className="space-y-2">
              <h2 className="text-sm font-semibold">Reject Voucher</h2>
              <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Rejection reason (required)" className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
              <button type="submit" disabled={busy}
                className="block bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg disabled:opacity-60">
                Reject
              </button>
            </form>

            {actionError && <p className="text-sm text-red-600">{actionError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}

function SignatureBlock({ label, src }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      {src ? (
        <img src={src} alt={label} className="h-16 border rounded-lg bg-slate-50 object-contain" />
      ) : (
        <p className="text-sm text-slate-400 italic">Not provided</p>
      )}
    </div>
  );
}
