import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineTrash, HiOutlinePencilSquare, HiOutlinePlus } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import TransactionForm from './TransactionForm';
import BankAccountForm from './BankAccountForm';
import {
  getTransactions,
  deleteTransaction,
  getBankAccounts,
  deleteBankAccount,
  getAccountSummary,
} from '../../services/account.service';

const typeColors = {
  income: 'green',
  expense: 'red',
};

const accountTypeColors = {
  cash: 'yellow',
  bank: 'blue',
  mobile_banking: 'purple',
};

const accountTypeLabels = {
  cash: 'Cash',
  bank: 'Bank',
  mobile_banking: 'Mobile Banking',
};

const tabs = [
  { label: 'Transactions', value: 'transactions' },
  { label: 'Bank Accounts', value: 'bank-accounts' },
  { label: 'Summary', value: 'summary' },
];

const formatCurrency = (val) =>
  `৳${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const AccountList = () => {
  const [activeTab, setActiveTab] = useState('transactions');
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);

  // Bank accounts (needed for transaction form + bank accounts tab)
  const [bankAccounts, setBankAccounts] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);

  // Summary
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Transactions via useFetch
  const {
    data: txnData,
    pagination: txnPagination,
    loading: txnLoading,
    setPage: setTxnPage,
    setSearch: setTxnSearch,
    refetch: refetchTxn,
  } = useFetch(getTransactions);

  const fetchBankAccounts = useCallback(async () => {
    setBankLoading(true);
    try {
      const res = await getBankAccounts();
      setBankAccounts(res.data.data || []);
    } catch {
      toast.error('Failed to load bank accounts');
    } finally {
      setBankLoading(false);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await getAccountSummary();
      setSummary(res.data.data || null);
    } catch {
      toast.error('Failed to load summary');
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBankAccounts();
  }, [fetchBankAccounts]);

  useEffect(() => {
    if (activeTab === 'summary') fetchSummary();
  }, [activeTab, fetchSummary]);

  // Transaction handlers
  const handleDeleteTxn = async (txn) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    try {
      await deleteTransaction(txn._id);
      toast.success('Transaction deleted');
      refetchTxn();
      fetchBankAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete transaction');
    }
  };

  // Bank account handlers
  const handleEditBank = (account) => {
    setEditingBank(account);
    setBankModalOpen(true);
  };

  const handleAddBank = () => {
    setEditingBank(null);
    setBankModalOpen(true);
  };

  const handleDeleteBank = async (account) => {
    if (!window.confirm(`Are you sure you want to delete "${account.name}"?`)) return;
    try {
      await deleteBankAccount(account._id);
      toast.success('Bank account deleted');
      fetchBankAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete bank account');
    }
  };

  // Transaction columns
  const txnColumns = [
    {
      key: 'date',
      label: 'Date',
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <StatusBadge color={typeColors[row.type]}>
          {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
        </StatusBadge>
      ),
    },
    { key: 'category', label: 'Category' },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className={row.type === 'income' ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {row.type === 'expense' ? '-' : '+'}{formatCurrency(row.amount)}
        </span>
      ),
    },
    {
      key: 'account',
      label: 'Account',
      render: (row) => row.account?.name || '-',
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => row.description || '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleDeleteTxn(row)}
          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
          title="Delete"
        >
          <HiOutlineTrash className="w-4 h-4" />
        </button>
      ),
    },
  ];

  // Bank account columns
  const bankColumns = [
    { key: 'name', label: 'Name' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <StatusBadge color={accountTypeColors[row.type]}>
          {accountTypeLabels[row.type] || row.type}
        </StatusBadge>
      ),
    },
    {
      key: 'bankName',
      label: 'Bank',
      render: (row) => row.bankName || '-',
    },
    {
      key: 'accountNumber',
      label: 'Account #',
      render: (row) => row.accountNumber || '-',
    },
    {
      key: 'currentBalance',
      label: 'Balance',
      render: (row) => (
        <span className="font-medium">{formatCurrency(row.currentBalance)}</span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEditBank(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
            title="Edit"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteBank(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
            title="Delete"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Accounts" subtitle="Manage transactions, bank accounts, and financial summary">
        {activeTab === 'transactions' && (
          <button
            onClick={() => setTxnModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Transaction
          </button>
        )}
        {activeTab === 'bank-accounts' && (
          <button
            onClick={handleAddBank}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <HiOutlinePlus className="w-4 h-4" />
            Add Bank Account
          </button>
        )}
      </PageHeader>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <DataTable
          columns={txnColumns}
          data={txnData || []}
          pagination={txnPagination}
          onPageChange={setTxnPage}
          onSearch={setTxnSearch}
          loading={txnLoading}
        />
      )}

      {/* Bank Accounts Tab */}
      {activeTab === 'bank-accounts' && (
        <div className="bg-white rounded-xl border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {bankColumns.map((col) => (
                    <th key={col.key} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bankLoading ? (
                  <tr>
                    <td colSpan={bankColumns.length} className="text-center py-12 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : bankAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={bankColumns.length} className="text-center py-12 text-gray-400">
                      No bank accounts found
                    </td>
                  </tr>
                ) : (
                  bankAccounts.map((row) => (
                    <tr key={row._id} className="border-b border-gray-100 hover:bg-gray-50">
                      {bankColumns.map((col) => (
                        <td key={col.key} className="px-4 py-3 text-gray-700 whitespace-nowrap">
                          {col.render ? col.render(row) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div>
          {summaryLoading ? (
            <div className="text-center py-12 text-gray-400">Loading...</div>
          ) : summary ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="text-sm text-gray-500 mb-1">Total Income</p>
                  <p className="text-2xl font-semibold text-green-600">{formatCurrency(summary.totalIncome)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="text-sm text-gray-500 mb-1">Total Expense</p>
                  <p className="text-2xl font-semibold text-red-600">{formatCurrency(summary.totalExpense)}</p>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <p className="text-sm text-gray-500 mb-1">Net Profit</p>
                  <p className={`text-2xl font-semibold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(summary.netProfit)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Balances</h3>
                {summary.bankBalances && summary.bankBalances.length > 0 ? (
                  <div className="space-y-3">
                    {summary.bankBalances.map((acc) => (
                      <div key={acc._id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                        <div>
                          <p className="font-medium text-gray-800">{acc.name}</p>
                          <p className="text-xs text-gray-500">
                            {accountTypeLabels[acc.type] || acc.type}
                            {acc.bankName ? ` - ${acc.bankName}` : ''}
                          </p>
                        </div>
                        <p className="font-semibold text-gray-900">{formatCurrency(acc.currentBalance)}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">No bank accounts found</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">No data available</div>
          )}
        </div>
      )}

      {/* Modals */}
      <TransactionForm
        isOpen={txnModalOpen}
        onClose={() => setTxnModalOpen(false)}
        bankAccounts={bankAccounts}
        onSuccess={() => {
          refetchTxn();
          fetchBankAccounts();
        }}
      />

      <BankAccountForm
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        bankAccount={editingBank}
        onSuccess={fetchBankAccounts}
      />
    </div>
  );
};

export default AccountList;
