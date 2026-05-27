const router = require('express').Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidator, loginValidator, refreshValidator } = require('../middleware/validators');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/refresh', refreshValidator, authController.refresh);
router.get('/me', authenticate, authController.getMe);

module.exports = router;
