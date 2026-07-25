export default function StatCard({ label, value, tone = 'default' }) {
  const tones = {
    default: 'bg-white text-slate-800',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    brand: 'bg-brand-50 text-brand-700',
  };
  return (
    <div className={`rounded-xl shadow p-4 ${tones[tone]}`}>
      <p className="text-xs opacity-70 mb-1">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
    </div>
  );
}
