import { useState } from 'react';
import { HiOutlineAdjustmentsHorizontal, HiOutlineArrowsRightLeft } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import { getStockList, getLowStock, getAdjustments, getTransfers } from '../../services/inventory.service';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import StockAdjustForm from './StockAdjustForm';
import StockTransferForm from './StockTransferForm';

const tabs = [
  { key: 'stock', label: 'Stock List' },
  { key: 'lowStock', label: 'Low Stock' },
  { key: 'adjustments', label: 'Adjustments' },
  { key: 'transfers', label: 'Transfers' },
];

const InventoryList = () => {
  const [activeTab, setActiveTab] = useState('stock');
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);

  const stockFetch = useFetch(getStockList, {
    initialParams: { page: 1, limit: 20, search: '' },
  });

  const lowStockFetch = useFetch(getLowStock, {
    initialParams: {},
  });

  const adjustmentsFetch = useFetch(getAdjustments, {
    initialParams: { page: 1, limit: 20 },
  });

  const transfersFetch = useFetch(getTransfers, {
    initialParams: { page: 1, limit: 20 },
  });

  const handleSuccess = () => {
    setShowAdjustForm(false);
    setShowTransferForm(false);
    stockFetch.refetch();
    lowStockFetch.refetch();
    adjustmentsFetch.refetch();
    transfersFetch.refetch();
  };

  const stockColumns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Product Name' },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category?.name || '-',
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (row) => row.stock ?? 0,
    },
    {
      key: 'alertQuantity',
      label: 'Alert Qty',
      render: (row) => row.alertQuantity ?? 0,
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const isLow = row.stock <= (row.alertQuantity || 0);
        return (
          <StatusBadge color={isLow ? 'red' : 'green'}>
            {isLow ? 'Low Stock' : 'In Stock'}
          </StatusBadge>
        );
      },
    },
  ];

  const adjustmentColumns = [
    {
      key: 'product',
      label: 'Product',
      render: (row) => row.product?.name || '-',
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => row.product?.sku || '-',
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <StatusBadge color={row.type === 'addition' ? 'green' : 'red'}>
          {row.type}
        </StatusBadge>
      ),
    },
    { key: 'quantity', label: 'Quantity' },
    { key: 'reason', label: 'Reason', render: (row) => row.reason || '-' },
    {
      key: 'adjustedBy',
      label: 'Adjusted By',
      render: (row) => row.adjustedBy?.name || '-',
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  const transferColumns = [
    {
      key: 'product',
      label: 'Product',
      render: (row) => row.product?.name || '-',
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => row.product?.sku || '-',
    },
    {
      key: 'fromWarehouse',
      label: 'From',
      render: (row) => row.fromWarehouse?.name || '-',
    },
    {
      key: 'toWarehouse',
      label: 'To',
      render: (row) => row.toWarehouse?.name || '-',
    },
    { key: 'quantity', label: 'Quantity' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const colors = { pending: 'yellow', completed: 'green', cancelled: 'red' };
        return <StatusBadge color={colors[row.status] || 'gray'}>{row.status}</StatusBadge>;
      },
    },
    {
      key: 'transferredBy',
      label: 'Transferred By',
      render: (row) => row.transferredBy?.name || '-',
    },
    {
      key: 'createdAt',
      label: 'Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'stock':
        return (
          <DataTable
            columns={stockColumns}
            data={stockFetch.data || []}
            pagination={stockFetch.pagination}
            onPageChange={stockFetch.setPage}
            onSearch={stockFetch.setSearch}
            loading={stockFetch.loading}
          />
        );
      case 'lowStock':
        return (
          <DataTable
            columns={stockColumns}
            data={lowStockFetch.data || []}
            loading={lowStockFetch.loading}
          />
        );
      case 'adjustments':
        return (
          <DataTable
            columns={adjustmentColumns}
            data={adjustmentsFetch.data || []}
            pagination={adjustmentsFetch.pagination}
            onPageChange={adjustmentsFetch.setPage}
            loading={adjustmentsFetch.loading}
          />
        );
      case 'transfers':
        return (
          <DataTable
            columns={transferColumns}
            data={transfersFetch.data || []}
            pagination={transfersFetch.pagination}
            onPageChange={transfersFetch.setPage}
            loading={transfersFetch.loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Manage stock levels, adjustments and transfers">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdjustForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <HiOutlineAdjustmentsHorizontal className="w-4 h-4" />
            Stock Adjustment
          </button>
          <button
            onClick={() => setShowTransferForm(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700"
          >
            <HiOutlineArrowsRightLeft className="w-4 h-4" />
            Stock Transfer
          </button>
        </div>
      </PageHeader>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {renderTab()}

      {showAdjustForm && (
        <StockAdjustForm
          onClose={() => setShowAdjustForm(false)}
          onSuccess={handleSuccess}
        />
      )}

      {showTransferForm && (
        <StockTransferForm
          onClose={() => setShowTransferForm(false)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default InventoryList;
