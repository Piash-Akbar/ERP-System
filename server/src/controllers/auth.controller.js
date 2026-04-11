const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.register(req.body);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: { user, accessToken },
      message: 'Registration successful',
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user, accessToken },
      message: 'Login successful',
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    const data = await authService.refreshAccessToken(token);
    res.json({ success: true, data, message: 'Token refreshed' });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const data = await authService.forgotPassword(req.body.email);
    res.json({ success: true, data, message: data.message });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const data = await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data, message: data.message });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const data = await authService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword
    );
    res.json({ success: true, data, message: data.message });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res) => {
  res.json({
    success: true,
    data: req.user,
    message: 'Profile retrieved',
  });
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    res.json({ success: true, data: user, message: 'Profile updated' });
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const users = await User.find({ isDeleted: false })
      .select('name email phone role branch isActive')
      .populate('role', 'name displayName')
      .populate('branch', 'name code')
      .sort({ name: 1 });
    res.json({ success: true, data: users, message: 'Users retrieved' });
  } catch (error) {
    next(error);
  }
};

const getRoles = async (req, res, next) => {
  try {
    const Role = require('../models/Role');
    const roles = await Role.find({ isDeleted: false })
      .select('name displayName description')
      .sort({ name: 1 });
    res.json({ success: true, data: roles, message: 'Roles retrieved' });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id);
    res.clearCookie('refreshToken');
    res.json({ success: true, data: null, message: 'Logged out' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  changePassword,
  getProfile,
  updateProfile,
  getUsers,
  getRoles,
  logout,
};
