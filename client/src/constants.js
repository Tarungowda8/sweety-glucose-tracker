// Keep in sync with server/src/constants.js
export const SLOTS = [
  { value: 'morning', label: 'Morning (fasting)' },
  { value: 'after_breakfast', label: 'After breakfast' },
  { value: 'after_lunch', label: 'After lunch' },
  { value: 'after_dinner', label: 'After dinner' },
];

export const MIN_VALUE = 40;
export const MAX_VALUE = 600;

export const slotLabel = (value) => SLOTS.find((s) => s.value === value)?.label ?? value;
