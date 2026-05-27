const router = require('express').Router();
const deviceController = require('../controllers/deviceController');
const { authenticate, authorize } = require('../middleware/auth');
const { createDeviceValidator, updateDeviceValidator, idParamValidator } = require('../middleware/validators');
const upload = require('../middleware/upload');

router.use(authenticate);

router.get('/', deviceController.getAll);
router.get('/:id', idParamValidator, deviceController.getById);
router.get('/:id/history', idParamValidator, deviceController.getHistory);
router.post('/', authorize('admin', 'client'), upload.single('photo'), createDeviceValidator, deviceController.create);
router.put('/:id', authorize('admin', 'client'), upload.single('photo'), updateDeviceValidator, deviceController.update);
router.post('/:id/photo', authorize('admin', 'client'), idParamValidator, upload.single('photo'), deviceController.uploadPhoto);
router.delete('/:id', authorize('admin'), idParamValidator, deviceController.delete);

module.exports = router;
