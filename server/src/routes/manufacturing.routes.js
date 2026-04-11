const express = require('express');
const router = express.Router();
const mfgController = require('../controllers/manufacturing.controller');
const { protect } = require('../middlewares/auth');
const { authorize } = require('../middlewares/authorize');
const { logActivity } = require('../middlewares/activityLogger');
const { validate } = require('../middlewares/validate');
const {
  createBOMSchema, updateBOMSchema,
  createWorkOrderSchema, updateWorkOrderSchema,
  createWorkCenterSchema, updateWorkCenterSchema,
  createPlanSchema, updatePlanSchema,
  createSubcontractingItemSchema, updateSubcontractingItemSchema,
  createSubcontractingOrderSchema, updateSubcontractingOrderSchema,
} = require('../validators/manufacturing.validator');

// All routes require authentication
router.use(protect);

// ─── Summary & Capacity ─────────────────────────────────
router.get('/summary', authorize('manufacturing', 'view'), mfgController.getSummary);
router.get('/capacity', authorize('manufacturing', 'view'), mfgController.getCapacity);

// ─── BOM ─────────────────────────────────────────────────
router
  .route('/bom')
  .get(authorize('manufacturing', 'view'), mfgController.getBOMs)
  .post(authorize('manufacturing', 'create'), validate(createBOMSchema), logActivity('manufacturing', 'Created BOM'), mfgController.createBOM);

router
  .route('/bom/:id')
  .get(authorize('manufacturing', 'view'), mfgController.getBOMById)
  .put(authorize('manufacturing', 'edit'), validate(updateBOMSchema), logActivity('manufacturing', 'Updated BOM'), mfgController.updateBOM)
  .delete(authorize('manufacturing', 'delete'), logActivity('manufacturing', 'Deleted BOM'), mfgController.deleteBOM);

// ─── Work Orders ─────────────────────────────────────────
router
  .route('/work-orders')
  .get(authorize('manufacturing', 'view'), mfgController.getWorkOrders)
  .post(authorize('manufacturing', 'create'), validate(createWorkOrderSchema), logActivity('manufacturing', 'Created work order'), mfgController.createWorkOrder);

router
  .route('/work-orders/:id')
  .put(authorize('manufacturing', 'edit'), validate(updateWorkOrderSchema), logActivity('manufacturing', 'Updated work order'), mfgController.updateWorkOrder)
  .delete(authorize('manufacturing', 'delete'), logActivity('manufacturing', 'Deleted work order'), mfgController.deleteWorkOrder);

// ─── Subcontracting Items ────────────────────────────────
router
  .route('/subcontracting-items')
  .get(authorize('manufacturing', 'view'), mfgController.getSubcontractingItems)
  .post(authorize('manufacturing', 'create'), validate(createSubcontractingItemSchema), logActivity('manufacturing', 'Created subcontracting item'), mfgController.createSubcontractingItem);

router
  .route('/subcontracting-items/:id')
  .put(authorize('manufacturing', 'edit'), validate(updateSubcontractingItemSchema), logActivity('manufacturing', 'Updated subcontracting item'), mfgController.updateSubcontractingItem)
  .delete(authorize('manufacturing', 'delete'), logActivity('manufacturing', 'Deleted subcontracting item'), mfgController.deleteSubcontractingItem);

// ─── Subcontracting Orders ───────────────────────────────
router
  .route('/subcontracting-orders')
  .get(authorize('manufacturing', 'view'), mfgController.getSubcontractingOrders)
  .post(authorize('manufacturing', 'create'), validate(createSubcontractingOrderSchema), logActivity('manufacturing', 'Created subcontracting order'), mfgController.createSubcontractingOrder);

router
  .route('/subcontracting-orders/:id')
  .put(authorize('manufacturing', 'edit'), validate(updateSubcontractingOrderSchema), logActivity('manufacturing', 'Updated subcontracting order'), mfgController.updateSubcontractingOrder)
  .delete(authorize('manufacturing', 'delete'), logActivity('manufacturing', 'Deleted subcontracting order'), mfgController.deleteSubcontractingOrder);

// ─── Work Centers ───────────────────────────────────────
router
  .route('/work-centers')
  .get(authorize('manufacturing', 'view'), mfgController.getWorkCenters)
  .post(authorize('manufacturing', 'create'), validate(createWorkCenterSchema), logActivity('manufacturing', 'Created work center'), mfgController.createWorkCenter);

router
  .route('/work-centers/:id')
  .put(authorize('manufacturing', 'edit'), validate(updateWorkCenterSchema), logActivity('manufacturing', 'Updated work center'), mfgController.updateWorkCenter)
  .delete(authorize('manufacturing', 'delete'), logActivity('manufacturing', 'Deleted work center'), mfgController.deleteWorkCenter);

// ─── Production Plans (root GET + CRUD) ──────────────────
router
  .route('/plans')
  .post(authorize('manufacturing', 'create'), validate(createPlanSchema), logActivity('manufacturing', 'Created production plan'), mfgController.createPlan);

router
  .route('/plans/:id')
  .get(authorize('manufacturing', 'view'), mfgController.getPlanById)
  .put(authorize('manufacturing', 'edit'), validate(updatePlanSchema), logActivity('manufacturing', 'Updated production plan'), mfgController.updatePlan)
  .delete(authorize('manufacturing', 'delete'), logActivity('manufacturing', 'Deleted production plan'), mfgController.deletePlan);

// Root route returns production plans list
router.get('/', authorize('manufacturing', 'view'), mfgController.getPlans);

module.exports = router;
