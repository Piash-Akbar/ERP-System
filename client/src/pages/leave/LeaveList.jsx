import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineCheckCircle,
  HiOutlineXCircle,
} from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import LeaveForm from './LeaveForm';
import {
  getLeaveApplications,
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  deleteLeaveType,
  approveLeaveApplication,
  rejectLeaveApplication,
  getHolidays,
  createHoliday,
  deleteHoliday,
} from '../../services/leave.service';
import { getStaff } from '../../services/hrm.service';

const tabs = [
  { label: 'Applications', value: 'applications' },
  { label: 'Leave Types', value: 'types' },
  { label: 'Holidays', value: 'holidays' },
];

const statusColors = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
};

// ─── Applications Tab ─────────────────────────────────────────

const ApplicationsTab = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [leaveTypesList, setLeaveTypesList] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getLeaveApplications);

  useEffect(() => {
    getLeaveTypes().then((res) => setLeaveTypesList(res.data.data || [])).catch(() => {});
    getStaff({ limit: 200 }).then((res) => {
      setStaffList(res.data.data?.data || res.data.data || []);
    }).catch(() => {});
  }, []);

  const handleApprove = async (id) => {
    try {
      await approveLeaveApplication(id);
      toast.success('Application approved');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    }
  };

  const handleRejectClick = (id) => {
    setRejectingId(id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async () => {
    try {
      await rejectLeaveApplication(rejectingId, { reason: rejectReason });
      toast.success('Application rejected');
      setRejectModalOpen(false);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    }
  };

  const columns = [
    {
      key: 'staff',
      label: 'Staff',
      render: (row) => row.staff?.user?.name || '-',
    },
    {
      key: 'leaveType',
      label: 'Type',
      render: (row) => row.leaveType?.name || '-',
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (row) => {
        const start = row.startDate ? new Date(row.startDate).toLocaleDateString() : '';
        const end = row.endDate ? new Date(row.endDate).toLocaleDateString() : '';
        return `${start} - ${end}`;
      },
    },
    { key: 'totalDays', label: 'Days' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge color={statusColors[row.status]}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          {row.status === 'pending' && (
            <>
              <button
                onClick={() => handleApprove(row._id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-green-600"
                title="Approve"
              >
                <HiOutlineCheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleRejectClick(row._id)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
                title="Reject"
              >
                <HiOutlineXCircle className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
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
          Apply Leave
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
      <LeaveForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refetch}
        leaveTypes={leaveTypesList}
        staffList={staffList}
      />

      {/* Reject Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)} title="Reject Application" size="sm">
        <div className="space-y-4">
          <FormInput
            label="Rejection Reason"
            type="textarea"
            name="reason"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection (optional)"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setRejectModalOpen(false)}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRejectSubmit}
              className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

// ─── Leave Types Tab ──────────────────────────────────────────

const LeaveTypesTab = () => {
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [form, setForm] = useState({ name: '', daysAllowed: '', isPaid: true, carryForward: false, maxCarryForwardDays: '' });
  const [saving, setSaving] = useState(false);

  const fetchTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await getLeaveTypes();
      setTypes(res.data.data || []);
    } catch {
      toast.error('Failed to load leave types');
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAdd = () => {
    setEditingType(null);
    setForm({ name: '', daysAllowed: '', isPaid: true, carryForward: false, maxCarryForwardDays: '' });
    setModalOpen(true);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setForm({
      name: type.name || '',
      daysAllowed: type.daysAllowed || '',
      isPaid: type.isPaid ?? true,
      carryForward: type.carryForward ?? false,
      maxCarryForwardDays: type.maxCarryForwardDays || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async (type) => {
    if (!window.confirm(`Delete leave type "${type.name}"?`)) return;
    try {
      await deleteLeaveType(type._id);
      toast.success('Leave type deleted');
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.daysAllowed) {
      toast.error('Name and days allowed are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        daysAllowed: Number(form.daysAllowed),
        isPaid: form.isPaid,
        carryForward: form.carryForward,
        maxCarryForwardDays: Number(form.maxCarryForwardDays) || 0,
      };
      if (editingType) {
        await updateLeaveType(editingType._id, payload);
        toast.success('Leave type updated');
      } else {
        await createLeaveType(payload);
        toast.success('Leave type created');
      }
      setModalOpen(false);
      fetchTypes();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Leave Type
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Days Allowed</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Paid</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Carry Forward</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingTypes ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">Loading...</td>
              </tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">No leave types found</td>
              </tr>
            ) : (
              types.map((t) => (
                <tr key={t._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{t.name}</td>
                  <td className="px-4 py-3 text-gray-700">{t.daysAllowed}</td>
                  <td className="px-4 py-3">
                    <StatusBadge color={t.isPaid ? 'green' : 'gray'}>{t.isPaid ? 'Yes' : 'No'}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {t.carryForward ? `Yes (max ${t.maxCarryForwardDays})` : 'No'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(t)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
                        title="Edit"
                      >
                        <HiOutlinePencilSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(t)}
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
                        title="Delete"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingType ? 'Edit Leave Type' : 'Add Leave Type'} size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Annual Leave"
          />
          <FormInput
            label="Days Allowed"
            type="number"
            name="daysAllowed"
            value={form.daysAllowed}
            onChange={handleChange}
            placeholder="0"
            min="0"
          />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="isPaid"
                checked={form.isPaid}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Paid Leave
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                name="carryForward"
                checked={form.carryForward}
                onChange={handleChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Carry Forward
            </label>
          </div>
          {form.carryForward && (
            <FormInput
              label="Max Carry Forward Days"
              type="number"
              name="maxCarryForwardDays"
              value={form.maxCarryForwardDays}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          )}
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
              {saving ? 'Saving...' : editingType ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

// ─── Holidays Tab ─────────────────────────────────────────────

const HolidaysTab = () => {
  const [holidays, setHolidays] = useState([]);
  const [loadingH, setLoadingH] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', date: '', isRecurring: false });
  const [saving, setSaving] = useState(false);

  const fetchHolidays = async () => {
    setLoadingH(true);
    try {
      const res = await getHolidays();
      setHolidays(res.data.data || []);
    } catch {
      toast.error('Failed to load holidays');
    } finally {
      setLoadingH(false);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: inputType === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.date) {
      toast.error('Name and date are required');
      return;
    }
    setSaving(true);
    try {
      await createHoliday(form);
      toast.success('Holiday added');
      setModalOpen(false);
      setForm({ name: '', date: '', isRecurring: false });
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add holiday');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (holiday) => {
    if (!window.confirm(`Delete holiday "${holiday.name}"?`)) return;
    try {
      await deleteHoliday(holiday._id);
      toast.success('Holiday deleted');
      fetchHolidays();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Holiday
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Recurring</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingH ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-400">Loading...</td>
              </tr>
            ) : holidays.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-gray-400">No holidays found</td>
              </tr>
            ) : (
              holidays.map((h) => (
                <tr key={h._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-700">{h.name}</td>
                  <td className="px-4 py-3 text-gray-700">{new Date(h.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge color={h.isRecurring ? 'blue' : 'gray'}>
                      {h.isRecurring ? 'Yes' : 'No'}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(h)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Holiday" size="sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Holiday name"
          />
          <FormInput
            label="Date"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="isRecurring"
              checked={form.isRecurring}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Recurring (yearly)
          </label>
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
              {saving ? 'Saving...' : 'Add Holiday'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
};

// ─── Main LeaveList ───────────────────────────────────────────

const LeaveList = () => {
  const [activeTab, setActiveTab] = useState('applications');

  return (
    <div>
      <PageHeader title="Leave Management" subtitle="Manage leave applications, types, and holidays" />

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

      {activeTab === 'applications' && <ApplicationsTab />}
      {activeTab === 'types' && <LeaveTypesTab />}
      {activeTab === 'holidays' && <HolidaysTab />}
    </div>
  );
};

export default LeaveList;
