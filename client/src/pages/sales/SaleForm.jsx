import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { createSale } from '../../services/sale.service';
import { getContacts } from '../../services/contact.service';
import { getProducts } from '../../services/product.service';
import toast from 'react-hot-toast';

const emptyItem = { product: '', quantity: 1, unitPrice: 0, discount: 0 };

const SaleForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    customer: '',
    saleDate: new Date().toISOString().split('T')[0],
    items: [{ ...emptyItem }],
    discountAmount: 0,
    taxAmount: 0,
    shippingCharge: 0,
    otherCharge: 0,
    payments: [{ amount: 0, method: 'cash' }],
    note: '',
  });
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getContacts({ type: 'customer', limit: 100 }).then((res) => setCustomers(res.data.data?.data || []));
    getProducts({ limit: 200 }).then((res) => setProducts(res.data.data?.data || []));
  }, []);

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'product') {
      const prod = products.find((p) => p._id === value);
      if (prod) {
        items[index].unitPrice = prod.sellingPrice;
        items[index].name = prod.name;
        items[index].sku = prod.sku;
      }
    }
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const subtotal = form.items.reduce((sum, item) => sum + item.quantity * item.unitPrice - item.discount, 0);
  const grandTotal = subtotal - form.discountAmount + form.taxAmount + form.shippingCharge + form.otherCharge;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer) return toast.error('Select a customer');
    if (form.items.some((i) => !i.product)) return toast.error('Select products for all items');

    setLoading(true);
    try {
      await createSale({ ...form, subtotal, grandTotal });
      toast.success('Sale created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create sale');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Sale" size="xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Customer" type="select" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} required>
            <option value="">Select Customer</option>
            {customers.map((c) => <option key={c._id} value={c._id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
          </FormInput>
          <FormInput label="Sale Date" type="date" value={form.saleDate} onChange={(e) => setForm({ ...form, saleDate: e.target.value })} />
        </div>

        {/* Items */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-medium text-gray-700">Items</h4>
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800">+ Add Item</button>
          </div>
          <div className="space-y-2">
            {form.items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-4">
                  <FormInput type="select" value={item.product} onChange={(e) => updateItem(i, 'product', e.target.value)}>
                    <option value="">Select Product</option>
                    {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                  </FormInput>
                </div>
                <div className="col-span-2">
                  <FormInput type="number" placeholder="Qty" value={item.quantity} min={1} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} />
                </div>
                <div className="col-span-2">
                  <FormInput type="number" placeholder="Price" value={item.unitPrice} min={0} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} />
                </div>
                <div className="col-span-2">
                  <FormInput type="number" placeholder="Discount" value={item.discount} min={0} onChange={(e) => updateItem(i, 'discount', Number(e.target.value))} />
                </div>
                <div className="col-span-1 text-sm text-gray-700 py-2">৳{(item.quantity * item.unitPrice - item.discount).toLocaleString()}</div>
                <div className="col-span-1">
                  {form.items.length > 1 && (
                    <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-sm py-2">Remove</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-3">
            <FormInput label="Overall Discount" type="number" value={form.discountAmount} min={0} onChange={(e) => setForm({ ...form, discountAmount: Number(e.target.value) })} />
            <FormInput label="Tax Amount" type="number" value={form.taxAmount} min={0} onChange={(e) => setForm({ ...form, taxAmount: Number(e.target.value) })} />
            <FormInput label="Shipping Charge" type="number" value={form.shippingCharge} min={0} onChange={(e) => setForm({ ...form, shippingCharge: Number(e.target.value) })} />
            <FormInput label="Other Charges" type="number" value={form.otherCharge} min={0} onChange={(e) => setForm({ ...form, otherCharge: Number(e.target.value) })} />
          </div>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal:</span><span>৳{subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span>Discount:</span><span>-৳{form.discountAmount.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span>Tax:</span><span>+৳{form.taxAmount.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping:</span><span>+৳{form.shippingCharge.toLocaleString()}</span></div>
            <div className="flex justify-between text-sm"><span>Other:</span><span>+৳{form.otherCharge.toLocaleString()}</span></div>
            <hr />
            <div className="flex justify-between font-semibold text-lg"><span>Grand Total:</span><span>৳{grandTotal.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Payment */}
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Payment Amount" type="number" value={form.payments[0].amount} min={0}
            onChange={(e) => setForm({ ...form, payments: [{ ...form.payments[0], amount: Number(e.target.value) }] })} />
          <FormInput label="Payment Method" type="select" value={form.payments[0].method}
            onChange={(e) => setForm({ ...form, payments: [{ ...form.payments[0], method: e.target.value }] })}>
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="mobile_banking">Mobile Banking</option>
            <option value="cheque">Cheque</option>
          </FormInput>
        </div>

        <FormInput label="Note" type="textarea" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />

        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Sale'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SaleForm;
