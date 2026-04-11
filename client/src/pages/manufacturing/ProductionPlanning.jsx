import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import useFetch from '../../hooks/useFetch';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getPlans, createPlan, updatePlan, deletePlan, getManufacturingSummary } from '../../services/manufacturing.service';
import { getProducts } from '../../services/product.service';

const planStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
const statusBg = { scheduled: 'bg-yellow-50 text-yellow-700', in_progress: 'bg-blue-50 text-blue-700', completed: 'bg-green-50 text-green-700', cancelled: 'bg-red-50 text-red-700' };
const materialStatusColors = { available: 'green', partial: 'yellow', shortage: 'red' };

const ProductionPlanning = () => {
  const [summary, setSummary] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ product: '', quantity: '', startDate: '', endDate: '', resources: '', materialStatus: 'available', notes: '' });

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getPlans);

  useEffect(() => {
    getManufacturingSummary().then((res) => setSummary(res.data.data)).catch(() => {});
    getProducts({ limit: 200 }).then((res) => setProducts(res.data.data?.data || res.data.data || [])).catch(() => {});
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await updatePlan(id, { status });
      toast.success('Status updated');
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try { await deletePlan(id); toast.success('Deleted'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.product || !form.quantity || !form.startDate || !form.endDate) return toast.error('Fill required fields');
    setSaving(true);
    try {
      await createPlan({ ...form, quantity: Number(form.quantity) });
      toast.success('Plan created'); setModalOpen(false);
      setForm({ product: '', quantity: '', startDate: '', endDate: '', resources: '', materialStatus: 'available', notes: '' });
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setSaving(false); }
  };

  const plans = data || [];

  return (
    <div>
      <PageHeader title="Production Planning" subtitle="Manage production planning and resource allocation">
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Create Plan</button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Plans</p><p className="text-2xl font-bold text-blue-600 mt-1">{summary?.totalPlans || plans.length}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">In Progress</p><p className="text-2xl font-bold text-orange-600 mt-1">{summary?.inProgressPlans || 0}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600 mt-1">{summary?.completedPlans || 0}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Work Orders</p><p className="text-2xl font-bold text-purple-600 mt-1">{summary?.totalWorkOrders || 0}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input type="text" placeholder="Search plans..." onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">PLAN CODE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PRODUCT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">QTY</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">START</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">END</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">MATERIAL</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PROGRESS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : plans.length === 0 ? <tr><td colSpan={9} className="text-center py-12 text-gray-400">No plans found</td></tr>
              : plans.map((p) => (
                <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.planCode}</td>
                  <td className="px-4 py-3 text-gray-700">{p.product?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{p.quantity}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(p.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(p.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3"><StatusBadge color={materialStatusColors[p.materialStatus]}>{p.materialStatus}</StatusBadge></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1.5"><div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${p.progress || 0}%` }}></div></div>
                      <span className="text-xs text-gray-500">{p.progress || 0}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={p.status} onChange={(e) => handleStatusChange(p._id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${statusBg[p.status] || 'bg-gray-50 text-gray-700'}`}>
                      {planStatuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Create Production Plan" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Product *" type="select" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </FormInput>
            <FormInput label="Quantity *" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} min="1" />
            <FormInput label="Start Date *" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            <FormInput label="End Date *" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
          <FormInput label="Resources" value={form.resources} onChange={(e) => setForm({ ...form, resources: e.target.value })} placeholder="e.g. 10 machines, 50 workers" />
          <FormInput label="Notes" type="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create Plan'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProductionPlanning;
