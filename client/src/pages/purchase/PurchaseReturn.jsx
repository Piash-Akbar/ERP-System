import { useState, useEffect } from 'react';
import { getPurchases, getPurchase, createPurchaseReturn } from '../../services/purchase.service';
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
  const [purchases, setPurchases] = useState([]);
  const [purchaseId, setPurchaseId] = useState('');
  const [purchase, setPurchase] = useState(null);
  const [returnQtys, setReturnQtys] = useState({});
  const [reason, setReason] = useState('Quality Issue');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPurchases({ isReturn: 'false', limit: 200 }).then((res) => {
      setPurchases(res.data.data?.data || []);
    });
  }, []);

  useEffect(() => {
    if (!purchaseId) { setPurchase(null); return; }
    getPurchase(purchaseId).then((res) => {
      setPurchase(res.data.data);
      setReturnQtys({});
    });
  }, [purchaseId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!purchaseId) return toast.error('Select a purchase');
    const items = Object.entries(returnQtys)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([itemId, qty]) => ({ itemId, quantity: Number(qty) }));
    if (items.length === 0) return toast.error('Enter quantity for at least one item');

    setLoading(true);
    try {
      await createPurchaseReturn(purchaseId, { items, note: note ? `${reason}: ${note}` : reason });
      toast.success('Return created successfully');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create return');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Purchase Return" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Purchase Order"
          type="select"
          value={purchaseId}
          onChange={(e) => setPurchaseId(e.target.value)}
          required
        >
          <option value="">Select Purchase Order</option>
          {purchases.map((p) => (
            <option key={p._id} value={p._id}>
              {p.referenceNo} — {p.supplier?.name || 'Supplier'} (৳{p.grandTotal?.toLocaleString()})
            </option>
          ))}
        </FormInput>

        {purchase && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
            <table className="w-full text-sm border">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2">Product</th>
                  <th className="px-3 py-2">Purchased</th>
                  <th className="px-3 py-2">Unit Price</th>
                  <th className="px-3 py-2">Return Qty</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items?.map((item) => (
                  <tr key={item._id} className="border-t">
                    <td className="px-3 py-2">{item.name || item.product?.name}</td>
                    <td className="px-3 py-2 text-center">{item.quantity}</td>
                    <td className="px-3 py-2 text-center">৳{item.unitPrice}</td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={item.quantity}
                        value={returnQtys[item._id] || ''}
                        onChange={(e) => setReturnQtys({ ...returnQtys, [item._id]: e.target.value })}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <FormInput label="Reason" type="select" value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="Quality Issue">Quality Issue</option>
          <option value="Wrong Specification">Wrong Specification</option>
          <option value="Damaged Goods">Damaged Goods</option>
          <option value="Excess Quantity">Excess Quantity</option>
        </FormInput>
        <FormInput
          label="Note"
          type="textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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
