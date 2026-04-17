import { useState, useEffect } from 'react';
import { HiOutlineDocumentText, HiOutlineArrowDownTray, HiOutlinePlus } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import StatusBadge from './StatusBadge';
import { getLinkedDocuments } from '../services/document.service';

const LinkedDocuments = ({ module, recordId }) => {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (module && recordId) fetchDocs();
  }, [module, recordId]);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await getLinkedDocuments(module, recordId);
      setDocs(res.data.data || []);
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  if (loading) {
    return <div className="text-sm text-gray-400 py-4">Loading documents...</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900">Linked Documents ({docs.length})</h3>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <HiOutlineDocumentText className="w-8 h-8 mx-auto mb-2" />
          <p className="text-sm">No documents linked</p>
        </div>
      ) : (
        <div className="space-y-2">
          {docs.map((doc) => (
            <div key={doc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <HiOutlineDocumentText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{doc.title}</p>
                  <p className="text-xs text-gray-400">{doc.fileName} &middot; v{doc.version}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge color="blue">{doc.category}</StatusBadge>
                <a
                  href={`${apiBase}/api/v1/documents/${doc._id}/download`}
                  className="p-1.5 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-blue-600"
                  title="Download"
                >
                  <HiOutlineArrowDownTray className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LinkedDocuments;
