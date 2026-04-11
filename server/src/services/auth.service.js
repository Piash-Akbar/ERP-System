const User = require('../models/User');
const Role = require('../models/Role');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { ROLES } = require('../config/constants');

const register = async ({ name, email, password, phone }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 400;
    throw error;
  }

  // Assign default staff role
  let role = await Role.findOne({ name: ROLES.STAFF });
  if (!role) {
    const error = new Error('Default role not found. Please seed roles first.');
    error.statusCode = 500;
    throw error;
  }

  const user = await User.create({ name, email, password, phone, role: role._id });

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  const userData = await User.findById(user._id).populate('role');

  return { user: userData, accessToken, refreshToken };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email, isDeleted: false }).select('+password').populate('role');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    const error = new Error('Account is deactivated. Contact admin.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  user.refreshToken = refreshToken;
  await user.save();

  user.password = undefined;
  user.refreshToken = undefined;

  return { user, accessToken, refreshToken };
};

const refreshAccessToken = async (token) => {
  if (!token) {
    const error = new Error('Refresh token required');
    error.statusCode = 401;
    throw error;
  }

  const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  const user = await User.findById(decoded.id).select('+refreshToken');

  if (!user || user.refreshToken !== token) {
    const error = new Error('Invalid refresh token');
    error.statusCode = 401;
    throw error;
  }

  const accessToken = generateAccessToken(user._id);
  return { accessToken };
};

const forgotPassword = async (email) => {
  const user = await User.findOne({ email, isDeleted: false });
  if (!user) {
    // Don't reveal if email exists
    return { message: 'If an account exists, a reset link has been sent' };
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();

  // TODO: Send email with reset link
  // For now, return token (remove in production)
  return { message: 'Password reset link sent', resetToken };
};

const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshToken = undefined;
  await user.save();

  return { message: 'Password reset successful' };
};

const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error('Current password is incorrect');
    error.statusCode = 400;
    throw error;
  }

  user.password = newPassword;
  await user.save();

  return { message: 'Password changed successfully' };
};

const updateProfile = async (userId, updates) => {
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  }).populate('role');

  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  return user;
};

const logout = async (userId) => {
  await User.findByIdAndUpdate(userId, { refreshToken: undefined });
  return { message: 'Logged out successfully' };
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  forgotPassword,
  resetPassword,
  changePassword,
  updateProfile,
  logout,
};
