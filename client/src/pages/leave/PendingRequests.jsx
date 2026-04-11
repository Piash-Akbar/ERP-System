import { useState } from 'react';
import toast from 'react-hot-toast';
import { HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import useFetch from '../../hooks/useFetch';
import { getLeaveApplications, approveLeaveApplication, rejectLeaveApplication } from '../../services/leave.service';

const statusColors = { pending: 'yellow', approved: 'green', rejected: 'red' };

const PendingRequests = () => {
  const [filter, setFilter] = useState('');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const { data, pagination, loading, setPage, setSearch, setParams, refetch } = useFetch(getLeaveApplications, {
    initialParams: { status: '' },
  });

  const handleFilterChange = (status) => {
    setFilter(status);
    setParams((prev) => ({ ...prev, status, page: 1 }));
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this leave request?')) return;
    setProcessing(true);
    try {
      await approveLeaveApplication(id);
      toast.success('Leave approved');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(true);
    try {
      await rejectLeaveApplication(rejectModal, { reason: rejectionReason });
      toast.success('Leave rejected');
      setRejectModal(null);
      setRejectionReason('');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    } finally {
      setProcessing(false);
    }
  };

  const applications = data || [];

  return (
    <div>
      <PageHeader title="Leave Requests" subtitle="Review and manage leave applications" />

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 mb-4">
        {[
          { label: 'All', value: '' },
          { label: 'Pending', value: 'pending' },
          { label: 'Approved', value: 'approved' },
          { label: 'Rejected', value: 'rejected' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => handleFilterChange(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === tab.value
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <input
            type="text"
            placeholder="Search..."
            onChange={(e) => setSearch(e.target.value)}
            className="pl-3 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 w-64"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">EMPLOYEE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">LEAVE TYPE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">START DATE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">END DATE</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">DAYS</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">REASON</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">APPLIED</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">STATUS</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Loading...</td></tr>
              ) : applications.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">No leave requests found</td></tr>
              ) : (
                applications.map((app) => (
                  <tr key={app._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">{app.staff?.user?.name || '-'}</p>
                        <p className="text-xs text-gray-500">{app.staff?.employeeId}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{app.leaveType?.name || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{new Date(app.startDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-700">{new Date(app.endDate).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-gray-700">{app.totalDays}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[150px] truncate">{app.reason || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{new Date(app.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <StatusBadge color={statusColors[app.status]}>
                        {app.status?.charAt(0).toUpperCase() + app.status?.slice(1)}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      {app.status === 'pending' ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleApprove(app._id)}
                            disabled={processing}
                            className="p-1.5 hover:bg-green-50 rounded-lg text-gray-500 hover:text-green-600"
                            title="Approve"
                          >
                            <HiOutlineCheckCircle className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => { setRejectModal(app._id); setRejectionReason(''); }}
                            disabled={processing}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-600"
                            title="Reject"
                          >
                            <HiOutlineXCircle className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          {app.status === 'approved' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
            <div className="flex gap-1">
              <button onClick={() => setPage(pagination.page - 1)} disabled={pagination.page <= 1} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Prev</button>
              <button onClick={() => setPage(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      <Modal isOpen={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Leave Request" size="sm">
        <div className="space-y-4">
          <FormInput
            label="Rejection Reason"
            type="textarea"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter reason for rejection (optional)"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={() => setRejectModal(null)} className="px-4 py-2.5 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={handleReject} disabled={processing} className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
              {processing ? 'Rejecting...' : 'Reject'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PendingRequests;
