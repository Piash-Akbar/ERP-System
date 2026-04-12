import { useState, useEffect } from 'react';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import { getSales, createSaleReturn } from '../../services/sale.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import toast from 'react-hot-toast';

const SaleReturn = () => {
  const [showForm, setShowForm] = useState(false);
  const [returnForm, setReturnForm] = useState({
    invoiceNo: '',
    saleId: '',
    customer: '',
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [salesList, setSalesList] = useState([]);

  // Fetch available (non-returned) sales for the dropdown
  useEffect(() => {
    if (showForm) {
      getSales({ page: 1, limit: 100, isReturn: false })
        .then((res) => {
          const sales = res.data?.data?.data || [];
          setSalesList(sales.filter((s) => s.status !== 'returned' && s.status !== 'cancelled'));
        })
        .catch(() => setSalesList([]));
    }
  }, [showForm]);

  // For the return list, we fetch sales that have returns or use a custom endpoint
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getSales, {
    initialParams: { page: 1, limit: 20, search: '', isReturn: true },
  });

  const handleExport = () => {
    toast.success('Export started');
  };

  const handleSubmitReturn = async (e) => {
    e.preventDefault();
    if (!returnForm.saleId) return toast.error('Select an invoice');
    if (!returnForm.reason) return toast.error('Enter a reason');

    setSubmitting(true);
    try {
      await createSaleReturn(returnForm.saleId, {
        amount: returnForm.amount,
        reason: returnForm.reason,
        date: returnForm.date,
      });
      toast.success('Return created successfully');
      setShowForm(false);
      setReturnForm({ invoiceNo: '', saleId: '', customer: '', date: new Date().toISOString().split('T')[0], amount: 0, reason: '' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create return');
    } finally {
      setSubmitting(false);
    }
  };

  const reasonBadge = (reason) => {
    const colors = {
      Damaged: 'red',
      'Wrong Item': 'orange',
      Defective: 'yellow',
      Other: 'gray',
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        reason === 'Damaged' ? 'bg-red-50 text-red-700' :
        reason === 'Wrong Item' ? 'bg-orange-50 text-orange-700' :
        reason === 'Defective' ? 'bg-yellow-50 text-yellow-700' :
        'bg-gray-100 text-gray-600'
      }`}>
        {reason}
      </span>
    );
  };

  const columns = [
    {
      key: 'returnId',
      label: 'RETURN ID',
      render: (row) => <span className="font-medium text-gray-900">{row.returnId || `RET-${String(row._id).slice(-6).toUpperCase()}`}</span>,
    },
    {
      key: 'invoiceNo',
      label: 'INVOICE NO',
      render: (row) => row.invoiceNo || '-',
    },
    {
      key: 'customer',
      label: 'CUSTOMER',
      render: (row) => row.customer?.name || '-',
    },
    {
      key: 'date',
      label: 'DATE',
      render: (row) => new Date(row.returnDate || row.saleDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    },
    {
      key: 'amount',
      label: 'AMOUNT',
      render: (row) => <span className="font-medium">৳{(row.returnAmount || row.grandTotal || 0).toLocaleString()}</span>,
    },
    {
      key: 'reason',
      label: 'REASON',
      render: (row) => reasonBadge(row.returnReason || row.reason || 'Other'),
    },
  ];

  return (
    <div>
      <PageHeader title="Sales Return" subtitle="Manage product returns from customers">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
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

      {/* New Return Modal */}
      {showForm && (
        <Modal isOpen onClose={() => setShowForm(false)} title="New Sales Return" size="md">
          <form onSubmit={handleSubmitReturn} className="space-y-4">
            <FormInput
              label="Invoice / Sale ID"
              type="select"
              value={returnForm.saleId}
              onChange={(e) => {
                const sale = salesList.find((s) => s._id === e.target.value);
                setReturnForm({
                  ...returnForm,
                  saleId: e.target.value,
                  invoiceNo: sale?.invoiceNo || '',
                  customer: sale?.customer?.name || '',
                  amount: sale?.grandTotal || 0,
                });
              }}
              required
            >
              <option value="">Select Invoice</option>
              {salesList.map((sale) => (
                <option key={sale._id} value={sale._id}>
                  {sale.invoiceNo} — {sale.customer?.name || 'N/A'} (৳{(sale.grandTotal || 0).toLocaleString()})
                </option>
              ))}
            </FormInput>
            {returnForm.customer && (
              <FormInput label="Customer" type="text" value={returnForm.customer} disabled />
            )}
            <FormInput
              label="Return Date"
              type="date"
              value={returnForm.date}
              onChange={(e) => setReturnForm({ ...returnForm, date: e.target.value })}
            />
            <FormInput
              label="Return Amount"
              type="number"
              value={returnForm.amount}
              min={0}
              onChange={(e) => setReturnForm({ ...returnForm, amount: Number(e.target.value) })}
            />
            <FormInput label="Reason" type="select" value={returnForm.reason} onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })} required>
              <option value="">Select Reason</option>
              <option value="Damaged">Damaged</option>
              <option value="Wrong Item">Wrong Item</option>
              <option value="Defective">Defective</option>
              <option value="Other">Other</option>
            </FormInput>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Creating...' : 'Create Return'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default SaleReturn;
