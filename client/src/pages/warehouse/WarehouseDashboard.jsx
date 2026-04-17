import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlineArchiveBox,
  HiOutlineCurrencyDollar,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineArrowsRightLeft,
  HiOutlineExclamationTriangle,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useWarehouse } from '../../context/WarehouseContext';
import { getWarehouseDashboard, getStockMovementChart, getStockByCategory } from '../../services/warehouseOps.service';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#06b6d4', '#f97316'];

const WarehouseDashboard = () => {
  const { selectedWarehouse } = useWarehouse();
  const [dashboard, setDashboard] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!selectedWarehouse?._id) return;
    setLoading(true);

    const warehouseId = selectedWarehouse._id;

    Promise.all([
      getWarehouseDashboard({ warehouse: warehouseId }),
      getStockMovementChart({ warehouse: warehouseId, days: 7 }),
      getStockByCategory({ warehouse: warehouseId }),
    ])
      .then(([dashRes, chartRes, catRes]) => {
        setDashboard(dashRes.data.data);
        setChartData(chartRes.data.data || []);
        setCategoryData(catRes.data.data || []);
      })
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, [selectedWarehouse?._id]);

  if (!selectedWarehouse) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Select a warehouse from the top bar to view dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const d = dashboard || {};

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Warehouse Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Real-time warehouse operations overview</p>
        </div>
        <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Row 1 — 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <KPICard
          title="Total Warehouse Stock"
          value={(d.totalStock || 0).toLocaleString()}
          subtitle="2.5% from last week"
          subtitleColor="text-green-500"
          icon={HiOutlineArchiveBox}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <KPICard
          title="Stock Value"
          value={`$${((d.stockValue || 0) / 1000).toFixed(1)}K`}
          icon={HiOutlineCurrencyDollar}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <KPICard
          title="Today Received"
          value={(d.todayReceived || 0).toLocaleString()}
          subtitle={`${d.todayReceivedCount || 0} items`}
          subtitleColor="text-green-500"
          icon={HiOutlineArrowDownTray}
          iconBg="bg-green-50"
          iconColor="text-green-500"
        />
        <KPICard
          title="Today Issued"
          value={(d.todayIssued || 0).toLocaleString()}
          subtitle={`${d.todayIssuedCount || 0} items`}
          subtitleColor="text-red-500"
          icon={HiOutlineArrowUpTray}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
      </div>

      {/* Row 2 — 3 Secondary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <SecondaryCard
          title="Pending Transfers"
          value={d.pendingTransfers || 0}
          icon={HiOutlineArrowsRightLeft}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <SecondaryCard
          title="Low Stock Alerts"
          value={d.lowStockAlerts || 0}
          icon={HiOutlineExclamationTriangle}
          iconBg="bg-red-50"
          iconColor="text-red-500"
        />
        <SecondaryCard
          title="Damaged Stock"
          value={d.damagedStock || 0}
          icon={HiOutlineExclamationCircle}
          iconBg="bg-yellow-50"
          iconColor="text-yellow-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Stock Movement Line Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Stock Movement (Last 7 Days)</h3>
          {chartData.length === 0 ? (
            <p className="text-xs text-gray-400 py-16 text-center">No movement data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="received" name="Received" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="issued" name="Issued" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Stock by Category Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Stock by Category</h3>
          {categoryData.length === 0 ? (
            <p className="text-xs text-gray-400 py-16 text-center">No category data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="totalStock"
                  nameKey="category"
                  label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                >
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => val.toLocaleString()}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(val) => <span className="text-xs text-gray-600">{val}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

const KPICard = ({ title, value, subtitle, subtitleColor, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-start justify-between">
    <div className="flex-1">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
      {subtitle && <p className={`text-xs mt-1 ${subtitleColor || 'text-gray-400'}`}>{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-lg ${iconBg}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
  </div>
);

const SecondaryCard = ({ title, value, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
    </div>
    <div className={`p-3 rounded-lg ${iconBg}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
  </div>
);

export default WarehouseDashboard;
