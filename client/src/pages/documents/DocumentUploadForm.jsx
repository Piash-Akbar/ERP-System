import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { uploadDocument } from '../../services/document.service';

const initialState = {
  title: '',
  description: '',
  category: 'other',
  tags: '',
  expiryDate: '',
  linkedModule: '',
  linkedModel: '',
  linkedId: '',
};

const DocumentUploadForm = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState(initialState);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      if (!form.title) {
        setForm((prev) => ({ ...prev, title: f.name.replace(/\.[^.]+$/, '') }));
      }
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!file) newErrors.file = 'File is required';
    if (!form.title.trim()) newErrors.title = 'Title is required';
    if (!form.category) newErrors.category = 'Category is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append('file', file);
    Object.entries(form).forEach(([key, value]) => {
      if (value) formData.append(key, value);
    });

    setLoading(true);
    try {
      await uploadDocument(formData);
      toast.success('Document uploaded');
      setForm(initialState);
      setFile(null);
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Document" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          {file && <p className="text-xs text-gray-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>}
          {errors.file && <p className="text-sm text-red-500 mt-1">{errors.file}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Title" name="title" value={form.title} onChange={handleChange} error={errors.title} placeholder="Document title" />
          <FormInput label="Category" type="select" name="category" value={form.category} onChange={handleChange} error={errors.category}>
            <option value="invoice">Invoice</option>
            <option value="receipt">Receipt</option>
            <option value="contract">Contract</option>
            <option value="warranty">Warranty</option>
            <option value="certificate">Certificate</option>
            <option value="report">Report</option>
            <option value="legal">Legal</option>
            <option value="insurance">Insurance</option>
            <option value="shipping">Shipping</option>
            <option value="customs">Customs</option>
            <option value="hr">HR</option>
            <option value="other">Other</option>
          </FormInput>
          <FormInput label="Tags (comma-separated)" name="tags" value={form.tags} onChange={handleChange} placeholder="e.g. Q1, urgent, import" />
          <FormInput label="Expiry Date" type="date" name="expiryDate" value={form.expiryDate} onChange={handleChange} />
        </div>

        <FormInput label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Optional description" />

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentUploadForm;
