const { SLOTS, MIN_VALUE, MAX_VALUE } = require('./constants');
const { isValidDateString } = require('./utils/dates');

// Every validator returns either { error: { field, message } } or { data }.
const fail = (field, message) => ({ error: { field, message } });

function validateReadingInput(input, { today }) {
  const { date, slot, value } = input || {};

  if (value === undefined || value === null || String(value).trim() === '') {
    return fail('value', 'Please enter a glucose value.');
  }

  // Accept numbers or digit-only strings. Rejects decimals, "1e2", "0x10", etc.
  const text = String(value).trim();
  const number = typeof value === 'number' ? value : /^\d+$/.test(text) ? Number(text) : NaN;
  if (!Number.isInteger(number) || number < MIN_VALUE || number > MAX_VALUE) {
    return fail('value', `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`);
  }

  if (typeof slot !== 'string' || !Object.hasOwn(SLOTS, slot)) {
    return fail('slot', 'Please choose a time slot.');
  }

  if (!date) return fail('date', 'Please choose a date.');
  if (!isValidDateString(date)) return fail('date', 'Please enter a valid date.');
  if (date > today) return fail('date', 'Date cannot be in the future.'); // ISO strings sort correctly

  return { data: { date, slot, value: number } };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(input) {
  const { name, email, password } = input || {};
  const cleanName = typeof name === 'string' ? name.trim() : '';
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!cleanName) return fail('name', 'Please enter your name.');
  if (cleanName.length > 100) return fail('name', 'Name must be 100 characters or fewer.');
  if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 255) {
    return fail('email', 'Please enter a valid email address.');
  }
  if (typeof password !== 'string' || password.length < 8) {
    return fail('password', 'Password must be at least 8 characters.');
  }
  if (Buffer.byteLength(password) > 72) {
    // bcrypt only uses the first 72 bytes
    return fail('password', 'Password must be 72 bytes or fewer.');
  }

  return { data: { name: cleanName, email: cleanEmail, password } };
}

function validateLogin(input) {
  const { email, password } = input || {};
  const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!cleanEmail) return fail('email', 'Please enter your email.');
  if (typeof password !== 'string' || password === '') {
    return fail('password', 'Please enter your password.');
  }
  return { data: { email: cleanEmail, password } };
}

module.exports = { validateReadingInput, validateRegistration, validateLogin };
