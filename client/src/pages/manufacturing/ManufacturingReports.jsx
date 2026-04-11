import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import { getManufacturingSummary } from '../../services/manufacturing.service';

const ManufacturingReports = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getManufacturingSummary()
      .then((res) => setSummary(res.data.data))
      .catch(() => toast.error('Something went wrong'))
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    { label: 'Total Plans', value: summary?.totalPlans || 0, color: 'text-blue-600' },
    { label: 'Work Orders', value: summary?.totalWorkOrders || 0, color: 'text-green-600' },
    { label: 'Active BOMs', value: summary?.activeBOMs || 0, color: 'text-orange-600' },
    { label: 'Sub. Orders', value: summary?.totalSubOrders || 0, color: 'text-purple-600' },
  ];

  const reports = [
    { title: 'Production Summary', desc: 'Overall production metrics and KPIs', link: '/manufacturing/production' },
    { title: 'Work Order Status', desc: 'Current status of all work orders', link: '/manufacturing/work-orders' },
    { title: 'Capacity Utilization', desc: 'Work center capacity analysis', link: '/manufacturing/capacity' },
    { title: 'BOM Analysis', desc: 'Bill of materials breakdown', link: '/manufacturing/bom' },
    { title: 'Subcontracting Report', desc: 'Subcontractor performance analysis', link: '/manufacturing/subcontracting-orders' },
    { title: 'Billing Overview', desc: 'Payment and billing status', link: '/manufacturing/subcontracting-billing' },
  ];

  return (
    <div>
      <PageHeader title="Manufacturing Reports & Dashboards" subtitle="Access comprehensive manufacturing analytics and insights" />

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {stats.map((s) => (
              <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
                <p className="text-xs text-gray-500">{s.label}</p>
                <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {reports.map((r) => (
              <div key={r.title} className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-900">{r.title}</h3>
                <p className="text-xs text-gray-500 mt-1 mb-4">{r.desc}</p>
                <a href={r.link} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 inline-block">View Report</a>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Summary</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div><span className="text-gray-500">In Progress Plans:</span> <strong>{summary?.inProgressPlans || 0}</strong></div>
              <div><span className="text-gray-500">Completed Plans:</span> <strong>{summary?.completedPlans || 0}</strong></div>
              <div><span className="text-gray-500">Pending Orders:</span> <strong>{summary?.pendingOrders || 0}</strong></div>
              <div><span className="text-gray-500">Total BOM Cost:</span> <strong>৳{(summary?.totalBOMCost || 0).toLocaleString()}</strong></div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ManufacturingReports;
