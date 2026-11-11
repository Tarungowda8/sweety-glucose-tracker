const express = require('express');
const db = require('../db');
const requireAuth = require('../middleware/auth');
const { HttpError, asyncHandler } = require('../utils/httpError');
const { isValidDateString, todayString, getReportRanges } = require('../utils/dates');
const { summarize } = require('../services/reportService');
const { SLOT_ORDER_SQL } = require('../constants');

const router = express.Router();
router.use(requireAuth);

const fetchReadings = async (userId, { start, end }) => {
  const { rows } = await db.query(
    `SELECT id, reading_date, slot, value FROM readings
     WHERE user_id = $1 AND reading_date BETWEEN $2 AND $3
     ORDER BY reading_date, ${SLOT_ORDER_SQL}`,
    [userId, start, end]
  );
  return rows;
};

// GET /api/reports?date=YYYY-MM-DD   (date defaults to today)
// Returns the daily, month-to-date and previous-month reports for that date.
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const date = req.query.date || todayString();
    if (!isValidDateString(date)) {
      throw new HttpError(400, 'Invalid date. Use YYYY-MM-DD.', 'date');
    }

    const ranges = getReportRanges(date);
    const [daily, monthToDate, monthly] = await Promise.all([
      fetchReadings(req.user.id, ranges.daily),
      fetchReadings(req.user.id, ranges.monthToDate),
      fetchReadings(req.user.id, ranges.monthly),
    ]);

    res.json({
      date,
      daily: {
        range: ranges.daily,
        stats: summarize(daily.map((r) => r.value)),
        readings: daily.map((r) => ({
          id: r.id,
          date: r.reading_date,
          slot: r.slot,
          value: r.value,
        })),
      },
      monthToDate: {
        range: ranges.monthToDate,
        stats: summarize(monthToDate.map((r) => r.value)),
      },
      monthly: {
        range: ranges.monthly,
        stats: summarize(monthly.map((r) => r.value)),
      },
    });
  })
);

module.exports = router;
