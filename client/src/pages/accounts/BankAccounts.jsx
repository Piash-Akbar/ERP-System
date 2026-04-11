import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlinePencilSquare, HiOutlineFunnel, HiOutlineArrowDownTray, HiOutlineBuildingLibrary } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import BankAccountForm from './BankAccountForm';
import { getBankAccounts, deleteBankAccount } from '../../services/account.service';

const formatCurrency = (val) =>
  `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const maskAccountNumber = (num) => {
  if (!num) return '-';
  const str = String(num);
  if (str.length <= 4) return str;
  return '****' + str.slice(-4);
};

const BankAccounts = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBank, setEditingBank] = useState(null);

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getBankAccounts);

  const handleAdd = () => {
    setEditingBank(null);
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    setEditingBank(row);
    setModalOpen(true);
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete bank account "${row.name}"?`)) return;
    try {
      await deleteBankAccount(row._id);
      toast.success('Bank account deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleExport = () => toast.success('Export started');

  const columns = [
    {
      key: 'bankName',
      label: 'BANK NAME',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <HiOutlineBuildingLibrary className="w-4 h-4 text-blue-600" />
          </div>
          <span className="font-medium text-gray-900">{row.bankName || row.name}</span>
        </div>
      ),
    },
    {
      key: 'accountNumber',
      label: 'ACCOUNT NUMBER',
      render: (row) => <span className="font-mono text-gray-600">{maskAccountNumber(row.accountNumber)}</span>,
    },
    {
      key: 'type',
      label: 'ACCOUNT TYPE',
      render: (row) => {
        const typeLabels = { cash: 'Cash', bank: 'Savings', mobile_banking: 'Mobile Banking', checking: 'Checking', savings: 'Savings' };
        return typeLabels[row.type] || row.type || '-';
      },
    },
    {
      key: 'currentBalance',
      label: 'BALANCE',
      render: (row) => <span className="font-semibold text-gray-900">{formatCurrency(row.currentBalance)}</span>,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: () => <StatusBadge color="green">Active</StatusBadge>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
            title="Edit"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
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
      <PageHeader title="Bank Accounts" subtitle="Manage company bank accounts">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Bank Account
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

      <BankAccountForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        bankAccount={editingBank}
        onSuccess={refetch}
      />
    </div>
  );
};

export default BankAccounts;
