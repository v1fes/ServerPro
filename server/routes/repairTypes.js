const router = require('express').Router();
const repairTypeController = require('../controllers/repairTypeController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);
router.use(authorize('admin', 'master'));

router.get('/', repairTypeController.getAll);

module.exports = router;
