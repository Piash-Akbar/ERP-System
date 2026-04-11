import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineArrowDownTray, HiOutlineEye } from 'react-icons/hi2';
import { exportToCsv } from '../../utils/exportCsv';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import { getTransactions } from '../../services/account.service';

const formatCurrency = (val) =>
  `৳${Math.abs(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const typeColors = {
  income: 'green',
  expense: 'red',
};

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTransactions()
      .then((res) => {
        const d = res.data?.data;
        setTransactions(Array.isArray(d) ? d : d?.data || d?.docs || []);
      })
      .catch(() => toast.error('Failed to load transactions'))
      .finally(() => setLoading(false));
  }, []);

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
    { key: 'transactionId', label: 'TRANSACTION ID', render: (row) => <span className="font-medium text-blue-600">{row.transactionId}</span> },
    {
      key: 'date',
      label: 'DATE',
      render: (row) => new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    { key: 'description', label: 'DESCRIPTION' },
    {
      key: 'type',
      label: 'TYPE',
      render: (row) => <StatusBadge color={typeColors[row.type]}>{row.type}</StatusBadge>,
    },
    {
      key: 'amount',
      label: 'AMOUNT',
      render: (row) => (
        <span className={`font-medium ${row.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {row.amount >= 0 ? '' : '-'}{formatCurrency(row.amount)}
        </span>
      ),
    },
    { key: 'account', label: 'ACCOUNT', render: (row) => row.account?.name || '-' },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: () => (
        <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600" title="View">
          <HiOutlineEye className="w-4 h-4" />
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
        onSearch={() => {}}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <HiOutlineArrowDownTray className="w-4 h-4" />
              Export
            </button>
          </div>
        }
      />
    </div>
  );
};

export default Transactions;
