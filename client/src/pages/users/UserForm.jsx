import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { createUser, updateUser, getRoles, getBranches } from '../../services/user.service';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  role: '',
  branch: '',
  isActive: true,
};

const UserForm = ({ isOpen, onClose, user, onSuccess }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const isEdit = Boolean(user);

  useEffect(() => {
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        password: '',
        role: user.role?._id || user.role || '',
        branch: user.branch?._id || user.branch || '',
        isActive: user.isActive !== undefined ? user.isActive : true,
      });
    } else {
      setForm(initialState);
    }
    setErrors({});
  }, [user, isOpen]);

  const loadOptions = async () => {
    try {
      const [rolesRes, branchesRes] = await Promise.all([getRoles(), getBranches({ limit: 100 })]);
      setRoles(rolesRes.data.data?.data || rolesRes.data.data || []);
      setBranches(branchesRes.data.data?.data || branchesRes.data.data || []);
    } catch {
      // Silently fail - selects will be empty
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.trim().length < 2) newErrors.name = 'Name is required (min 2 characters)';
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Valid email is required';
    if (!isEdit && (!form.password || form.password.length < 8)) newErrors.password = 'Password is required (min 8 characters)';
    if (!form.role) newErrors.role = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = { ...form };
    if (isEdit) delete payload.password;
    if (!payload.branch) delete payload.branch;

    setLoading(true);
    try {
      if (isEdit) {
        await updateUser(user._id, payload);
        toast.success('User updated successfully');
      } else {
        await createUser(payload);
        toast.success('User created successfully');
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit User' : 'Add User'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Full name"
          />
          <FormInput
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="email@example.com"
          />
          <FormInput
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone number"
          />
          {!isEdit && (
            <FormInput
              label="Password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Min 8 characters"
            />
          )}
          <FormInput
            label="Role"
            type="select"
            name="role"
            value={form.role}
            onChange={handleChange}
            error={errors.role}
          >
            <option value="">Select Role</option>
            {roles.map((r) => (
              <option key={r._id} value={r._id}>
                {r.name}
              </option>
            ))}
          </FormInput>
          <FormInput
            label="Branch"
            type="select"
            name="branch"
            value={form.branch}
            onChange={handleChange}
          >
            <option value="">No Branch</option>
            {branches.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </FormInput>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : isEdit ? 'Update User' : 'Add User'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserForm;
