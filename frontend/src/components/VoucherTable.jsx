import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function VoucherTable({ vouchers, emptyText }) {
  if (!vouchers.length) return <p className="text-slate-500 text-sm">{emptyText}</p>;

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-100 text-left text-slate-600">
          <tr>
            <th className="px-4 py-2">Voucher #</th>
            <th className="px-4 py-2">Employee</th>
            <th className="px-4 py-2">Title</th>
            <th className="px-4 py-2">Amount</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {vouchers.map((v) => (
            <tr key={v.id} className="border-t">
              <td className="px-4 py-2 font-medium">{v.voucher_number}</td>
              <td className="px-4 py-2">{v.employee_name}</td>
              <td className="px-4 py-2">{v.expense_title}</td>
              <td className="px-4 py-2">₹{Number(v.amount).toFixed(2)}</td>
              <td className="px-4 py-2"><StatusBadge status={v.status} /></td>
              <td className="px-4 py-2">
                <Link to={`/vouchers/${v.id}`} className="text-brand-600 hover:underline">View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
