import { useState } from 'react';
import { getActivityLogs } from '../../services/activityLog.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';

const moduleOptions = [
  'All',
  'auth',
  'contacts',
  'products',
  'purchases',
  'sales',
  'inventory',
  'accounts',
  'transfer',
  'settings',
];

const moduleColors = {
  auth: 'blue',
  contacts: 'green',
  products: 'purple',
  purchases: 'yellow',
  sales: 'orange',
  inventory: 'red',
  accounts: 'blue',
  transfer: 'green',
  settings: 'gray',
};

const ActivityLogList = () => {
  const [moduleFilter, setModuleFilter] = useState('');
  const { data, pagination, loading, setPage, setSearch, setParams, refetch } = useFetch(
    getActivityLogs,
    { initialParams: { module: '' } }
  );

  const handleModuleChange = (e) => {
    const value = e.target.value === 'All' ? '' : e.target.value;
    setModuleFilter(value);
    setParams((prev) => ({ ...prev, module: value, page: 1 }));
  };

  const columns = [
    {
      key: 'createdAt',
      label: 'Date/Time',
      render: (row) => new Date(row.createdAt).toLocaleString(),
    },
    {
      key: 'user',
      label: 'User',
      render: (row) => row.user?.name || '-',
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => row.action,
    },
    {
      key: 'module',
      label: 'Module',
      render: (row) => (
        <StatusBadge color={moduleColors[row.module] || 'gray'}>
          {row.module}
        </StatusBadge>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => row.description || '-',
    },
  ];

  return (
    <div>
      <PageHeader title="Activity Log" subtitle="View system activity history">
        <select
          value={moduleFilter || 'All'}
          onChange={handleModuleChange}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {moduleOptions.map((mod) => (
            <option key={mod} value={mod}>
              {mod === 'All' ? 'All Modules' : mod.charAt(0).toUpperCase() + mod.slice(1)}
            </option>
          ))}
        </select>
      </PageHeader>

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

export default ActivityLogList;
