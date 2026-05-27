const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);
  console.error(err.stack);

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message);
    return res.status(400).json({ message: 'Помилка валідації', errors: messages });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: 'Запис з такими даними вже існує' });
  }

  const status = err.statusCode || 500;
  const message = err.message || 'Внутрішня помилка сервера';
  res.status(status).json({ message });
};

module.exports = errorHandler;
