const { HttpError } = require('../utils/httpError');

function notFound(req, res, next) {
  next(new HttpError(404, 'Route not found.'));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message, field: err.field });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body is not valid JSON.' });
  }
  if (err.code === '23505') {
    // unique violation that slipped past our checks
    return res.status(409).json({ error: 'That record already exists.' });
  }
  console.error(err);
  return res.status(500).json({ error: 'Something went wrong. Please try again.' });
}

module.exports = { notFound, errorHandler };
