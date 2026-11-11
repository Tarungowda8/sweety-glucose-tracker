// `name` is used in error messages, `label` is shown in the UI.
const SLOTS = {
  morning: { name: 'Morning', label: 'Morning (fasting)', order: 1 },
  after_breakfast: { name: 'After breakfast', label: 'After breakfast', order: 2 },
  after_lunch: { name: 'After lunch', label: 'After lunch', order: 3 },
  after_dinner: { name: 'After dinner', label: 'After dinner', order: 4 },
};

const MIN_VALUE = 40;
const MAX_VALUE = 600;
const MAX_READINGS_PER_DAY = 4;

// SQL fragment to sort readings in the natural order of the day.
// Built from the constants above (never from user input), so it is safe to inline.
const SLOT_ORDER_SQL = `CASE slot ${Object.entries(SLOTS)
  .map(([key, { order }]) => `WHEN '${key}' THEN ${order}`)
  .join(' ')} END`;

module.exports = { SLOTS, MIN_VALUE, MAX_VALUE, MAX_READINGS_PER_DAY, SLOT_ORDER_SQL };
