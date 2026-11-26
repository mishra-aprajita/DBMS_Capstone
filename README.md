# Smart Campus Resource & Lab Booking Dashboard

React + Vite (client) and Node + Express + mysql2 (server) on your existing `smart_campus` MySQL database.
**No schema changes are made.** The app only reads/writes your existing tables.

## Run
Requires Node 18+ and your MySQL running with the `smart_campus` database already loaded.

    cd server
    cp .env.example .env        # then put your MySQL root password in server/.env
    npm install
    npm run dev                 # API on http://localhost:4000

    cd ../client                # second terminal
    npm install
    npm run dev                 # open http://localhost:5173

`.env` goes in the `server/` folder (it is git-ignored). Credentials never reach the browser.

## Warnings
* **Never re-run schema.sql** - it starts with `DROP DATABASE IF EXISTS smart_campus`.
* Member 3's test bookings 100 and 101 are in your database and will appear in the dashboard.
* Login is a demo role switcher (top bar). Roles are read from `app_user` and enforced by the API,
  but there are no passwords, so this is not real authentication.

## Business rules implemented
Overlap check `existing_start < new_end AND existing_end > new_start` on PENDING/APPROVED bookings and active maintenance;
resources locked with `SELECT ... FOR UPDATE` (in id order) inside a transaction; resource must be AVAILABLE;
duration <= `resource_type.max_booking_hours`; approve/reject writes `approval` + updates `booking` atomically;
cancel writes `cancellation` + updates `booking`; maintenance report/complete keeps `resource.status` in sync.

## Not included yet
Edit-booking form, notifications dropdown, resource-type filter in Analytics, server-side pagination (paging is client-side).
