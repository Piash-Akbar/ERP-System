const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/approval.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const { submitApprovalSchema, approvalActionSchema } = require('../validators/approval.validator');

router.use(protect);

router.post('/submit', authorize('approvals', 'create'), validate(submitApprovalSchema), logActivity('approvals', 'Submitted for approval'), ctrl.submitApproval);
router.get('/', authorize('approvals', 'view'), ctrl.getApprovals);
router.get('/pending', authorize('approvals', 'view'), ctrl.getPendingApprovals);
router.get('/my-submissions', ctrl.getMySubmissions);
router.get('/:id', authorize('approvals', 'view'), ctrl.getApproval);
router.post('/:id/approve', authorize('approvals', 'approve'), validate(approvalActionSchema), logActivity('approvals', 'Approved request'), ctrl.approveRequest);
router.post('/:id/reject', authorize('approvals', 'approve'), validate(approvalActionSchema), logActivity('approvals', 'Rejected request'), ctrl.rejectRequest);
router.post('/:id/hold', authorize('approvals', 'approve'), validate(approvalActionSchema), logActivity('approvals', 'Put request on hold'), ctrl.holdRequest);
router.post('/:id/cancel', logActivity('approvals', 'Cancelled request'), ctrl.cancelRequest);
router.post('/:id/escalate', authorize('approvals', 'approve'), validate(approvalActionSchema), logActivity('approvals', 'Escalated request'), ctrl.escalateRequest);

module.exports = router;
