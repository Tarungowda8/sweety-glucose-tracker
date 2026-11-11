const test = require('node:test');
const assert = require('node:assert/strict');
const { getReportRanges, isValidDateString, addDays } = require('../src/utils/dates');

test('report ranges match the example in the brief (15 Oct 2026)', () => {
  const ranges = getReportRanges('2026-10-15');
  assert.deepEqual(ranges.daily, { start: '2026-10-15', end: '2026-10-15' });
  assert.deepEqual(ranges.monthToDate, { start: '2026-10-01', end: '2026-10-15' });
  assert.deepEqual(ranges.monthly, { start: '2026-09-01', end: '2026-09-30' });
});

test('monthly report in January uses December of the previous year', () => {
  const { monthly } = getReportRanges('2027-01-10');
  assert.deepEqual(monthly, { start: '2026-12-01', end: '2026-12-31' });
});

test('monthly report handles leap-year February', () => {
  assert.equal(getReportRanges('2024-03-05').monthly.end, '2024-02-29');
  assert.equal(getReportRanges('2026-03-05').monthly.end, '2026-02-28');
});

test('month-to-date on the 1st is a single day', () => {
  assert.deepEqual(getReportRanges('2026-10-01').monthToDate, {
    start: '2026-10-01',
    end: '2026-10-01',
  });
});

test('isValidDateString accepts real dates only', () => {
  assert.equal(isValidDateString('2026-10-15'), true);
  assert.equal(isValidDateString('2024-02-29'), true);
  assert.equal(isValidDateString('2026-02-29'), false);
  assert.equal(isValidDateString('2026-13-01'), false);
  assert.equal(isValidDateString('15-10-2026'), false);
  assert.equal(isValidDateString(''), false);
  assert.equal(isValidDateString(undefined), false);
});

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
});
