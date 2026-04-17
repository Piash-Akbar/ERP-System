const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const {
  createUserSchema,
  updateUserSchema,
  toggleStatusSchema,
  resetPasswordSchema,
} = require('../validators/user.validator');

router.use(protect);

router
  .route('/')
  .get(authorize('users', 'view'), userController.getUsers)
  .post(authorize('users', 'create'), validate(createUserSchema), logActivity('users', 'Created user'), userController.createUser);

router
  .route('/:id')
  .get(authorize('users', 'view'), userController.getUser)
  .put(authorize('users', 'edit'), validate(updateUserSchema), logActivity('users', 'Updated user'), userController.updateUser)
  .delete(authorize('users', 'delete'), logActivity('users', 'Deleted user'), userController.deleteUser);

router.put('/:id/status', authorize('users', 'edit'), validate(toggleStatusSchema), logActivity('users', 'Changed user status'), userController.toggleStatus);
router.post('/:id/reset-password', authorize('users', 'edit'), validate(resetPasswordSchema), logActivity('users', 'Reset user password'), userController.resetPassword);

module.exports = router;
