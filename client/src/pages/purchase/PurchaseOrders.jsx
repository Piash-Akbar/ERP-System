import { useState } from 'react';
import { getPurchases, deletePurchase, updatePurchaseStatus } from '../../services/purchase.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import PurchaseForm from './PurchaseForm';
import PurchaseDetail from './PurchaseDetail';
import toast from 'react-hot-toast';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';

const purchaseStatuses = ['ordered', 'received', 'partial', 'returned', 'cancelled'];
const paymentStatusColors = { paid: 'green', partial: 'yellow', unpaid: 'red' };

const PurchaseOrders = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getPurchases, {
    initialParams: { isReturn: 'false' },
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await deletePurchase(id);
      toast.success('Purchase order deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePurchaseStatus(id, newStatus);
      toast.success('Status updated');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const columns = [
    { key: 'referenceNo', label: 'PO NUMBER', render: (row) => <span className="font-medium text-gray-900">{row.referenceNo}</span> },
    { key: 'supplier', label: 'SUPPLIER', render: (row) => row.supplier?.name || '-' },
    { key: 'purchaseDate', label: 'DATE', render: (row) => new Date(row.purchaseDate).toLocaleDateString() },
    { key: 'grandTotal', label: 'AMOUNT', render: (row) => <span className="font-medium">৳{row.grandTotal?.toLocaleString()}</span> },
    {
      key: 'paymentStatus',
      label: 'PAYMENT',
      render: (row) => {
        const ps = row.paymentStatus || 'unpaid';
        return <StatusBadge color={paymentStatusColors[ps]}>{ps.charAt(0).toUpperCase() + ps.slice(1)}</StatusBadge>;
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <select
          value={row.status || 'ordered'}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${
            row.status === 'received' ? 'bg-green-50 text-green-700' :
            row.status === 'ordered' ? 'bg-blue-50 text-blue-700' :
            row.status === 'partial' ? 'bg-yellow-50 text-yellow-700' :
            row.status === 'returned' ? 'bg-orange-50 text-orange-700' :
            row.status === 'cancelled' ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-700'
          }`}
        >
          {purchaseStatuses.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      label: '',
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
      <PageHeader title="Purchase Orders" subtitle="Manage purchase orders and procurement">
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ New Purchase Order</button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
        actions={
          <>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"><HiOutlineFunnel className="w-4 h-4" />Filter</button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"><HiOutlineArrowDownTray className="w-4 h-4" />Export</button>
          </>
        }
      />

      {showForm && <PurchaseForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />}
      {showDetail && <PurchaseDetail purchaseId={showDetail} onClose={() => setShowDetail(null)} onRefetch={refetch} />}
    </div>
  );
};

export default PurchaseOrders;
