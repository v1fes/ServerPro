const router = require('express').Router();
const predictionController = require('../controllers/predictionController');
const { authenticate, authorize } = require('../middleware/auth');
const { predictValidator } = require('../middleware/validators');

router.use(authenticate);

router.post('/ml/:deviceId', authorize('admin', 'master', 'client'), predictValidator, predictionController.predictML);
router.post('/gemini/:deviceId', authorize('admin', 'master', 'client'), predictValidator, predictionController.predictGemini);
router.post('/combined/:deviceId', authorize('admin', 'master', 'client'), predictValidator, predictionController.predictCombined);
router.get('/device/:deviceId', predictValidator, predictionController.getDevicePredictions);

module.exports = router;
