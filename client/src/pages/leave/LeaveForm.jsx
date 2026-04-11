import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { createLeaveApplication } from '../../services/leave.service';

const initialState = {
  staff: '',
  leaveType: '',
  startDate: '',
  endDate: '',
  reason: '',
};

const LeaveForm = ({ isOpen, onClose, onSuccess, leaveTypes = [], staffList = [] }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setForm(initialState);
      setErrors({});
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const calcDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const validate = () => {
    const newErrors = {};
    if (!form.staff) newErrors.staff = 'Staff is required';
    if (!form.leaveType) newErrors.leaveType = 'Leave type is required';
    if (!form.startDate) newErrors.startDate = 'Start date is required';
    if (!form.endDate) newErrors.endDate = 'End date is required';
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const totalDays = calcDays();
    if (totalDays <= 0) {
      toast.error('Invalid date range');
      return;
    }

    setLoading(true);
    try {
      await createLeaveApplication({
        staff: form.staff,
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        totalDays,
        reason: form.reason,
      });
      toast.success('Leave application submitted');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Apply Leave" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="Staff"
          type="select"
          name="staff"
          value={form.staff}
          onChange={handleChange}
          error={errors.staff}
        >
          <option value="">Select Staff</option>
          {staffList.map((s) => (
            <option key={s._id} value={s._id}>
              {s.user?.name || s.employeeId} ({s.employeeId})
            </option>
          ))}
        </FormInput>

        <FormInput
          label="Leave Type"
          type="select"
          name="leaveType"
          value={form.leaveType}
          onChange={handleChange}
          error={errors.leaveType}
        >
          <option value="">Select Leave Type</option>
          {leaveTypes.map((lt) => (
            <option key={lt._id} value={lt._id}>
              {lt.name} ({lt.daysAllowed} days)
            </option>
          ))}
        </FormInput>

        <div className="grid grid-cols-2 gap-4">
          <FormInput
            label="Start Date"
            type="date"
            name="startDate"
            value={form.startDate}
            onChange={handleChange}
            error={errors.startDate}
          />
          <FormInput
            label="End Date"
            type="date"
            name="endDate"
            value={form.endDate}
            onChange={handleChange}
            error={errors.endDate}
          />
        </div>

        {form.startDate && form.endDate && calcDays() > 0 && (
          <p className="text-sm text-gray-600">
            Total days: <span className="font-medium">{calcDays()}</span>
          </p>
        )}

        <FormInput
          label="Reason"
          type="textarea"
          name="reason"
          value={form.reason}
          onChange={handleChange}
          placeholder="Reason for leave"
        />

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
            {loading ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default LeaveForm;
