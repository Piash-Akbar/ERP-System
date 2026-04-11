import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineArrowDownTray, HiOutlineCheckCircle, HiOutlineBanknotes } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import useFetch from '../../hooks/useFetch';
import { getPayroll, generatePayroll, approvePayroll, markPayrollPaid } from '../../services/hrm.service';

const statusColors = { draft: 'yellow', approved: 'blue', paid: 'green' };
const fmt = (n) => `৳${(n || 0).toLocaleString()}`;

const Payroll = () => {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [generating, setGenerating] = useState(false);

  const { data, pagination, loading, setPage, setParams, refetch } = useFetch(getPayroll, {
    initialParams: { month: now.getMonth() + 1, year: now.getFullYear() },
  });

  const handleFilter = () => {
    setParams((prev) => ({ ...prev, month, year, page: 1 }));
  };

  const handleGenerate = async () => {
    if (!window.confirm(`Generate payroll for ${month}/${year}?`)) return;
    setGenerating(true);
    try {
      await generatePayroll({ month, year });
      toast.success('Payroll generated successfully');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to generate payroll');
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approvePayroll(id);
      toast.success('Payroll approved');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handlePay = async (id) => {
    if (!window.confirm('Mark this payroll as paid?')) return;
    try {
      await markPayrollPaid(id);
      toast.success('Payroll marked as paid');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark paid');
    }
  };

  const payrollData = data || [];
  const totalPayroll = payrollData.reduce((sum, p) => sum + (p.netSalary || 0), 0);
  const pendingCount = payrollData.filter((p) => p.status === 'draft').length;
  const paidCount = payrollData.filter((p) => p.status === 'paid').length;

  return (
    <div>
      <PageHeader title="Payroll Management" subtitle="Manage employee salaries and payments">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
        >
          {generating ? 'Generating...' : '+ Generate Payroll'}
        </button>
      </PageHeader>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Total Payroll</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{fmt(totalPayroll)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500">Paid</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{paidCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <input
          type="number"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-24"
        />
        <button onClick={handleFilter} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Filter
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          <HiOutlineArrowDownTray className="w-4 h-4" /> Export
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">EMPLOYEE</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">PERIOD</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">BASIC SALARY</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ALLOWANCES</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">DEDUCTIONS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">LOAN DED.</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">NET SALARY</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : payrollData.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-12 text-gray-400">No payroll records. Click "Generate Payroll" to create.</td></tr>
            ) : (
              payrollData.map((p) => (
                <tr key={p._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{p.staff?.user?.name || p.staff?.employeeId || '-'}</p>
                      <p className="text-xs text-gray-500">{p.staff?.employeeId}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{p.month}/{p.year}</td>
                  <td className="px-4 py-3 text-gray-700">{fmt(p.basicSalary)}</td>
                  <td className="px-4 py-3 text-green-600">{fmt(p.allowances)}</td>
                  <td className="px-4 py-3 text-red-600">{fmt(p.deductions)}</td>
                  <td className="px-4 py-3 text-red-600">{fmt(p.loanDeduction)}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{fmt(p.netSalary)}</td>
                  <td className="px-4 py-3">
                    <StatusBadge color={statusColors[p.status]}>
                      {p.status?.charAt(0).toUpperCase() + p.status?.slice(1)}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {p.status === 'draft' && (
                        <button onClick={() => handleApprove(p._id)} className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600" title="Approve">
                          <HiOutlineCheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      {p.status === 'approved' && (
                        <button onClick={() => handlePay(p._id)} className="p-1.5 hover:bg-blue-50 rounded-lg text-gray-500 hover:text-blue-600" title="Mark Paid">
                          <HiOutlineBanknotes className="w-4 h-4" />
                        </button>
                      )}
                      {p.status === 'paid' && (
                        <span className="text-xs text-gray-400">Completed</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payroll;
