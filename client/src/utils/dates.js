const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n) => String(n).padStart(2, '0');

// Today in the user's own time zone, as 'YYYY-MM-DD'.
export function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

const parts = (dateString) => dateString.split('-').map(Number);

// '2026-10-15' -> '15 Oct 2026'
export function formatDate(dateString) {
  const [year, month, day] = parts(dateString);
  return `${day} ${MONTHS[month - 1]} ${year}`;
}

// ('2026-10-01', '2026-10-15') -> '1 Oct – 15 Oct 2026'; a single day -> '15 Oct 2026'
export function formatRange({ start, end }) {
  if (start === end) return formatDate(end);
  const [startYear, startMonth, startDay] = parts(start);
  const startText =
    startYear === parts(end)[0]
      ? `${startDay} ${MONTHS[startMonth - 1]}`
      : formatDate(start);
  return `${startText} – ${formatDate(end)}`;
}
