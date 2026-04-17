import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
} from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import UserForm from './UserForm';
import { getUsers, deleteUser, toggleUserStatus, resetUserPassword } from '../../services/user.service';

const statusTabs = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' },
];

const UserList = () => {
  const [activeTab, setActiveTab] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const { data, pagination, loading, setPage, setSearch, setParams, refetch } = useFetch(getUsers, {
    initialParams: { isActive: '' },
  });

  const handleTabChange = (value) => {
    setActiveTab(value);
    setParams((prev) => ({ ...prev, isActive: value, page: 1 }));
  };

  const handleAdd = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to delete "${user.name}"?`)) return;
    try {
      await deleteUser(user._id);
      toast.success('User deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = !user.isActive;
    const action = newStatus ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} "${user.name}"?`)) return;
    try {
      await toggleUserStatus(user._id, newStatus);
      toast.success(`User ${action}d successfully`);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${action} user`);
    }
  };

  const handleResetPassword = (user) => {
    setResetTarget(user);
    setNewPassword('');
    setResetModalOpen(true);
  };

  const submitResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setResetLoading(true);
    try {
      await resetUserPassword(resetTarget._id, newPassword);
      toast.success('Password reset successfully');
      setResetModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setResetLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (row) => (
        <StatusBadge color="purple">
          {row.role?.name || 'N/A'}
        </StatusBadge>
      ),
    },
    {
      key: 'branch',
      label: 'Branch',
      render: (row) => row.branch?.name || '-',
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (row) => (
        <StatusBadge color={row.isActive ? 'green' : 'red'}>
          {row.isActive ? 'Active' : 'Inactive'}
        </StatusBadge>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      render: (row) =>
        row.lastLogin
          ? new Date(row.lastLogin).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'Never',
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
            onClick={() => handleToggleStatus(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-yellow-600"
            title={row.isActive ? 'Deactivate' : 'Activate'}
          >
            {row.isActive ? (
              <HiOutlineShieldExclamation className="w-4 h-4" />
            ) : (
              <HiOutlineShieldCheck className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => handleResetPassword(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-orange-600"
            title="Reset Password"
          >
            <HiOutlineLockClosed className="w-4 h-4" />
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
    <div>
      <PageHeader title="User Management" subtitle="Manage system users and access">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add User
        </button>
      </PageHeader>

      <div className="flex items-center gap-1 mb-4">
        {statusTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
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

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
      />

      <UserForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        user={editingUser}
        onSuccess={refetch}
      />

      {/* Reset Password Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reset Password for {resetTarget?.name}
            </h3>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 characters)"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitResetPassword}
                disabled={resetLoading}
                className="px-4 py-2.5 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {resetLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserList;
