import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import DataTable from '../../components/DataTable';
import BranchForm from './BranchForm';
import { getBranches, deleteBranch } from '../../services/location.service';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getBranches();
      setBranches(data.data || []);
    } catch {
      toast.error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBranches(); }, [fetchBranches]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this branch?')) return;
    try {
      await deleteBranch(id);
      toast.success('Branch deleted');
      fetchBranches();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'BRANCH CODE',
      render: (row) => <span className="font-medium text-gray-900">{row.code}</span>,
    },
    { key: 'name', label: 'NAME' },
    {
      key: 'location',
      label: 'LOCATION',
      render: (row) => row.address ? `${row.address}${row.city ? ', ' + row.city : ''}` : '-',
    },
    { key: 'phone', label: 'CONTACT', render: (row) => row.phone || '-' },
    { key: 'email', label: 'EMAIL', render: (row) => row.email || '-' },
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
          <button onClick={() => { setEditingBranch(row); setModalOpen(true); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600">
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
      <PageHeader title="Branches" subtitle="Manage company branches">
        <button onClick={() => { setEditingBranch(null); setModalOpen(true); }} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          + Add Branch
        </button>
      </PageHeader>

      <DataTable columns={columns} data={branches} loading={loading} />

      <BranchForm
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingBranch(null); }}
        branch={editingBranch}
        onSuccess={fetchBranches}
      />
    </div>
  );
};

export default Branches;
