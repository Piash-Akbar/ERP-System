const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const {
  createContactSchema,
  updateContactSchema,
} = require('../validators/contact.validator');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(authorize('contacts', 'view'), contactController.getContacts)
  .post(authorize('contacts', 'create'), validate(createContactSchema), logActivity('contacts', 'Created contact'), contactController.createContact);

router
  .route('/:id')
  .get(authorize('contacts', 'view'), contactController.getContact)
  .put(authorize('contacts', 'edit'), validate(updateContactSchema), logActivity('contacts', 'Updated contact'), contactController.updateContact)
  .delete(authorize('contacts', 'delete'), logActivity('contacts', 'Deleted contact'), contactController.deleteContact);

module.exports = router;
