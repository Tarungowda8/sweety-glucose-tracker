const test = require('node:test');
const assert = require('node:assert/strict');
const { summarize } = require('../src/services/reportService');

test('summarize returns an empty result when there are no readings', () => {
  assert.deepEqual(summarize([]), { count: 0, highest: null, lowest: null, average: null });
});

test('summarize returns highest, lowest, average and count', () => {
  assert.deepEqual(summarize([100, 150, 200]), { count: 3, highest: 200, lowest: 100, average: 150 });
});

test('average is rounded to 1 decimal place', () => {
  assert.equal(summarize([100, 101, 101]).average, 100.7);
  assert.equal(summarize([90, 91]).average, 90.5);
});

test('a single reading is its own highest, lowest and average', () => {
  assert.deepEqual(summarize([123]), { count: 1, highest: 123, lowest: 123, average: 123 });
});
