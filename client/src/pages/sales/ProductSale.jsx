import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import { getContacts } from '../../services/contact.service';
import { getProducts } from '../../services/product.service';
import { createSale } from '../../services/sale.service';
import ContactForm from '../contacts/ContactForm';

const emptyItem = { product: '', name: '', quantity: 1, unitPrice: 0, purchasePrice: 0 };

const ProductSale = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [form, setForm] = useState({
    customer: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ ...emptyItem }],
    tax: 0,
    shippingCharge: 0,
    otherCharges: 0,
    previousDues: 0,
  });

  const loadCustomers = (selectLatest = false) => {
    return getContacts({ type: 'customer', limit: 500 })
      .then((res) => {
        const d = res.data?.data;
        const list = Array.isArray(d) ? d : d?.data || d?.docs || [];
        setCustomers(list);
        if (selectLatest && list.length) {
          const newest = [...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          setForm((prev) => ({ ...prev, customer: newest._id }));
        }
      })
      .catch(() => toast.error('Failed to load customers'));
  };

  useEffect(() => {
    loadCustomers();
    getProducts({ limit: 500 })
      .then((res) => {
        const d = res.data?.data;
        setProducts(Array.isArray(d) ? d : d?.data || d?.docs || []);
      })
      .catch(() => toast.error('Failed to load products'));
  }, []);

  const updateItem = (index, field, value) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };

    // Auto-fill price when product is selected
    if (field === 'product' && value) {
      const prod = products.find((p) => p._id === value);
      if (prod) {
        items[index].name = prod.name;
        items[index].unitPrice = prod.sellingPrice || 0;
        items[index].purchasePrice = prod.purchasePrice || 0;
        // console.log(prod);
      }
    }

    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...emptyItem }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const subtotal = form.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const total = subtotal + form.tax + form.shippingCharge + form.otherCharges + form.previousDues;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.customer) return toast.error('Select a customer');
    if (!form.items.some((item) => item.product)) return toast.error('Add at least one product');

    setSubmitting(true);
    try {
      const payload = {
        customer: form.customer,
        saleDate: form.date,
        items: form.items.filter((item) => item.product).map((item) => ({
          product: item.product,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          
          subtotal: item.quantity * item.unitPrice,
        })),
        subtotal,
        taxAmount: form.tax,
        shippingCharge: form.shippingCharge,
        otherCharge: form.otherCharges,
        previousDue: form.previousDues,
        grandTotal: total,
      };
      await createSale(payload);
      toast.success('Sale created successfully');
      navigate('/sales');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create sale');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader title="New Product Sale" subtitle="Create a new product sale invoice" />

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Customer Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Customer" name="customer" type="select" value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })}>
              <option value="">Select customer</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name}{c.company ? ` (${c.company})` : ''}</option>
              ))}
            </FormInput>
            <FormInput label="Date" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </div>
            <button type="button" onClick={() => setShowContactModal(true)} className="self-end text-sm text-blue-600 hover:text-blue-800">+ Add Customer</button>
        </div>

        {/* Products */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-gray-900">Products</h3>
            <button type="button" onClick={addItem} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Add Item</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium text-gray-600">Product</th>
                  <th className="text-left py-2 font-medium text-gray-600 w-20">Qty</th>
                  <th className="text-left py-2 font-medium text-gray-600 w-28">Price</th>
                  <th className="text-left py-2 font-medium text-gray-600 w-28">Total</th>
                  <th className="text-left py-2 font-medium text-gray-600 w-28">Purchase Price</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {form.items.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-2">
                      <select value={item.product} onChange={(e) => updateItem(i, 'product', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400">
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 pr-2"><input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></td>
                    <td className="py-2 pr-2"><input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(i, 'unitPrice', Number(e.target.value))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" /></td>
                    <td className="py-2 pr-2 font-medium text-gray-900">৳{(item.quantity * item.unitPrice).toFixed(2)}</td>
                    <td className='py-2 pr-2 font-medium text-gray-900'>৳{(item.purchasePrice)}</td>
                    <td className="py-2">{form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Charges + Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Additional Charges</h3>
            <div className="space-y-3">
              <FormInput label="TAX (%)" type="number" value={form.tax} min={0} onChange={(e) => setForm({ ...form, tax: Number(e.target.value) })} />
              <FormInput label="Shipping Charge" type="number" value={form.shippingCharge} min={0} onChange={(e) => setForm({ ...form, shippingCharge: Number(e.target.value) })} />
              <FormInput label="Other Charges" type="number" value={form.otherCharges} min={0} onChange={(e) => setForm({ ...form, otherCharges: Number(e.target.value) })} />
              <FormInput label="Previous Dues" type="number" value={form.previousDues} min={0} onChange={(e) => setForm({ ...form, previousDues: Number(e.target.value) })} />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span className="text-gray-900">৳{subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">TAX</span><span className="text-gray-900">৳{form.tax.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Shipping</span><span className="text-gray-900">৳{form.shippingCharge.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Other Charges</span><span className="text-gray-900">৳{form.otherCharges.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Previous Dues</span><span className="text-gray-900">৳{form.previousDues.toFixed(2)}</span></div>
              <hr className="border-gray-200" />
              <div className="flex justify-between"><span className="text-base font-semibold text-gray-900">Total</span><span className="text-2xl font-bold text-gray-900">৳{total.toFixed(2)}</span></div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/sales')} className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Cancel</button>
          <button type="submit" disabled={submitting} className="px-6 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Sale'}
          </button>
        </div>
      </form>

      <ContactForm
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        onSuccess={() => loadCustomers(true)}
      />
    </div>
  );
};

export default ProductSale;
