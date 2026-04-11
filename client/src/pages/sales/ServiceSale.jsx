import { useState, useEffect } from 'react';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import toast from 'react-hot-toast';
import { getSales, updateSaleStatus } from '../../services/sale.service';

const saleStatuses = ['draft', 'confirmed', 'delivered', 'returned', 'cancelled'];
const statusBg = {
  confirmed: 'bg-green-50 text-green-700',
  delivered: 'bg-blue-50 text-blue-700',
  draft: 'bg-orange-50 text-orange-700',
  cancelled: 'bg-red-50 text-red-700',
  returned: 'bg-yellow-50 text-yellow-700',
};

const ServiceSale = () => {
  const [search, setSearch] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    getSales({ type: 'service' })
      .then((res) => {
        const d = res.data?.data;
        setData(Array.isArray(d) ? d : d?.data || d?.docs || []);
      })
      .catch(() => toast.error('Failed to load service sales'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateSaleStatus(id, newStatus);
      setData((prev) => prev.map((row) => row._id === id ? { ...row, status: newStatus } : row));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = data.filter((d) => {
    const term = search.toLowerCase();
    return (d.customer?.name || '').toLowerCase().includes(term) || (d.invoiceNo || '').toLowerCase().includes(term);
  });

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
                <th className="text-left px-4 py-3 font-medium text-gray-600">INVOICE NO</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">CUSTOMER</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DATE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">AMOUNT</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No service sales found</td></tr>
              ) : filtered.map((row) => (
                <tr key={row._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.invoiceNo}</td>
                  <td className="px-4 py-3 text-gray-700">{row.customer?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(row.saleDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">৳{row.grandTotal?.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <select
                      value={row.status}
                      onChange={(e) => handleStatusChange(row._id, e.target.value)}
                      className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${statusBg[row.status] || 'bg-gray-50 text-gray-700'}`}
                    >
                      {saleStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
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
