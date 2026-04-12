import { useState, useEffect } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getBrands, createBrand, updateBrand, deleteBrand } from '../../services/product.service';

const Brands = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState(null);
  const [form, setForm] = useState({ name: '', description: '' });

  const fetchBrands = async () => {
    try {
      const res = await getBrands();
      setData(res.data.data || []);
    } catch {
      toast.error('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  const resetForm = () => {
    setForm({ name: '', description: '' });
    setEditingBrand(null);
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.name) return toast.error('Brand name is required');
    try {
      if (editingBrand) {
        await updateBrand(editingBrand._id, form);
        toast.success('Brand updated');
      } else {
        await createBrand(form);
        toast.success('Brand created');
      }
      resetForm();
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleEdit = (brand) => {
    setEditingBrand(brand);
    setForm({ name: brand.name, description: brand.description || '' });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this brand?')) return;
    try {
      await deleteBrand(id);
      toast.success('Brand deleted');
      fetchBrands();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete brand');
    }
  };

  return (
    <div>
      <PageHeader title="Brands" subtitle="Manage product brands">
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Add Brand</button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <input type="text" placeholder="Search..." className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"><HiOutlineFunnel className="w-4 h-4" /> Filter</button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"><HiOutlineArrowDownTray className="w-4 h-4" /> Export</button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-600">BRAND NAME</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">DESCRIPTION</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="3" className="px-4 py-8 text-center text-gray-500">No brands found</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-gray-500">{row.description}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleEdit(row)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(row._id)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={resetForm} title={editingBrand ? 'Edit Brand' : 'Add Brand'} size="md">
        <div className="space-y-4">
          <FormInput label="Brand Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter brand name" />
          <FormInput label="Description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brand description" />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={resetForm} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">{editingBrand ? 'Update Brand' : 'Add Brand'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Brands;
