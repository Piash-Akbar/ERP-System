import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import FormInput from '../../components/FormInput';
import { createContact, updateContact } from '../../services/contact.service';

const initialState = {
  type: 'customer',
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  taxNumber: '',
  openingBalance: '',
  creditLimit: '',
};

const ContactForm = ({ isOpen, onClose, contact, onSuccess }) => {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const isEdit = Boolean(contact);

  useEffect(() => {
    if (contact) {
      setForm({
        type: contact.type || 'customer',
        name: contact.name || '',
        company: contact.company || '',
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address || '',
        city: contact.city || '',
        country: contact.country || '',
        taxNumber: contact.taxNumber || '',
        openingBalance: contact.openingBalance || '',
        creditLimit: contact.creditLimit || '',
      });
    } else {
      setForm(initialState);
    }
    setErrors({});
  }, [contact, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name || form.name.trim().length < 2) {
      newErrors.name = 'Name is required (min 2 characters)';
    }
    if (!form.type) {
      newErrors.type = 'Type is required';
    }
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (form.openingBalance && Number(form.openingBalance) < 0) {
      newErrors.openingBalance = 'Must be 0 or greater';
    }
    if (form.creditLimit && Number(form.creditLimit) < 0) {
      newErrors.creditLimit = 'Must be 0 or greater';
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
    if (payload.creditLimit !== '') {
      payload.creditLimit = Number(payload.creditLimit);
    } else {
      delete payload.creditLimit;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await updateContact(contact._id, payload);
        toast.success('Contact updated successfully');
      } else {
        await createContact(payload);
        toast.success('Contact created successfully');
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Contact' : 'Add Contact'} size="lg">
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
            <option value="customer">Customer</option>
            <option value="supplier">Supplier</option>
            <option value="both">Both</option>
          </FormInput>

          <FormInput
            label="Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Contact name"
          />

          <FormInput
            label="Company"
            name="company"
            value={form.company}
            onChange={handleChange}
            placeholder="Company name"
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

          <FormInput
            label="Tax Number"
            name="taxNumber"
            value={form.taxNumber}
            onChange={handleChange}
            placeholder="Tax / VAT number"
          />

          <FormInput
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="Street address"
          />

          <FormInput
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="City"
          />

          <FormInput
            label="Country"
            name="country"
            value={form.country}
            onChange={handleChange}
            placeholder="Country"
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
          />

          <FormInput
            label="Credit Limit"
            type="number"
            name="creditLimit"
            value={form.creditLimit}
            onChange={handleChange}
            error={errors.creditLimit}
            placeholder="0"
            min="0"
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
            {loading ? 'Saving...' : isEdit ? 'Update Contact' : 'Add Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ContactForm;
