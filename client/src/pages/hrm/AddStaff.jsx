import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import { createStaff } from '../../services/hrm.service';
import { getBranches } from '../../services/location.service';
import api from '../../services/api';

const departmentOptions = [
  'Administration', 'Sales & Marketing', 'Procurement', 'Warehouse',
  'Finance & Accounts', 'Human Resources', 'Operations', 'Production',
  'Quality Control', 'IT & Technology', 'General',
];

const designationOptions = [
  'System Administrator', 'Manager', 'Senior Executive', 'Executive',
  'Sales Manager', 'Purchase Officer', 'Inventory Manager', 'Senior Accountant',
  'Accountant', 'HR Manager', 'Branch Manager', 'Supervisor', 'Operator', 'Staff',
];

const AddStaff = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: '',
    employeeId: '',
    department: '',
    designation: '',
    branch: '',
    joiningDate: '',
    basicSalary: '',
    allowances: '',
    deductions: '',
    bankAccount: '',
    bankName: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
  });

  useEffect(() => {
    api.get('/auth/roles').then((res) => setRoles(res.data.data || [])).catch(() => {});
    getBranches().then((res) => setBranches(res.data.data || [])).catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name) return toast.error('Name is required');
    if (!form.email) return toast.error('Email is required');
    if (!form.password || form.password.length < 8) return toast.error('Password must be at least 8 characters');
    if (!form.employeeId) return toast.error('Employee ID is required');
    if (!form.department) return toast.error('Please select a department');
    if (!form.designation) return toast.error('Please select a designation');

    setLoading(true);
    try {
      await createStaff({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        role: form.role || undefined,
        employeeId: form.employeeId,
        department: form.department,
        designation: form.designation,
        branch: form.branch || undefined,
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
      });
      toast.success('Staff created successfully');
      navigate('/hrm');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create staff');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title="Add New Staff" subtitle="Enter employee information" />

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* User Account */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">User Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Full Name *" name="name" value={form.name} onChange={handleChange} placeholder="Enter full name" />
            <FormInput label="Employee ID *" name="employeeId" value={form.employeeId} onChange={handleChange} placeholder="EMP-001" />
            <FormInput label="Email *" name="email" type="email" value={form.email} onChange={handleChange} placeholder="email@example.com" />
            <FormInput label="Password *" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Min 8 characters" />
            <FormInput label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" />
            <FormInput label="Role" name="role" type="select" value={form.role} onChange={handleChange}>
              <option value="">Select role (default: Staff)</option>
              {roles.map((r) => (
                <option key={r._id} value={r._id}>{r.displayName || r.name}</option>
              ))}
            </FormInput>
          </div>
        </div>

        {/* Employment Details */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Employment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Department *" name="department" type="select" value={form.department} onChange={handleChange} required>
              <option value="">Select department</option>
              {departmentOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </FormInput>
            <FormInput label="Designation *" name="designation" type="select" value={form.designation} onChange={handleChange} required>
              <option value="">Select designation</option>
              {designationOptions.map((d) => <option key={d} value={d}>{d}</option>)}
            </FormInput>
            <FormInput label="Branch" name="branch" type="select" value={form.branch} onChange={handleChange}>
              <option value="">Select branch</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.name} ({b.code})</option>)}
            </FormInput>
            <FormInput label="Join Date" name="joiningDate" type="date" value={form.joiningDate} onChange={handleChange} />
          </div>
        </div>

        {/* Salary */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Salary Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput label="Basic Salary" name="basicSalary" type="number" value={form.basicSalary} onChange={handleChange} placeholder="0" min="0" />
            <FormInput label="Allowances" name="allowances" type="number" value={form.allowances} onChange={handleChange} placeholder="0" min="0" />
            <FormInput label="Deductions" name="deductions" type="number" value={form.deductions} onChange={handleChange} placeholder="0" min="0" />
          </div>
        </div>

        {/* Bank Details */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput label="Bank Account Number" name="bankAccount" value={form.bankAccount} onChange={handleChange} placeholder="Account number" />
            <FormInput label="Bank Name" name="bankName" value={form.bankName} onChange={handleChange} placeholder="Bank name" />
          </div>
        </div>

        {/* Emergency Contact */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Emergency Contact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormInput label="Contact Name" name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} placeholder="Name" />
            <FormInput label="Contact Phone" name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} placeholder="Phone" />
            <FormInput label="Relation" name="emergencyContactRelation" value={form.emergencyContactRelation} onChange={handleChange} placeholder="e.g. Spouse, Parent" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/hrm')} className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Saving...' : 'Save Staff'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddStaff;
