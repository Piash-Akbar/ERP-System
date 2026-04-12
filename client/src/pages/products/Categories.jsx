import { useState, useEffect } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/product.service';

const Categories = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState({ name: '', parent: '', description: '' });

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setData(res.data.data || []);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setForm({ name: '', parent: '', description: '' });
    setEditingCategory(null);
    setModalOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.name) return toast.error('Category name is required');
    try {
      if (editingCategory) {
        await updateCategory(editingCategory._id, form);
        toast.success('Category updated');
      } else {
        await createCategory(form);
        toast.success('Category created');
      }
      resetForm();
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      parent: category.parent?._id || category.parent || '',
      description: category.description || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete category');
    }
  };

  return (
    <div>
      <PageHeader title="Categories" subtitle="Manage product categories">
        <button onClick={() => { resetForm(); setModalOpen(true); }} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Add Category</button>
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
            <th className="text-left px-4 py-3 font-medium text-gray-600">CATEGORY NAME</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">PARENT CATEGORY</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">DESCRIPTION</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
          </tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan="4" className="px-4 py-8 text-center text-gray-500">No categories found</td></tr>
            ) : (
              data.map((row) => (
                <tr key={row._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-gray-700">{row.parent?.name || '-'}</td>
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

      <Modal isOpen={modalOpen} onClose={resetForm} title={editingCategory ? 'Edit Category' : 'Add Category'} size="md">
        <div className="space-y-4">
          <FormInput label="Category Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter category name" />
          <FormInput label="Parent Category" type="select" value={form.parent} onChange={(e) => setForm({ ...form, parent: e.target.value })}>
            <option value="">None (Top Level)</option>
            {data.filter((c) => c._id !== editingCategory?._id).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </FormInput>
          <FormInput label="Description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Category description" />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={resetForm} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleSubmit} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">{editingCategory ? 'Update Category' : 'Add Category'}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
