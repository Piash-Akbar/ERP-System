import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import WarehouseForm from './WarehouseForm';
import { getWarehouses, deleteWarehouse } from '../../services/location.service';

const Warehouses = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const fetchWarehouses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getWarehouses();
      setWarehouses(data.data || []);
    } catch {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWarehouses(); }, [fetchWarehouses]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this warehouse?')) return;
    try {
      await deleteWarehouse(id);
      toast.success('Warehouse deleted');
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'WAREHOUSE CODE',
      render: (row) => <span className="font-medium text-gray-900">{row.code}</span>,
    },
    {
      key: 'name',
      label: 'NAME',
      render: (row) => (
        <div className="flex items-center gap-2">
          <StatusBadge color="green">Active</StatusBadge>
          <span>{row.name}</span>
        </div>
      ),
    },
    { key: 'address', label: 'LOCATION', render: (row) => row.address || '-' },
    {
      key: 'branch',
      label: 'BRANCH',
      render: (row) => row.branch?.name || '-',
    },
    {
      key: 'capacity',
      label: 'STOCK LEVEL/CAPACITY',
      render: (row) => row.capacity ? `${row.capacity} sq ft` : '-',
    },
    {
      key: 'manager',
      label: 'MANAGER',
      render: (row) => row.manager?.name || '-',
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => { setEditingWarehouse(row); setModalOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600">
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row._id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600">
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Warehouses" subtitle="Manage storage locations">
        <button onClick={() => { setEditingWarehouse(null); setModalOpen(true); }} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          + Add Warehouse
        </button>
      </PageHeader>

      <DataTable columns={columns} data={warehouses} loading={loading} />

      <WarehouseForm
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingWarehouse(null); }}
        warehouse={editingWarehouse}
        onSuccess={fetchWarehouses}
      />
    </div>
  );
};

export default Warehouses;
