import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { transferStock } from '../../services/inventory.service';
import { getProducts } from '../../services/product.service';
import api from '../../services/api';

const StockTransferForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    product: '',
    fromWarehouse: '',
    toWarehouse: '',
    quantity: '',
    note: '',
  });

  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getProducts({ limit: 1000 })
      .then((res) => setProducts(res.data.data?.data || res.data.data || []))
      .catch(() => toast.error('Something went wrong'));

    api.get('/warehouses')
      .then((res) => setWarehouses(res.data.data?.data || res.data.data || []))
      .catch(() => toast.error('Something went wrong'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.product) errs.product = 'Product is required';
    if (!form.fromWarehouse) errs.fromWarehouse = 'Source warehouse is required';
    if (!form.toWarehouse) errs.toWarehouse = 'Destination warehouse is required';
    if (form.fromWarehouse && form.toWarehouse && form.fromWarehouse === form.toWarehouse) {
      errs.toWarehouse = 'Destination must differ from source';
    }
    if (!form.quantity || Number(form.quantity) < 1) errs.quantity = 'Quantity must be at least 1';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await transferStock({
        ...form,
        quantity: Number(form.quantity),
      });
      toast.success('Stock transferred successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to transfer stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Stock Transfer" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Product"
          name="product"
          type="select"
          value={form.product}
          onChange={handleChange}
          error={errors.product}
          required
        >
          <option value="">Select Product</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </FormInput>

        <FormInput
          label="From Warehouse"
          name="fromWarehouse"
          type="select"
          value={form.fromWarehouse}
          onChange={handleChange}
          error={errors.fromWarehouse}
          required
        >
          <option value="">Select Source Warehouse</option>
          {warehouses.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </FormInput>

        <FormInput
          label="To Warehouse"
          name="toWarehouse"
          type="select"
          value={form.toWarehouse}
          onChange={handleChange}
          error={errors.toWarehouse}
          required
        >
          <option value="">Select Destination Warehouse</option>
          {warehouses.map((w) => (
            <option key={w._id} value={w._id}>
              {w.name}
            </option>
          ))}
        </FormInput>

        <FormInput
          label="Quantity"
          name="quantity"
          type="number"
          value={form.quantity}
          onChange={handleChange}
          error={errors.quantity}
          required
        />

        <FormInput
          label="Note"
          name="note"
          type="textarea"
          value={form.note}
          onChange={handleChange}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Transferring...' : 'Transfer Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockTransferForm;
