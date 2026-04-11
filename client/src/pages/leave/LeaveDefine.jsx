import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import { getLeaveTypes, getLeaveBalance } from '../../services/leave.service';
import { getStaff } from '../../services/hrm.service';

const LeaveDefine = () => {
  const [staffList, setStaffList] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, ltRes] = await Promise.all([
        getStaff({ limit: 200 }),
        getLeaveTypes(),
      ]);
      const staff = staffRes.data.data?.data || staffRes.data.data || [];
      const types = ltRes.data.data || [];
      setStaffList(staff);
      setLeaveTypes(types);

      // Fetch balance for each staff
      const balanceMap = {};
      await Promise.all(
        staff.map(async (s) => {
          try {
            const res = await getLeaveBalance(s._id);
            balanceMap[s._id] = res.data.data || [];
          } catch {
            balanceMap[s._id] = [];
          }
        })
      );
      setBalances(balanceMap);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = staffList.filter((s) => {
    const name = s.user?.name || s.employeeId || '';
    return name.toLowerCase().includes(search.toLowerCase()) || s.employeeId?.toLowerCase().includes(search.toLowerCase());
  });

  const getBalance = (staffId, leaveTypeName) => {
    const staffBalances = balances[staffId] || [];
    const found = staffBalances.find((b) => (b.leaveType?.name || b.leaveType) === leaveTypeName);
    return found || { used: 0, allowed: 0, remaining: 0 };
  };

  return (
    <div>
      <PageHeader title="Define Leave" subtitle="View leave allocation and balance for employees" />

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees..."
          className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">EMPLOYEE ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">EMPLOYEE NAME</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">DEPARTMENT</th>
              {leaveTypes.map((lt) => (
                <th key={lt._id} className="text-left px-4 py-3 font-medium text-gray-600">{lt.name.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3 + leaveTypes.length} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={3 + leaveTypes.length} className="text-center py-12 text-gray-400">No staff found</td></tr>
            ) : (
              filtered.map((s) => (
                <tr key={s._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.employeeId}</td>
                  <td className="px-4 py-3 text-gray-700">{s.user?.name || '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{s.department || '-'}</td>
                  {leaveTypes.map((lt) => {
                    const bal = getBalance(s._id, lt.name);
                    return (
                      <td key={lt._id} className="px-4 py-3">
                        <span className="font-semibold text-gray-900">{bal.used}</span>
                        <span className="text-gray-400"> / {bal.allowed || lt.daysAllowed}</span>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaveDefine;
