import { useState } from 'react';
import { getMoneyTransfers, deleteMoneyTransfer } from '../../services/transfer.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import TransferForm from './TransferForm';
import toast from 'react-hot-toast';

const TransferList = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getMoneyTransfers);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transfer? Balance changes will be reversed.')) return;
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
      key: 'date',
      label: 'Date',
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'fromAccount',
      label: 'From Account',
      render: (row) => row.fromAccount?.name || '-',
    },
    {
      key: 'toAccount',
      label: 'To Account',
      render: (row) => row.toAccount?.name || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => `৳${row.amount?.toLocaleString()}`,
    },
    {
      key: 'transferredBy',
      label: 'Transferred By',
      render: (row) => row.transferredBy?.name || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleDelete(row._id)}
          className="text-red-600 hover:text-red-800 text-xs font-medium"
        >
          Delete
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Money Transfers" subtitle="Manage fund transfers between accounts">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
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
      />

      {showForm && (
        <TransferForm
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            refetch();
          }}
        />
      )}
    </div>
  );
};

export default TransferList;
