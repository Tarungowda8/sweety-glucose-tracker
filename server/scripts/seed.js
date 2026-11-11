// Creates a demo user with about 60 days of sample readings. Safe to run again:
// it resets the demo user's readings each time.
const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');
const { SLOTS } = require('../src/constants');
const { todayString, addDays } = require('../src/utils/dates');

const DEMO = { name: 'Demo Patient', email: 'demo@sweety.app', password: 'Demo@1234' };
const DAYS = 60;

// Tiny deterministic random generator so the demo data looks the same every run.
function makeRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

// Typical-looking values for each slot (fasting is lower than after meals).
const BASE = { morning: 105, after_breakfast: 150, after_lunch: 145, after_dinner: 140 };

async function main() {
  const random = makeRandom(42);
  const hash = await bcrypt.hash(DEMO.password, 10);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash
     RETURNING id`,
    [DEMO.name, DEMO.email, hash]
  );
  const userId = rows[0].id;
  await pool.query('DELETE FROM readings WHERE user_id = $1', [userId]);

  const today = todayString();
  let inserted = 0;
  for (let offset = 0; offset < DAYS; offset++) {
    const date = addDays(today, -offset);
    for (const slot of Object.keys(SLOTS)) {
      // Skip some readings so the data isn't perfect (and today is only partly filled).
      const skip = random() < 0.15 || (offset === 0 && slot !== 'morning');
      if (skip) continue;
      const value = Math.round(BASE[slot] + (random() - 0.5) * 60);
      await pool.query(
        'INSERT INTO readings (user_id, reading_date, slot, value) VALUES ($1, $2, $3, $4)',
        [userId, date, slot, value]
      );
      inserted++;
    }
  }

  console.log(`Seeded ${inserted} readings.`);
  console.log(`Log in with  ${DEMO.email}  /  ${DEMO.password}`);
}

main()
  .catch((err) => {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
