import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import ContactForm from './ContactForm';
import { getContacts, deleteContact } from '../../services/contact.service';

const typeColors = {
  customer: 'blue',
  supplier: 'purple',
  both: 'green',
};

const tabs = [
  { label: 'All', value: '' },
  { label: 'Customers', value: 'customer' },
  { label: 'Suppliers', value: 'supplier' },
];

const ContactList = () => {
  const [activeTab, setActiveTab] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const { data, pagination, loading, setPage, setSearch, setParams, refetch } = useFetch(getContacts, {
    initialParams: { type: '' },
  });

  const handleTabChange = (type) => {
    setActiveTab(type);
    setParams((prev) => ({ ...prev, type, page: 1 }));
  };

  const handleAdd = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setModalOpen(true);
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(`Are you sure you want to delete "${contact.name}"?`)) return;
    try {
      await deleteContact(contact._id);
      toast.success('Contact deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete contact');
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'company', label: 'Company' },
    {
      key: 'type',
      label: 'Type',
      render: (row) => (
        <StatusBadge color={typeColors[row.type]}>
          {row.type.charAt(0).toUpperCase() + row.type.slice(1)}
        </StatusBadge>
      ),
    },
    { key: 'phone', label: 'Phone' },
    {
      key: 'currentDue',
      label: 'Due',
      render: (row) => (
        <span className={row.currentDue > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
          {(row.currentDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleEdit(row)}
            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600"
            title="Edit"
          >
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
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
      <PageHeader title="Contacts" subtitle="Manage customers and suppliers">
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <HiOutlinePlus className="w-4 h-4" />
          Add Contact
        </button>
      </PageHeader>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleTabChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
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

      <ContactForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        contact={editingContact}
        onSuccess={refetch}
      />
    </div>
  );
};

export default ContactList;
