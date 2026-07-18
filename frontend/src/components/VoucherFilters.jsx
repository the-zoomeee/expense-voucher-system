import { CATEGORIES } from '../constants/categories';

const SORT_OPTIONS = [
  { value: 'created_at:desc', label: 'Newest first' },
  { value: 'created_at:asc', label: 'Oldest first' },
  { value: 'amount:desc', label: 'Amount: high to low' },
  { value: 'amount:asc', label: 'Amount: low to high' },
  { value: 'expense_date:desc', label: 'Expense date: newest' },
  { value: 'expense_date:asc', label: 'Expense date: oldest' },
];

export default function VoucherFilters({ filters, onChange, statusOptions }) {
  function set(key, value) {
    onChange({ ...filters, [key]: value });
  }

  function setSort(value) {
    const [sortBy, sortOrder] = value.split(':');
    onChange({ ...filters, sortBy, sortOrder });
  }

  function clearAll() {
    onChange({});
  }

  const sortValue = `${filters.sortBy || 'created_at'}:${filters.sortOrder || 'desc'}`;
  const hasActiveFilters = Object.values(filters).some((v) => v && v !== 'created_at' && v !== 'desc');

  return (
    <div className="bg-white rounded-xl shadow p-4 mb-4 space-y-3">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <input
          placeholder="Search voucher # or employee"
          value={filters.search || ''}
          onChange={(e) => set('search', e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm col-span-2"
        />
        <input
          placeholder="Department"
          value={filters.department || ''}
          onChange={(e) => set('department', e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        />
        <select
          value={filters.category || ''}
          onChange={(e) => set('category', e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        {statusOptions && (
          <select
            value={filters.status || ''}
            onChange={(e) => set('status', e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm"
          >
            <option value="">All statuses</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </select>
        )}

        <select
          value={sortValue}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        >
          {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Expense date from</label>
          <input type="date" value={filters.dateFrom || ''} onChange={(e) => set('dateFrom', e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm w-full" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">to</label>
          <input type="date" value={filters.dateTo || ''} onChange={(e) => set('dateTo', e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm w-full" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Amount min</label>
          <input type="number" min="0" value={filters.amountMin || ''} onChange={(e) => set('amountMin', e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm w-full" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500 whitespace-nowrap">Amount max</label>
          <input type="number" min="0" value={filters.amountMax || ''} onChange={(e) => set('amountMax', e.target.value)}
            className="border rounded-lg px-2 py-1.5 text-sm w-full" />
        </div>
      </div>

      {hasActiveFilters && (
        <button onClick={clearAll} className="text-xs text-brand-600 hover:underline">
          Clear all filters
        </button>
      )}
    </div>
  );
}
