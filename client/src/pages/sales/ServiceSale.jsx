import { useState } from 'react';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';

const serviceStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
const statusBg = { Completed: 'bg-green-50 text-green-700', 'In Progress': 'bg-yellow-50 text-yellow-700', Pending: 'bg-orange-50 text-orange-700', Cancelled: 'bg-red-50 text-red-700' };

const initialData = [
  { id: 'SRV-001', customer: 'ABC Corp', service: 'Consultation', date: '2026-03-25', amount: 450, status: 'Completed' },
  { id: 'SRV-002', customer: 'Tech Solutions', service: 'Maintenance', date: '2026-03-24', amount: 800, status: 'In Progress' },
  { id: 'SRV-003', customer: 'Rafiq Trading', service: 'Leather Finishing', date: '2026-03-22', amount: 1200, status: 'Pending' },
];

const ServiceSale = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState(initialData);

  const handleStatusChange = (id, newStatus) => {
    setData((prev) => prev.map((row) => row.id === id ? { ...row, status: newStatus } : row));
    toast.success('Status updated');
  };

  const filtered = data.filter((d) => d.customer.toLowerCase().includes(search.toLowerCase()) || d.id.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader title="Service Sale" subtitle="Manage service-based sales">
        <button className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ New Service</button>
      </PageHeader>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64" />
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"><HiOutlineFunnel className="w-4 h-4" /> Filter</button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"><HiOutlineArrowDownTray className="w-4 h-4" /> Export</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">SERVICE ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">CUSTOMER</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">SERVICE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DATE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">AMOUNT</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.id}</td>
                  <td className="px-4 py-3 text-gray-700">{row.customer}</td>
                  <td className="px-4 py-3 text-gray-700">{row.service}</td>
                  <td className="px-4 py-3 text-gray-700">{row.date}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">${row.amount}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.status}
                      onChange={(e) => handleStatusChange(row.id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${statusBg[row.status] || 'bg-gray-50 text-gray-700'}`}
                    >
                      {serviceStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ServiceSale;
