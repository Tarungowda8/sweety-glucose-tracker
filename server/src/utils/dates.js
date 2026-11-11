// All dates in this app are plain 'YYYY-MM-DD' strings.
// Working with strings (and UTC maths) avoids time zone bugs.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const pad = (n) => String(n).padStart(2, '0');

function isValidDateString(value) {
  if (typeof value !== 'string') return false;
  const match = DATE_RE.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

// Today's date in the server's time zone (set TZ in .env).
function todayString(now = new Date()) {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function lastDayOfMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function addDays(dateString, days) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

// For a selected date, returns the three report ranges (inclusive start and end):
//   daily        - the selected date
//   monthToDate  - 1st of the selected month up to the selected date
//   monthly      - the whole previous calendar month
function getReportRanges(dateString) {
  const [year, month] = dateString.split('-').map(Number);
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;

  return {
    daily: { start: dateString, end: dateString },
    monthToDate: { start: `${year}-${pad(month)}-01`, end: dateString },
    monthly: {
      start: `${prevYear}-${pad(prevMonth)}-01`,
      end: `${prevYear}-${pad(prevMonth)}-${pad(lastDayOfMonth(prevYear, prevMonth))}`,
    },
  };
}

module.exports = { isValidDateString, todayString, addDays, getReportRanges };
