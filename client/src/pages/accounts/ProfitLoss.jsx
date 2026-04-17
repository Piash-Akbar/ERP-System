import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineBanknotes } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getProfitLoss } from '../../services/account.service';

const formatCurrency = (val) =>
  `৳${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const periodOptions = [
  { label: 'This Month', value: 'month' },
  { label: 'This Quarter', value: 'quarter' },
  { label: 'This Year', value: 'year' },
  { label: 'All Time', value: 'all' },
];

const getDateRange = (period) => {
  const now = new Date();
  const end = now.toISOString().split('T')[0];
  let start;
  if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  } else if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3) * 3;
    start = new Date(now.getFullYear(), q, 1).toISOString().split('T')[0];
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
  } else {
    return {};
  }
  return { startDate: start, endDate: end };
};

const ProfitLoss = () => {
  const [period, setPeriod] = useState('quarter');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getProfitLoss(getDateRange(period))
      .then((res) => {
        if (!cancelled) setReport(res.data.data || null);
      })
      .catch(() => toast.error('Failed to load profit & loss'))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [period]);

  const totalRevenue = report?.totalRevenue || 0;
  const totalExpenses = report?.totalExpenses || 0;
  const netProfit = report?.netProfit || 0;
  const monthlyData = report?.monthlyData || [];
  const revenueBreakdown = report?.revenueBreakdown || [];
  const expenseBreakdown = report?.expenseBreakdown || [];

  const summaryCards = [
    { title: 'Total Revenue', amount: totalRevenue, icon: HiOutlineArrowTrendingUp, bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
    { title: 'Total Expenses', amount: totalExpenses, icon: HiOutlineArrowTrendingDown, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    { title: 'Net Profit', amount: netProfit, icon: HiOutlineBanknotes, bg: 'bg-blue-50', text: netProfit >= 0 ? 'text-blue-600' : 'text-red-600', border: 'border-blue-200' },
  ];

  return (
    <div>
      <PageHeader title="Profit & Loss Statement" subtitle="Financial performance summary">
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg"
        >
          {periodOptions.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      </PageHeader>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className={`${card.bg} rounded-xl border ${card.border} p-6`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{card.title}</p>
                      <p className={`text-2xl font-bold ${card.text} mt-1`}>{formatCurrency(card.amount)}</p>
                    </div>
                    <div className={`p-3 ${card.bg} rounded-xl`}>
                      <Icon className={`w-6 h-6 ${card.text}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
            <div className="h-80">
              {monthlyData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  No data for the selected period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                    <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Profit" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
              <div className="space-y-3">
                {revenueBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-400">No revenue recorded</p>
                ) : (
                  revenueBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-gray-900">Total Revenue</span>
                  <span className="text-sm font-bold text-green-600">{formatCurrency(totalRevenue)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
              <div className="space-y-3">
                {expenseBreakdown.length === 0 ? (
                  <p className="text-sm text-gray-400">No expenses recorded</p>
                ) : (
                  expenseBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-600">{item.label}</span>
                      <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                    </div>
                  ))
                )}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-bold text-gray-900">Total Expenses</span>
                  <span className="text-sm font-bold text-red-600">{formatCurrency(totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfitLoss;
