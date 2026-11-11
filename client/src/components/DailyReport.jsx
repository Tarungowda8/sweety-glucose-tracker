import Stats from './Stats.jsx';
import { SLOTS } from '../constants.js';
import { formatDate } from '../utils/dates.js';

export default function DailyReport({ report, onAdd, onEdit, onDelete }) {
  const bySlot = Object.fromEntries(report.readings.map((r) => [r.slot, r]));

  return (
    <section className="card report">
      <header className="report-head">
        <h2>Daily report</h2>
        <p className="muted">{formatDate(report.range.start)}</p>
      </header>

      <ul className="slots">
        {SLOTS.map((slot) => {
          const reading = bySlot[slot.value];
          return (
            <li key={slot.value} className={reading ? 'slot filled' : 'slot'}>
              <span className="slot-name">{slot.label}</span>
              {reading ? (
                <>
                  <span className="slot-value">
                    {reading.value}
                    <small>mg/dl</small>
                  </span>
                  <span className="slot-actions">
                    <button className="link" onClick={() => onEdit(reading)}>
                      Edit
                    </button>
                    <button className="link danger" onClick={() => onDelete(reading)}>
                      Delete
                    </button>
                  </span>
                </>
              ) : (
                <>
                  <span className="slot-value none">Not recorded</span>
                  <span className="slot-actions">
                    <button className="link" onClick={() => onAdd(slot.value)}>
                      Add reading
                    </button>
                  </span>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <Stats stats={report.stats} emptyText="No readings for this day yet. Add one using the form." />
    </section>
  );
}
