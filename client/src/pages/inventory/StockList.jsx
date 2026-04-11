import { HiOutlineFunnel, HiOutlineArrowDownTray, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import { getStockList } from '../../services/inventory.service';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const StockList = () => {
  const { data, pagination, loading, setPage, setSearch } = useFetch(getStockList);

  const handleExport = () => {
    toast.success('Export started');
  };

  const columns = [
    {
      key: 'sku',
      label: 'SKU',
      render: (row) => <span className="font-medium text-gray-900">{row.sku}</span>,
    },
    {
      key: 'name',
      label: 'PRODUCT',
      render: (row) => row.name || '-',
    },
    {
      key: 'warehouse',
      label: 'WAREHOUSE',
      render: (row) => row.warehouse?.name || '-',
    },
    {
      key: 'stock',
      label: 'STOCK',
      render: (row) => {
        const isLow = row.stock <= (row.alertQuantity || 0);
        return (
          <span className="inline-flex items-center gap-1">
            {isLow && <HiOutlineExclamationTriangle className="w-4 h-4 text-orange-500" />}
            <span className={isLow ? 'text-orange-600 font-medium' : ''}>{row.stock ?? 0}</span>
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => {
        const isLow = row.stock <= (row.alertQuantity || 0);
        return (
          <StatusBadge color={isLow ? 'orange' : 'green'}>
            {isLow && <HiOutlineExclamationTriangle className="w-3 h-3 mr-1" />}
            {isLow ? 'Low Stock' : 'In Stock'}
          </StatusBadge>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Stock List" subtitle="View current inventory stock levels" />

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
        actions={
          <>
            <button className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <HiOutlineFunnel className="w-4 h-4" />
              Filter
            </button>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
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

export default StockList;
