import { useState, useEffect } from 'react';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { createMoneyTransfer } from '../../services/transfer.service';
import api from '../../services/api';
import toast from 'react-hot-toast';

const TransferForm = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    note: '',
  });
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/accounts/bank-accounts')
      .then((res) => setAccounts(res.data.data?.data || res.data.data || []))
      .catch(() => toast.error('Failed to load bank accounts'));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromAccount) return toast.error('Select source account');
    if (!form.toAccount) return toast.error('Select destination account');
    if (form.fromAccount === form.toAccount) return toast.error('Source and destination must be different');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');

    setLoading(true);
    try {
      await createMoneyTransfer({ ...form, amount: Number(form.amount) });
      toast.success('Transfer created');
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New Money Transfer" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormInput
          label="From Account"
          type="select"
          value={form.fromAccount}
          onChange={(e) => setForm({ ...form, fromAccount: e.target.value })}
          required
        >
          <option value="">Select Source Account</option>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name} {a.bankName ? `(${a.bankName})` : ''} - Balance: ৳{a.currentBalance?.toLocaleString()}
            </option>
          ))}
        </FormInput>

        <FormInput
          label="To Account"
          type="select"
          value={form.toAccount}
          onChange={(e) => setForm({ ...form, toAccount: e.target.value })}
          required
        >
          <option value="">Select Destination Account</option>
          {accounts.map((a) => (
            <option key={a._id} value={a._id}>
              {a.name} {a.bankName ? `(${a.bankName})` : ''}
            </option>
          ))}
        </FormInput>

        <FormInput
          label="Amount"
          type="number"
          value={form.amount}
          min={0}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />

        <FormInput
          label="Date"
          type="date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />

        <FormInput
          label="Note"
          type="textarea"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Transferring...' : 'Create Transfer'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TransferForm;
