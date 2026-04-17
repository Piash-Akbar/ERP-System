import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import { getExpiringDocuments } from '../../services/document.service';

const ExpiringDocuments = () => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExpiring();
  }, [days]);

  const fetchExpiring = async () => {
    setLoading(true);
    try {
      const res = await getExpiringDocuments({ days });
      setDocs(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load expiring documents');
    } finally {
      setLoading(false);
    }
  };

  const getDaysRemaining = (date) => {
    const diff = Math.ceil((new Date(date) - new Date()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div>
      <PageHeader title="Expiring Documents" subtitle="Documents approaching expiry">
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3 py-2.5 text-sm border border-gray-300 rounded-lg"
        >
          <option value={7}>Next 7 days</option>
          <option value={15}>Next 15 days</option>
          <option value={30}>Next 30 days</option>
          <option value={60}>Next 60 days</option>
          <option value={90}>Next 90 days</option>
        </select>
      </PageHeader>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : docs.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <HiOutlineExclamationTriangle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No documents expiring in the next {days} days</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Expires</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Days Left</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Uploaded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map((doc) => {
                const daysLeft = getDaysRemaining(doc.expiryDate);
                return (
                  <tr
                    key={doc._id}
                    onClick={() => navigate(`/documents/${doc._id}`)}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 font-medium text-blue-600">{doc.title}</td>
                    <td className="px-4 py-3">
                      <StatusBadge color="blue">{doc.category}</StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(doc.expiryDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${daysLeft <= 7 ? 'text-red-600' : daysLeft <= 15 ? 'text-yellow-600' : 'text-gray-600'}`}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{doc.uploadedBy?.name || 'N/A'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ExpiringDocuments;
