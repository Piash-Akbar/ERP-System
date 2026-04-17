import toast from 'react-hot-toast';
import { HiOutlineArrowDownTray, HiOutlineTrash } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import { exportToCsv } from '../../utils/exportCsv';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getTransactions, deleteTransaction } from '../../services/account.service';

const formatCurrency = (val) =>
  `৳${Math.abs(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const typeColors = {
  income: 'green',
  expense: 'red',
};

const Transactions = () => {
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getTransactions);

  const transactions = data || [];

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await deleteTransaction(row._id);
      toast.success('Transaction deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleExport = () => {
    const cols = [
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount' },
      { key: 'description', label: 'Description' },
      { key: 'date', label: 'Date' },
      { key: 'reference', label: 'Reference' },
    ];
    const rows = transactions.map((t) => ({
      ...t,
      date: new Date(t.date).toLocaleDateString(),
    }));
    exportToCsv('transactions', cols, rows);
    toast.success('Exported to CSV');
  };

  const columns = [
    {
      key: 'date',
      label: 'DATE',
      render: (row) => new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    { key: 'category', label: 'CATEGORY' },
    { key: 'description', label: 'DESCRIPTION', render: (row) => row.description || '-' },
    {
      key: 'type',
      label: 'TYPE',
      render: (row) => <StatusBadge color={typeColors[row.type]}>{row.type}</StatusBadge>,
    },
    {
      key: 'amount',
      label: 'AMOUNT',
      render: (row) => (
        <span className={`font-medium ${row.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
          {row.type === 'expense' ? '-' : '+'}{formatCurrency(row.amount)}
        </span>
      ),
    },
    { key: 'account', label: 'ACCOUNT', render: (row) => row.account?.name || '-' },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (row) => (
        <button
          onClick={() => handleDelete(row)}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
          title="Delete"
        >
          <HiOutlineTrash className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Transactions" subtitle="View all financial transactions" />

      <DataTable
        columns={columns}
        data={transactions}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
        actions={
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <HiOutlineArrowDownTray className="w-4 h-4" />
            Export
          </button>
        }
      />
    </div>
  );
};

export default Transactions;
