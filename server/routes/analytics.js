const router = require('express').Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', analyticsController.getDashboard);
router.get('/orders-by-period', analyticsController.getOrdersByPeriod);
router.get('/failure-stats', analyticsController.getFailureStats);
router.get('/masters-performance', analyticsController.getMastersPerformance);

module.exports = router;
