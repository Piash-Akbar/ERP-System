const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createLeaveTypeSchema, updateLeaveTypeSchema, createApplicationSchema, createHolidaySchema } = require('../validators/leave.validator');

// All routes require authentication
router.use(protect);

// ─── Leave Types ──────────────────────────────────────────────
router
  .route('/types')
  .get(authorize('leave', 'view'), leaveController.getLeaveTypes)
  .post(authorize('leave', 'create'), validate(createLeaveTypeSchema), logActivity('leave', 'Created leave type'), leaveController.createLeaveType);

router
  .route('/types/:id')
  .put(authorize('leave', 'edit'), validate(updateLeaveTypeSchema), logActivity('leave', 'Updated leave type'), leaveController.updateLeaveType)
  .delete(authorize('leave', 'delete'), logActivity('leave', 'Deleted leave type'), leaveController.deleteLeaveType);

// ─── Leave Applications ──────────────────────────────────────
router
  .route('/')
  .get(authorize('leave', 'view'), leaveController.getApplications)
  .post(authorize('leave', 'create'), validate(createApplicationSchema), logActivity('leave', 'Applied for leave'), leaveController.createApplication);

router
  .route('/:id/approve')
  .put(authorize('leave', 'edit'), logActivity('leave', 'Approved leave'), leaveController.approveApplication);

router
  .route('/:id/reject')
  .put(authorize('leave', 'edit'), logActivity('leave', 'Rejected leave'), leaveController.rejectApplication);

// ─── Balance ──────────────────────────────────────────────────
router
  .route('/balance/:staffId')
  .get(authorize('leave', 'view'), leaveController.getLeaveBalance);

// ─── Holidays ─────────────────────────────────────────────────
router
  .route('/holidays')
  .get(authorize('leave', 'view'), leaveController.getHolidays)
  .post(authorize('leave', 'create'), validate(createHolidaySchema), logActivity('leave', 'Created holiday'), leaveController.createHoliday);

router
  .route('/holidays/:id')
  .delete(authorize('leave', 'delete'), logActivity('leave', 'Deleted holiday'), leaveController.deleteHoliday);

module.exports = router;
