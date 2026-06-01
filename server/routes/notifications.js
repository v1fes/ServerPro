const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', notificationController.getAll);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markAsRead);

module.exports = router;
