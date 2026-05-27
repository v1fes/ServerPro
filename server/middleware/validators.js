const { body, param, validationResult } = require('express-validator');

// Middleware to handle validation errors
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Помилка валідації',
      errors: errors.array().map(e => e.msg),
    });
  }
  next();
};

// Auth validators
const registerValidator = [
  body('email').isEmail().withMessage('Невірний формат email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Пароль має бути мінімум 6 символів'),
  body('firstName').trim().notEmpty().withMessage('Ім\'я обов\'язкове').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Прізвище обов\'язкове').isLength({ max: 100 }),
  body('phone').optional().trim().isLength({ max: 20 }),
  validate,
];

const loginValidator = [
  body('email').isEmail().withMessage('Невірний формат email').normalizeEmail(),
  body('password').notEmpty().withMessage('Пароль обов\'язковий'),
  validate,
];

const refreshValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token обов\'язковий'),
  validate,
];

// Device validators
const createDeviceValidator = [
  body('deviceType').isIn(['phone', 'laptop', 'tablet', 'other']).withMessage('Невірний тип пристрою'),
  body('brand').trim().notEmpty().withMessage('Бренд обов\'язковий').isLength({ max: 100 }),
  body('model').trim().notEmpty().withMessage('Модель обов\'язкова').isLength({ max: 100 }),
  body('serialNumber').optional().trim().isLength({ max: 200 }),
  body('purchaseDate').optional().isISO8601().withMessage('Невірний формат дати'),
  body('clientId').optional().isInt({ min: 1 }).withMessage('Невірний clientId'),
  validate,
];

const updateDeviceValidator = [
  param('id').isInt({ min: 1 }),
  body('deviceType').optional().isIn(['phone', 'laptop', 'tablet', 'other']).withMessage('Невірний тип пристрою'),
  body('brand').optional().trim().notEmpty().isLength({ max: 100 }),
  body('model').optional().trim().notEmpty().isLength({ max: 100 }),
  body('serialNumber').optional().trim().isLength({ max: 200 }),
  body('purchaseDate').optional().isISO8601().withMessage('Невірний формат дати'),
  validate,
];

// Order validators
const createOrderValidator = [
  body('deviceId').isInt({ min: 1 }).withMessage('deviceId обов\'язковий'),
  body('description').trim().notEmpty().withMessage('Опис обов\'язковий').isLength({ max: 2000 }),
  body('deadline').optional().isISO8601().withMessage('Невірний формат дати'),
  body('photoUrl').optional().trim(),
  validate,
];

const updateOrderValidator = [
  param('id').isInt({ min: 1 }),
  body('masterId').optional().isInt({ min: 1 }),
  body('diagnosis').optional().trim().isLength({ max: 2000 }),
  body('totalCost').optional().isFloat({ min: 0 }).withMessage('Вартість має бути числом >= 0'),
  body('deadline').optional().isISO8601().withMessage('Невірний формат дати'),
  validate,
];

const updateStatusValidator = [
  param('id').isInt({ min: 1 }),
  body('status').isIn(['new', 'diagnostics', 'in_progress', 'waiting_parts', 'ready', 'issued'])
    .withMessage('Невірний статус'),
  body('comment').optional().trim().isLength({ max: 1000 }),
  validate,
];

const addPartValidator = [
  param('id').isInt({ min: 1 }),
  body('partId').isInt({ min: 1 }).withMessage('partId обов\'язковий'),
  body('quantity').isInt({ min: 1 }).withMessage('Кількість має бути >= 1'),
  validate,
];

const addRepairTypeValidator = [
  param('id').isInt({ min: 1 }),
  body('repairTypeId').isInt({ min: 1 }).withMessage('repairTypeId обов\'язковий'),
  body('cost').optional().isFloat({ min: 0 }).withMessage('Вартість має бути >= 0'),
  validate,
];

// User validators
const createUserValidator = [
  body('email').isEmail().withMessage('Невірний формат email').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Пароль має бути мінімум 6 символів'),
  body('firstName').trim().notEmpty().withMessage('Ім\'я обов\'язкове').isLength({ max: 100 }),
  body('lastName').trim().notEmpty().withMessage('Прізвище обов\'язкове').isLength({ max: 100 }),
  body('role').isIn(['admin', 'master', 'client']).withMessage('Невірна роль'),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('specialization').optional().trim().isLength({ max: 200 }),
  validate,
];

const updateUserValidator = [
  param('id').isInt({ min: 1 }),
  body('firstName').optional().trim().notEmpty().isLength({ max: 100 }),
  body('lastName').optional().trim().notEmpty().isLength({ max: 100 }),
  body('phone').optional().trim().isLength({ max: 20 }),
  body('role').optional().isIn(['admin', 'master', 'client']).withMessage('Невірна роль'),
  body('specialization').optional().trim().isLength({ max: 200 }),
  body('isActive').optional().isBoolean(),
  validate,
];

// Part validators
const createPartValidator = [
  body('name').trim().notEmpty().withMessage('Назва обов\'язкова').isLength({ max: 200 }),
  body('category').optional().trim().isLength({ max: 100 }),
  body('price').isFloat({ min: 0 }).withMessage('Ціна має бути >= 0'),
  body('quantityInStock').isInt({ min: 0 }).withMessage('Кількість має бути >= 0'),
  body('minStockLevel').optional().isInt({ min: 0 }),
  body('compatibleDeviceType').optional().trim(),
  body('compatibleBrand').optional().trim(),
  validate,
];

const updatePartValidator = [
  param('id').isInt({ min: 1 }),
  body('name').optional().trim().notEmpty().isLength({ max: 200 }),
  body('price').optional().isFloat({ min: 0 }),
  body('quantityInStock').optional().isInt({ min: 0 }),
  body('minStockLevel').optional().isInt({ min: 0 }),
  validate,
];

// Prediction validators
const predictValidator = [
  param('deviceId').isInt({ min: 1 }).withMessage('Невірний deviceId'),
  validate,
];

// ID param validator
const idParamValidator = [
  param('id').isInt({ min: 1 }).withMessage('Невірний ID'),
  validate,
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshValidator,
  createDeviceValidator,
  updateDeviceValidator,
  createOrderValidator,
  updateOrderValidator,
  updateStatusValidator,
  addPartValidator,
  addRepairTypeValidator,
  createUserValidator,
  updateUserValidator,
  createPartValidator,
  updatePartValidator,
  predictValidator,
  idParamValidator,
};
