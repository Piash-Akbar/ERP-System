const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
} = require('../validators/auth.validator');

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.get('/users', protect, authController.getUsers);
router.get('/roles', protect, authController.getRoles);
router.get('/profile', protect, authController.getProfile);
router.put('/profile', protect, validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', protect, validate(changePasswordSchema), authController.changePassword);
router.post('/logout', protect, authController.logout);

module.exports = router;
