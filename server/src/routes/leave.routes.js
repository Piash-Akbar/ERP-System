const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

// All routes require authentication
router.use(protect);

// ─── Leave Types ──────────────────────────────────────────────
router
  .route('/types')
  .get(authorize('leave', 'view'), leaveController.getLeaveTypes)
  .post(authorize('leave', 'create'), leaveController.createLeaveType);

router
  .route('/types/:id')
  .put(authorize('leave', 'edit'), leaveController.updateLeaveType)
  .delete(authorize('leave', 'delete'), leaveController.deleteLeaveType);

// ─── Leave Applications ──────────────────────────────────────
router
  .route('/')
  .get(authorize('leave', 'view'), leaveController.getApplications)
  .post(authorize('leave', 'create'), leaveController.createApplication);

router
  .route('/:id/approve')
  .put(authorize('leave', 'edit'), leaveController.approveApplication);

router
  .route('/:id/reject')
  .put(authorize('leave', 'edit'), leaveController.rejectApplication);

// ─── Balance ──────────────────────────────────────────────────
router
  .route('/balance/:staffId')
  .get(authorize('leave', 'view'), leaveController.getLeaveBalance);

// ─── Holidays ─────────────────────────────────────────────────
router
  .route('/holidays')
  .get(authorize('leave', 'view'), leaveController.getHolidays)
  .post(authorize('leave', 'create'), leaveController.createHoliday);

router
  .route('/holidays/:id')
  .delete(authorize('leave', 'delete'), leaveController.deleteHoliday);

module.exports = router;
