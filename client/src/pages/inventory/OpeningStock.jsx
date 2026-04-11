import { useState, useEffect } from 'react';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch';
import { getOpeningStock, addOpeningStock } from '../../services/inventory.service';
import { getProducts } from '../../services/product.service';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import api from '../../services/api';

const OpeningStock = () => {
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getOpeningStock);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ product: '', warehouse: '', quantity: '', date: '', value: '' });
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (showForm) {
      getProducts({ limit: 1000 })
        .then((res) => setProducts(res.data.data?.data || res.data.data || []))
        .catch(() => {});
      api.get('/warehouses')
        .then((res) => setWarehouses(res.data.data?.data || res.data.data || []))
        .catch(() => {});
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
    if (!form.warehouse) errs.warehouse = 'Warehouse is required';
    if (!form.quantity || Number(form.quantity) < 1) errs.quantity = 'Quantity must be at least 1';
    if (!form.date) errs.date = 'Date is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await addOpeningStock({ ...form, quantity: Number(form.quantity), value: Number(form.value) || 0 });
      toast.success('Opening stock added successfully');
      setShowForm(false);
      setForm({ product: '', warehouse: '', quantity: '', date: '', value: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add opening stock');
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
      key: 'warehouse',
      label: 'WAREHOUSE',
      render: (row) => row.warehouse?.name || '-',
    },
    {
      key: 'quantity',
      label: 'QUANTITY',
      render: (row) => row.quantity ?? 0,
    },
    {
      key: 'date',
      label: 'DATE',
      render: (row) => row.date ? new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-',
    },
    {
      key: 'value',
      label: 'VALUE',
      render: (row) => <span className="font-medium">${Number(row.value || 0).toLocaleString()}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Opening Stock" subtitle="Manage opening stock entries">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          + Add Opening Stock
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
        <Modal isOpen onClose={() => setShowForm(false)} title="Add Opening Stock" size="md">
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormInput label="Product" name="product" type="select" value={form.product} onChange={handleChange} error={errors.product} required>
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
              ))}
            </FormInput>

            <FormInput label="Warehouse" name="warehouse" type="select" value={form.warehouse} onChange={handleChange} error={errors.warehouse} required>
              <option value="">Select Warehouse</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>{w.name}</option>
              ))}
            </FormInput>

            <FormInput label="Quantity" name="quantity" type="number" value={form.quantity} onChange={handleChange} error={errors.quantity} required />
            <FormInput label="Date" name="date" type="date" value={form.date} onChange={handleChange} error={errors.date} required />
            <FormInput label="Value" name="value" type="number" value={form.value} onChange={handleChange} />

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 disabled:opacity-50">
                {saving ? 'Saving...' : 'Add Opening Stock'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default OpeningStock;
