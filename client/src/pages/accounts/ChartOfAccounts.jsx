import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import {
  getChartOfAccounts,
  createChartAccount,
  deleteChartAccount,
} from '../../services/account.service';

const formatCurrency = (val) =>
  val || val === 0
    ? `৳${Number(val).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    : '-';

const typeColors = {
  Assets: 'blue',
  Liabilities: 'red',
  Equity: 'purple',
  Revenue: 'green',
  Expenses: 'orange',
};

const initialForm = { code: '', name: '', type: 'Assets', parentCode: '', balance: '' };

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getChartOfAccounts();
      setAccounts(res.data.data || []);
    } catch {
      toast.error('Failed to load chart of accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.code.trim()) errs.code = 'Code is required';
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.type) errs.type = 'Type is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { ...form };
      if (payload.balance !== '') payload.balance = Number(payload.balance);
      else delete payload.balance;
      if (!payload.parentCode) delete payload.parentCode;
      await createChartAccount(payload);
      toast.success('Account added successfully');
      setModalOpen(false);
      setForm(initialForm);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add account');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete account "${row.name}"?`)) return;
    try {
      await deleteChartAccount(row._id);
      toast.success('Account deleted');
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleExport = () => toast.success('Export started');

  const columns = [
    {
      key: 'code',
      label: 'ACCOUNT CODE',
      render: (row) => (
        <span className="font-mono text-sm" style={{ marginLeft: `${(row.level || 0) * 24}px` }}>
          {row.code}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'ACCOUNT NAME',
      render: (row) => (
        <span
          className={row.level === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}
          style={{ marginLeft: `${(row.level || 0) * 24}px` }}
        >
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
      <PageHeader title="Chart of Accounts" subtitle="Manage accounting chart of accounts">
        <button
          onClick={() => { setForm(initialForm); setErrors({}); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Account
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={accounts}
        loading={loading}
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
            <FormInput label="Account Code *" name="code" value={form.code} onChange={handleChange} error={errors.code} placeholder="e.g. 1100" />
            <FormInput label="Account Type" type="select" name="type" value={form.type} onChange={handleChange} error={errors.type}>
              <option value="Assets">Assets</option>
              <option value="Liabilities">Liabilities</option>
              <option value="Equity">Equity</option>
              <option value="Revenue">Revenue</option>
              <option value="Expenses">Expenses</option>
            </FormInput>
          </div>
          <FormInput label="Account Name *" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="e.g. Current Assets" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Parent Account" type="select" name="parentCode" value={form.parentCode} onChange={handleChange}>
              <option value="">None (Top Level)</option>
              {accounts.map((a) => (
                <option key={a._id} value={a.code}>{a.code} - {a.name}</option>
              ))}
            </FormInput>
            <FormInput label="Opening Balance" type="number" name="balance" value={form.balance} onChange={handleChange} placeholder="0" step="0.01" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50">
              {saving ? 'Saving...' : 'Add Account'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ChartOfAccounts;
