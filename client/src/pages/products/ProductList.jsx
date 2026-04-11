import { useState, useEffect } from 'react';
import { HiOutlinePlus } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import useFetch from '../../hooks/useFetch';
import { getProducts, deleteProduct, getCategories, getBrands } from '../../services/product.service';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ProductForm from './ProductForm';

const typeColors = {
  single: 'blue',
  variant: 'purple',
  combo: 'orange',
};

const ProductList = () => {
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [filters, setFilters] = useState({});

  const { data, pagination, loading, setPage, setSearch, setParams, refetch } = useFetch(getProducts, {
    initialParams: { page: 1, limit: 20, search: '', ...filters },
  });

  useEffect(() => {
    getCategories().then((res) => setCategories(res.data.data || [])).catch(() => toast.error('Something went wrong'));
    getBrands().then((res) => setBrands(res.data.data || [])).catch(() => toast.error('Something went wrong'));
  }, []);

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value || undefined };
    setFilters(updated);
    setParams((prev) => ({ ...prev, ...updated, page: 1 }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    setEditProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditProduct(null);
  };

  const handleFormSuccess = () => {
    handleFormClose();
    refetch();
  };

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Name' },
    {
      key: 'category',
      label: 'Category',
      render: (row) => row.category?.name || '-',
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (row) => row.brand?.name || '-',
    },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <StatusBadge color={typeColors[row.type] || 'gray'}>
          {row.type}
        </StatusBadge>
      ),
    },
    {
      key: 'purchasePrice',
      label: 'Purchase Price',
      render: (row) => `৳${row.purchasePrice?.toFixed(2)}`,
    },
    {
      key: 'sellingPrice',
      label: 'Selling Price',
      render: (row) => `৳${row.sellingPrice?.toFixed(2)}`,
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (row) => {
        const isLow = row.stock <= (row.alertQuantity || 0);
        return (
          <StatusBadge color={isLow ? 'red' : 'green'}>
            {row.stock ?? 0}
          </StatusBadge>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleEdit(row)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Products" subtitle="Manage your product catalog">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Product
        </button>
      </PageHeader>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.category || ''}
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>{cat.name}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.brand || ''}
          onChange={(e) => handleFilterChange('brand', e.target.value)}
        >
          <option value="">All Brands</option>
          {brands.map((b) => (
            <option key={b._id} value={b._id}>{b.name}</option>
          ))}
        </select>
        <select
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filters.type || ''}
          onChange={(e) => handleFilterChange('type', e.target.value)}
        >
          <option value="">All Types</option>
          <option value="single">Single</option>
          <option value="variant">Variant</option>
          <option value="combo">Combo</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
      />

      {showForm && (
        <ProductForm
          product={editProduct}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
};

export default ProductList;
