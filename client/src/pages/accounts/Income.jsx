import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash, HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getIncomes, createIncome, deleteIncome } from '../../services/account.service';

const formatCurrency = (val) =>
  `৳${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const sources = ['Product Sales', 'Service Income', 'Other Income'];
const paymentMethods = ['Bank Transfer', 'Cash', 'Credit Card', 'Check'];

const initialForm = {
  source: '',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  paymentMethod: '',
  description: '',
};

const Income = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getIncomes);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.source) errs.source = 'Income source is required';
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Amount must be greater than 0';
    if (!form.date) errs.date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await createIncome({ ...form, amount: Number(form.amount) });
      toast.success('Income added successfully');
      setModalOpen(false);
      setForm(initialForm);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add income');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      await deleteIncome(row._id);
      toast.success('Income deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleExport = () => toast.success('Export started');

  const columns = [
    {
      key: 'source',
      label: 'INCOME SOURCE',
      render: (row) => <span className="font-medium text-gray-900">{row.source || '-'}</span>,
    },
    {
      key: 'amount',
      label: 'AMOUNT',
      render: (row) => <span className="font-medium text-green-600">{formatCurrency(row.amount)}</span>,
    },
    {
      key: 'date',
      label: 'DATE',
      render: (row) => new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    {
      key: 'paymentMethod',
      label: 'PAYMENT METHOD',
      render: (row) => row.paymentMethod || '-',
    },
    {
      key: 'description',
      label: 'DESCRIPTION',
      render: (row) => row.description || '-',
    },
    {
      key: 'actions',
      label: '',
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
      <PageHeader title="Income" subtitle="Track and manage business income">
        <button
          onClick={() => { setForm(initialForm); setErrors({}); setModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Income
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Income" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Income Source"
              type="select"
              name="source"
              value={form.source}
              onChange={handleChange}
              error={errors.source}
            >
              <option value="">Select Source</option>
              {sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </FormInput>
            <FormInput
              label="Amount"
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              error={errors.amount}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
            <FormInput
              label="Date"
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              error={errors.date}
            />
            <FormInput
              label="Payment Method"
              type="select"
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
            >
              <option value="">Select Method</option>
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </FormInput>
          </div>
          <FormInput
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Income description"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Income'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Income;
