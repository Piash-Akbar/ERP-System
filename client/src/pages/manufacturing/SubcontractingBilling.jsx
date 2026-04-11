import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import useFetch from '../../hooks/useFetch';
import { getSubcontractingOrders, updateSubcontractingOrder } from '../../services/manufacturing.service';

const payStatuses = ['pending', 'in_progress', 'completed'];
const statusBg = { pending: 'bg-orange-50 text-orange-700', in_progress: 'bg-yellow-50 text-yellow-700', completed: 'bg-green-50 text-green-700' };
const statusLabel = { pending: 'Unpaid', in_progress: 'Partial', completed: 'Paid' };

const SubcontractingBilling = () => {
  const { data, loading, refetch } = useFetch(getSubcontractingOrders);

  const handleStatusChange = async (id, status) => {
    try { await updateSubcontractingOrder(id, { status }); toast.success('Status updated'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const orders = data || [];
  const totalDue = orders.reduce((s, o) => s + (o.dueAmount || 0), 0);
  const totalPaid = orders.reduce((s, o) => s + (o.paidAmount || 0), 0);
  const overdue = orders.filter((o) => o.dueAmount > 0 && o.dueDate && new Date(o.dueDate) < new Date()).reduce((s, o) => s + (o.dueAmount || 0), 0);

  return (
    <div>
      <PageHeader title="Subcontracting Billing" subtitle="Manage and track subcontractor payments" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Due</p><p className="text-2xl font-bold text-blue-600 mt-1">৳{totalDue.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Overdue</p><p className="text-2xl font-bold text-red-600 mt-1">৳{overdue.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Paid</p><p className="text-2xl font-bold text-green-600 mt-1">৳{totalPaid.toLocaleString()}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">ORDER CODE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SUPPLIER</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">AMOUNT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PAID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">BALANCE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">DUE DATE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PAYMENT STATUS</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : orders.length === 0 ? <tr><td colSpan={7} className="text-center py-12 text-gray-400">No billing data</td></tr>
              : orders.map((o) => (
                <tr key={o._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.orderCode}</td>
                  <td className="px-4 py-3 text-gray-700">{o.supplier?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">৳{(o.totalAmount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{(o.paidAmount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">৳{(o.dueAmount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{o.dueDate ? new Date(o.dueDate).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${statusBg[o.status]}`}>
                      {payStatuses.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubcontractingBilling;
