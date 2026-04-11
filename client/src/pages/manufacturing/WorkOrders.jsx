import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import useFetch from '../../hooks/useFetch';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getWorkOrders, createWorkOrder, updateWorkOrder, deleteWorkOrder, getManufacturingSummary, getWorkCenters } from '../../services/manufacturing.service';
import { getProducts } from '../../services/product.service';

const woStatuses = ['pending', 'in_progress', 'completed', 'shipping', 'cancelled'];
const priorities = ['high', 'medium', 'low'];
const statusBg = { pending: 'bg-yellow-50 text-yellow-700', in_progress: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700', shipping: 'bg-purple-50 text-purple-700', cancelled: 'bg-red-50 text-red-700' };
const priorityBg = { high: 'bg-red-50 text-red-700', medium: 'bg-orange-50 text-orange-700', low: 'bg-yellow-50 text-yellow-700' };

const WorkOrders = () => {
  const [summary, setSummary] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [workCenters, setWorkCenters] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: '', dueDate: '', priority: 'medium', workCenter: '', assignedTo: '', notes: '' });

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getWorkOrders);

  useEffect(() => {
    getManufacturingSummary().then((res) => setSummary(res.data.data)).catch(() => {});
    getProducts({ limit: 200 }).then((res) => setProducts(res.data.data?.data || res.data.data || [])).catch(() => {});
    getWorkCenters({ limit: 200 }).then((res) => setWorkCenters(res.data.data?.data || res.data.data || [])).catch(() => {});
  }, []);

  const handleStatusChange = async (id, status) => {
    try { await updateWorkOrder(id, { status }); toast.success('Status updated'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete?')) return;
    try { await deleteWorkOrder(id); toast.success('Deleted'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product || !form.quantity || !form.dueDate) return toast.error('Fill required fields');
    setSaving(true);
    try {
      const payload = {
        product: form.product,
        quantity: Number(form.quantity),
        dueDate: form.dueDate,
        priority: form.priority,
        assignedTo: form.assignedTo,
        notes: form.notes,
      };
      if (form.workCenter) payload.workCenter = form.workCenter;
      await createWorkOrder(payload);
      toast.success('Work order created'); setModalOpen(false);
      setForm({ product: '', quantity: '', dueDate: '', priority: 'medium', workCenter: '', assignedTo: '', notes: '' });
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const orders = data || [];

  return (
    <div>
      <PageHeader title="Work Orders" subtitle="Manage and track manufacturing work orders">
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Create Work Order</button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Orders</p><p className="text-2xl font-bold text-blue-600 mt-1">{summary?.totalWorkOrders || orders.length}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">In Progress</p><p className="text-2xl font-bold text-orange-600 mt-1">{summary?.inProgressOrders || 0}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600 mt-1">{summary?.completedOrders || 0}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold text-yellow-600 mt-1">{summary?.pendingOrders || 0}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input type="text" placeholder="Search work orders..." onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">WO CODE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PRODUCT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">QTY</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">WORK CENTER</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">DUE DATE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PRIORITY</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : orders.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No work orders found</td></tr>
              : orders.map((o) => (
                <tr key={o._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{o.orderCode}</td>
                  <td className="px-4 py-3 text-gray-700">{o.product?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{o.quantity}</td>
                  <td className="px-4 py-3 text-gray-700">{o.workCenter?.name || o.assignedTo || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(o.dueDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <select value={o.priority} onChange={(e) => updateWorkOrder(o._id, { priority: e.target.value }).then(() => { toast.success('Priority updated'); refetch(); }).catch(() => toast.error('Failed'))}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${priorityBg[o.priority]}`}>
                      {priorities.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select value={o.status} onChange={(e) => handleStatusChange(o._id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${statusBg[o.status]}`}>
                      {woStatuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Work Order" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Product *" type="select" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </FormInput>
            <FormInput label="Quantity *" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
            <FormInput label="Due Date *" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            <FormInput label="Priority" type="select" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
            </FormInput>
          </div>
          <FormInput label="Work Center" type="select" value={form.workCenter} onChange={(e) => setForm({ ...form, workCenter: e.target.value })}>
            <option value="">Select work center (optional)</option>
            {workCenters.map((wc) => <option key={wc._id} value={wc._id}>{wc.name} ({wc.capacity} {wc.unit})</option>)}
          </FormInput>
          <FormInput label="Assigned To" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} placeholder="e.g. Team Lead - Ahmed" />
          <FormInput label="Notes" type="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default WorkOrders;
