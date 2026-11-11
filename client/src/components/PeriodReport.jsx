import Stats from './Stats.jsx';
import { formatRange } from '../utils/dates.js';

// Used for the month-to-date and previous-month reports.
export default function PeriodReport({ title, report }) {
  return (
    <section className="card report">
      <header className="report-head">
        <h2>{title}</h2>
        <p className="muted">{formatRange(report.range)}</p>
      </header>
      <Stats stats={report.stats} emptyText="No readings in this period yet." />
    </section>
  );
}
