import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { adjustStock } from '../../services/inventory.service';
import { getProducts } from '../../services/product.service';

const StockAdjustForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    product: '',
    type: 'addition',
    quantity: '',
    reason: '',
    note: '',
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    getProducts({ limit: 1000 })
      .then((res) => setProducts(res.data.data?.data || res.data.data || []))
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
    if (!form.quantity || Number(form.quantity) < 1) errs.quantity = 'Quantity must be at least 1';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await adjustStock({
        ...form,
        quantity: Number(form.quantity),
      });
      toast.success('Stock adjusted successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Stock Adjustment" size="md">
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
          label="Type"
          name="type"
          type="select"
          value={form.type}
          onChange={handleChange}
          required
        >
          <option value="addition">Addition</option>
          <option value="subtraction">Subtraction</option>
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
          label="Reason"
          name="reason"
          value={form.reason}
          onChange={handleChange}
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
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Adjust Stock'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StockAdjustForm;
