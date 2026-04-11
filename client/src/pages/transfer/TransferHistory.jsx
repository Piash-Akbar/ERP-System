import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { getMoneyTransfers, deleteMoneyTransfer } from '../../services/transfer.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';

const TransferHistory = () => {
  const navigate = useNavigate();
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getMoneyTransfers);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transfer?')) return;
    try {
      await deleteMoneyTransfer(id);
      toast.success('Transfer deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const columns = [
    {
      key: 'transferId',
      label: 'TRANSFER ID',
      render: (row) => <span className="font-medium text-gray-900">{row.transferId || `TRF-${String(row._id).slice(-6).toUpperCase()}`}</span>,
    },
    {
      key: 'date',
      label: 'DATE',
      render: (row) => new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    {
      key: 'fromAccount',
      label: 'FROM ACCOUNT',
      render: (row) => row.fromAccount?.name || '-',
    },
    {
      key: 'toAccount',
      label: 'TO ACCOUNT',
      render: (row) => row.toAccount?.name || '-',
    },
    {
      key: 'amount',
      label: 'AMOUNT',
      render: (row) => <span className="font-medium">${row.amount?.toLocaleString()}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button onClick={() => handleDelete(row._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">
          Delete
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Transfer History" subtitle="View all money transfers">
        <button onClick={() => navigate('/transfer/new')} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          + New Transfer
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              <HiOutlineFunnel className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              <HiOutlineArrowDownTray className="w-4 h-4" /> Export
            </button>
          </div>
        }
      />
    </div>
  );
};

export default TransferHistory;
