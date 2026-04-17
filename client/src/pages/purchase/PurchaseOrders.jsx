import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { getPurchases, deletePurchase, updatePurchaseStatus, createPurchase } from '../../services/purchase.service';
import { getContacts } from '../../services/contact.service';
import { getProducts, createProduct } from '../../services/product.service';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import PurchaseForm from './PurchaseForm';
import PurchaseDetail from './PurchaseDetail';
import toast from 'react-hot-toast';
import { HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';

const purchaseStatuses = ['ordered', 'received', 'partial', 'returned', 'cancelled'];
const paymentStatusColors = { paid: 'green', partial: 'yellow', unpaid: 'red' };

const isObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

const PurchaseOrders = () => {
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getPurchases, {
    initialParams: { isReturn: 'false' },
  });

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        referenceNo: 'PO-001', purchaseDate: new Date().toISOString().split('T')[0], supplier: 'Supplier Name',
        status: 'received', productSku: 'SKU-001', productName: 'Sample Product',
        quantity: 10, unitPrice: 100, discount: 0,
        sellingPrice: 150, category: '', brand: '', unit: 'pcs',
        discountAmount: 0, taxAmount: 0, shippingCharge: 0, otherCharge: 0,
        paidAmount: 0, paymentMethod: 'cash', note: '',
      },
      {
        referenceNo: 'PO-001', purchaseDate: '', supplier: '', status: '',
        productSku: 'SKU-002', productName: 'Second Item',
        quantity: 5, unitPrice: 200, discount: 0,
        sellingPrice: 250, category: '', brand: '', unit: 'pcs',
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Purchase Orders');
    XLSX.writeFile(wb, 'purchase-order-import-template.xlsx');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (!rows.length) { toast.error('Excel is empty'); return; }

      const [supRes, prodRes] = await Promise.all([
        getContacts({ type: 'supplier', limit: 500 }),
        getProducts({ limit: 1000 }),
      ]);
      const suppliers = supRes.data.data?.data || [];
      const products = prodRes.data.data?.data || [];
      const supplierByName = new Map(suppliers.map((s) => [String(s.name).toLowerCase(), s._id]));
      const productBySku = new Map(products.map((p) => [String(p.sku).toLowerCase(), p]));

      // Group rows by referenceNo (blank groups get an auto ref)
      const groups = new Map();
      let autoRef = 0;
      let currentRef = '';
      for (const row of rows) {
        let ref = row.referenceNo ? String(row.referenceNo).trim() : '';
        if (!ref) ref = currentRef || `IMPORT-${Date.now()}-${++autoRef}`;
        currentRef = ref;
        if (!groups.has(ref)) groups.set(ref, []);
        groups.get(ref).push(row);
      }

      let okProducts = 0, okOrders = 0;
      const failures = [];

      for (const [ref, grpRows] of groups.entries()) {
        const header = grpRows.find((r) => r.supplier) || grpRows[0];
        const supVal = header.supplier ? String(header.supplier).trim() : '';
        const supplierId = isObjectId(supVal) ? supVal : supplierByName.get(supVal.toLowerCase());
        if (!supplierId) { failures.push(`${ref}: supplier "${supVal}" not found`); continue; }

        const items = [];
        for (const row of grpRows) {
          const sku = row.productSku ? String(row.productSku).trim() : '';
          if (!sku) { failures.push(`${ref}: row missing productSku`); continue; }
          let product = productBySku.get(sku.toLowerCase());
          if (!product) {
            try {
              const payload = {
                name: String(row.productName || sku).trim(),
                sku, type: 'single',
                unit: row.unit || 'pcs',
                purchasePrice: Number(row.unitPrice) || 0,
                sellingPrice: Number(row.sellingPrice) || Number(row.unitPrice) || 0,
                minSellingPrice: Number(row.unitPrice) || 0,
                alertQuantity: 0, taxPercent: 0,
              };
              const res = await createProduct(payload);
              product = res.data.data || res.data;
              productBySku.set(sku.toLowerCase(), product);
              okProducts++;
            } catch (err) {
              failures.push(`${ref} / ${sku}: product create failed — ${err.response?.data?.error || 'error'}`);
              continue;
            }
          }
          items.push({
            product: product._id,
            name: product.name,
            sku: product.sku,
            quantity: Number(row.quantity) || 1,
            unitPrice: Number(row.unitPrice) || Number(product.purchasePrice) || 0,
            discount: Number(row.discount) || 0,
          });
        }
        if (!items.length) { failures.push(`${ref}: no valid items`); continue; }

        const discountAmount = Number(header.discountAmount) || 0;
        const taxAmount = Number(header.taxAmount) || 0;
        const shippingCharge = Number(header.shippingCharge) || 0;
        const otherCharge = Number(header.otherCharge) || 0;
        const subtotal = items.reduce((s, it) => s + it.quantity * it.unitPrice - it.discount, 0);
        const grandTotal = subtotal - discountAmount + taxAmount + shippingCharge + otherCharge;
        const paidAmount = Number(header.paidAmount) || 0;

        const purchaseDate = header.purchaseDate
          ? new Date(header.purchaseDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        try {
          await createPurchase({
            referenceNo: ref,
            supplier: supplierId,
            purchaseDate,
            status: header.status || 'received',
            items,
            discountAmount, taxAmount, shippingCharge, otherCharge,
            subtotal, grandTotal,
            payments: paidAmount > 0 ? [{ amount: paidAmount, method: header.paymentMethod || 'cash' }] : [],
            note: header.note || '',
          });
          okOrders++;
        } catch (err) {
          failures.push(`${ref}: create PO failed — ${err.response?.data?.error || 'error'}`);
        }
      }

      if (okProducts) toast.success(`Created ${okProducts} product${okProducts > 1 ? 's' : ''}`);
      if (okOrders) toast.success(`Imported ${okOrders} purchase order${okOrders > 1 ? 's' : ''}`);
      if (failures.length) { toast.error(`${failures.length} issue(s) — see console`); console.error('PO Import issues:', failures); }
      if (okOrders) refetch();
    } catch (err) {
      toast.error('Failed to read Excel file');
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this purchase order?')) return;
    try {
      await deletePurchase(id);
      toast.success('Purchase order deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Delete failed');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updatePurchaseStatus(id, newStatus);
      toast.success('Status updated');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status');
    }
  };

  const columns = [
    { key: 'referenceNo', label: 'PO NUMBER', render: (row) => <span className="font-medium text-gray-900">{row.referenceNo}</span> },
    { key: 'supplier', label: 'SUPPLIER', render: (row) => row.supplier?.name || '-' },
    { key: 'purchaseDate', label: 'DATE', render: (row) => new Date(row.purchaseDate).toLocaleDateString() },
    { key: 'grandTotal', label: 'AMOUNT', render: (row) => <span className="font-medium">৳{row.grandTotal?.toLocaleString()}</span> },
    {
      key: 'paymentStatus',
      label: 'PAYMENT',
      render: (row) => {
        const ps = row.paymentStatus || 'unpaid';
        return <StatusBadge color={paymentStatusColors[ps]}>{ps.charAt(0).toUpperCase() + ps.slice(1)}</StatusBadge>;
      },
    },
    {
      key: 'status',
      label: 'STATUS',
      render: (row) => (
        <select
          value={row.status || 'ordered'}
          onChange={(e) => handleStatusChange(row._id, e.target.value)}
          className={`px-2 py-1 text-xs font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-orange-400 ${
            row.status === 'received' ? 'bg-green-50 text-green-700' :
            row.status === 'ordered' ? 'bg-blue-50 text-blue-700' :
            row.status === 'partial' ? 'bg-yellow-50 text-yellow-700' :
            row.status === 'returned' ? 'bg-orange-50 text-orange-700' :
            row.status === 'cancelled' ? 'bg-red-50 text-red-700' :
            'bg-gray-50 text-gray-700'
          }`}
        >
          {purchaseStatuses.map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="flex gap-2">
          <button onClick={() => setShowDetail(row._id)} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View</button>
          <button onClick={() => handleDelete(row._id)} className="text-red-600 hover:text-red-800 text-xs font-medium">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Manage purchase orders and procurement">
        <button type="button" onClick={downloadTemplate}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
          Download Template
        </button>
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
          {importing ? 'Importing...' : 'Import from Excel'}
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">+ New Purchase Order</button>
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
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"><HiOutlineFunnel className="w-4 h-4" />Filter</button>
            <button className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"><HiOutlineArrowDownTray className="w-4 h-4" />Export</button>
          </>
        }
      />

      {showForm && <PurchaseForm onClose={() => setShowForm(false)} onSuccess={() => { setShowForm(false); refetch(); }} />}
      {showDetail && <PurchaseDetail purchaseId={showDetail} onClose={() => setShowDetail(null)} onRefetch={refetch} />}
    </div>
  );
};

export default PurchaseOrders;
