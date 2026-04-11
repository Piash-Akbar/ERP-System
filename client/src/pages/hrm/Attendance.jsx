import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { getAttendance, markAttendance, getStaff } from '../../services/hrm.service';

const statusColors = { present: 'green', absent: 'red', late: 'yellow', half_day: 'orange', on_leave: 'purple' };
const statusLabels = { present: 'Present', absent: 'Absent', late: 'Late', half_day: 'Half Day', on_leave: 'On Leave' };

const Attendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [staffRes, attRes] = await Promise.all([
        getStaff({ limit: 200 }),
        getAttendance({ date }),
      ]);
      const staffList = staffRes.data.data?.data || staffRes.data.data || [];
      const attList = attRes.data.data || [];

      const merged = staffList.map((s) => {
        const existing = attList.find((a) => (a.staff?._id || a.staff) === s._id);
        return {
          staffId: s._id,
          employeeId: s.employeeId,
          name: s.user?.name || s.employeeId,
          department: s.department || '-',
          status: existing?.status || 'present',
          checkIn: existing?.checkIn || '09:00',
          checkOut: existing?.checkOut || '18:00',
        };
      });
      setRecords(merged);
    } catch {
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStatusChange = (index, status) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status };
      if (status === 'absent' || status === 'on_leave') {
        updated[index].checkIn = '';
        updated[index].checkOut = '';
      }
      return updated;
    });
  };

  const handleTimeChange = (index, field, value) => {
    setRecords((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = records.map((r) => ({
        staff: r.staffId,
        date,
        status: r.status,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
      }));
      await markAttendance(payload);
      toast.success('Attendance saved successfully');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Attendance Management" subtitle="Track employee attendance">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </PageHeader>

      <div className="flex items-center gap-3 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          <HiOutlineFunnel className="w-4 h-4" /> Filter
        </button>
        <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
          <HiOutlineArrowDownTray className="w-4 h-4" /> Export
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">EMPLOYEE ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">NAME</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">DEPARTMENT</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">CHECK IN</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">CHECK OUT</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Loading...</td></tr>
            ) : records.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">No staff found</td></tr>
            ) : (
              records.map((r, idx) => (
                <tr key={r.staffId} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.employeeId}</td>
                  <td className="px-4 py-3 text-gray-700">{r.name}</td>
                  <td className="px-4 py-3 text-gray-500">{r.department}</td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      onChange={(e) => handleStatusChange(idx, e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    >
                      {Object.entries(statusLabels).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={r.checkIn}
                      onChange={(e) => handleTimeChange(idx, 'checkIn', e.target.value)}
                      disabled={r.status === 'absent' || r.status === 'on_leave'}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={r.checkOut}
                      onChange={(e) => handleTimeChange(idx, 'checkOut', e.target.value)}
                      disabled={r.status === 'absent' || r.status === 'on_leave'}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-100 disabled:text-gray-400"
                    />
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

export default Attendance;
