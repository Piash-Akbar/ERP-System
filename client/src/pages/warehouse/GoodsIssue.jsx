import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineArchiveBoxXMark, HiOutlineTrash, HiOutlineMinus, HiOutlinePlus } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import WarehouseScannerInput from '../../components/WarehouseScannerInput';
import { useWarehouse } from '../../context/WarehouseContext';
import { createIssue, completeIssue } from '../../services/warehouseOps.service';

const GoodsIssue = () => {
  const { selectedWarehouse } = useWarehouse();
  const [items, setItems] = useState([]);
  const [destination, setDestination] = useState('');
  const [destinationType, setDestinationType] = useState('other');
  const [reference, setReference] = useState('');
  const [saving, setSaving] = useState(false);
  const [continuousScan, setContinuousScan] = useState(true);

  const handleScan = (product, barcode) => {
    const warehouseQty = product.warehouseStock?.find(
      (ws) => String(ws.warehouse) === String(selectedWarehouse?._id)
    )?.quantity || 0;

    setItems((prev) => {
      const existing = prev.find((i) => String(i.product._id) === String(product._id));
      if (existing) {
        return prev.map((i) =>
          String(i.product._id) === String(product._id)
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [
        ...prev,
        {
          product,
          barcode: barcode || product.barcode,
          quantity: 1,
          availableStock: warehouseQty,
          note: '',
        },
      ];
    });
  };

  const updateItem = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const adjustQty = (index, delta) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);

  const handleSubmit = async (asDraft = true) => {
    if (!selectedWarehouse?._id) return toast.error('Select a warehouse first');
    if (items.length === 0) return toast.error('Scan at least one product');

    const overStock = items.find((i) => i.quantity > i.availableStock);
    if (!asDraft && overStock) {
      return toast.error(`Insufficient stock for ${overStock.product.name}`);
    }

    setSaving(true);
    try {
      const payload = {
        warehouse: selectedWarehouse._id,
        destination,
        destinationType,
        reference,
        items: items.map((i) => ({
          product: i.product._id,
          barcode: i.barcode,
          quantity: i.quantity,
          note: i.note,
        })),
      };

      const res = await createIssue(payload);
      const doc = res.data.data;

      if (!asDraft) {
        await completeIssue(doc._id);
        toast.success('Goods issued and stock updated');
      } else {
        toast.success('Issue saved as draft');
      }

      setItems([]);
      setReference('');
      setDestination('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Goods Issue (Stock Out)" subtitle="Scan products to issue from warehouse">
        <button
          onClick={() => setContinuousScan(!continuousScan)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
            continuousScan
              ? 'bg-green-50 text-green-700 border-green-200'
              : 'bg-gray-50 text-gray-500 border-gray-200'
          }`}
        >
          {continuousScan ? 'Continuous Scan Mode' : 'Single Scan Mode'}
        </button>
      </PageHeader>

      {/* Form Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Destination</label>
            <select
              value={destinationType}
              onChange={(e) => setDestinationType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="sale">Sale</option>
              <option value="production">Production</option>
              <option value="department">Department</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Issue Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., ISS-2026-001"
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Total Items to Issue</label>
            <div className="px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg">
              {totalQuantity}
            </div>
          </div>
        </div>
      </div>

      {/* Scanner */}
      <div className="mb-1">
        <WarehouseScannerInput onScan={handleScan} continuousScan={continuousScan} />
      </div>
      <p className="text-xs text-gray-400 mb-4 ml-1">Tip: System will auto-check stock availability. Scan same barcode to increase quantity.</p>

      {/* Issue List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Issue List ({items.length} products)
        </h3>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <HiOutlineArchiveBoxXMark className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm font-medium">No items scanned yet</p>
            <p className="text-xs mt-1">Start scanning products to add them to the issue list</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 font-medium text-center">Available</th>
                    <th className="pb-2 font-medium text-center">Quantity</th>
                    <th className="pb-2 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => {
                    const isOverStock = item.quantity > item.availableStock;
                    return (
                      <tr key={i} className="border-b border-gray-50 dark:border-gray-700">
                        <td className="py-3 text-gray-800 dark:text-gray-200 font-medium">{item.product.name}</td>
                        <td className="py-3 text-gray-500 text-xs">{item.product.sku}</td>
                        <td className={`py-3 text-center text-xs font-medium ${isOverStock ? 'text-red-500' : 'text-green-600'}`}>
                          {item.availableStock}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button onClick={() => adjustQty(i, -1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                              <HiOutlineMinus className="w-4 h-4 text-gray-500" />
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItem(i, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                              className={`w-16 text-center px-2 py-1 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                                isOverStock ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
                              }`}
                            />
                            <button onClick={() => adjustQty(i, 1)} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
                              <HiOutlinePlus className="w-4 h-4 text-gray-500" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3">
                          <button onClick={() => removeItem(i)} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">{items.length}</span> products,{' '}
                <span className="font-medium">{totalQuantity}</span> total quantity
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  Save as Draft
                </button>
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Processing...' : 'Complete Issue'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GoodsIssue;
