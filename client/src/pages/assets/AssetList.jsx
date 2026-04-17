import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineEye } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { getAssets, deleteAsset } from '../../services/asset.service';

const statusColors = {
  active: 'green',
  in_maintenance: 'yellow',
  disposed: 'red',
  transferred: 'blue',
  inactive: 'gray',
};

const statusTabs = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'In Maintenance', value: 'in_maintenance' },
  { label: 'Disposed', value: 'disposed' },
];

const AssetList = () => {
  const [activeTab, setActiveTab] = useState('');
  const navigate = useNavigate();

  const { data, pagination, loading, setPage, setSearch, setParams, refetch } = useFetch(getAssets, {
    initialParams: { status: '' },
  });

  const handleTabChange = (value) => {
    setActiveTab(value);
    setParams((prev) => ({ ...prev, status: value, page: 1 }));
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`Delete asset "${asset.name}"?`)) return;
    try {
      await deleteAsset(asset._id);
      toast.success('Asset deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const columns = [
    {
      key: 'assetCode',
      label: 'Code',
      render: (row) => <span className="font-mono text-sm">{row.assetCode}</span>,
    },
    { key: 'name', label: 'Name' },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category?.name || '-',
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => row.location?.name || row.branch?.name || '-',
    },
    {
      key: 'assignedTo',
      label: 'Assigned To',
      render: (row) => row.assignedTo?.name || '-',
    },
    {
      key: 'purchasePrice',
      label: 'Purchase Price',
      render: (row) => row.purchasePrice?.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    },
    {
      key: 'currentValue',
      label: 'Current Value',
      render: (row) => (
        <span className={row.currentValue < row.purchasePrice * 0.2 ? 'text-red-600 font-medium' : ''}>
          {row.currentValue?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge color={statusColors[row.status] || 'gray'}>
          {row.status?.replace('_', ' ')}
        </StatusBadge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate(`/assets/${row._id}`)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
            title="View"
          >
            <HiOutlineEye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/assets/${row._id}/edit`)}
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
    <div>
      <PageHeader title="Assets" subtitle="Manage fixed assets">
        <button
          onClick={() => navigate('/assets/new')}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Register Asset
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
    </div>
  );
};

export default AssetList;
