const styles = {
  draft: 'bg-slate-200 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${styles[status] || ''}`}>
      {status}
    </span>
  );
}
