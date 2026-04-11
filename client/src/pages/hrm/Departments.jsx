import { useState } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';

const demoData = [
  { code: 'DEPT-001', name: 'Sales & Marketing', manager: 'John Doe', employees: 15, description: 'Handles sales and marketing operations', status: 'Active' },
  { code: 'DEPT-002', name: 'Production', manager: 'Jane Smith', employees: 25, description: 'Manufacturing and quality control', status: 'Active' },
  { code: 'DEPT-003', name: 'Finance & Accounts', manager: 'Mike Johnson', employees: 8, description: 'Finance management and accounting', status: 'Active' },
];

const deptStatuses = ['Active', 'Inactive'];

const Departments = () => {
  const [data, setData] = useState(demoData);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <PageHeader title="Departments" subtitle="Manage organizational departments">
        <button onClick={() => setModalOpen(true)} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ Add Department</button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200"><input type="text" placeholder="Search departments..." className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" /></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-gray-50 border-b border-gray-200">
            <th className="text-left px-4 py-3 font-medium text-gray-600">CODE</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">DEPARTMENT</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">MANAGER</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">EMPLOYEES</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">DESCRIPTION</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
            <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
          </tr></thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.code} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{d.code}</td>
                <td className="px-4 py-3 text-gray-700">{d.name}</td>
                <td className="px-4 py-3 text-gray-700">{d.manager}</td>
                <td className="px-4 py-3 text-gray-700">{d.employees}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{d.description}</td>
                <td className="px-4 py-3">
                    <select
                      value={d.status}
                      onChange={(e) => setData((prev) => prev.map((item) => item.code === d.code ? { ...item, status: e.target.value } : item))}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${d.status === 'Active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
                    >
                      {deptStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Department" size="md">
        <div className="space-y-4">
          <FormInput label="Department Name" placeholder="Enter department name" />
          <FormInput label="Manager" type="select"><option value="">Select manager</option></FormInput>
          <FormInput label="Description" type="textarea" placeholder="Department description" />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">Add Department</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Departments;
