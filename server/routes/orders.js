const router = require('express').Router();
const orderController = require('../controllers/orderController');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createOrderValidator, updateOrderValidator, updateStatusValidator,
  addPartValidator, addRepairTypeValidator, idParamValidator,
} = require('../middleware/validators');

// Public: guest tracking
router.get('/track/:orderNumber', orderController.trackByNumber);

router.use(authenticate);

router.get('/', orderController.getAll);
router.get('/:id', idParamValidator, orderController.getById);
router.get('/:id/timeline', idParamValidator, orderController.getTimeline);
router.post('/', authorize('admin', 'client'), createOrderValidator, orderController.create);
router.put('/:id', authorize('admin', 'master'), updateOrderValidator, orderController.update);
router.put('/:id/status', authorize('admin', 'master'), updateStatusValidator, orderController.updateStatus);
router.post('/:id/parts', authorize('admin', 'master'), addPartValidator, orderController.addPart);
router.post('/:id/repair-types', authorize('admin', 'master'), addRepairTypeValidator, orderController.addRepairType);

module.exports = router;
