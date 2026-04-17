const asyncHandler = require('../utils/asyncHandler');
const userService = require('../services/user.service');

const getUsers = asyncHandler(async (req, res) => {
  const result = await userService.getAll(req.query);
  res.json({ success: true, data: result, message: 'Users retrieved' });
});

const getUser = asyncHandler(async (req, res) => {
  const user = await userService.getById(req.params.id);
  res.json({ success: true, data: user, message: 'User retrieved' });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.create(req.body);
  res.status(201).json({ success: true, data: user, message: 'User created' });
});

const updateUser = asyncHandler(async (req, res) => {
  const user = await userService.update(req.params.id, req.body);
  res.json({ success: true, data: user, message: 'User updated' });
});

const toggleStatus = asyncHandler(async (req, res) => {
  const user = await userService.toggleStatus(req.params.id, req.body.isActive);
  res.json({ success: true, data: user, message: 'User status updated' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await userService.resetPassword(req.params.id, req.body.newPassword);
  res.json({ success: true, data: result, message: 'Password reset successfully' });
});

const deleteUser = asyncHandler(async (req, res) => {
  await userService.remove(req.params.id);
  res.json({ success: true, data: null, message: 'User deleted' });
});

module.exports = { getUsers, getUser, createUser, updateUser, toggleStatus, resetPassword, deleteUser };
