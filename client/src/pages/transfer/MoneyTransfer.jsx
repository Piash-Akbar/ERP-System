import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import PageHeader from '../../components/PageHeader';
import FormInput from '../../components/FormInput';
import { createMoneyTransfer } from '../../services/transfer.service';
import api from '../../services/api';

const MoneyTransfer = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    referenceNumber: '',
    description: '',
  });

  useEffect(() => {
    api.get('/accounts/bank-accounts')
      .then((res) => setAccounts(res.data.data?.data || res.data.data || []))
      .catch(() => toast.error('Failed to load bank accounts'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fromAccount) return toast.error('Select source account');
    if (!form.toAccount) return toast.error('Select destination account');
    if (form.fromAccount === form.toAccount) return toast.error('Source and destination must be different');
    if (!form.amount || Number(form.amount) <= 0) return toast.error('Enter a valid amount');

    setLoading(true);
    try {
      await createMoneyTransfer({ ...form, amount: Number(form.amount) });
      toast.success('Transfer completed successfully');
      navigate('/transfer');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create transfer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader title="Money Transfer" subtitle="Transfer funds between accounts" />

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="From Account *" name="fromAccount" type="select" value={form.fromAccount} onChange={handleChange} required>
            <option value="">Select source account</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>{a.name} {a.bankName ? `(${a.bankName})` : ''}</option>
            ))}
          </FormInput>
          <FormInput label="To Account *" name="toAccount" type="select" value={form.toAccount} onChange={handleChange} required>
            <option value="">Select destination account</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>{a.name} {a.bankName ? `(${a.bankName})` : ''}</option>
            ))}
          </FormInput>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput label="Amount *" name="amount" type="number" value={form.amount} onChange={handleChange} placeholder="৳ 0.00" min="0" step="0.01" required />
          <FormInput label="Transfer Date *" name="date" type="date" value={form.date} onChange={handleChange} />
        </div>

        <FormInput label="Reference Number" name="referenceNumber" value={form.referenceNumber} onChange={handleChange} placeholder="Enter reference number" />
        <FormInput label="Description" name="description" value={form.description} onChange={handleChange} placeholder="Enter description" />

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button type="button" onClick={() => navigate('/transfer')} className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Transferring...' : 'Transfer Money'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MoneyTransfer;
