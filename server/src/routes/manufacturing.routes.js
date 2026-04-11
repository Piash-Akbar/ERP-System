const express = require('express');
const router = express.Router();
const mfgController = require('../controllers/manufacturing.controller');
const { protect } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// ─── Summary & Capacity ─────────────────────────────────
router.get('/summary', mfgController.getSummary);
router.get('/capacity', mfgController.getCapacity);

// ─── BOM ─────────────────────────────────────────────────
router
  .route('/bom')
  .get(mfgController.getBOMs)
  .post(mfgController.createBOM);

router
  .route('/bom/:id')
  .put(mfgController.updateBOM)
  .delete(mfgController.deleteBOM);

// ─── Work Orders ─────────────────────────────────────────
router
  .route('/work-orders')
  .get(mfgController.getWorkOrders)
  .post(mfgController.createWorkOrder);

router
  .route('/work-orders/:id')
  .put(mfgController.updateWorkOrder)
  .delete(mfgController.deleteWorkOrder);

// ─── Subcontracting Items ────────────────────────────────
router
  .route('/subcontracting-items')
  .get(mfgController.getSubcontractingItems)
  .post(mfgController.createSubcontractingItem);

router
  .route('/subcontracting-items/:id')
  .put(mfgController.updateSubcontractingItem)
  .delete(mfgController.deleteSubcontractingItem);

// ─── Subcontracting Orders ───────────────────────────────
router
  .route('/subcontracting-orders')
  .get(mfgController.getSubcontractingOrders)
  .post(mfgController.createSubcontractingOrder);

router
  .route('/subcontracting-orders/:id')
  .put(mfgController.updateSubcontractingOrder)
  .delete(mfgController.deleteSubcontractingOrder);

// ─── Work Centers ───────────────────────────────────────
router
  .route('/work-centers')
  .get(mfgController.getWorkCenters)
  .post(mfgController.createWorkCenter);

router
  .route('/work-centers/:id')
  .put(mfgController.updateWorkCenter)
  .delete(mfgController.deleteWorkCenter);

// ─── Production Plans (root GET + CRUD) ──────────────────
router
  .route('/plans')
  .post(mfgController.createPlan);

router
  .route('/plans/:id')
  .put(mfgController.updatePlan)
  .delete(mfgController.deletePlan);

// Root route returns production plans list
router.get('/', mfgController.getPlans);

module.exports = router;
