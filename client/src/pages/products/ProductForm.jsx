import { useState, useEffect } from 'react';
import { HiOutlinePlus, HiOutlineTrash } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import {
  createProduct,
  updateProduct,
  getCategories,
  getBrands,
  getUnits,
  getTaxes,
} from '../../services/product.service';

const emptyVariant = { name: '', sku: '', purchasePrice: '', sellingPrice: '', stock: 0 };

const ProductForm = ({ product, onClose, onSuccess }) => {
  const isEdit = Boolean(product);

  const [form, setForm] = useState({
    name: '',
    sku: '',
    type: 'single',
    category: '',
    brand: '',
    unit: '',
    tax: '',
    purchasePrice: '',
    sellingPrice: '',
    minSellingPrice: '',
    alertQuantity: '',
    description: '',
    serialTracking: false,
    variants: [],
  });

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [units, setUnits] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    Promise.all([getCategories(), getBrands(), getUnits(), getTaxes()])
      .then(([catRes, brandRes, unitRes, taxRes]) => {
        setCategories(catRes.data.data || []);
        setBrands(brandRes.data.data || []);
        setUnits(unitRes.data.data || []);
        setTaxes(taxRes.data.data || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        sku: product.sku || '',
        type: product.type || 'single',
        category: product.category?._id || product.category || '',
        brand: product.brand?._id || product.brand || '',
        unit: product.unit?._id || product.unit || '',
        tax: product.tax?._id || product.tax || '',
        purchasePrice: product.purchasePrice ?? '',
        sellingPrice: product.sellingPrice ?? '',
        minSellingPrice: product.minSellingPrice ?? '',
        alertQuantity: product.alertQuantity ?? '',
        description: product.description || '',
        serialTracking: product.serialTracking || false,
        variants: product.variants || [],
      });
    }
  }, [product]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleVariantChange = (index, field, value) => {
    setForm((prev) => {
      const variants = [...prev.variants];
      variants[index] = { ...variants[index], [field]: value };
      return { ...prev, variants };
    });
  };

  const addVariant = () => {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { ...emptyVariant }] }));
  };

  const removeVariant = (index) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.sku.trim()) errs.sku = 'SKU is required';
    if (form.purchasePrice === '' || Number(form.purchasePrice) < 0) errs.purchasePrice = 'Valid purchase price required';
    if (form.sellingPrice === '' || Number(form.sellingPrice) < 0) errs.sellingPrice = 'Valid selling price required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        ...form,
        purchasePrice: Number(form.purchasePrice),
        sellingPrice: Number(form.sellingPrice),
        minSellingPrice: form.minSellingPrice ? Number(form.minSellingPrice) : undefined,
        alertQuantity: form.alertQuantity ? Number(form.alertQuantity) : undefined,
        category: form.category || undefined,
        brand: form.brand || undefined,
        unit: form.unit || undefined,
        tax: form.tax || undefined,
      };

      if (payload.type === 'variant' && payload.variants.length) {
        payload.variants = payload.variants.map((v) => ({
          ...v,
          purchasePrice: Number(v.purchasePrice),
          sellingPrice: Number(v.sellingPrice),
          stock: Number(v.stock) || 0,
        }));
      } else {
        delete payload.variants;
      }

      if (isEdit) {
        await updateProduct(product._id, payload);
        toast.success('Product updated successfully');
      } else {
        await createProduct(payload);
        toast.success('Product created successfully');
      }
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={isEdit ? 'Edit Product' : 'Add Product'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Product Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            required
          />
          <FormInput
            label="SKU"
            name="sku"
            value={form.sku}
            onChange={handleChange}
            error={errors.sku}
            required
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormInput label="Type" name="type" type="select" value={form.type} onChange={handleChange}>
            <option value="single">Single</option>
            <option value="variant">Variant</option>
            <option value="combo">Combo</option>
          </FormInput>
          <FormInput label="Category" name="category" type="select" value={form.category} onChange={handleChange}>
            <option value="">Select Category</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </FormInput>
          <FormInput label="Brand" name="brand" type="select" value={form.brand} onChange={handleChange}>
            <option value="">Select Brand</option>
            {brands.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </FormInput>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormInput label="Unit" name="unit" type="select" value={form.unit} onChange={handleChange}>
            <option value="">Select Unit</option>
            {units.map((u) => (
              <option key={u._id} value={u._id}>{u.name} ({u.shortName})</option>
            ))}
          </FormInput>
          <FormInput label="Tax" name="tax" type="select" value={form.tax} onChange={handleChange}>
            <option value="">Select Tax</option>
            {taxes.map((t) => (
              <option key={t._id} value={t._id}>{t.name} ({t.rate}%)</option>
            ))}
          </FormInput>
          <FormInput
            label="Alert Quantity"
            name="alertQuantity"
            type="number"
            value={form.alertQuantity}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormInput
            label="Purchase Price"
            name="purchasePrice"
            type="number"
            value={form.purchasePrice}
            onChange={handleChange}
            error={errors.purchasePrice}
            required
          />
          <FormInput
            label="Selling Price"
            name="sellingPrice"
            type="number"
            value={form.sellingPrice}
            onChange={handleChange}
            error={errors.sellingPrice}
            required
          />
          <FormInput
            label="Min Selling Price"
            name="minSellingPrice"
            type="number"
            value={form.minSellingPrice}
            onChange={handleChange}
          />
        </div>

        <FormInput
          label="Description"
          name="description"
          type="textarea"
          value={form.description}
          onChange={handleChange}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="serialTracking"
            name="serialTracking"
            checked={form.serialTracking}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="serialTracking" className="text-sm font-medium text-gray-700">
            Enable Serial Tracking
          </label>
        </div>

        {/* Variant rows */}
        {form.type === 'variant' && (
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-700">Variants</h4>
              <button
                type="button"
                onClick={addVariant}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                <HiOutlinePlus className="w-4 h-4" />
                Add Variant
              </button>
            </div>
            {form.variants.length === 0 && (
              <p className="text-sm text-gray-400">No variants added yet.</p>
            )}
            {form.variants.map((variant, index) => (
              <div key={index} className="grid grid-cols-6 gap-3 mb-3 items-end">
                <FormInput
                  label={index === 0 ? 'Name' : ''}
                  value={variant.name}
                  onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                  placeholder="Variant name"
                />
                <FormInput
                  label={index === 0 ? 'SKU' : ''}
                  value={variant.sku}
                  onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                  placeholder="SKU"
                />
                <FormInput
                  label={index === 0 ? 'Purchase Price' : ''}
                  type="number"
                  value={variant.purchasePrice}
                  onChange={(e) => handleVariantChange(index, 'purchasePrice', e.target.value)}
                />
                <FormInput
                  label={index === 0 ? 'Selling Price' : ''}
                  type="number"
                  value={variant.sellingPrice}
                  onChange={(e) => handleVariantChange(index, 'sellingPrice', e.target.value)}
                />
                <FormInput
                  label={index === 0 ? 'Stock' : ''}
                  type="number"
                  value={variant.stock}
                  onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="p-2.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                >
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProductForm;
