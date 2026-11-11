const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { validateRegistration, validateLogin } = require('../validation');

const router = express.Router();
const SALT_ROUNDS = 10;

const signToken = (userId) =>
  jwt.sign({}, config.jwtSecret, { subject: String(userId), expiresIn: config.jwtExpiresIn });

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const result = validateRegistration(req.body);
    if (result.error) throw new HttpError(400, result.error.message, result.error.field);
    const { name, email, password } = result.data;

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    let user;
    try {
      const { rows } = await db.query(
        'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email',
        [name, email, passwordHash]
      );
      user = rows[0];
    } catch (err) {
      if (err.code === '23505') {
        throw new HttpError(409, 'An account with this email already exists.', 'email');
      }
      throw err;
    }

    res.status(201).json({ token: signToken(user.id), user });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = validateLogin(req.body);
    if (result.error) throw new HttpError(400, result.error.message, result.error.field);
    const { email, password } = result.data;

    const { rows } = await db.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    const row = rows[0];
    // Same message for "no such user" and "wrong password" so emails can't be probed.
    const valid = row && (await bcrypt.compare(password, row.password_hash));
    if (!valid) throw new HttpError(401, 'Invalid email or password.');

    const user = { id: row.id, name: row.name, email: row.email };
    res.json({ token: signToken(user.id), user });
  })
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { rows } = await db.query('SELECT id, name, email FROM users WHERE id = $1', [
      req.user.id,
    ]);
    if (!rows[0]) throw new HttpError(401, 'Please log in to continue.');
    res.json({ user: rows[0] });
  })
);

module.exports = router;
