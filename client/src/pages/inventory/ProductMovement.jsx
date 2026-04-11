import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import { getProductMovements } from '../../services/inventory.service';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import toast from 'react-hot-toast';

const typeColors = {
  sale: 'blue',
  purchase: 'green',
  transfer: 'purple',
};

const ProductMovement = () => {
  const { data, pagination, loading, setPage, setSearch } = useFetch(getProductMovements);

  const handleExport = () => {
    toast.success('Export started');
  };

  const columns = [
    {
      key: 'product',
      label: 'PRODUCT',
      render: (row) => row.product?.name || '-',
    },
    {
      key: 'type',
      label: 'TYPE',
      render: (row) => {
        const type = row.type || 'transfer';
        return (
          <StatusBadge color={typeColors[type] || 'gray'}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </StatusBadge>
        );
      },
    },
    {
      key: 'quantity',
      label: 'QUANTITY',
      render: (row) => row.quantity ?? 0,
    },
    {
      key: 'source',
      label: 'SOURCE',
      render: (row) => row.source?.name || row.source || '-',
    },
    {
      key: 'destination',
      label: 'DESTINATION',
      render: (row) => row.destination?.name || row.destination || '-',
    },
    {
      key: 'date',
      label: 'DATE',
      render: (row) => {
        const d = row.date || row.createdAt;
        return d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Product Movement" subtitle="Track product movement history" />

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

export default ProductMovement;
