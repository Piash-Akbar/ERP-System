import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import { createProduct, getCategories, getBrands } from '../../services/product.service';

const productTypes = ['Single Product', 'Variant Product', 'Combo Product'];
const typeMap = { 'Single Product': 'single', 'Variant Product': 'variant', 'Combo Product': 'combo' };

const AddProduct = () => {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('Single Product');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);
  const [form, setForm] = useState({
    name: '', sku: '', category: '', subCategory: '', brand: '', model: '',
    unit: '', alertQuantity: '10', purchasePrice: '', sellingPrice: '', minSellingPrice: '',
    taxPercent: '0', description: '',
  });

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.data || [])).catch(() => {});
    getBrands().then((res) => setBrands(res.data.data || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([
      {
        name: 'Sample Product', sku: 'SKU-001', type: 'single',
        category: '', subCategory: '', brand: '', model: '',
        unit: 'pcs', alertQuantity: 10,
        purchasePrice: 100, sellingPrice: 150, minSellingPrice: 120,
        taxPercent: 0, description: '',
      },
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Products');
    XLSX.writeFile(wb, 'product-import-template.xlsx');
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (!rows.length) {
        toast.error('Excel is empty');
        return;
      }
      const catByName = new Map(categories.map((c) => [String(c.name).toLowerCase(), c._id]));
      const brandByName = new Map(brands.map((b) => [String(b.name).toLowerCase(), b._id]));
      const isObjectId = (v) => typeof v === 'string' && /^[0-9a-fA-F]{24}$/.test(v);

      let ok = 0;
      const failures = [];
      for (const [i, row] of rows.entries()) {
        if (!row.name || !row.sku || row.sellingPrice == null || row.sellingPrice === '') {
          failures.push(`Row ${i + 2}: missing name/sku/sellingPrice`);
          continue;
        }
        const rawType = String(row.type || 'single').toLowerCase();
        const type = ['single', 'variant', 'combo'].includes(rawType) ? rawType : 'single';
        const catVal = row.category ? String(row.category) : '';
        const brandVal = row.brand ? String(row.brand) : '';
        const category = isObjectId(catVal) ? catVal : catByName.get(catVal.toLowerCase()) || undefined;
        const brand = isObjectId(brandVal) ? brandVal : brandByName.get(brandVal.toLowerCase()) || undefined;
        const payload = {
          name: String(row.name).trim(),
          sku: String(row.sku).trim(),
          type,
          category,
          subCategory: row.subCategory || undefined,
          brand,
          model: row.model || '',
          unit: row.unit || '',
          alertQuantity: Number(row.alertQuantity) || 0,
          purchasePrice: Number(row.purchasePrice) || 0,
          sellingPrice: Number(row.sellingPrice),
          minSellingPrice: Number(row.minSellingPrice) || 0,
          taxPercent: Number(row.taxPercent) || 0,
          description: row.description || '',
        };
        try {
          await createProduct(payload);
          ok++;
        } catch (err) {
          failures.push(`Row ${i + 2} (${payload.sku}): ${err.response?.data?.error || 'failed'}`);
        }
      }
      if (ok) toast.success(`Imported ${ok} product${ok > 1 ? 's' : ''}`);
      if (failures.length) {
        toast.error(`${failures.length} row(s) failed`);
        console.error('Import failures:', failures);
      }
      if (ok && !failures.length) navigate('/products');
    } catch (err) {
      toast.error('Failed to read Excel file');
      console.error(err);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.sku) return toast.error('Name and SKU are required');
    if (!form.sellingPrice) return toast.error('Selling price is required');
    setLoading(true);
    try {
      await createProduct({
        ...form,
        type: typeMap[activeType],
        purchasePrice: Number(form.purchasePrice) || 0,
        sellingPrice: Number(form.sellingPrice),
        minSellingPrice: Number(form.minSellingPrice) || 0,
        alertQuantity: Number(form.alertQuantity) || 0,
        taxPercent: Number(form.taxPercent) || 0,
      });
      toast.success('Product created successfully');
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader title="Add New Product" subtitle="Create a new product entry" />
        <div className="flex items-center gap-2">
          <button type="button" onClick={downloadTemplate}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Download Template
          </button>
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50">
            {importing ? 'Importing...' : 'Import from Excel'}
          </button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} className="hidden" />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Product Type */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-3">Product Type</h3>
          <div className="flex gap-2">
            {productTypes.map((type) => (
              <button key={type} type="button" onClick={() => setActiveType(type)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${activeType === type ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Basic Information */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Product Name *" name="name" value={form.name} onChange={handleChange} placeholder="Enter product name" required />
            <FormInput label="SKU *" name="sku" value={form.sku} onChange={handleChange} placeholder="Enter SKU" required />
            <FormInput label="Category" name="category" type="select" value={form.category} onChange={handleChange}>
              <option value="">Select category</option>
              {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </FormInput>
            <FormInput label="Sub Category" name="subCategory" type="select" value={form.subCategory} onChange={handleChange}>
              <option value="">Select sub category</option>
            </FormInput>
            <FormInput label="Brand" name="brand" type="select" value={form.brand} onChange={handleChange}>
              <option value="">Select brand</option>
              {brands.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </FormInput>
            <FormInput label="Model" name="model" value={form.model} onChange={handleChange} placeholder="Enter model" />
            <FormInput label="Unit" name="unit" type="select" value={form.unit} onChange={handleChange}>
              <option value="">Select unit</option>
              <option value="pcs">Pieces</option><option value="kg">Kilogram</option>
            </FormInput>
            <FormInput label="Alert Quantity" name="alertQuantity" type="number" value={form.alertQuantity} onChange={handleChange} min="0" />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput label="Purchase Price" name="purchasePrice" type="number" value={form.purchasePrice} onChange={handleChange} placeholder="0.00" min="0" />
            <FormInput label="Selling Price *" name="sellingPrice" type="number" value={form.sellingPrice} onChange={handleChange} placeholder="0.00" min="0" required />
            <FormInput label="Minimum Selling Price" name="minSellingPrice" type="number" value={form.minSellingPrice} onChange={handleChange} placeholder="0.00" min="0" />
          </div>
        </div>

        {/* Tax & Image */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tax & Image</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="TAX (%)" name="taxPercent" type="number" value={form.taxPercent} onChange={handleChange} min="0" />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
                <p className="text-sm text-gray-500">Click to upload image</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Description</h3>
          <FormInput type="textarea" name="description" value={form.description} onChange={handleChange} placeholder="Enter product description..." />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/products')} className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">Cancel</button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">{loading ? 'Creating...' : 'Create Product'}</button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
