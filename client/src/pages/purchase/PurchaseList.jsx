import { useState } from 'react';
import { getPurchases, deletePurchase, updatePurchaseStatus } from '../../services/purchase.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import PurchaseForm from './PurchaseForm';
import PurchaseDetail from './PurchaseDetail';
import toast from 'react-hot-toast';

const paymentColors = { paid: 'green', partial: 'yellow', unpaid: 'red' };
const statusColors = { ordered: 'blue', received: 'green', partial: 'yellow', returned: 'orange', cancelled: 'red' };

const purchaseStatuses = ['ordered', 'received', 'partial', 'returned', 'cancelled'];

const PurchaseList = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getPurchases);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePurchaseStatus(id, newStatus);
      toast.success('Status updated');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase?')) return;
    try {
      await deletePurchase(id);
      toast.success('Purchase deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const columns = [
    { key: 'referenceNo', label: 'Reference #' },
    { key: 'supplier', label: 'Supplier', render: (row) => row.supplier?.name || '-' },
    { key: 'purchaseDate', label: 'Date', render: (row) => new Date(row.purchaseDate).toLocaleDateString() },
    { key: 'grandTotal', label: 'Total', render: (row) => `৳${row.grandTotal?.toLocaleString()}` },
    { key: 'paidAmount', label: 'Paid', render: (row) => `৳${row.paidAmount?.toLocaleString()}` },
    { key: 'dueAmount', label: 'Due', render: (row) => `৳${row.dueAmount?.toLocaleString()}` },
    {
      key: 'paymentStatus', label: 'Payment',
      render: (row) => <StatusBadge color={paymentColors[row.paymentStatus]}>{row.paymentStatus}</StatusBadge>,
    },
    {
      key: 'status', label: 'Status',
      render: (row) => (
        <select
          value={row.status || 'ordered'}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${
            row.status === 'received' ? 'bg-green-50 text-green-700' :
            row.status === 'ordered' ? 'bg-blue-50 text-blue-700' :
            row.status === 'cancelled' ? 'bg-red-50 text-red-700' :
            'bg-yellow-50 text-yellow-700'
          }`}
        >
          {purchaseStatuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => setShowDetail(row._id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View</button>
          <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Purchase" subtitle="Manage purchase orders">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          + New Purchase
        </button>
      </PageHeader>

      <DataTable columns={columns} data={data || []} pagination={pagination} onPageChange={setPage} onSearch={setSearch} loading={loading} />

      {showForm && <PurchaseForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />}
      {showDetail && <PurchaseDetail purchaseId={showDetail} onClose={() => setShowDetail(null)} onRefetch={refetch} />}
    </div>
  );
};

export default PurchaseList;
