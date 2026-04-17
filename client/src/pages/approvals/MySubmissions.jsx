import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { getMySubmissions, cancelRequest } from '../../services/approval.service';

const statusColors = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  on_hold: 'blue',
  cancelled: 'gray',
  escalated: 'purple',
};

const MySubmissions = () => {
  const [activeTab, setActiveTab] = useState('');
  const navigate = useNavigate();

  const { data, pagination, loading, setPage, setSearch, setParams, refetch } = useFetch(getMySubmissions, {
    initialParams: { status: '' },
  });

  const handleTabChange = (value) => {
    setActiveTab(value);
    setParams((prev) => ({ ...prev, status: value, page: 1 }));
  };

  const handleCancel = async (row) => {
    if (!window.confirm('Cancel this approval request?')) return;
    try {
      await cancelRequest(row._id);
      toast.success('Request cancelled');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const columns = [
    {
      key: 'sourceRef',
      label: 'Reference',
      render: (row) => (
        <button
          onClick={() => navigate(`/approvals/${row._id}`)}
          className="text-blue-600 hover:underline font-medium"
        >
          {row.sourceRef || row._id.slice(-8).toUpperCase()}
        </button>
      ),
    },
    { key: 'module', label: 'Module', render: (row) => <span className="capitalize">{row.module}</span> },
    { key: 'action', label: 'Action', render: (row) => <span className="capitalize">{row.action}</span> },
    {
      key: 'currentLevel',
      label: 'Level',
      render: (row) => `${row.currentLevel} / ${row.totalLevels}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge color={statusColors[row.status] || 'gray'}>
          {row.status.replace('_', ' ')}
        </StatusBadge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Submitted',
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) =>
        (row.status === 'pending' || row.status === 'on_hold') ? (
          <button
            onClick={() => handleCancel(row)}
            className="text-sm text-red-600 hover:underline"
          >
            Cancel
          </button>
        ) : null,
    },
  ];

  const tabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ];

  return (
    <div>
      <PageHeader title="My Submissions" subtitle="Track your approval requests" />

      <div className="flex items-center gap-1 mb-4">
        {tabs.map((tab) => (
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
    </div>
  );
};

export default MySubmissions;
