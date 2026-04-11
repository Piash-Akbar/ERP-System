import { useState } from 'react';
import { getProducts } from '../../services/product.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';
import { HiOutlineFunnel, HiOutlineArrowDownTray, HiOutlineExclamationTriangle } from 'react-icons/hi2';

const StockAlerts = () => {
  const { data: rawData, pagination, loading, setPage, setSearch } = useFetch(getProducts, {
    initialParams: { limit: 50 },
  });

  // Filter products that are at or below alert level
  const data = (rawData || []).filter((product) => {
    const alertLevel = product.alertQuantity || product.minStock || 10;
    return product.stock <= alertLevel;
  });

  const handleExport = () => {
    toast.success('Export started');
  };

  const getStockStatus = (product) => {
    const alertLevel = product.alertQuantity || product.minStock || 10;
    const ratio = product.stock / alertLevel;
    if (ratio <= 0.3) return 'Critical';
    return 'Low';
  };

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => <span className="font-medium text-gray-900">{row.sku || '-'}</span>,
    },
    {
      key: 'name',
      label: 'PRODUCT',
      render: (row) => row.name,
    },
    {
      key: 'stock',
      label: 'CURRENT STOCK',
      render: (row) => {
        const status = getStockStatus(row);
        return (
          <div className="flex items-center gap-1.5">
            {status === 'Critical' && <HiOutlineExclamationTriangle className="w-4 h-4 text-red-500" />}
            {status === 'Low' && <HiOutlineExclamationTriangle className="w-4 h-4 text-yellow-500" />}
            <span className={status === 'Critical' ? 'text-red-600 font-medium' : 'text-yellow-600 font-medium'}>
              {row.stock ?? 0}
            </span>
          </div>
        );
      },
    },
    {
      key: 'alertLevel',
      label: 'ALERT LEVEL',
      render: (row) => row.alertQuantity || row.minStock || 10,
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const status = getStockStatus(row);
        if (status === 'Critical') {
          return (
            <div className="flex items-center gap-1.5">
              <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-red-500" />
              <StatusBadge color="red">Critical</StatusBadge>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1.5">
            <HiOutlineExclamationTriangle className="w-3.5 h-3.5 text-yellow-500" />
            <StatusBadge color="yellow">Low</StatusBadge>
          </div>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Stock Alerts" subtitle="Products requiring reorder" />

      <DataTable
        columns={columns}
        data={data}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
        actions={
          <>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <HiOutlineFunnel className="w-4 h-4" />
              Filter
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <HiOutlineArrowDownTray className="w-4 h-4" />
              Export
            </button>
          </>
        }
      />
    </div>
  );
};

export default StockAlerts;
