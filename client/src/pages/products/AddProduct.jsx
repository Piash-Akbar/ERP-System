import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';

const productTypes = ['Single Product', 'Variant Product', 'Combo Product'];

const AddProduct = () => {
  const navigate = useNavigate();
  const [activeType, setActiveType] = useState('Single Product');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', sku: '', category: '', subCategory: '', brand: '', model: '',
    unit: '', alertQuantity: '10', purchasePrice: '', sellingPrice: '', minSellingPrice: '',
    taxPercent: '0', description: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.sku) return toast.error('Name and SKU are required');
    if (!form.sellingPrice) return toast.error('Selling price is required');
    toast.success('Product created successfully');
    navigate('/products');
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="Add New Product" subtitle="Create a new product entry" />

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
              <option value="wallets">Wallets</option><option value="belts">Belts</option><option value="jackets">Jackets</option>
            </FormInput>
            <FormInput label="Sub Category" name="subCategory" type="select" value={form.subCategory} onChange={handleChange}>
              <option value="">Select sub category</option>
            </FormInput>
            <FormInput label="Brand" name="brand" type="select" value={form.brand} onChange={handleChange}>
              <option value="">Select brand</option>
              <option value="premium">Premium</option><option value="classic">Classic</option><option value="elite">Elite</option>
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
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50">Create Product</button>
        </div>
      </form>
    </div>
  );
};

export default AddProduct;
