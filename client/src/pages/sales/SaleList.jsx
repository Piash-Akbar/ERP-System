import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { getSales, deleteSale, updateSaleStatus } from '../../services/sale.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import SaleDetail from './SaleDetail';
import toast from 'react-hot-toast';

const paymentStatusColors = { paid: 'green', partial: 'yellow', pending: 'orange', unpaid: 'red' };
const statusColors = { draft: 'gray', confirmed: 'blue', delivered: 'green', returned: 'red', cancelled: 'gray' };
const saleStatuses = ['draft', 'confirmed', 'delivered', 'returned', 'cancelled'];

const SaleList = () => {
  const navigate = useNavigate();
  const [showDetail, setShowDetail] = useState(null);
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getSales);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this sale?')) return;
    try {
      await deleteSale(id);
      toast.success('Sale deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateSaleStatus(id, newStatus);
      toast.success('Status updated');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const columns = [
    {
      key: 'invoiceNo',
      label: 'INVOICE NO',
      render: (row) => <span className="font-medium text-gray-900">{row.invoiceNo}</span>,
    },
    {
      key: 'customer',
      label: 'CUSTOMER',
      render: (row) => row.customer?.name || '-',
    },
    {
      key: 'saleDate',
      label: 'DATE',
      render: (row) => new Date(row.saleDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    {
      key: 'grandTotal',
      label: 'AMOUNT',
      render: (row) => <span className="font-medium">৳{row.grandTotal?.toLocaleString()}</span>,
    },
    {
      key: 'paymentStatus',
      label: 'PAYMENT',
      render: (row) => {
        const status = row.paymentStatus || 'pending';
        return <StatusBadge color={paymentStatusColors[status]}>{status.charAt(0).toUpperCase() + status.slice(1)}</StatusBadge>;
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <select
          value={row.status || 'confirmed'}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${
            row.status === 'delivered' ? 'bg-green-50 text-green-700' :
            row.status === 'confirmed' ? 'bg-blue-50 text-blue-700' :
            row.status === 'returned' ? 'bg-red-50 text-red-700' :
            row.status === 'cancelled' ? 'bg-gray-100 text-gray-600' :
            'bg-gray-50 text-gray-700'
          }`}
        >
          {saleStatuses.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button onClick={() => setShowDetail(row._id)} className="text-orange-500 hover:text-orange-700 text-xs font-medium">View</button>
          <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Sales List" subtitle="Manage all your sales and invoices">
        <button onClick={() => navigate('/sales/product-sale')} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors">+ New Sale</button>
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
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><HiOutlineFunnel className="w-4 h-4" />Filter</button>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><HiOutlineArrowDownTray className="w-4 h-4" />Export</button>
          </>
        }
      />

      {showDetail && <SaleDetail saleId={showDetail} onClose={() => setShowDetail(null)} onRefetch={refetch} />}
    </div>
  );
};

export default SaleList;
