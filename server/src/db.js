const { Pool, types } = require('pg');
const config = require('./config');

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Date objects.
// This avoids time zone shifts (a date should never change because of the server's TZ).
types.setTypeParser(1082, (value) => value);

const pool = new Pool({ connectionString: config.databaseUrl });

const query = (text, params) => pool.query(text, params);

// Runs `work(client)` inside a transaction and rolls back if it throws.
async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
