import { useState } from 'react';
import { api } from '../api.js';
import { SLOTS, MIN_VALUE, MAX_VALUE } from '../constants.js';
import { formatDate } from '../utils/dates.js';

// Quick checks so the user gets instant feedback. The server repeats every rule.
function checkValue(raw) {
  const text = raw.trim();
  if (text === '') return 'Please enter a glucose value.';
  const number = Number(text);
  if (!/^\d+$/.test(text) || number < MIN_VALUE || number > MAX_VALUE) {
    return `Value must be between ${MIN_VALUE} and ${MAX_VALUE} mg/dl.`;
  }
  return '';
}

export default function ReadingForm({ date, editing, presetSlot, takenSlots, onSaved, onCancel }) {
  const firstFree = SLOTS.find((s) => !takenSlots.includes(s.value));
  const [slot, setSlot] = useState(editing?.slot ?? presetSlot ?? firstFree?.value ?? SLOTS[0].value);
  const [value, setValue] = useState(editing ? String(editing.value) : '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError('');

    const valueError = checkValue(value);
    if (valueError) {
      setError(valueError);
      return;
    }

    setBusy(true);
    try {
      const payload = { date, slot, value: Number(value) };
      if (editing) await api.updateReading(editing.id, payload);
      else await api.createReading(payload);
      await onSaved();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="card reading-form" onSubmit={onSubmit} noValidate>
      <h2>{editing ? 'Edit reading' : 'Add a reading'}</h2>
      <p className="muted">For {formatDate(date)}</p>

      <label>
        Time of day
        <select value={slot} onChange={(e) => setSlot(e.target.value)}>
          {SLOTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
              {takenSlots.includes(s.value) && s.value !== editing?.slot ? ' (already recorded)' : ''}
            </option>
          ))}
        </select>
      </label>

      <label>
        Glucose value (mg/dl)
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="e.g. 110"
        />
      </label>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <div className="actions">
        <button className="btn primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : editing ? 'Save changes' : 'Save reading'}
        </button>
        {editing && (
          <button className="btn" type="button" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
