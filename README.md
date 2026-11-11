# Sweety – Blood Glucose Tracker

A small web app where a diabetes patient records up to 4 blood glucose readings a day and views daily, month-to-date and previous-month reports.

**Stack:** React (Vite) · Node.js + Express · PostgreSQL

## Features

- Sign up / log in (passwords hashed with bcrypt, login via JWT). Each user only sees their own readings.
- Add, view, edit and delete readings (date, time slot, value in mg/dl).
- Validation with clear messages (value required, 40–600 whole number, one reading per slot per day, max 4 per day, no future dates).
- Reports: daily (with each reading and its slot), month-to-date, and previous month. Each shows highest, lowest, average (1 decimal) and count, with an empty state.
- Bonus included: paginated `GET /api/readings` (`?page=1&limit=20`) and a `docker-compose.yml` for PostgreSQL.

## Project layout

```
sweety/
├── docker-compose.yml        # PostgreSQL for local development
├── server/                   # Express API
│   ├── db/schema.sql         # tables and constraints
│   ├── scripts/              # migrate.js, seed.js
│   ├── src/                  # app, routes, validation, report logic
│   ├── tests/                # unit tests (Node's built-in test runner)
│   └── .env.example
└── client/                   # React app
    ├── src/
    └── .env.example
```

## Install

Requires **Node.js 18+** and **PostgreSQL 14+** (or Docker).

```bash
cd server && npm install
cd ../client && npm install
```

## Set up the database

Option A – Docker:

```bash
docker compose up -d
```

Option B – local PostgreSQL: create a database and user yourself, e.g.

```sql
CREATE USER sweety WITH PASSWORD 'sweety_password';
CREATE DATABASE sweety OWNER sweety;
```

Then configure and create the tables:

```bash
cd server
cp .env.example .env        # edit values if needed (JWT_SECRET especially)
npm run migrate             # creates the tables
npm run seed                # demo user + ~60 days of sample readings
```

Demo login: **demo@sweety.app** / **Demo@1234**

## Run

```bash
# terminal 1 – API on http://localhost:4000
cd server && npm run dev

# terminal 2 – React app on http://localhost:5173
cd client && npm run dev
```

The Vite dev server proxies `/api` to the API, so the client needs no configuration in development.

## Run the tests

```bash
cd server && npm test
```

The tests cover the validation rules, the report date ranges (including January and leap years) and the statistics (rounding, empty case). They need no database.

## API

All routes except register/login need `Authorization: Bearer <token>`. Errors look like `{ "error": "message", "field": "value" }`.

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/auth/register` | `{ name, email, password }` → `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | current user |
| GET | `/api/readings` | list; filters `date`, `from`, `to`; `page`, `limit` (max 100) |
| POST | `/api/readings` | `{ date, slot, value }` |
| PUT | `/api/readings/:id` | update a reading |
| DELETE | `/api/readings/:id` | delete a reading |
| GET | `/api/reports?date=YYYY-MM-DD` | daily + month-to-date + previous-month reports |

Slots: `morning`, `after_breakfast`, `after_lunch`, `after_dinner`.

Status codes: `400` validation error, `401` not logged in / bad credentials, `404` not found (including other users' readings), `409` conflict (duplicate slot, 4 readings already, email already used).

## Notes

### Assumptions

- **"Today" uses the server's time zone** (set `TZ` in `server/.env`) when checking for future dates. The client's date picker uses the browser's time zone; near midnight the two could disagree if they are in different zones.
- **Report ranges:** month-to-date is the 1st of the selected date's month up to the selected date. "Monthly" is the whole calendar month before the selected date's month.
- **Reports for a future date** are allowed and simply show no data; only *saving* a reading in the future is rejected.
- **When a day already has 4 readings**, "You can add only 4 readings per day." is shown (checked before the duplicate-slot rule, otherwise it could never appear, since the 4 slots are also unique).
- **Editing** applies the same rules, ignoring the reading being edited.
- Values must be whole numbers; decimals like `99.5` get the "between 40 and 600" message.
- `bcryptjs` (pure JavaScript bcrypt) is used instead of the native `bcrypt` package to avoid build tool problems on Windows. The hashes are the same format.
- The JWT is kept in `localStorage` for simplicity.

### Design decisions

- Dates are handled as plain `YYYY-MM-DD` strings end to end, and `DATE` columns are returned as strings, so time zones can't shift a reading to another day.
- The database enforces `UNIQUE (user_id, reading_date, slot)` and the 40–600 range as a safety net. The API also locks the user row during writes so two simultaneous requests can't exceed 4 readings a day.
- Report maths lives in a small pure function (`summarize`) so it is easy to test.

### With more time

- API integration tests against a test database (supertest), and React Testing Library tests for the reading form.
- Charts (line chart of the month), Redis caching of reports, and a doctor role.
- httpOnly cookie sessions, rate limiting on login, password reset.
- Pagination UI for the full reading history, and CSV export.
- Dockerfiles for the API and client.
