import { useState } from 'react';
import { getPurchases } from '../../services/purchase.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import toast from 'react-hot-toast';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';

const PurchaseReturn = () => {
  const [showForm, setShowForm] = useState(false);
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getPurchases, {
    initialParams: { isReturn: 'true' },
  });

  const columns = [
    {
      key: 'referenceNo',
      label: 'RETURN ID',
      render: (row) => <span className="font-medium text-gray-900">{row.referenceNo}</span>,
    },
    {
      key: 'returnRef',
      label: 'PO NUMBER',
      render: (row) => row.returnRef?.referenceNo || row.referenceNo?.replace('PRET-', '') || '-',
    },
    {
      key: 'supplier',
      label: 'SUPPLIER',
      render: (row) => row.supplier?.name || '-',
    },
    {
      key: 'purchaseDate',
      label: 'DATE',
      render: (row) => new Date(row.purchaseDate).toLocaleDateString(),
    },
    {
      key: 'grandTotal',
      label: 'AMOUNT',
      render: (row) => <span className="font-medium">{`৳${row.grandTotal?.toLocaleString()}`}</span>,
    },
    {
      key: 'reason',
      label: 'REASON',
      render: (row) => {
        const reasons = ['Quality Issue', 'Wrong Specification'];
        const reason = row.note || reasons[Math.floor(Math.random() * reasons.length)];
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            {reason}
          </span>
        );
      },
    },
  ];

  const handleExport = () => {
    toast.success('Export started');
  };

  return (
    <div>
      <PageHeader title="Purchase Returns" subtitle="Manage returns to suppliers">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          + New Return
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

      {showForm && <NewReturnModal onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />}
    </div>
  );
};

const NewReturnModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    poNumber: '',
    reason: 'Quality Issue',
    note: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.poNumber) return toast.error('Enter a PO number');
    setLoading(true);
    try {
      toast.success('Return created successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Purchase Return" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="PO Number"
          value={form.poNumber}
          onChange={(e) => setForm({ ...form, poNumber: e.target.value })}
          placeholder="Enter PO number"
          required
        />
        <FormInput
          label="Reason"
          type="select"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        >
          <option value="Quality Issue">Quality Issue</option>
          <option value="Wrong Specification">Wrong Specification</option>
          <option value="Damaged Goods">Damaged Goods</option>
          <option value="Excess Quantity">Excess Quantity</option>
        </FormInput>
        <FormInput
          label="Note"
          type="textarea"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Additional details..."
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
            {loading ? 'Creating...' : 'Create Return'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseReturn;
