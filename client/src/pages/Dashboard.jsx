import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineCurrencyDollar,
  HiOutlineExclamationCircle,
  HiOutlineBuildingLibrary,
  HiOutlineBanknotes,
  HiOutlinePlus,
  HiOutlineCube,
  HiOutlineArrowsRightLeft,
  HiOutlineUserPlus,
  HiOutlineDocumentText,
  HiOutlineShoppingCart,
  HiOutlineBell,
  HiOutlineClipboardDocumentCheck,
  HiOutlineArchiveBox,
  HiOutlineClock,
  HiOutlineChevronRight,
} from 'react-icons/hi2';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area,
} from 'recharts';
import { getDashboardSummary, getDashboardChart } from '../services/dashboard.service';
import { getLeaveApplications } from '../services/leave.service';
import { getNotifications } from '../services/notification.service';
import { getActivityLogs } from '../services/activityLog.service';
import { getLowStock } from '../services/inventory.service';

const RECENT_MODULES_KEY = 'recentModules';
const QUICK_ACTIONS = [
  { label: 'Create Sale', to: '/sales/product-sale', icon: HiOutlineShoppingCart, color: 'bg-blue-50 text-blue-600' },
  { label: 'Add Product', to: '/products/add', icon: HiOutlineCube, color: 'bg-orange-50 text-orange-600' },
  { label: 'Add Expense', to: '/accounts/expenses', icon: HiOutlineCurrencyDollar, color: 'bg-red-50 text-red-600' },
  { label: 'Transfer Stock', to: '/inventory/adjustment', icon: HiOutlineArrowsRightLeft, color: 'bg-teal-50 text-teal-600' },
  { label: 'New Purchase', to: '/purchase', icon: HiOutlineDocumentText, color: 'bg-purple-50 text-purple-600' },
  { label: 'Add Staff', to: '/hrm', icon: HiOutlineUserPlus, color: 'bg-green-50 text-green-600' },
];

const SHORTCUT_MODULES = [
  { label: 'Inventory', to: '/inventory', icon: HiOutlineArchiveBox },
  { label: 'POS / Sales', to: '/sales', icon: HiOutlineShoppingCart },
  { label: 'Accounts', to: '/accounts/transactions', icon: HiOutlineCurrencyDollar },
  { label: 'Purchase', to: '/purchase', icon: HiOutlineDocumentText },
  { label: 'Reports', to: '/accounts/profit-loss', icon: HiOutlineDocumentText },
  { label: 'Warehouse', to: '/locations/warehouses', icon: HiOutlineBuildingLibrary },
];

const timeAgo = (date) => {
  if (!date) return '';
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const periods = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'year', label: 'Financial Year' },
];

const fmt = (n) => `৳${(n || 0).toLocaleString()}`;

const Dashboard = () => {
  const [period, setPeriod] = useState('year');
  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [recentModules, setRecentModules] = useState([]);

  useEffect(() => {
    setLoading(true);
    getDashboardSummary(period)
      .then((res) => setSummary(res.data.data))
      .catch(() => toast.error('Something went wrong'))
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    getDashboardChart()
      .then((res) => setChartData(res.data.data))
      .catch(() => toast.error('Something went wrong'));

    const unwrap = (res) => {
      const d = res?.data?.data;
      if (Array.isArray(d)) return d;
      if (Array.isArray(d?.data)) return d.data;
      if (Array.isArray(d?.items)) return d.items;
      return [];
    };

    getLeaveApplications({ status: 'pending', limit: 5 })
      .then((res) => setPendingLeaves(unwrap(res)))
      .catch(() => {});

    getNotifications({ limit: 5 })
      .then((res) => setNotifications(unwrap(res).slice(0, 5)))
      .catch(() => {});

    getActivityLogs({ limit: 6 })
      .then((res) => setActivities(unwrap(res).slice(0, 6)))
      .catch(() => {});

    getLowStock()
      .then((res) => setLowStock(unwrap(res).slice(0, 5)))
      .catch(() => {});

    try {
      const stored = JSON.parse(localStorage.getItem(RECENT_MODULES_KEY) || '[]');
      setRecentModules(stored.slice(0, 6));
    } catch {
      setRecentModules([]);
    }
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
              value={fmt(cards.totalSales || 0)}
              subtitle={`Revenue for ${period === 'today' ? 'today' : period === 'week' ? 'this week' : period === 'month' ? 'this month' : 'financial year'}`}
              icon={HiOutlineCurrencyDollar}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <SummaryCard
              title="Total Dues"
              value={fmt(cards.salesDue || 0)}
              subtitle="14.5% due still remains"
              icon={HiOutlineExclamationCircle}
              iconBg="bg-red-50"
              iconColor="text-red-500"
            />
            <SummaryCard
              title="Expenses"
              value={fmt(cards.totalExpense || 0)}
              subtitle="Total expenses this period"
              icon={HiOutlineCurrencyDollar}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
            />
            <SummaryCard
              title="Net Profit"
              value={fmt(cards.netProfit || 0)}
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
              value={fmt(cards.purchaseDue || 0)}
              icon={HiOutlineCurrencyDollar}
              iconBg="bg-orange-50"
              iconColor="text-orange-500"
            />
            <MiniCard
              title="Invoice Due"
              value={fmt(cards.customerDue || 0)}
              icon={HiOutlineCurrencyDollar}
              iconBg="bg-red-50"
              iconColor="text-red-500"
            />
            <MiniCard
              title="Total in Bank"
              value={fmt(cards.bankBalance || 0)}
              icon={HiOutlineBuildingLibrary}
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
            />
            <MiniCard
              title="Cash in Hand"
              value={fmt(cards.cashBalance || 0)}
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
                    formatter={(val) => `৳${val.toLocaleString()}`}
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
                    formatter={(val) => `৳${val.toLocaleString()}`}
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
                  formatter={(val) => `৳${val.toLocaleString()}`}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
                <Bar dataKey="inflow" name="Inflow" fill="#14b8a6" radius={[4, 4, 0, 0]} barSize={20} />
                <Bar dataKey="outflow" name="Outflow" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border border-gray-100 hover:border-orange-300 hover:shadow-sm transition"
                >
                  <span className={`p-2.5 rounded-lg ${a.color}`}>
                    <a.icon className="w-5 h-5" />
                  </span>
                  <span className="text-xs font-medium text-gray-700 text-center">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Approvals + Stock Insights + Recent Modules */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <PendingApprovalsWidget items={pendingLeaves} />
            <StockInsightsWidget items={lowStock} />
            <RecentModulesWidget recent={recentModules} />
          </div>

          {/* Activity Feed + Notifications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <ActivityFeedWidget items={activities} />
            <NotificationsWidget items={notifications} />
          </div>
        </>
      )}
    </div>
  );
};

/* ---- Widgets ---- */

const WidgetShell = ({ title, action, children }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const EmptyState = ({ text }) => (
  <p className="text-xs text-gray-400 py-6 text-center">{text}</p>
);

const PendingApprovalsWidget = ({ items }) => (
  <WidgetShell
    title="Pending Approvals"
    action={
      <Link to="/leave/pending" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
        View all <HiOutlineChevronRight className="w-3 h-3" />
      </Link>
    }
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-orange-50">
        <HiOutlineClipboardDocumentCheck className="w-5 h-5 text-orange-600" />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{items.length}</p>
        <p className="text-xs text-gray-500">Leave requests awaiting action</p>
      </div>
    </div>
    {items.length === 0 ? (
      <EmptyState text="No pending approvals" />
    ) : (
      <ul className="space-y-2">
        {items.slice(0, 3).map((it) => (
          <li key={it._id} className="flex items-center justify-between text-xs">
            <span className="text-gray-700 truncate">{it.staff?.name || it.staff?.fullName || 'Staff'}</span>
            <span className="px-2 py-0.5 rounded bg-red-50 text-red-600 font-medium">Pending</span>
          </li>
        ))}
      </ul>
    )}
  </WidgetShell>
);

const StockInsightsWidget = ({ items }) => (
  <WidgetShell
    title="Low Stock Alerts"
    action={
      <Link to="/inventory" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
        View all <HiOutlineChevronRight className="w-3 h-3" />
      </Link>
    }
  >
    {items.length === 0 ? (
      <EmptyState text="All stock levels healthy" />
    ) : (
      <ul className="space-y-2.5">
        {items.map((p) => (
          <li key={p._id} className="flex items-center justify-between text-xs">
            <span className="text-gray-700 truncate flex-1">{p.name || p.productName}</span>
            <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-700 font-medium ml-2">
              {p.currentStock ?? 0} left
            </span>
          </li>
        ))}
      </ul>
    )}
  </WidgetShell>
);

const RecentModulesWidget = ({ recent }) => {
  const list = recent.length ? recent : SHORTCUT_MODULES;
  return (
    <WidgetShell title={recent.length ? 'Recent Modules' : 'Quick Shortcuts'}>
      <div className="grid grid-cols-2 gap-2">
        {list.slice(0, 6).map((m) => {
          const Icon = m.icon || HiOutlineCube;
          return (
            <Link
              key={m.label || m.to}
              to={m.to}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-100 hover:bg-gray-50 transition text-xs"
            >
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="text-gray-700 truncate">{m.label}</span>
            </Link>
          );
        })}
      </div>
    </WidgetShell>
  );
};

const ActivityFeedWidget = ({ items }) => (
  <WidgetShell
    title="Recent Activity"
    action={
      <Link to="/activity-log" className="text-xs text-orange-600 hover:underline flex items-center gap-1">
        View all <HiOutlineChevronRight className="w-3 h-3" />
      </Link>
    }
  >
    {items.length === 0 ? (
      <EmptyState text="No activity yet" />
    ) : (
      <ul className="space-y-3">
        {items.map((a) => (
          <li key={a._id} className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-blue-50 mt-0.5">
              <HiOutlineClock className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-700 truncate">
                <span className="font-medium">{a.user?.name || a.userName || 'User'}</span>{' '}
                <span className="text-gray-500">{a.action || ''}</span>
                {a.module && <span className="text-gray-400"> · {a.module}</span>}
              </p>
              <p className="text-[11px] text-gray-400">{timeAgo(a.createdAt)}</p>
            </div>
          </li>
        ))}
      </ul>
    )}
  </WidgetShell>
);

const NotificationsWidget = ({ items }) => (
  <WidgetShell
    title="Notifications"
    action={
      <span className="text-xs text-gray-400">Latest {items.length}</span>
    }
  >
    {items.length === 0 ? (
      <EmptyState text="You're all caught up" />
    ) : (
      <ul className="space-y-3">
        {items.map((n) => {
          const priority = n.priority || n.type || 'info';
          const dot =
            priority === 'high' || priority === 'urgent'
              ? 'bg-red-500'
              : priority === 'warning'
              ? 'bg-yellow-500'
              : 'bg-blue-500';
          return (
            <li key={n._id} className="flex items-start gap-3">
              <span className={`w-2 h-2 rounded-full mt-1.5 ${dot}`}></span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-700 truncate">{n.title || n.message}</p>
                <p className="text-[11px] text-gray-400">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.read && <HiOutlineBell className="w-3.5 h-3.5 text-orange-500" />}
            </li>
          );
        })}
      </ul>
    )}
  </WidgetShell>
);

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
