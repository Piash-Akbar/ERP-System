import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { HiOutlineArrowLeft, HiOutlineArrowDownTray, HiOutlineDocumentText } from 'react-icons/hi2';
import StatusBadge from '../../components/StatusBadge';
import { getDocument } from '../../services/document.service';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDoc();
  }, [id]);

  const fetchDoc = async () => {
    setLoading(true);
    try {
      const res = await getDocument(id);
      setDoc(res.data.data);
    } catch (err) {
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!doc) {
    return <div className="text-center py-20 text-gray-500">Document not found</div>;
  }

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const isPreviewable = doc.mimeType?.startsWith('image/') || doc.mimeType === 'application/pdf';

  return (
    <div>
      <button onClick={() => navigate('/documents')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Documents
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Preview */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{doc.title}</h2>
            {isPreviewable ? (
              doc.mimeType?.startsWith('image/') ? (
                <img src={`${apiBase}/api/v1/documents/${doc._id}/preview`} alt={doc.title} className="max-w-full rounded-lg" />
              ) : (
                <iframe
                  src={`${apiBase}/api/v1/documents/${doc._id}/preview`}
                  className="w-full h-[600px] border border-gray-200 rounded-lg"
                  title={doc.title}
                />
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <HiOutlineDocumentText className="w-16 h-16 mb-3" />
                <p className="text-sm">Preview not available for this file type</p>
                <p className="text-xs mt-1">{doc.mimeType}</p>
              </div>
            )}
          </div>

          {/* Version History */}
          {doc.previousVersion && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Previous Version</h3>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500">v{doc.previousVersion.version}</span>
                <span>{doc.previousVersion.title}</span>
                <span className="text-gray-400">{doc.previousVersion.fileName}</span>
                <span className="text-gray-400">
                  {new Date(doc.previousVersion.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">Category</span>
                <p><StatusBadge color="blue">{doc.category}</StatusBadge></p>
              </div>
              <div>
                <span className="text-gray-500">File Name</span>
                <p className="font-medium">{doc.fileName}</p>
              </div>
              <div>
                <span className="text-gray-500">Size</span>
                <p>{doc.fileSize ? (doc.fileSize / 1024 / 1024).toFixed(2) + ' MB' : '-'}</p>
              </div>
              <div>
                <span className="text-gray-500">Version</span>
                <p>{doc.version}</p>
              </div>
              <div>
                <span className="text-gray-500">Uploaded By</span>
                <p>{doc.uploadedBy?.name || 'N/A'}</p>
              </div>
              <div>
                <span className="text-gray-500">Uploaded</span>
                <p>{new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
              {doc.expiryDate && (
                <div>
                  <span className="text-gray-500">Expires</span>
                  <p className={new Date(doc.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                    {new Date(doc.expiryDate).toLocaleDateString()}
                  </p>
                </div>
              )}
              {doc.tags?.length > 0 && (
                <div>
                  <span className="text-gray-500">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {doc.tags.map((tag, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
              {doc.linkedModule && (
                <div>
                  <span className="text-gray-500">Linked To</span>
                  <p className="capitalize">{doc.linkedModule} / {doc.linkedModel}</p>
                </div>
              )}
            </div>

            <a
              href={`${apiBase}/api/v1/documents/${doc._id}/download`}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <HiOutlineArrowDownTray className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentDetail;
