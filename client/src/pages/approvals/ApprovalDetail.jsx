import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HiOutlineCheckCircle,
  HiOutlineXCircle,
  HiOutlinePauseCircle,
  HiOutlineArrowUpCircle,
  HiOutlineArrowLeft,
} from 'react-icons/hi2';
import StatusBadge from '../../components/StatusBadge';
import { getApproval, approveRequest, rejectRequest, holdRequest, escalateRequest } from '../../services/approval.service';

const statusColors = {
  pending: 'yellow',
  approved: 'green',
  rejected: 'red',
  on_hold: 'blue',
  cancelled: 'gray',
  escalated: 'purple',
};

const ApprovalDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await getApproval(id);
      setRequest(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (actionFn, actionName) => {
    setActionLoading(actionName);
    try {
      await actionFn(id, { comment });
      toast.success(`${actionName} successfully`);
      setComment('');
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.error || `Failed to ${actionName.toLowerCase()}`);
    } finally {
      setActionLoading('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!request) {
    return <div className="text-center py-20 text-gray-500">Approval request not found</div>;
  }

  const isPending = request.status === 'pending' || request.status === 'escalated';

  return (
    <div>
      <button
        onClick={() => navigate('/approvals')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Queue
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Request Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {request.sourceRef || `Request #${request._id.slice(-8).toUpperCase()}`}
              </h2>
              <StatusBadge color={statusColors[request.status] || 'gray'}>
                {request.status.replace('_', ' ')}
              </StatusBadge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Module</span>
                <p className="font-medium capitalize">{request.module}</p>
              </div>
              <div>
                <span className="text-gray-500">Action</span>
                <p className="font-medium capitalize">{request.action}</p>
              </div>
              <div>
                <span className="text-gray-500">Level</span>
                <p className="font-medium">{request.currentLevel} / {request.totalLevels}</p>
              </div>
              <div>
                <span className="text-gray-500">Submitted By</span>
                <p className="font-medium">{request.submittedBy?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Source Model</span>
                <p className="font-medium">{request.sourceModel}</p>
              </div>
              <div>
                <span className="text-gray-500">Branch</span>
                <p className="font-medium">{request.branch?.name || '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">Submitted</span>
                <p className="font-medium">
                  {new Date(request.createdAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                  })}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Due Date</span>
                <p className="font-medium">
                  {request.dueDate
                    ? new Date(request.dueDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })
                    : '-'}
                </p>
              </div>
            </div>

            {request.metadata && Object.keys(request.metadata).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  {Object.entries(request.metadata).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <p className="font-medium">{typeof value === 'number' ? value.toLocaleString() : String(value)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Approval Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Approval History</h3>
            {request.approvals.length === 0 ? (
              <p className="text-sm text-gray-500">No actions yet</p>
            ) : (
              <div className="space-y-3">
                {request.approvals.map((entry, idx) => (
                  <div key={idx} className="flex items-start gap-3 pb-3 border-b border-gray-50 last:border-0">
                    <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${
                      entry.action === 'approved' ? 'bg-green-500' :
                      entry.action === 'rejected' ? 'bg-red-500' :
                      entry.action === 'hold' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">{entry.user?.name || 'Unknown'}</span>
                        {' '}
                        <span className="capitalize text-gray-600">{entry.action.replace('_', ' ')}</span>
                        {' at Level '}
                        {entry.level}
                      </p>
                      {entry.comment && <p className="text-sm text-gray-500 mt-0.5">{entry.comment}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(entry.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="space-y-6">
          {isPending && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Take Action</h3>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-4"
              />
              <div className="space-y-2">
                <button
                  onClick={() => handleAction(approveRequest, 'Approved')}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  <HiOutlineCheckCircle className="w-4 h-4" />
                  {actionLoading === 'Approved' ? 'Approving...' : 'Approve'}
                </button>
                <button
                  onClick={() => handleAction(rejectRequest, 'Rejected')}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <HiOutlineXCircle className="w-4 h-4" />
                  {actionLoading === 'Rejected' ? 'Rejecting...' : 'Reject'}
                </button>
                <button
                  onClick={() => handleAction(holdRequest, 'On Hold')}
                  disabled={!!actionLoading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <HiOutlinePauseCircle className="w-4 h-4" />
                  {actionLoading === 'On Hold' ? 'Processing...' : 'Put on Hold'}
                </button>
                {request.currentLevel < request.totalLevels && (
                  <button
                    onClick={() => handleAction(escalateRequest, 'Escalated')}
                    disabled={!!actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 disabled:opacity-50"
                  >
                    <HiOutlineArrowUpCircle className="w-4 h-4" />
                    {actionLoading === 'Escalated' ? 'Escalating...' : 'Escalate'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Rule Info */}
          {request.rule && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Approval Rule</h3>
              <p className="text-sm text-gray-600">{request.rule.name}</p>
              <p className="text-xs text-gray-400 mt-1">{request.rule.levels?.length || 0} level(s)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApprovalDetail;
