import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { slotLabel } from '../constants.js';
import { todayString } from '../utils/dates.js';
import ReadingForm from './ReadingForm.jsx';
import DailyReport from './DailyReport.jsx';
import PeriodReport from './PeriodReport.jsx';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const today = todayString();

  const [date, setDate] = useState(today);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0); // bump to reload the report
  const [editing, setEditing] = useState(null);
  const [presetSlot, setPresetSlot] = useState(null);

  // Load the reports whenever the date changes or a reading is saved/deleted.
  useEffect(() => {
    let ignore = false; // ignore slow responses for a date the user has already left
    api
      .getReport(date)
      .then((data) => {
        if (!ignore) {
          setReport(data);
          setError('');
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      });
    return () => {
      ignore = true;
    };
  }, [date, version]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  const onDateChange = (event) => {
    if (!event.target.value) return; // the user cleared the field
    setDate(event.target.value);
    setEditing(null);
    setPresetSlot(null);
  };

  const onSaved = async () => {
    setEditing(null);
    setPresetSlot(null);
    reload();
  };

  async function onDelete(reading) {
    if (!window.confirm(`Delete the ${slotLabel(reading.slot)} reading of ${reading.value} mg/dl?`)) return;
    try {
      await api.deleteReading(reading.id);
      setEditing(null);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  const takenSlots = report && report.date === date ? report.daily.readings.map((r) => r.slot) : [];
  // A new key resets the form after saving, or when we switch to editing / pre-selecting a slot.
  const formKey = `${date}-${editing?.id ?? 'new'}-${presetSlot ?? ''}-${version}`;

  return (
    <div className="shell">
      <header className="topbar">
        <h1 className="brand">Sweety</h1>
        <div className="who">
          <span>{user.name}</span>
          <button className="btn" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <div className="date-row">
        <label>
          Date
          <input type="date" value={date} max={today} onChange={onDateChange} />
        </label>
        {date !== today && (
          <button className="btn" onClick={() => setDate(today)}>
            Back to today
          </button>
        )}
      </div>

      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}

      <main className="layout">
        <aside>
          <ReadingForm
            key={formKey}
            date={date}
            editing={editing}
            presetSlot={presetSlot}
            takenSlots={takenSlots}
            onSaved={onSaved}
            onCancel={() => setEditing(null)}
          />
        </aside>

        <div className="reports">
          {!report ? (
            !error && <p className="muted">Loading reports…</p>
          ) : (
            <>
              <DailyReport
                report={report.daily}
                onAdd={(slot) => {
                  setEditing(null);
                  setPresetSlot(slot);
                }}
                onEdit={(reading) => {
                  setPresetSlot(null);
                  setEditing(reading);
                }}
                onDelete={onDelete}
              />
              <div className="period-grid">
                <PeriodReport title="Month to date" report={report.monthToDate} />
                <PeriodReport title="Previous month" report={report.monthly} />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
