const test = require('node:test');
const assert = require('node:assert/strict');
const {
  validateReadingInput,
  validateRegistration,
  validateLogin,
} = require('../src/validation');

const today = '2026-10-15';
const valid = { date: '2026-10-15', slot: 'morning', value: 110 };
const check = (overrides) => validateReadingInput({ ...valid, ...overrides }, { today });

test('accepts a valid reading', () => {
  assert.deepEqual(check({}).data, valid);
});

test('accepts the value as a numeric string and converts it', () => {
  assert.equal(check({ value: '120' }).data.value, 120);
});

test('value is required', () => {
  for (const value of [undefined, null, '', '   ']) {
    assert.equal(check({ value }).error.message, 'Please enter a glucose value.');
  }
});

test('value must be a whole number from 40 to 600', () => {
  const message = 'Value must be between 40 and 600 mg/dl.';
  for (const value of [39, 601, 0, -50, 99.5, 'abc', '1e2', '0x50', '12.5']) {
    assert.equal(check({ value }).error.message, message, `value: ${value}`);
  }
  assert.equal(check({ value: 40 }).error, undefined);
  assert.equal(check({ value: 600 }).error, undefined);
});

test('date cannot be in the future', () => {
  assert.equal(check({ date: '2026-10-16' }).error.message, 'Date cannot be in the future.');
  assert.equal(check({ date: '2026-10-15' }).error, undefined);
  assert.equal(check({ date: '2026-10-14' }).error, undefined);
});

test('date must be present and real', () => {
  assert.equal(check({ date: undefined }).error.field, 'date');
  assert.equal(check({ date: '2026-02-30' }).error.field, 'date');
});

test('slot must be one of the four slots', () => {
  assert.equal(check({ slot: 'midnight' }).error.field, 'slot');
  assert.equal(check({ slot: 'constructor' }).error.field, 'slot');
  assert.equal(check({ slot: undefined }).error.field, 'slot');
});

test('registration normalises email and enforces password length', () => {
  const ok = validateRegistration({ name: ' Asha ', email: ' Asha@Example.COM ', password: 'longenough1' });
  assert.deepEqual(ok.data, { name: 'Asha', email: 'asha@example.com', password: 'longenough1' });

  assert.equal(validateRegistration({ name: '', email: 'a@b.co', password: 'longenough1' }).error.field, 'name');
  assert.equal(validateRegistration({ name: 'A', email: 'nope', password: 'longenough1' }).error.field, 'email');
  assert.equal(validateRegistration({ name: 'A', email: 'a@b.co', password: 'short' }).error.field, 'password');
});

test('login requires email and password', () => {
  assert.equal(validateLogin({ password: 'x' }).error.field, 'email');
  assert.equal(validateLogin({ email: 'a@b.co' }).error.field, 'password');
  assert.equal(validateLogin({ email: 'A@B.co', password: 'x' }).data.email, 'a@b.co');
});
