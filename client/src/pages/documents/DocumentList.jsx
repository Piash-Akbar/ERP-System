import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePlus, HiOutlinePencilSquare, HiOutlineTrash, HiOutlineArrowDownTray, HiOutlineEye } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import DocumentUploadForm from './DocumentUploadForm';
import { getDocuments, deleteDocument } from '../../services/document.service';

const categoryColors = {
  invoice: 'blue', receipt: 'green', contract: 'purple', warranty: 'yellow',
  certificate: 'green', report: 'blue', legal: 'red', insurance: 'purple',
  shipping: 'yellow', customs: 'red', hr: 'blue', other: 'gray',
};

const categoryOptions = [
  { label: 'All', value: '' },
  { label: 'Invoice', value: 'invoice' },
  { label: 'Receipt', value: 'receipt' },
  { label: 'Contract', value: 'contract' },
  { label: 'Warranty', value: 'warranty' },
  { label: 'Certificate', value: 'certificate' },
  { label: 'Report', value: 'report' },
  { label: 'Legal', value: 'legal' },
  { label: 'HR', value: 'hr' },
  { label: 'Other', value: 'other' },
];

const DocumentList = () => {
  const [activeCategory, setActiveCategory] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const { data, pagination, loading, setPage, setSearch, setParams, refetch } = useFetch(getDocuments, {
    initialParams: { category: '' },
  });

  const handleCategoryChange = (value) => {
    setActiveCategory(value);
    setParams((prev) => ({ ...prev, category: value, page: 1 }));
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"?`)) return;
    try {
      await deleteDocument(doc._id);
      toast.success('Document deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const columns = [
    { key: 'title', label: 'Title' },
    {
      key: 'category',
      label: 'Category',
      render: (row) => (
        <StatusBadge color={categoryColors[row.category] || 'gray'}>
          {row.category}
        </StatusBadge>
      ),
    },
    {
      key: 'tags',
      label: 'Tags',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {(row.tags || []).slice(0, 3).map((tag, i) => (
            <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{tag}</span>
          ))}
        </div>
      ),
    },
    {
      key: 'fileSize',
      label: 'Size',
      render: (row) => formatFileSize(row.fileSize),
    },
    { key: 'version', label: 'Ver' },
    {
      key: 'uploadedBy',
      label: 'Uploaded By',
      render: (row) => row.uploadedBy?.name || 'N/A',
    },
    {
      key: 'expiryDate',
      label: 'Expires',
      render: (row) => {
        if (!row.expiryDate) return '-';
        const d = new Date(row.expiryDate);
        const isExpiring = d < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return (
          <span className={isExpiring ? 'text-red-600 font-medium' : ''}>
            {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/documents/${row._id}/preview`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
            title="Preview"
          >
            <HiOutlineEye className="w-4 h-4" />
          </a>
          <a
            href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/v1/documents/${row._id}/download`}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-green-600"
            title="Download"
          >
            <HiOutlineArrowDownTray className="w-4 h-4" />
          </a>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600"
            title="Delete"
          >
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Documents" subtitle="Manage business documents">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Upload Document
        </button>
      </PageHeader>

      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {categoryOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleCategoryChange(opt.value)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              activeCategory === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
      />

      <DocumentUploadForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default DocumentList;
