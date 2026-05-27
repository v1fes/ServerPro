const router = require('express').Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');
const { createUserValidator, updateUserValidator, idParamValidator } = require('../middleware/validators');

router.use(authenticate);

router.get('/', authorize('admin'), userController.getAll);
router.get('/masters', authorize('admin', 'master'), userController.getMasters);
router.get('/:id', authorize('admin'), idParamValidator, userController.getById);
router.post('/', authorize('admin'), createUserValidator, userController.create);
router.put('/:id', authorize('admin'), updateUserValidator, userController.update);
router.delete('/:id', authorize('admin'), idParamValidator, userController.delete);

module.exports = router;
