const express = require('express');
const router = express.Router();
const hrmController = require('../controllers/hrm.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { createStaffSchema, updateStaffSchema, markAttendanceSchema, generatePayrollSchema, createLoanSchema } = require('../validators/hrm.validator');

// All routes require authentication
router.use(protect);

// ─── Attendance (before /:id to avoid conflicts) ─────────────
router
  .route('/attendance')
  .get(authorize('hrm', 'view'), hrmController.getAttendance)
  .post(authorize('hrm', 'create'), validate(markAttendanceSchema), logActivity('hrm', 'Marked attendance'), hrmController.markAttendance);

router
  .route('/attendance/:staffId')
  .get(authorize('hrm', 'view'), hrmController.getStaffAttendance);

// ─── Payroll ──────────────────────────────────────────────────
router
  .route('/payroll')
  .get(authorize('hrm', 'view'), hrmController.getPayroll);

router
  .route('/payroll/generate')
  .post(authorize('hrm', 'create'), validate(generatePayrollSchema), logActivity('hrm', 'Generated payroll'), hrmController.generatePayroll);

router
  .route('/payroll/:id/approve')
  .put(authorize('hrm', 'edit'), logActivity('hrm', 'Approved payroll'), hrmController.approvePayroll);

router
  .route('/payroll/:id/pay')
  .put(authorize('hrm', 'edit'), logActivity('hrm', 'Marked payroll paid'), hrmController.markPayrollPaid);

// ─── Loan ─────────────────────────────────────────────────────
router
  .route('/loans')
  .get(authorize('hrm', 'view'), hrmController.getLoans)
  .post(authorize('hrm', 'create'), validate(createLoanSchema), logActivity('hrm', 'Created loan'), hrmController.createLoan);

router
  .route('/loans/staff/:staffId')
  .get(authorize('hrm', 'view'), hrmController.getLoansByStaff);

// ─── Staff ────────────────────────────────────────────────────
router
  .route('/')
  .get(authorize('hrm', 'view'), hrmController.getStaff)
  .post(authorize('hrm', 'create'), validate(createStaffSchema), logActivity('hrm', 'Created staff'), hrmController.createStaff);

router
  .route('/:id')
  .get(authorize('hrm', 'view'), hrmController.getStaffById)
  .put(authorize('hrm', 'edit'), validate(updateStaffSchema), logActivity('hrm', 'Updated staff'), hrmController.updateStaff)
  .delete(authorize('hrm', 'delete'), logActivity('hrm', 'Deleted staff'), hrmController.deleteStaff);

module.exports = router;
