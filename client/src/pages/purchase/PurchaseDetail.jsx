import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { getPurchase, addPurchasePayment } from '../../services/purchase.service';
import toast from 'react-hot-toast';

const PurchaseDetail = ({ purchaseId, onClose, onRefetch }) => {
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => { fetchPurchase(); }, [purchaseId]);

  const fetchPurchase = async () => {
    try {
      const { data } = await getPurchase(purchaseId);
      setPurchase(data.data);
    } catch { toast.error('Failed to load purchase'); } finally { setLoading(false); }
  };

  const handlePayment = async () => {
    if (paymentAmount <= 0) return toast.error('Enter a valid amount');
    try {
      await addPurchasePayment(purchaseId, { amount: paymentAmount, method: paymentMethod });
      toast.success('Payment added');
      fetchPurchase();
      onRefetch();
      setPaymentAmount(0);
    } catch (err) { toast.error(err.response?.data?.error || 'Payment failed'); }
  };

  if (loading) return <Modal isOpen onClose={onClose} title="Purchase Details"><p>Loading...</p></Modal>;
  if (!purchase) return null;

  return (
    <Modal isOpen onClose={onClose} title={`Reference: ${purchase.referenceNo}`} size="lg">
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><span className="text-gray-500">Supplier:</span> <span className="font-medium">{purchase.supplier?.name}</span></div>
          <div><span className="text-gray-500">Date:</span> <span className="font-medium">{new Date(purchase.purchaseDate).toLocaleDateString()}</span></div>
          <div><span className="text-gray-500">Status:</span> <StatusBadge color={purchase.status === 'received' ? 'green' : 'blue'}>{purchase.status}</StatusBadge></div>
          <div><span className="text-gray-500">Payment:</span> <StatusBadge color={purchase.paymentStatus === 'paid' ? 'green' : purchase.paymentStatus === 'partial' ? 'yellow' : 'red'}>{purchase.paymentStatus}</StatusBadge></div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50"><th className="text-left px-3 py-2">Product</th><th className="px-3 py-2">Qty</th><th className="px-3 py-2">Price</th><th className="px-3 py-2 text-right">Subtotal</th></tr></thead>
            <tbody>
              {purchase.items?.map((item, i) => (
                <tr key={i} className="border-b"><td className="px-3 py-2">{item.name || item.product?.name}</td><td className="px-3 py-2 text-center">{item.quantity}</td><td className="px-3 py-2 text-center">৳{item.unitPrice}</td><td className="px-3 py-2 text-right">৳{item.subtotal?.toLocaleString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
          <div className="flex justify-between font-semibold text-base"><span>Grand Total:</span><span>৳{purchase.grandTotal?.toLocaleString()}</span></div>
          <div className="flex justify-between text-green-600"><span>Paid:</span><span>৳{purchase.paidAmount?.toLocaleString()}</span></div>
          <div className="flex justify-between text-red-600 font-medium"><span>Due:</span><span>৳{purchase.dueAmount?.toLocaleString()}</span></div>
        </div>

        {purchase.dueAmount > 0 && (
          <div className="border rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Payment</h4>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-gray-500">Amount</label>
                <input type="number" value={paymentAmount} min={0} onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500">Method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="cash">Cash</option><option value="bank">Bank</option><option value="mobile_banking">Mobile Banking</option>
                </select>
              </div>
              <button onClick={handlePayment} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700">Pay</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default PurchaseDetail;
