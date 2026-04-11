import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlinePencilSquare, HiOutlineTrash, HiOutlineFunnel, HiOutlineArrowDownTray } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import ContactForm from './ContactForm';
import { getContacts, deleteContact } from '../../services/contact.service';

const Customers = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getContacts, {
    initialParams: { type: 'customer' },
  });

  const handleAdd = () => {
    setEditingContact(null);
    setModalOpen(true);
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setModalOpen(true);
  };

  const handleDelete = async (contact) => {
    if (!window.confirm(`Delete "${contact.name}"?`)) return;
    try {
      await deleteContact(contact._id);
      toast.success('Customer deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'CUSTOMER NAME',
      render: (row) => <span className="font-medium text-gray-900">{row.name}</span>,
    },
    { key: 'email', label: 'EMAIL', render: (row) => row.email || '-' },
    { key: 'phone', label: 'PHONE', render: (row) => row.phone || '-' },
    {
      key: 'currentDue',
      label: 'DUE AMOUNT',
      render: (row) => (
        <span className={row.currentDue > 0 ? 'text-red-600 font-medium' : 'text-gray-500'}>
          ${(row.currentDue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => handleEdit(row)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600">
            <HiOutlinePencilSquare className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(row)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-600">
            <HiOutlineTrash className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Customers" subtitle="Manage your customer database">
        <button onClick={handleAdd} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          + Add Customer
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
        actions={
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              <HiOutlineFunnel className="w-4 h-4" /> Filter
            </button>
            <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">
              <HiOutlineArrowDownTray className="w-4 h-4" /> Export
            </button>
          </div>
        }
      />

      <ContactForm isOpen={modalOpen} onClose={() => setModalOpen(false)} contact={editingContact} onSuccess={refetch} />
    </div>
  );
};

export default Customers;
