import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { createWarehouse, updateWarehouse, getBranches } from '../../services/location.service';

const WarehouseForm = ({ isOpen, onClose, warehouse, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    branch: '',
    address: '',
  });
  const [branches, setBranches] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const isEdit = !!warehouse;

  useEffect(() => {
    if (isOpen) {
      fetchBranches();
    }
  }, [isOpen]);

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name || '',
        code: warehouse.code || '',
        branch: warehouse.branch?._id || warehouse.branch || '',
        address: warehouse.address || '',
      });
    } else {
      setFormData({ name: '', code: '', branch: '', address: '' });
    }
    setErrors({});
  }, [warehouse, isOpen]);

  const fetchBranches = async () => {
    try {
      const { data } = await getBranches();
      setBranches(data.data);
    } catch (err) {
      toast.error('Failed to load branches');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.code.trim()) newErrors.code = 'Code is required';
    if (!formData.branch) newErrors.branch = 'Branch is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEdit) {
        await updateWarehouse(warehouse._id, formData);
        toast.success('Warehouse updated successfully');
      } else {
        await createWarehouse(formData);
        toast.success('Warehouse created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Warehouse' : 'Add Warehouse'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="Warehouse name"
        />
        <FormInput
          label="Code"
          name="code"
          value={formData.code}
          onChange={handleChange}
          error={errors.code}
          placeholder="e.g. WH-001"
        />
        <FormInput
          label="Branch"
          name="branch"
          type="select"
          value={formData.branch}
          onChange={handleChange}
          error={errors.branch}
        >
          <option value="">Select Branch</option>
          {branches.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name} ({b.code})
            </option>
          ))}
        </FormInput>
        <FormInput
          label="Address"
          name="address"
          type="textarea"
          value={formData.address}
          onChange={handleChange}
          placeholder="Warehouse address"
        />
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default WarehouseForm;
