import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import StatusBadge from '../../components/StatusBadge';
import BranchForm from './BranchForm';
import WarehouseForm from './WarehouseForm';
import {
  getBranches,
  deleteBranch,
  getWarehouses,
  deleteWarehouse,
} from '../../services/location.service';

const TABS = ['Branches', 'Warehouses'];

const LocationList = () => {
  const [activeTab, setActiveTab] = useState('Branches');
  const [branches, setBranches] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Branch modal state
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  // Warehouse modal state
  const [warehouseModalOpen, setWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  useEffect(() => {
    if (activeTab === 'Branches') {
      fetchBranches();
    } else {
      fetchWarehouses();
    }
  }, [activeTab]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const { data } = await getBranches();
      setBranches(data.data);
    } catch (err) {
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const { data } = await getWarehouses();
      setWarehouses(data.data);
    } catch (err) {
      toast.error('Failed to load warehouses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await deleteBranch(id);
      toast.success('Branch deleted');
      fetchBranches();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete branch');
    }
  };

  const handleDeleteWarehouse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this warehouse?')) return;
    try {
      await deleteWarehouse(id);
      toast.success('Warehouse deleted');
      fetchWarehouses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete warehouse');
    }
  };

  const branchColumns = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code', render: (row) => <StatusBadge color="blue">{row.code}</StatusBadge> },
    { key: 'address', label: 'Address', render: (row) => row.address || '-' },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '-' },
    { key: 'email', label: 'Email', render: (row) => row.email || '-' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingBranch(row); setBranchModalOpen(true); }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            title="Edit"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteBranch(row._id)}
            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
            title="Delete"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const warehouseColumns = [
    { key: 'name', label: 'Name' },
    { key: 'code', label: 'Code', render: (row) => <StatusBadge color="purple">{row.code}</StatusBadge> },
    {
      key: 'branch',
      label: 'Branch',
      render: (row) => row.branch?.name || '-',
    },
    { key: 'address', label: 'Address', render: (row) => row.address || '-' },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setEditingWarehouse(row); setWarehouseModalOpen(true); }}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            title="Edit"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteWarehouse(row._id)}
            className="p-1.5 hover:bg-red-50 rounded-lg text-red-500"
            title="Delete"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleAddClick = () => {
    if (activeTab === 'Branches') {
      setEditingBranch(null);
      setBranchModalOpen(true);
    } else {
      setEditingWarehouse(null);
      setWarehouseModalOpen(true);
    }
  };

  return (
    <div>
      <PageHeader title="Locations" subtitle="Manage branches and warehouses">
        <button
          onClick={handleAddClick}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add {activeTab === 'Branches' ? 'Branch' : 'Warehouse'}
        </button>
      </PageHeader>

      {/* Tab Switcher */}
      <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm rounded-md font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Data Table */}
      {activeTab === 'Branches' ? (
        <DataTable columns={branchColumns} data={branches} loading={loading} />
      ) : (
        <DataTable columns={warehouseColumns} data={warehouses} loading={loading} />
      )}

      {/* Branch Form Modal */}
      <BranchForm
        isOpen={branchModalOpen}
        onClose={() => { setBranchModalOpen(false); setEditingBranch(null); }}
        branch={editingBranch}
        onSuccess={fetchBranches}
      />

      {/* Warehouse Form Modal */}
      <WarehouseForm
        isOpen={warehouseModalOpen}
        onClose={() => { setWarehouseModalOpen(false); setEditingWarehouse(null); }}
        warehouse={editingWarehouse}
        onSuccess={fetchWarehouses}
      />
    </div>
  );
};

export default LocationList;
