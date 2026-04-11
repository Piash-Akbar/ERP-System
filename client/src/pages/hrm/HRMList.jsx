import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineBanknotes,
} from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import StaffForm from './StaffForm';
import {
  getStaff,
  deleteStaff,
  getAttendance,
  markAttendance,
  getPayroll,
  generatePayroll,
  approvePayroll,
  markPayrollPaid,
  getLoans,
  createLoan,
} from '../../services/hrm.service';
import api from '../../services/api';

const tabs = [
  { label: 'Staff', value: 'staff' },
  { label: 'Attendance', value: 'attendance' },
  { label: 'Payroll', value: 'payroll' },
  { label: 'Loans', value: 'loans' },
];

const statusColors = {
  draft: 'yellow',
  approved: 'blue',
  paid: 'green',
  active: 'green',
  completed: 'gray',
  present: 'green',
  absent: 'red',
  late: 'orange',
  half_day: 'yellow',
  on_leave: 'purple',
};

// ─── Staff Tab ────────────────────────────────────────────────

const StaffTab = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [users, setUsers] = useState([]);

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getStaff);

  useEffect(() => {
    api.get('/auth/users').then((res) => {
      setUsers(res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleAdd = () => {
    setEditingStaff(null);
    setModalOpen(true);
  };

  const handleEdit = (staff) => {
    setEditingStaff(staff);
    setModalOpen(true);
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`Are you sure you want to delete "${staff.employeeId}"?`)) return;
    try {
      await deleteStaff(staff._id);
      toast.success('Staff deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete staff');
    }
  };

  const columns = [
    { key: 'employeeId', label: 'Employee ID' },
    {
      key: 'name',
      label: 'Name',
      render: (row) => row.user?.name || '-',
    },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    {
      key: 'salary',
      label: 'Salary',
      render: (row) => (row.basicSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
            title="Edit"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
            title="Delete"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Staff
        </button>
      </div>
      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
      />
      <StaffForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        staff={editingStaff}
        onSuccess={refetch}
        users={users}
      />
    </>
  );
};

// ─── Attendance Tab ───────────────────────────────────────────

const AttendanceTab = () => {
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [allStaff, setAllStaff] = useState([]);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [staffRes, attRes] = await Promise.all([
        getStaff({ limit: 200 }),
        getAttendance({ date }),
      ]);
      const staffList = staffRes.data.data?.data || staffRes.data.data || [];
      const attList = attRes.data.data || [];
      setAllStaff(staffList);

      // Merge attendance with staff
      const records = staffList.map((s) => {
        const existing = attList.find(
          (a) => (a.staff?._id || a.staff) === s._id
        );
        return {
          staff: s._id,
          staffName: s.user?.name || s.employeeId,
          employeeId: s.employeeId,
          status: existing?.status || 'present',
          checkIn: existing?.checkIn || '',
          checkOut: existing?.checkOut || '',
          note: existing?.note || '',
        };
      });
      setAttendanceRecords(records);
    } catch (err) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoadingData(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleStatusChange = (index, status) => {
    setAttendanceRecords((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status };
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = attendanceRecords.map((r) => ({
        staff: r.staff,
        date,
        status: r.status,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        note: r.note,
      }));
      await markAttendance(payload);
      toast.success('Attendance saved');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Employee ID</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Check In</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Check Out</th>
            </tr>
          </thead>
          <tbody>
            {loadingData ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td>
              </tr>
            ) : attendanceRecords.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">No staff found</td>
              </tr>
            ) : (
              attendanceRecords.map((record, idx) => (
                <tr key={record.staff} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{record.employeeId}</td>
                  <td className="px-4 py-3 text-gray-700">{record.staffName}</td>
                  <td className="px-4 py-3">
                    <select
                      value={record.status}
                      onChange={(e) => handleStatusChange(idx, e.target.value)}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                      <option value="half_day">Half Day</option>
                      <option value="on_leave">On Leave</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={record.checkIn}
                      onChange={(e) => {
                        const updated = [...attendanceRecords];
                        updated[idx] = { ...updated[idx], checkIn: e.target.value };
                        setAttendanceRecords(updated);
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="time"
                      value={record.checkOut}
                      onChange={(e) => {
                        const updated = [...attendanceRecords];
                        updated[idx] = { ...updated[idx], checkOut: e.target.value };
                        setAttendanceRecords(updated);
                      }}
                      className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

// ─── Payroll Tab ──────────────────────────────────────────────

const PayrollTab = () => {
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
      toast.success('Payroll generated');
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
    try {
      await markPayrollPaid(id);
      toast.success('Payroll marked as paid');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to mark paid');
    }
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => row.staff?.user?.name || row.staff?.employeeId || '-',
    },
    {
      key: 'period',
      label: 'Period',
      render: (row) => `${row.month}/${row.year}`,
    },
    {
      key: 'basicSalary',
      label: 'Basic',
      render: (row) => (row.basicSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    },
    {
      key: 'allowances',
      label: 'Allowances',
      render: (row) => (row.allowances || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    },
    {
      key: 'deductions',
      label: 'Deductions',
      render: (row) => (row.deductions || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    },
    {
      key: 'loanDeduction',
      label: 'Loan Ded.',
      render: (row) => (row.loanDeduction || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    },
    {
      key: 'netSalary',
      label: 'Net Salary',
      render: (row) => (
        <span className="font-medium">
          {(row.netSalary || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge color={statusColors[row.status]}>{row.status}</StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'draft' && (
            <button
              onClick={() => handleApprove(row._id)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-green-600"
              title="Approve"
            >
              <HiOutlineCheckCircle className="w-4 h-4" />
            </button>
          )}
          {row.status === 'approved' && (
            <button
              onClick={() => handlePay(row._id)}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
              title="Mark Paid"
            >
              <HiOutlineBanknotes className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <div className="flex items-center gap-4 mb-4">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
        />
        <button
          onClick={handleFilter}
          className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Filter
        </button>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <HiOutlinePlus className="w-4 h-4" />
          {generating ? 'Generating...' : 'Generate Payroll'}
        </button>
      </div>
      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        loading={loading}
      />
    </>
  );
};

// ─── Loans Tab ────────────────────────────────────────────────

const LoansTab = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ staff: '', amount: '', monthlyDeduction: '', reason: '' });
  const [staffList, setStaffList] = useState([]);
  const [saving, setSaving] = useState(false);

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getLoans);

  useEffect(() => {
    getStaff({ limit: 200 }).then((res) => {
      setStaffList(res.data.data?.data || res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.staff || !form.amount || !form.monthlyDeduction) {
      toast.error('Staff, amount and monthly deduction are required');
      return;
    }
    setSaving(true);
    try {
      await createLoan({
        staff: form.staff,
        amount: Number(form.amount),
        monthlyDeduction: Number(form.monthlyDeduction),
        reason: form.reason,
      });
      toast.success('Loan created');
      setModalOpen(false);
      setForm({ staff: '', amount: '', monthlyDeduction: '', reason: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create loan');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'employee',
      label: 'Employee',
      render: (row) => row.staff?.user?.name || '-',
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (row.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    },
    {
      key: 'monthlyDeduction',
      label: 'Monthly Ded.',
      render: (row) => (row.monthlyDeduction || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    },
    {
      key: 'totalPaid',
      label: 'Total Paid',
      render: (row) => (row.totalPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
    },
    {
      key: 'remainingBalance',
      label: 'Remaining',
      render: (row) => (
        <span className={row.remainingBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
          {(row.remainingBalance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'reason',
      label: 'Reason',
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge color={statusColors[row.status]}>{row.status}</StatusBadge>
      ),
    },
  ];

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Loan
        </button>
      </div>
      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
      />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Loan" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput label="Staff" type="select" name="staff" value={form.staff} onChange={handleChange}>
            <option value="">Select Staff</option>
            {staffList.map((s) => (
              <option key={s._id} value={s._id}>
                {s.user?.name || s.employeeId} ({s.employeeId})
              </option>
            ))}
          </FormInput>
          <FormInput
            label="Loan Amount"
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="0"
            min="1"
          />
          <FormInput
            label="Monthly Deduction"
            type="number"
            name="monthlyDeduction"
            value={form.monthlyDeduction}
            onChange={handleChange}
            placeholder="0"
            min="1"
          />
          <FormInput
            label="Reason"
            type="textarea"
            name="reason"
            value={form.reason}
            onChange={handleChange}
            placeholder="Reason for loan"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Add Loan'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

// ─── Main HRMList ─────────────────────────────────────────────

const HRMList = () => {
  const [activeTab, setActiveTab] = useState('staff');

  return (
    <div>
      <PageHeader title="HRM" subtitle="Manage staff, attendance, payroll and loans" />

      {/* Tab navigation */}
      <div className="flex items-center gap-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'staff' && <StaffTab />}
      {activeTab === 'attendance' && <AttendanceTab />}
      {activeTab === 'payroll' && <PayrollTab />}
      {activeTab === 'loans' && <LoansTab />}
    </div>
  );
};

export default HRMList;
