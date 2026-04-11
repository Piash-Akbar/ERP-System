import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { createBankAccount, updateBankAccount } from '../../services/account.service';

const initialState = {
  name: '',
  type: 'bank',
  bankName: '',
  accountNumber: '',
  branch: '',
  openingBalance: '',
};

const BankAccountForm = ({ isOpen, onClose, bankAccount, onSuccess }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(bankAccount);

  useEffect(() => {
    if (bankAccount) {
      setForm({
        name: bankAccount.name || '',
        type: bankAccount.type || 'bank',
        bankName: bankAccount.bankName || '',
        accountNumber: bankAccount.accountNumber || '',
        branch: bankAccount.branch || '',
        openingBalance: bankAccount.openingBalance || '',
      });
    } else {
      setForm(initialState);
    }
    setErrors({});
  }, [bankAccount, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.trim().length < 1) newErrors.name = 'Account name is required';
    if (!form.type) newErrors.type = 'Type is required';
    if (form.openingBalance !== '' && Number(form.openingBalance) < 0) {
      newErrors.openingBalance = 'Must be 0 or greater';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = { ...form };
    if (payload.openingBalance !== '') {
      payload.openingBalance = Number(payload.openingBalance);
    } else {
      delete payload.openingBalance;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateBankAccount(bankAccount._id, payload);
        toast.success('Bank account updated successfully');
      } else {
        await createBankAccount(payload);
        toast.success('Bank account created successfully');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Bank Account' : 'Add Bank Account'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Account Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Account name"
          />

          <FormInput
            label="Type"
            type="select"
            name="type"
            value={form.type}
            onChange={handleChange}
            error={errors.type}
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
            <option value="mobile_banking">Mobile Banking</option>
          </FormInput>

          <FormInput
            label="Bank Name"
            name="bankName"
            value={form.bankName}
            onChange={handleChange}
            placeholder="Bank name"
          />

          <FormInput
            label="Account Number"
            name="accountNumber"
            value={form.accountNumber}
            onChange={handleChange}
            placeholder="Account number"
          />

          <FormInput
            label="Branch"
            name="branch"
            value={form.branch}
            onChange={handleChange}
            placeholder="Branch name"
          />

          <FormInput
            label="Opening Balance"
            type="number"
            name="openingBalance"
            value={form.openingBalance}
            onChange={handleChange}
            error={errors.openingBalance}
            placeholder="0"
            min="0"
            step="0.01"
          />
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
            {loading ? 'Saving...' : isEdit ? 'Update Account' : 'Add Account'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default BankAccountForm;
