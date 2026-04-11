import { useState } from 'react';
import { getCNFs, createCNF, updateCNF, deleteCNF } from '../../services/cnf.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import toast from 'react-hot-toast';
import { exportToCsv } from '../../utils/exportCsv';
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineDocumentText,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineArrowPath,
} from 'react-icons/hi2';

const statusColors = { pending: 'orange', in_progress: 'blue', completed: 'green' };
const statusLabels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };

const StatusIcon = ({ status }) => {
  if (status === 'completed') return <HiOutlineCheckCircle className="w-4 h-4 text-green-500" />;
  if (status === 'in_progress') return <HiOutlineArrowPath className="w-4 h-4 text-blue-500" />;
  return <HiOutlineClock className="w-4 h-4 text-orange-500" />;
};

const cnfStatuses = ['pending', 'in_progress', 'completed'];

const CNFManagement = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getCNFs);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateCNF(id, { status: newStatus });
      toast.success('Status updated');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this CNF entry?')) return;
    try {
      await deleteCNF(id);
      toast.success('CNF entry deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleExport = () => {
    const cols = [
      { key: 'agent', label: 'CNF Agent' },
      { key: 'lcNumber', label: 'LC Number' },
      { key: 'status', label: 'Status' },
      { key: 'note', label: 'Note' },
    ];
    exportToCsv('cnf_records', cols, data || []);
    toast.success('Exported to CSV');
  };

  const columns = [
    {
      key: 'agent',
      label: 'CNF AGENT',
      render: (row) => <span className="font-medium text-gray-900">{row.agent}</span>,
    },
    {
      key: 'purchase',
      label: 'PO NUMBER',
      render: (row) => row.purchase?.referenceNo || '-',
    },
    {
      key: 'lcNumber',
      label: 'LC NUMBER',
      render: (row) => row.lcNumber || '-',
    },
    {
      key: 'documents',
      label: 'DOCUMENTS',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <HiOutlineDocumentText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">{row.documents?.length || 0} files</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <select
          value={row.status || 'pending'}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${
            row.status === 'completed' ? 'bg-green-50 text-green-700' :
            row.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
            'bg-orange-50 text-orange-700'
          }`}
        >
          {cnfStatuses.map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
          Delete
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="CNF Management" subtitle="Manage clearing and forwarding agents">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-teal-500 text-white rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors"
        >
          <HiOutlineArrowUpTray className="w-4 h-4" />
          New CNF Entry
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          + Add CNF Entry
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
        actions={
          <>
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

      {showForm && <CNFForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />}
    </div>
  );
};

const CNFForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    agent: '',
    lcNumber: '',
    status: 'pending',
    note: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.agent) return toast.error('Enter agent name');
    setLoading(true);
    try {
      await createCNF(form);
      toast.success('CNF entry created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create CNF entry');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Add CNF Entry" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="CNF Agent"
          value={form.agent}
          onChange={(e) => setForm({ ...form, agent: e.target.value })}
          placeholder="Enter agent name"
          required
        />
        <FormInput
          label="LC Number"
          value={form.lcNumber}
          onChange={(e) => setForm({ ...form, lcNumber: e.target.value })}
          placeholder="Enter LC number"
        />
        <FormInput
          label="Status"
          type="select"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </FormInput>
        <FormInput
          label="Note"
          type="textarea"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Additional notes..."
        />
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Add Entry'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default CNFManagement;
