const jwt = require('jsonwebtoken');
const config = require('../config');
const { HttpError } = require('../utils/httpError');

// Expects "Authorization: Bearer <token>". Sets req.user = { id }.
module.exports = function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new HttpError(401, 'Please log in to continue.'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: Number(payload.sub) };
    return next();
  } catch {
    return next(new HttpError(401, 'Your session has expired. Please log in again.'));
  }
};
