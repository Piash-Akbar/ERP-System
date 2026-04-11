import { useState, useEffect } from 'react';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch';
import { getAdjustments, adjustStock } from '../../services/inventory.service';
import { getProducts } from '../../services/product.service';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';

const StockAdjustment = () => {
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getAdjustments);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product: '', type: 'addition', quantity: '', reason: '', note: '' });
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (showForm) {
      getProducts({ limit: 1000 })
        .then((res) => setProducts(res.data.data?.data || res.data.data || []))
        .catch(() => toast.error('Something went wrong'));
    }
  }, [showForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.product) errs.product = 'Product is required';
    if (!form.quantity || Number(form.quantity) < 1) errs.quantity = 'Quantity must be at least 1';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await adjustStock({ ...form, quantity: Number(form.quantity) });
      toast.success('Stock adjusted successfully');
      setShowForm(false);
      setForm({ product: '', type: 'addition', quantity: '', reason: '', note: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = () => {
    toast.success('Export started');
  };

  const columns = [
    {
      key: 'product',
      label: 'PRODUCT',
      render: (row) => row.product?.name || '-',
    },
    {
      key: 'type',
      label: 'TYPE',
      render: (row) => (
        <StatusBadge color={row.type === 'addition' ? 'green' : 'red'}>
          {row.type === 'addition' ? 'Addition' : 'Subtraction'}
        </StatusBadge>
      ),
    },
    {
      key: 'quantity',
      label: 'QUANTITY',
      render: (row) => row.quantity ?? 0,
    },
    {
      key: 'reason',
      label: 'REASON',
      render: (row) => row.reason || '-',
    },
    {
      key: 'createdAt',
      label: 'DATE',
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
  ];

  return (
    <div>
      <PageHeader title="Stock Adjustment" subtitle="Adjust inventory stock levels">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          + New Adjustment
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
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <HiOutlineFunnel className="w-4 h-4" />
              Filter
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <HiOutlineArrowDownTray className="w-4 h-4" />
              Export
            </button>
          </>
        }
      />

      {showForm && (
        <Modal isOpen onClose={() => setShowForm(false)} title="New Stock Adjustment" size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Product" name="product" type="select" value={form.product} onChange={handleChange} error={errors.product} required>
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
              ))}
            </FormInput>

            <FormInput label="Type" name="type" type="select" value={form.type} onChange={handleChange} required>
              <option value="addition">Addition</option>
              <option value="subtraction">Subtraction</option>
            </FormInput>

            <FormInput label="Quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} error={errors.quantity} required />
            <FormInput label="Reason" name="reason" value={form.reason} onChange={handleChange} />
            <FormInput label="Note" name="note" type="textarea" value={form.note} onChange={handleChange} />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Adjust Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default StockAdjustment;
