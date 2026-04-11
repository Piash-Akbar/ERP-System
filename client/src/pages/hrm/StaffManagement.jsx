import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';
import useFetch from '../../hooks/useFetch';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/PageHeader';
import { getStaff, deleteStaff } from '../../services/hrm.service';

const StaffManagement = () => {
  const navigate = useNavigate();
  const { data, pagination, loading, setPage, setSearch, refetch } = useFetch(getStaff);

  const handleDelete = async (staff) => {
    if (!window.confirm(`Delete "${staff.employeeId}"?`)) return;
    try {
      await deleteStaff(staff._id);
      toast.success('Staff deleted');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  const columns = [
    {
      key: 'employeeId',
      label: 'EMPLOYEE ID',
      render: (row) => <span className="font-medium text-gray-900">{row.employeeId}</span>,
    },
    {
      key: 'name',
      label: 'NAME',
      render: (row) => row.user?.name || '-',
    },
    {
      key: 'email',
      label: 'EMAIL',
      render: (row) => row.user?.email || '-',
    },
    { key: 'department', label: 'DEPARTMENT' },
    { key: 'designation', label: 'DESIGNATION' },
    {
      key: 'location',
      label: 'LOCATION',
      render: (row) => row.branch || '-',
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      render: (row) => (
        <div className="flex items-center gap-1">
          <button onClick={() => navigate(`/hrm/edit-staff/${row._id}`)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600">
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
      <PageHeader title="Staff Management" subtitle="Manage employee information">
        <button onClick={() => navigate('/hrm/add-staff')} className="px-4 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600">
          + Add Staff
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={data || []}
        pagination={pagination}
        onPageChange={setPage}
        onSearch={setSearch}
        loading={loading}
      />
    </div>
  );
};

export default StaffManagement;
