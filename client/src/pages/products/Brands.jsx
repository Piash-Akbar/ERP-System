import { useState } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';

const demoData = [
  { id: 1, name: 'Premium', products: 65, description: 'Premium leather products' },
  { id: 2, name: 'Classic', products: 32, description: 'Classic designs' },
  { id: 3, name: 'Elite', products: 24, description: 'Elite collection' },
];

const Brands = () => {
  const [data, setData] = useState(demoData);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  const handleAdd = () => {
    if (!form.name) return;
    setData([...data, { id: data.length + 1, name: form.name, products: 0, description: form.description }]);
    setForm({ name: '', description: '' });
    setModalOpen(false);
  };

  return (
    <div>
      <PageHeader title="Brands" subtitle="Manage product brands">
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Add Brand</button>
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
            <th className="text-left px-4 py-3 font-medium text-gray-600">PRODUCTS</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">DESCRIPTION</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
          </tr></thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.name}</td>
                <td className="px-4 py-3 text-gray-700">{row.products}</td>
                <td className="px-4 py-3 text-gray-500">{row.description}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"><HiOutlinePencilSquare className="w-4 h-4" /></button>
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"><HiOutlineTrash className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Brand" size="md">
        <div className="space-y-4">
          <FormInput label="Brand Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter brand name" />
          <FormInput label="Description" type="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brand description" />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleAdd} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">Add Brand</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Brands;
