import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import useFetch from '../../hooks/useFetch';
import { getBOMs, createBOM, updateBOM, deleteBOM } from '../../services/manufacturing.service';
import { getProducts } from '../../services/product.service';

const bomStatuses = ['draft', 'active'];
const statusBg = { draft: 'bg-yellow-50 text-yellow-700', active: 'bg-green-50 text-green-700' };

const emptyMaterial = { name: '', quantity: '', unit: '', unitCost: '' };
const emptyOperation = { name: '', description: '', duration: '', cost: '' };

const BillOfMaterials = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', product: '', version: 'v1.0', status: 'draft' });
  const [materials, setMaterials] = useState([{ ...emptyMaterial }]);
  const [operations, setOperations] = useState([{ ...emptyOperation }]);

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getBOMs);

  useEffect(() => {
    getProducts({ limit: 200 }).then((res) => setProducts(res.data.data?.data || res.data.data || [])).catch(() => toast.error('Something went wrong'));
  }, []);

  const handleStatusChange = async (id, status) => {
    try { await updateBOM(id, { status }); toast.success('Status updated'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this BOM?')) return;
    try { await deleteBOM(id); toast.success('Deleted'); refetch(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  // Material row handlers
  const addMaterialRow = () => setMaterials((prev) => [...prev, { ...emptyMaterial }]);
  const removeMaterialRow = (idx) => setMaterials((prev) => prev.filter((_, i) => i !== idx));
  const updateMaterial = (idx, field, value) => {
    setMaterials((prev) => prev.map((m, i) => i === idx ? { ...m, [field]: value } : m));
  };

  // Operation row handlers
  const addOperationRow = () => setOperations((prev) => [...prev, { ...emptyOperation }]);
  const removeOperationRow = (idx) => setOperations((prev) => prev.filter((_, i) => i !== idx));
  const updateOperation = (idx, field, value) => {
    setOperations((prev) => prev.map((o, i) => i === idx ? { ...o, [field]: value } : o));
  };

  // Calculate costs
  const materialCost = materials.reduce((sum, m) => sum + (Number(m.quantity) || 0) * (Number(m.unitCost) || 0), 0);
  const operationCost = operations.reduce((sum, o) => sum + (Number(o.cost) || 0), 0);
  const totalCost = materialCost + operationCost;

  const resetForm = () => {
    setForm({ name: '', product: '', version: 'v1.0', status: 'draft' });
    setMaterials([{ ...emptyMaterial }]);
    setOperations([{ ...emptyOperation }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('BOM name is required');

    const validMaterials = materials
      .filter((m) => m.name.trim())
      .map((m) => ({
        name: m.name,
        quantity: Number(m.quantity) || 0,
        unit: m.unit,
        unitCost: Number(m.unitCost) || 0,
        totalCost: (Number(m.quantity) || 0) * (Number(m.unitCost) || 0),
      }));

    const validOperations = operations
      .filter((o) => o.name.trim())
      .map((o) => ({
        name: o.name,
        description: o.description,
        duration: Number(o.duration) || 0,
        cost: Number(o.cost) || 0,
      }));

    setSaving(true);
    try {
      await createBOM({
        ...form,
        materials: validMaterials,
        operations: validOperations,
        materialCost,
        operationCost,
        totalCost,
      });
      toast.success('BOM created');
      setModalOpen(false);
      resetForm();
      refetch();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create BOM'); }
    finally { setSaving(false); }
  };

  const boms = data || [];
  const activeBoms = boms.filter((b) => b.status === 'active').length;
  const bomTotalCost = boms.reduce((s, b) => s + (b.totalCost || 0), 0);

  return (
    <div>
      <PageHeader title="Bill of Materials (BOM)" subtitle="Manage raw materials and operations for product manufacturing">
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Create BOM</button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total BOMs</p><p className="text-2xl font-bold text-blue-600 mt-1">{boms.length}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Active</p><p className="text-2xl font-bold text-green-600 mt-1">{activeBoms}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Draft</p><p className="text-2xl font-bold text-yellow-600 mt-1">{boms.length - activeBoms}</p></div>
        <div className="bg-white rounded-xl border border-gray-200 p-4"><p className="text-xs text-gray-500">Total Cost</p><p className="text-2xl font-bold text-purple-600 mt-1">৳{bomTotalCost.toLocaleString()}</p></div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input type="text" placeholder="Search BOMs..." onChange={(e) => setSearch(e.target.value)} className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">PRODUCT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">VERSION</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">MATERIALS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">MATERIAL COST</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">OPERATION COST</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">TOTAL COST</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr></thead>
            <tbody>
              {loading ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">Loading...</td></tr>
              : boms.length === 0 ? <tr><td colSpan={8} className="text-center py-12 text-gray-400">No BOMs found</td></tr>
              : boms.map((b) => (
                <tr key={b._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3"><div><p className="font-medium text-gray-900">{b.name || b.product?.name || '-'}</p></div></td>
                  <td className="px-4 py-3"><StatusBadge color="blue">{b.version}</StatusBadge></td>
                  <td className="px-4 py-3 text-gray-700">{b.materials?.length || 0} items</td>
                  <td className="px-4 py-3 text-gray-700">৳{(b.materialCost || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">৳{(b.operationCost || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">৳{(b.totalCost || 0).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select value={b.status} onChange={(e) => handleStatusChange(b._id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${statusBg[b.status]}`}>
                      {bomStatuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(b._id)} className="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create BOM Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); resetForm(); }} title="Create Bill of Materials" size="xl">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="BOM Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Leather Wallet BOM" />
            <FormInput label="Product" type="select" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })}>
              <option value="">Select product</option>
              {products.map((p) => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
            </FormInput>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormInput label="Version" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="v1.0" />
            <FormInput label="Status" type="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </FormInput>
          </div>

          {/* Materials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Materials</label>
              <button type="button" onClick={addMaterialRow} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                <HiOutlinePlus className="w-3.5 h-3.5" /> Add Material
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">NAME</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 w-20">QTY</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 w-20">UNIT</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 w-24">UNIT COST</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 w-24">TOTAL</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map((m, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="px-2 py-1.5">
                        <input className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="Material name" value={m.name} onChange={(e) => updateMaterial(idx, 'name', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="0" min="0" value={m.quantity} onChange={(e) => updateMaterial(idx, 'quantity', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="pcs" value={m.unit} onChange={(e) => updateMaterial(idx, 'unit', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="0" min="0" value={m.unitCost} onChange={(e) => updateMaterial(idx, 'unitCost', e.target.value)} />
                      </td>
                      <td className="px-3 py-1.5 text-sm text-gray-700">৳{((Number(m.quantity) || 0) * (Number(m.unitCost) || 0)).toLocaleString()}</td>
                      <td className="px-2 py-1.5">
                        {materials.length > 1 && (
                          <button type="button" onClick={() => removeMaterialRow(idx)} className="p-1 text-gray-400 hover:text-red-500">
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 text-right mt-1">Material Cost: <span className="font-medium text-gray-700">৳{materialCost.toLocaleString()}</span></p>
          </div>

          {/* Operations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Operations</label>
              <button type="button" onClick={addOperationRow} className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium">
                <HiOutlinePlus className="w-3.5 h-3.5" /> Add Operation
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">NAME</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600">DESCRIPTION</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 w-24">DURATION (min)</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-gray-600 w-24">COST</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {operations.map((o, idx) => (
                    <tr key={idx} className="border-b border-gray-100">
                      <td className="px-2 py-1.5">
                        <input className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="Operation name" value={o.name} onChange={(e) => updateOperation(idx, 'name', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="Description" value={o.description} onChange={(e) => updateOperation(idx, 'description', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="0" min="0" value={o.duration} onChange={(e) => updateOperation(idx, 'duration', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-orange-400" placeholder="0" min="0" value={o.cost} onChange={(e) => updateOperation(idx, 'cost', e.target.value)} />
                      </td>
                      <td className="px-2 py-1.5">
                        {operations.length > 1 && (
                          <button type="button" onClick={() => removeOperationRow(idx)} className="p-1 text-gray-400 hover:text-red-500">
                            <HiOutlineTrash className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 text-right mt-1">Operation Cost: <span className="font-medium text-gray-700">৳{operationCost.toLocaleString()}</span></p>
          </div>

          {/* Total */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total BOM Cost</span>
            <span className="text-lg font-bold text-gray-900">৳{totalCost.toLocaleString()}</span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">{saving ? 'Creating...' : 'Create BOM'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillOfMaterials;
