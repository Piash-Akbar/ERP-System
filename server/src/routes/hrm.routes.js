const express = require('express');
const router = express.Router();
const hrmController = require('../controllers/hrm.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');

// All routes require authentication
router.use(protect);

// ─── Attendance (before /:id to avoid conflicts) ─────────────
router
  .route('/attendance')
  .get(authorize('hrm', 'view'), hrmController.getAttendance)
  .post(authorize('hrm', 'create'), hrmController.markAttendance);

router
  .route('/attendance/:staffId')
  .get(authorize('hrm', 'view'), hrmController.getStaffAttendance);

// ─── Payroll ──────────────────────────────────────────────────
router
  .route('/payroll')
  .get(authorize('hrm', 'view'), hrmController.getPayroll);

router
  .route('/payroll/generate')
  .post(authorize('hrm', 'create'), hrmController.generatePayroll);

router
  .route('/payroll/:id/approve')
  .put(authorize('hrm', 'edit'), hrmController.approvePayroll);

router
  .route('/payroll/:id/pay')
  .put(authorize('hrm', 'edit'), hrmController.markPayrollPaid);

// ─── Loan ─────────────────────────────────────────────────────
router
  .route('/loans')
  .get(authorize('hrm', 'view'), hrmController.getLoans)
  .post(authorize('hrm', 'create'), hrmController.createLoan);

router
  .route('/loans/staff/:staffId')
  .get(authorize('hrm', 'view'), hrmController.getLoansByStaff);

// ─── Staff ────────────────────────────────────────────────────
router
  .route('/')
  .get(authorize('hrm', 'view'), hrmController.getStaff)
  .post(authorize('hrm', 'create'), hrmController.createStaff);

router
  .route('/:id')
  .get(authorize('hrm', 'view'), hrmController.getStaffById)
  .put(authorize('hrm', 'edit'), hrmController.updateStaff)
  .delete(authorize('hrm', 'delete'), hrmController.deleteStaff);

module.exports = router;
