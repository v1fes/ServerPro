const router = require('express').Router();
const partController = require('../controllers/partController');
const { authenticate, authorize } = require('../middleware/auth');
const { createPartValidator, updatePartValidator, idParamValidator } = require('../middleware/validators');

router.use(authenticate);

router.get('/', partController.getAll);
router.get('/low-stock', authorize('admin'), partController.getLowStock);
router.get('/:id', idParamValidator, partController.getById);
router.post('/', authorize('admin'), createPartValidator, partController.create);
router.put('/:id', authorize('admin'), updatePartValidator, partController.update);
router.delete('/:id', authorize('admin'), idParamValidator, partController.delete);

module.exports = router;
