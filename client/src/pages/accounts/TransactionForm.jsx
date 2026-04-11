import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { createTransaction } from '../../services/account.service';

const initialState = {
  type: 'income',
  category: '',
  amount: '',
  account: '',
  date: new Date().toISOString().split('T')[0],
  description: '',
};

const TransactionForm = ({ isOpen, onClose, bankAccounts = [], onSuccess }) => {
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

  const validate = () => {
    const newErrors = {};
    if (!form.type) newErrors.type = 'Type is required';
    if (!form.category || form.category.trim().length < 1) newErrors.category = 'Category is required';
    if (!form.amount || Number(form.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!form.date) newErrors.date = 'Date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      ...form,
      amount: Number(form.amount),
    };
    if (!payload.account) delete payload.account;

    setLoading(true);
    try {
      await createTransaction(payload);
      toast.success('Transaction created successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Transaction" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            label="Type"
            type="select"
            name="type"
            value={form.type}
            onChange={handleChange}
            error={errors.type}
          >
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </FormInput>

          <FormInput
            label="Category"
            name="category"
            value={form.category}
            onChange={handleChange}
            error={errors.category}
            placeholder="e.g. Sales Revenue, Rent, Salary"
          />

          <FormInput
            label="Amount"
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            error={errors.amount}
            placeholder="0.00"
            min="0"
            step="0.01"
          />

          <FormInput
            label="Bank Account"
            type="select"
            name="account"
            value={form.account}
            onChange={handleChange}
          >
            <option value="">-- Select Account --</option>
            {bankAccounts.map((acc) => (
              <option key={acc._id} value={acc._id}>
                {acc.name} {acc.bankName ? `(${acc.bankName})` : ''}
              </option>
            ))}
          </FormInput>

          <FormInput
            label="Date"
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            error={errors.date}
          />

          <FormInput
            label="Description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Transaction description"
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
            {loading ? 'Saving...' : 'Add Transaction'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransactionForm;
