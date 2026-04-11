import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';

const formatCurrency = (val) =>
  val ? `$${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-';

const typeColors = {
  Assets: 'blue',
  Liabilities: 'red',
  Equity: 'purple',
  Revenue: 'green',
  Expenses: 'orange',
};

const demoAccounts = [
  { _id: '1', code: '1000', name: 'Assets', type: 'Assets', balance: 750000, level: 0 },
  { _id: '2', code: '1100', name: 'Current Assets', type: 'Assets', balance: 345200, level: 1 },
  { _id: '3', code: '1110', name: 'Cash', type: 'Assets', balance: 125000, level: 2 },
  { _id: '4', code: '1120', name: 'Accounts Receivable', type: 'Assets', balance: 220200, level: 2 },
  { _id: '5', code: '2000', name: 'Liabilities', type: 'Liabilities', balance: 145000, level: 0 },
  { _id: '6', code: '2100', name: 'Accounts Payable', type: 'Liabilities', balance: 95000, level: 1 },
  { _id: '7', code: '3000', name: 'Equity', type: 'Equity', balance: null, level: 0 },
  { _id: '8', code: '4000', name: 'Revenue', type: 'Revenue', balance: 590215, level: 0 },
  { _id: '9', code: '4100', name: 'Sales Revenue', type: 'Revenue', balance: 520000, level: 1 },
  { _id: '10', code: '5000', name: 'Expenses', type: 'Expenses', balance: 385000, level: 0 },
  { _id: '11', code: '5100', name: 'Salaries', type: 'Expenses', balance: 186000, level: 1 },
];

const initialForm = { code: '', name: '', type: 'Assets', parentAccount: '' };

const ChartOfAccounts = () => {
  const [accounts] = useState(demoAccounts);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.code || !form.name) {
      toast.error('Account Code and Name are required');
      return;
    }
    toast.success('Account added successfully');
    setModalOpen(false);
    setForm(initialForm);
  };

  const handleExport = () => toast.success('Export started');

  const columns = [
    {
      key: 'code',
      label: 'ACCOUNT CODE',
      render: (row) => (
        <span className="font-mono text-sm" style={{ marginLeft: `${row.level * 24}px` }}>
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'ACCOUNT NAME',
      render: (row) => (
        <span className={`${row.level === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`} style={{ marginLeft: `${row.level * 24}px` }}>
          {row.name}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'TYPE',
      render: (row) => <StatusBadge color={typeColors[row.type]}>{row.type}</StatusBadge>,
    },
    {
      key: 'balance',
      label: 'BALANCE',
      render: (row) => <span className="font-medium text-gray-900">{formatCurrency(row.balance)}</span>,
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: () => (
        <div className="flex items-center gap-1">
          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600" title="Edit">
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600" title="Delete">
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Chart of Accounts" subtitle="Manage accounting chart of accounts">
        <button
          onClick={() => { setForm(initialForm); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Account
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={accounts}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Account" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Account Code *" name="code" value={form.code} onChange={handleChange} placeholder="e.g. 1100" />
            <FormInput label="Account Type" type="select" name="type" value={form.type} onChange={handleChange}>
              <option value="Assets">Assets</option>
              <option value="Liabilities">Liabilities</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expenses">Expenses</option>
            </FormInput>
          </div>
          <FormInput label="Account Name *" name="name" value={form.name} onChange={handleChange} placeholder="e.g. Current Assets" />
          <FormInput label="Parent Account" type="select" name="parentAccount" value={form.parentAccount} onChange={handleChange}>
            <option value="">None (Top Level)</option>
            {accounts.filter((a) => a.level === 0).map((a) => (
              <option key={a._id} value={a.code}>{a.code} - {a.name}</option>
            ))}
          </FormInput>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600">
              Add Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChartOfAccounts;
