import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineFunnel, HiOutlineArrowDownTray, HiOutlineEye } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';

const formatCurrency = (val) =>
  `$${Math.abs(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const typeColors = {
  Sale: 'green',
  Expense: 'red',
  Purchase: 'orange',
  Income: 'blue',
};

const demoTransactions = [
  { _id: '1', transactionId: 'TXN-001', date: '2026-03-25', description: 'Product Sale - ABC Corp', type: 'Sale', amount: 15600, account: 'Cash' },
  { _id: '2', transactionId: 'TXN-002', date: '2026-03-25', description: 'Office Rent Payment', type: 'Expense', amount: -5000, account: 'Bank - City Bank' },
  { _id: '3', transactionId: 'TXN-003', date: '2026-03-24', description: 'Purchase - XYZ Suppliers', type: 'Purchase', amount: -8900, account: 'Accounts Payable' },
  { _id: '4', transactionId: 'TXN-004', date: '2026-03-24', description: 'Service Income', type: 'Income', amount: 2500, account: 'Cash' },
];

const Transactions = () => {
  const [transactions] = useState(demoTransactions);

  const handleExport = () => toast.success('Export started');

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
    { key: 'account', label: 'ACCOUNT' },
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
            <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              <HiOutlineFunnel className="w-4 h-4" />
              Filter
            </button>
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
