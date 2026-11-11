const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { validateReadingInput } = require('../validation');
const { isValidDateString, todayString } = require('../utils/dates');
const { SLOTS, MAX_READINGS_PER_DAY, SLOT_ORDER_SQL } = require('../constants');

const router = express.Router();
router.use(requireAuth);

const formatReading = (row) => ({
  id: row.id,
  date: row.reading_date,
  slot: row.slot,
  value: row.value,
});

const article = (word) => (/^[aeiou]/i.test(word) ? 'an' : 'a');

// Business rules that need the database. Call inside a transaction.
// `excludeId` is the reading being edited (so it doesn't conflict with itself).
async function assertNoConflicts(client, userId, { date, slot }, excludeId = null) {
  const { rows } = await client.query(
    `SELECT id, slot FROM readings
     WHERE user_id = $1 AND reading_date = $2 AND ($3::int IS NULL OR id <> $3)`,
    [userId, date, excludeId]
  );

  if (rows.length >= MAX_READINGS_PER_DAY) {
    throw new HttpError(409, `You can add only ${MAX_READINGS_PER_DAY} readings per day.`, 'date');
  }
  if (rows.some((r) => r.slot === slot)) {
    const { name } = SLOTS[slot];
    throw new HttpError(
      409,
      `You already have ${article(name)} ${name} reading for this date.`,
      'slot'
    );
  }
}

// Two requests at the same moment could both pass the checks above.
// Locking the user's row makes a user's writes run one after another.
const lockUser = (client, userId) =>
  client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [userId]);

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(404, 'Reading not found.');
  return id;
}

function validateBody(body) {
  const result = validateReadingInput(body, { today: todayString() });
  if (result.error) throw new HttpError(400, result.error.message, result.error.field);
  return result.data;
}

// GET /api/readings?date=&from=&to=&page=1&limit=20
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const conditions = ['user_id = $1'];
    const params = [req.user.id];
    for (const [key, operator] of [['date', '='], ['from', '>='], ['to', '<=']]) {
      if (req.query[key] === undefined) continue;
      if (!isValidDateString(req.query[key])) {
        throw new HttpError(400, `Invalid ${key} date. Use YYYY-MM-DD.`, key);
      }
      params.push(req.query[key]);
      conditions.push(`reading_date ${operator} $${params.length}`);
    }
    const where = conditions.join(' AND ');

    const countResult = await db.query(`SELECT COUNT(*)::int AS total FROM readings WHERE ${where}`, params);
    const total = countResult.rows[0].total;

    const { rows } = await db.query(
      `SELECT id, reading_date, slot, value FROM readings
       WHERE ${where}
       ORDER BY reading_date DESC, ${SLOT_ORDER_SQL}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({
      data: rows.map(formatReading),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const data = validateBody(req.body);

    const reading = await db.withTransaction(async (client) => {
      await lockUser(client, req.user.id);
      await assertNoConflicts(client, req.user.id, data);
      const { rows } = await client.query(
        `INSERT INTO readings (user_id, reading_date, slot, value)
         VALUES ($1, $2, $3, $4)
         RETURNING id, reading_date, slot, value`,
        [req.user.id, data.date, data.slot, data.value]
      );
      return rows[0];
    });

    res.status(201).json({ reading: formatReading(reading) });
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const data = validateBody(req.body);

    const reading = await db.withTransaction(async (client) => {
      await lockUser(client, req.user.id);
      const existing = await client.query(
        'SELECT id FROM readings WHERE id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      if (existing.rowCount === 0) throw new HttpError(404, 'Reading not found.');

      await assertNoConflicts(client, req.user.id, data, id);
      const { rows } = await client.query(
        `UPDATE readings
         SET reading_date = $1, slot = $2, value = $3, updated_at = NOW()
         WHERE id = $4 AND user_id = $5
         RETURNING id, reading_date, slot, value`,
        [data.date, data.slot, data.value, id, req.user.id]
      );
      return rows[0];
    });

    res.json({ reading: formatReading(reading) });
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id);
    const result = await db.query('DELETE FROM readings WHERE id = $1 AND user_id = $2', [
      id,
      req.user.id,
    ]);
    if (result.rowCount === 0) throw new HttpError(404, 'Reading not found.');
    res.status(204).end();
  })
);

module.exports = router;
