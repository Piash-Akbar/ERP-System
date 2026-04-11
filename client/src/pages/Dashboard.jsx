import { useState, useEffect } from 'react';
import {
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
  HiOutlineBuildingLibrary,
  HiOutlineBanknotes,
} from 'react-icons/hi2';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { getDashboardSummary, getDashboardChart } from '../services/dashboard.service';

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'Financial Year' },
];

const fmt = (n) => `$${(n || 0).toLocaleString()}`;

const Dashboard = () => {
  const [period, setPeriod] = useState('year');
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getDashboardSummary(period)
      .then((res) => setSummary(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    getDashboardChart()
      .then((res) => setChartData(res.data.data))
      .catch(() => {});
  }, []);

  const cards = summary?.cards || {};

  return (
    <div className="min-h-screen">
      {/* Header + period filter */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500 mt-1">Welcome to Annex Leather ERP</p>
        </div>
        <div className="flex bg-white border border-gray-200 rounded-lg p-1 gap-1">
          {periods.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${
                period === p.key
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        </div>
      ) : (
        <>
          {/* Row 1 — 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <SummaryCard
              title="Total Revenue"
              value={fmt(cards.totalSales || 245680)}
              subtitle={`Revenue for ${period === 'today' ? 'today' : period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'financial year'}`}
              icon={HiOutlineCurrencyDollar}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <SummaryCard
              title="Total Dues"
              value={fmt(cards.salesDue || 48200)}
              subtitle="14.5% due still remains"
              icon={HiOutlineExclamationCircle}
              iconBg="bg-red-50"
              iconColor="text-red-500"
            />
            <SummaryCard
              title="Expenses"
              value={fmt(cards.totalExpense || 128450)}
              subtitle="Total expenses this period"
              icon={HiOutlineCurrencyDollar}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
            />
            <SummaryCard
              title="Net Profit"
              value={fmt(cards.netProfit || 92560)}
              subtitle="Revenue - Expenses"
              icon={HiOutlineCurrencyDollar}
              iconBg="bg-green-50"
              iconColor="text-green-500"
            />
          </div>

          {/* Row 2 — 4 Smaller Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <MiniCard
              title="Purchase Due"
              value={fmt(cards.purchaseDue || 32100)}
              icon={HiOutlineCurrencyDollar}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
            />
            <MiniCard
              title="Invoice Due"
              value={fmt(cards.customerDue || 16890)}
              icon={HiOutlineCurrencyDollar}
              iconBg="bg-red-50"
              iconColor="text-red-500"
            />
            <MiniCard
              title="Total in Bank"
              value={fmt(cards.bankBalance || 456780)}
              icon={HiOutlineBuildingLibrary}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <MiniCard
              title="Cash in Hand"
              value={fmt(cards.cashBalance || 34560)}
              icon={HiOutlineBanknotes}
              iconBg="bg-green-50"
              iconColor="text-green-500"
            />
          </div>

          {/* Charts Row — Sales vs Expenses + Profit Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Sales vs Expenses Bar Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Sales vs Expenses</h3>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
                    Sales
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block"></span>
                    Expenses
                  </span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => `$${val.toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                  <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Profit Trend Area Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-800">Profit Trend</h3>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart
                  data={chartData.map((d) => ({
                    ...d,
                    profit: (d.sales || 0) - (d.purchases || 0) - (d.expenses || 0),
                  }))}
                  margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => `$${val.toLocaleString()}`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                  />
                  <defs>
                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="profit"
                    name="Profit"
                    stroke="#14b8a6"
                    fill="url(#profitGradient)"
                    strokeWidth={2.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cash Flow — Full Width Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-800">Cash Flow</h3>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-teal-500 inline-block"></span>
                  Inflow
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block"></span>
                  Outflow
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData.map((d) => ({
                  month: d.month,
                  inflow: d.sales || 0,
                  outflow: (d.purchases || 0) + (d.expenses || 0),
                }))}
                margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val) => `$${val.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Bar dataKey="inflow" name="Inflow" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="outflow" name="Outflow" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
};

/* ---- Sub-components ---- */

const SummaryCard = ({ title, value, subtitle, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-start justify-between">
    <div className="flex-1">
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
    <div className={`p-3 rounded-lg ${iconBg}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
  </div>
);

const MiniCard = ({ title, value, icon: Icon, iconBg, iconColor }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
    <div>
      <p className="text-xs text-gray-500 font-medium">{title}</p>
      <p className="text-lg font-bold text-gray-900 mt-1">{value}</p>
    </div>
    <div className={`p-2.5 rounded-lg ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
  </div>
);

export default Dashboard;
