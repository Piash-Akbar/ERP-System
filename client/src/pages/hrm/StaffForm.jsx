import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { createStaff, updateStaff } from '../../services/hrm.service';

const initialState = {
  employeeId: '',
  user: '',
  department: '',
  designation: '',
  joiningDate: '',
  basicSalary: '',
  allowances: '',
  deductions: '',
  bankAccount: '',
  bankName: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  emergencyContactRelation: '',
};

const StaffForm = ({ isOpen, onClose, staff, onSuccess, users = [] }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(staff);

  useEffect(() => {
    if (staff) {
      setForm({
        employeeId: staff.employeeId || '',
        user: staff.user?._id || staff.user || '',
        department: staff.department || '',
        designation: staff.designation || '',
        joiningDate: staff.joiningDate ? staff.joiningDate.substring(0, 10) : '',
        basicSalary: staff.basicSalary || '',
        allowances: staff.allowances || '',
        deductions: staff.deductions || '',
        bankAccount: staff.bankAccount || '',
        bankName: staff.bankName || '',
        emergencyContactName: staff.emergencyContact?.name || '',
        emergencyContactPhone: staff.emergencyContact?.phone || '',
        emergencyContactRelation: staff.emergencyContact?.relation || '',
      });
    } else {
      setForm(initialState);
    }
    setErrors({});
  }, [staff, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.employeeId.trim()) newErrors.employeeId = 'Employee ID is required';
    if (!form.user) newErrors.user = 'User is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      employeeId: form.employeeId,
      user: form.user,
      department: form.department,
      designation: form.designation,
      joiningDate: form.joiningDate || undefined,
      basicSalary: Number(form.basicSalary) || 0,
      allowances: Number(form.allowances) || 0,
      deductions: Number(form.deductions) || 0,
      bankAccount: form.bankAccount,
      bankName: form.bankName,
      emergencyContact: {
        name: form.emergencyContactName,
        phone: form.emergencyContactPhone,
        relation: form.emergencyContactRelation,
      },
    };

    setLoading(true);
    try {
      if (isEdit) {
        await updateStaff(staff._id, payload);
        toast.success('Staff updated successfully');
      } else {
        await createStaff(payload);
        toast.success('Staff created successfully');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Staff' : 'Add Staff'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Employee ID"
            name="employeeId"
            value={form.employeeId}
            onChange={handleChange}
            error={errors.employeeId}
            placeholder="EMP-001"
          />

          <FormInput
            label="User"
            type="select"
            name="user"
            value={form.user}
            onChange={handleChange}
            error={errors.user}
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({u.email})
              </option>
            ))}
          </FormInput>

          <FormInput
            label="Department"
            name="department"
            value={form.department}
            onChange={handleChange}
            placeholder="Department"
          />

          <FormInput
            label="Designation"
            name="designation"
            value={form.designation}
            onChange={handleChange}
            placeholder="Designation"
          />

          <FormInput
            label="Joining Date"
            type="date"
            name="joiningDate"
            value={form.joiningDate}
            onChange={handleChange}
          />

          <FormInput
            label="Basic Salary"
            type="number"
            name="basicSalary"
            value={form.basicSalary}
            onChange={handleChange}
            placeholder="0"
            min="0"
          />

          <FormInput
            label="Allowances"
            type="number"
            name="allowances"
            value={form.allowances}
            onChange={handleChange}
            placeholder="0"
            min="0"
          />

          <FormInput
            label="Deductions"
            type="number"
            name="deductions"
            value={form.deductions}
            onChange={handleChange}
            placeholder="0"
            min="0"
          />

          <FormInput
            label="Bank Account"
            name="bankAccount"
            value={form.bankAccount}
            onChange={handleChange}
            placeholder="Account number"
          />

          <FormInput
            label="Bank Name"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            placeholder="Bank name"
          />
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput
              label="Name"
              name="emergencyContactName"
              value={form.emergencyContactName}
              onChange={handleChange}
              placeholder="Contact name"
            />
            <FormInput
              label="Phone"
              name="emergencyContactPhone"
              value={form.emergencyContactPhone}
              onChange={handleChange}
              placeholder="Phone"
            />
            <FormInput
              label="Relation"
              name="emergencyContactRelation"
              value={form.emergencyContactRelation}
              onChange={handleChange}
              placeholder="Relation"
            />
          </div>
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
            {loading ? 'Saving...' : isEdit ? 'Update Staff' : 'Add Staff'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StaffForm;
