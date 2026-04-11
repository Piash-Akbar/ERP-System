import { useState } from 'react';
import { HiOutlineArrowTrendingUp, HiOutlineArrowTrendingDown, HiOutlineBanknotes } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const formatCurrency = (val) =>
  `$${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const monthlyData = [
  { month: 'Oct', sales: 38000, expenses: 22000, profit: 16000 },
  { month: 'Nov', sales: 42000, expenses: 25000, profit: 17000 },
  { month: 'Dec', sales: 48000, expenses: 28000, profit: 20000 },
  { month: 'Jan', sales: 40000, expenses: 23000, profit: 17000 },
  { month: 'Feb', sales: 45000, expenses: 24000, profit: 21000 },
  { month: 'Mar', sales: 42000, expenses: 23000, profit: 19000 },
];

const revenueBreakdown = [
  { label: 'Product Sales', amount: 185000 },
  { label: 'Service Income', amount: 45000 },
  { label: 'Other Income', amount: 25000 },
];

const expenseBreakdown = [
  { label: 'Salaries', amount: 86700 },
  { label: 'Rent & Utilities', amount: 22500 },
  { label: 'Marketing', amount: 15800 },
  { label: 'Other Expenses', amount: 10000 },
];

const summaryCards = [
  { title: 'Total Revenue', amount: 255000, icon: HiOutlineArrowTrendingUp, color: 'green', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' },
  { title: 'Total Expenses', amount: 145000, icon: HiOutlineArrowTrendingDown, color: 'red', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
  { title: 'Net Profit', amount: 110000, icon: HiOutlineBanknotes, color: 'blue', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
];

const ProfitLoss = () => {
  const [period] = useState('This Quarter');

  return (
    <div>
      <PageHeader title="Profit & Loss Statement" subtitle="Financial performance summary" />

      {/* Summary Cards */}
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

      {/* Chart */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown</h3>
          <div className="space-y-3">
            {revenueBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-gray-900">Total Revenue</span>
              <span className="text-sm font-bold text-green-600">{formatCurrency(255000)}</span>
            </div>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <div className="space-y-3">
            {expenseBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-bold text-gray-900">Total Expenses</span>
              <span className="text-sm font-bold text-red-600">{formatCurrency(145000)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;
