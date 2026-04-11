import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import useFetch from '../../hooks/useFetch';
import { getSubcontractingOrders, createSubcontractingOrder, updateSubcontractingOrder, deleteSubcontractingOrder, getSubcontractingItems } from '../../services/manufacturing.service';
import { getContacts } from '../../services/contact.service';

const scStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
const statusBg = { pending: 'bg-yellow-50 text-yellow-700', in_progress: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700' };

const emptyItem = { item: '', quantity: '', unitCost: '' };

const SubcontractingOrders = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [scItems, setScItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ orderCode: '', supplier: '', dueDate: '', paidAmount: '', notes: '' });
  const [items, setItems] = useState([{ ...emptyItem }]);

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getSubcontractingOrders);

  useEffect(() => {
    getContacts({ type: 'supplier', limit: 100 }).then((res) => setSuppliers(res.data.data?.data || res.data.data || [])).catch(() => toast.error('Something went wrong'));
    getSubcontractingItems({ limit: 200 }).then((res) => setScItems(res.data.data?.data || res.data.data || [])).catch(() => toast.error('Something went wrong'));
  }, []);

  const handleStatusChange = async (id, status) => {
    try { await updateSubcontractingOrder(id, { status }); toast.success('Status updated'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await deleteSubcontractingOrder(id); toast.success('Deleted'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  // Item row handlers
  const addItemRow = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItemRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((item, i) => {
      if (i !== idx) return item;
      const updated = { ...item, [field]: value };
      // Auto-fill unit cost when selecting an item
      if (field === 'item') {
        const selected = scItems.find((s) => s._id === value);
        if (selected) updated.unitCost = selected.unitCost || '';
      }
      return updated;
    }));
  };

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitCost) || 0), 0);
  const dueAmount = totalAmount - (Number(form.paidAmount) || 0);

  const resetForm = () => {
    setForm({ orderCode: '', supplier: '', dueDate: '', paidAmount: '', notes: '' });
    setItems([{ ...emptyItem }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.orderCode) return toast.error('Order code is required');
    if (!form.supplier) return toast.error('Supplier is required');

    const validItems = items
      .filter((i) => i.item)
      .map((i) => ({
        item: i.item,
        quantity: Number(i.quantity) || 0,
        unitCost: Number(i.unitCost) || 0,
        totalCost: (Number(i.quantity) || 0) * (Number(i.unitCost) || 0),
      }));

    if (validItems.length === 0) return toast.error('Add at least one item');

    setSaving(true);
    try {
      await createSubcontractingOrder({
        orderCode: form.orderCode,
        supplier: form.supplier,
        items: validItems,
        totalAmount,
        dueDate: form.dueDate || undefined,
        paidAmount: Number(form.paidAmount) || 0,
        dueAmount: Math.max(0, dueAmount),
        notes: form.notes,
      });
      toast.success('Order created');
      setModalOpen(false);
      resetForm();
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create order'); }
    finally { setSaving(false); }
  };

  const orders = data || [];
  const pending = orders.filter((o) => o.status === 'pending').length;
  const totalAmt = orders.reduce((s, o) => s + (o.totalAmount || 0), 0);

  return (
    <div>
      <PageHeader title="Subcontracting Orders" subtitle="Manage orders placed with subcontractors">
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Create Order</button>
      </PageHeader>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Pending Orders</p><p className="text-2xl font-bold text-orange-600 mt-1">{pending}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Amount</p><p className="text-2xl font-bold text-blue-600 mt-1">৳{totalAmt.toLocaleString()}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Orders</p><p className="text-2xl font-bold text-green-600 mt-1">{orders.length}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input type="text" placeholder="Search orders..." onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">ORDER CODE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">SUPPLIER</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ITEMS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">AMOUNT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PAID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">DUE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : orders.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No orders found</td></tr>
              : orders.map((o) => (
                <tr key={o._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.orderCode}</td>
                  <td className="px-4 py-3 text-gray-700">{o.supplier?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{o.items?.length || 0}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">৳{(o.totalAmount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-green-600">৳{(o.paidAmount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-red-600 font-medium">৳{(o.dueAmount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${statusBg[o.status]}`}>
                      {scStatuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(o._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="Create Subcontracting Order" size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Order Code *" value={form.orderCode} onChange={(e) => setForm({ ...form, orderCode: e.target.value })} placeholder="e.g. SCO-001" />
            <FormInput label="Supplier *" type="select" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })}>
              <option value="">Select supplier</option>
              {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </FormInput>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Due Date" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <FormInput label="Paid Amount" type="number" value={form.paidAmount} onChange={(e) => setForm({ ...form, paidAmount: e.target.value })} placeholder="0" min="0" />
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Order Items</label>
              <button type="button" onClick={addItemRow} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                <HiOutlinePlus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">ITEM</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 w-24">QTY</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 w-28">UNIT COST</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 w-28">TOTAL</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="px-2 py-1.5">
                        <select className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" value={item.item} onChange={(e) => updateItem(idx, 'item', e.target.value)}>
                          <option value="">Select item</option>
                          {scItems.map((si) => <option key={si._id} value={si._id}>{si.name} {si.category ? `(${si.category})` : ''}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="0" min="1" value={item.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="0" min="0" value={item.unitCost} onChange={(e) => updateItem(idx, 'unitCost', e.target.value)} />
                      </td>
                      <td className="px-3 py-1.5 text-sm text-gray-700">৳{((Number(item.quantity) || 0) * (Number(item.unitCost) || 0)).toLocaleString()}</td>
                      <td className="px-2 py-1.5">
                        {items.length > 1 && (
                          <button type="button" onClick={() => removeItemRow(idx)} className="p-1 text-gray-400 hover:text-red-500">
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-medium text-gray-900">৳{totalAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Paid</span>
              <span className="font-medium text-green-600">৳{(Number(form.paidAmount) || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-gray-200 pt-1">
              <span className="font-medium text-gray-700">Due</span>
              <span className="font-bold text-red-600">৳{Math.max(0, dueAmount).toLocaleString()}</span>
            </div>
          </div>

          <FormInput label="Notes" type="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Additional notes..." />

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create Order'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SubcontractingOrders;
