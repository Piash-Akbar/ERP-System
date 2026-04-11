import { useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import FormInput from '../components/FormInput';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/auth.service';

const Profile = () => {
  const { user, loadUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileErrors, setProfileErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    if (profileErrors[name]) {
      setProfileErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateProfile = () => {
    const errors = {};
    if (!profileForm.name.trim()) errors.name = 'Name is required';
    if (!profileForm.email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(profileForm.email)) errors.email = 'Invalid email address';
    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordForm.currentPassword) errors.currentPassword = 'Current password is required';
    if (!passwordForm.newPassword) errors.newPassword = 'New password is required';
    else if (passwordForm.newPassword.length < 6) errors.newPassword = 'Password must be at least 6 characters';
    if (!passwordForm.confirmPassword) errors.confirmPassword = 'Confirm password is required';
    else if (passwordForm.newPassword !== passwordForm.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfile()) return;

    setProfileLoading(true);
    try {
      await updateProfile(profileForm);
      await loadUser();
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setPasswordLoading(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
    setProfileErrors({});
  };

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : '?');

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div>
      <PageHeader title="Profile" subtitle="Manage your account information" />

      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-semibold">
              {getInitial(user?.name)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
              <p className="text-sm text-gray-500">{user?.role?.displayName || user?.role || 'N/A'}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h3>
        {isEditing ? (
          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Full Name"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                error={profileErrors.name}
                placeholder="Enter full name"
              />
              <FormInput
                label="Email"
                name="email"
                type="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                error={profileErrors.email}
                placeholder="Enter email address"
              />
              <FormInput
                label="Phone"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                error={profileErrors.phone}
                placeholder="Enter phone number"
              />
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button
                type="submit"
                disabled={profileLoading}
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {profileLoading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user?.phone || 'N/A'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Current Password"
              name="currentPassword"
              type="password"
              value={passwordForm.currentPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.currentPassword}
              placeholder="Enter current password"
            />
            <div /> {/* spacer for grid alignment */}
            <FormInput
              label="New Password"
              name="newPassword"
              type="password"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.newPassword}
              placeholder="Enter new password"
            />
            <FormInput
              label="Confirm New Password"
              name="confirmPassword"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              error={passwordErrors.confirmPassword}
              placeholder="Confirm new password"
            />
          </div>
          <div className="mt-5">
            <button
              type="submit"
              disabled={passwordLoading}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Role</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {user?.role?.displayName || user?.role || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Branch</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {user?.branch?.name || user?.branch || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Account Status</p>
            <div className="mt-0.5">
              {user?.isActive ? (
                <StatusBadge color="green">Active</StatusBadge>
              ) : (
                <StatusBadge color="red">Inactive</StatusBadge>
              )}
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">Member Since</p>
            <p className="text-sm font-medium text-gray-900 mt-0.5">{formatDate(user?.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
