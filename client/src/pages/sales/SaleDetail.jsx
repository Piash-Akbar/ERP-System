import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import { getSale, addSalePayment } from '../../services/sale.service';
import toast from 'react-hot-toast';

const SaleDetail = ({ saleId, onClose, onRefetch }) => {
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');

  useEffect(() => {
    fetchSale();
  }, [saleId]);

  const fetchSale = async () => {
    try {
      const { data } = await getSale(saleId);
      setSale(data.data);
    } catch (err) {
      toast.error('Failed to load sale');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (paymentAmount <= 0) return toast.error('Enter a valid amount');
    try {
      await addSalePayment(saleId, { amount: paymentAmount, method: paymentMethod });
      toast.success('Payment added');
      fetchSale();
      onRefetch();
      setPaymentAmount(0);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Payment failed');
    }
  };

  if (loading) return <Modal isOpen onClose={onClose} title="Sale Details"><p className="text-gray-500">Loading...</p></Modal>;
  if (!sale) return null;

  return (
    <Modal isOpen onClose={onClose} title={`Invoice: ${sale.invoiceNo}`} size="lg">
      <div className="space-y-6">
        {/* Header info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Customer:</span>{' '}
            <span className="font-medium text-gray-900">{sale.customer?.name}</span>
          </div>
          <div>
            <span className="text-gray-500">Date:</span>{' '}
            <span className="font-medium text-gray-900">
              {new Date(sale.saleDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Status:</span>
            <StatusBadge color={sale.status === 'confirmed' ? 'blue' : 'green'}>{sale.status}</StatusBadge>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Payment:</span>
            <StatusBadge
              color={sale.paymentStatus === 'paid' ? 'green' : sale.paymentStatus === 'partial' ? 'yellow' : 'orange'}
            >
              {sale.paymentStatus}
            </StatusBadge>
          </div>
        </div>

        {/* Items table */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Items</h4>
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Qty</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Price</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-center">Discount</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {sale.items?.map((item, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-4 py-3 text-gray-700">{item.name || item.product?.name}</td>
                    <td className="px-4 py-3 text-center text-gray-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-center text-gray-700">৳{item.unitPrice}</td>
                    <td className="px-4 py-3 text-center text-gray-700">৳{item.discount || 0}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">৳{item.subtotal?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gray-50 rounded-xl p-5 text-sm space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span className="text-gray-900">৳{sale.subtotal?.toLocaleString()}</span>
          </div>
          {sale.discountAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Discount:</span>
              <span className="text-red-600">-৳{sale.discountAmount?.toLocaleString()}</span>
            </div>
          )}
          {sale.taxAmount > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Tax:</span>
              <span className="text-gray-900">+৳{sale.taxAmount?.toLocaleString()}</span>
            </div>
          )}
          {sale.shippingCharge > 0 && (
            <div className="flex justify-between text-gray-600">
              <span>Shipping:</span>
              <span className="text-gray-900">+৳{sale.shippingCharge?.toLocaleString()}</span>
            </div>
          )}
          <hr className="border-gray-200" />
          <div className="flex justify-between font-semibold text-base">
            <span className="text-gray-900">Grand Total:</span>
            <span className="text-gray-900">৳{sale.grandTotal?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>Paid:</span>
            <span>৳{sale.paidAmount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-red-600 font-medium">
            <span>Due:</span>
            <span>৳{sale.dueAmount?.toLocaleString()}</span>
          </div>
        </div>

        {/* Add payment */}
        {sale.dueAmount > 0 && (
          <div className="border border-gray-200 rounded-xl p-5">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Add Payment</h4>
            <div className="flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1.5">Amount</label>
                <input
                  type="number"
                  value={paymentAmount}
                  min={0}
                  max={sale.dueAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1.5">Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                  <option value="mobile_banking">Mobile Banking</option>
                </select>
              </div>
              <button
                onClick={handlePayment}
                className="px-5 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
              >
                Pay
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default SaleDetail;
