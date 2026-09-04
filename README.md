# expense-voucher-system

A small internal tool for handling expense vouchers end to end — an employee raises a voucher, a director approves or rejects it, and accounts can see everything that's been approved for payment. HR manages the user accounts on top of that.

Built as a MERN-ish stack, minus the M — MySQL instead of Mongo, Express + Node on the backend, React (Vite) on the frontend, Tailwind for styling.

Repo layout is just the two apps side by side:

```
expense-voucher-system/
  backend/
  frontend/
  README.md   <- you are here
```

## Why this exists

Most "approval flow" demos online are either a to-do list with extra steps or way over-engineered with microservices for no reason. This one's meant to actually mirror how a small company would do it — one employee raises the expense, one director signs off (digitally, with an uploaded signature image), accounts gets a read-only view of what's been cleared, and HR handles onboarding/offboarding of accounts. Nothing fancier than that.

## Roles

There are four roles, and the UI + API both change based on who's logged in:

| Role | Can do |
|---|---|
| `employee` | Create/edit/delete their own vouchers (while in draft), submit for approval, track status |
| `director` | See pending vouchers, approve (with signature upload) or reject with a reason |
| `accounts` | Read-only view of all vouchers, mainly for reconciliation/payment tracking |
| `hr` | Manage user accounts — create, deactivate, reset passwords |

Every route on the backend is locked down by role via `authorize()` middleware, not just hidden in the UI — so there's no "just call the API directly" shortcut to bypass permissions.

## Stack

**Backend** — `/backend`
- Express + MySQL (mysql2)
- JWT auth, bcrypt for password hashing
- Multer for signature image uploads
- Plain SQL, no ORM (schema is hand-written in `schema.sql`)

**Frontend** — `/frontend`
- React 18 + Vite
- Tailwind CSS
- React Router for the role-based routing
- Axios for API calls, with a small context for auth + toast notifications

## Getting it running locally

You'll need Node 18+ and a MySQL server running somewhere you can reach.

```bash
git clone <your-repo-url> expense-voucher-system
cd expense-voucher-system
```

### 1. Database

```bash
mysql -u root -p < backend/schema.sql
```

This creates the `expense_voucher_db` database and all the tables (`users`, `vouchers`, `voucher_history`).

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in your DB password and a real JWT secret
npm run seed            # creates the 4 demo accounts, skips ones that already exist
npm run dev              # nodemon, http://localhost:5000
```

Don't leave `JWT_SECRET` as the placeholder value in `.env.example` — swap it for something random before you push this anywhere.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```

The frontend expects the API at whatever's in `frontend/.env` (`VITE_API_BASE_URL`), defaults to `http://localhost:5000`.

## Demo logins

`npm run seed` creates these four accounts, all with the password `Password@123`:

| Email | Role | Employee code | Department |
|---|---|---|---|
| employee@demo.com | employee | EMP001 | Engineering |
| director@demo.com | director | DIR001 | Management |
| accounts@demo.com | accounts | ACC001 | Finance |
| hr@demo.com | hr | HR001 | Human Resources |

A couple of things worth knowing about this table:

- **`employee_code` and `department_name` are optional at the DB level** (`VARCHAR DEFAULT NULL`). They're not exclusive to the `employee` role — that was just how the seed data looked originally, since only employees actually raise vouchers so only they *needed* a code at first. Once the profile page went in, it made more sense to give every demo account a code and department too, so the profile screen doesn't show a bunch of blank dashes for three out of four logins.
- **The seed script skips existing rows.** If you already ran `npm run seed` before this change, re-running it won't backfill the new values — it checks `SELECT id FROM users WHERE email = ?` first and just logs "already exists" and moves on. If your local DB already has these four users without a code/department, run this once by hand:

```sql
UPDATE users SET employee_code = 'DIR001', department_name = 'Management'      WHERE email = 'director@demo.com';
UPDATE users SET employee_code = 'ACC001', department_name = 'Finance'         WHERE email = 'accounts@demo.com';
UPDATE users SET employee_code = 'HR001',  department_name = 'Human Resources' WHERE email = 'hr@demo.com';
```

Why bother mentioning this at all instead of just quietly fixing it? Because it's the kind of thing that looks like a bug when you're demoing this to someone (three logins randomly missing fields on their own profile page) and it's easy to lose ten minutes debugging the wrong layer — checking the API response, the React component, the JWT payload — when the actual answer is just "the seed data never set it." Saving that debugging time for whoever reads this next, including future-me.

## What's in the UI

- **Login** — role-based redirect after auth, straight to that role's dashboard.
- **Employee** — dashboard with quick stats, "My Vouchers" list, a form to raise a new voucher (with signature upload), edit while still in draft.
- **Director** — dashboard, pending approvals queue, approve/reject with signature + reason, full voucher history view.
- **Accounts** — dashboard + a read-only table of every voucher for reconciliation.
- **HR** — dashboard + employee management (create accounts, deactivate, reset a user's password).
- **Profile (all roles)** — click your name/avatar in the top-right of the navbar. Shows your name, email, role, department, and employee code, plus a form to change your own password. This replaced what used to be a plain "Change Password" link — same backend endpoint (`PATCH /auth/password`), just folded into one page with the account info instead of being a separate bare form.

## API shape, roughly

Everything's under `/api`:

```
POST   /auth/login
GET    /auth/me
PATCH  /auth/password

POST   /vouchers                 (employee)
PUT    /vouchers/:id             (employee, own draft only)
DELETE /vouchers/:id             (employee, own draft only)
POST   /vouchers/:id/submit      (employee)
GET    /vouchers/mine            (employee)

GET    /vouchers/pending         (director)
POST   /vouchers/:id/approve     (director)
POST   /vouchers/:id/reject      (director)

GET    /vouchers                 (director, accounts)
GET    /vouchers/:id/history
GET    /vouchers/:id

GET    /users                    (hr)
POST   /users                    (hr)
PUT    /users/:id                (hr)
PATCH  /users/:id/status         (hr)
PATCH  /users/:id/password       (hr)
```

Full request/response shapes aren't documented separately right now — the controllers are short enough that reading `src/controllers/*.js` directly is honestly faster than keeping a Postman collection in sync.

## Known gaps / things I'd do next

- No email notifications when a voucher is approved/rejected — director has to tell the employee themselves right now.
- Signature uploads are stored on local disk (`/backend/uploads/signatures`), not S3 or anything — fine for a demo, not fine for production.
- No pagination on the accounts "all vouchers" table yet, it just loads everything. Would matter once there's real volume.
- Password reset by HR is a straight overwrite, no "send reset link" flow — this is an internal tool so that trade-off was acceptable, but worth flagging.

## Folder structure

```
backend/
  src/
    controllers/    business logic per resource
    routes/          route -> controller wiring, auth checks live here
    middleware/      auth (JWT verify + role check), multer upload config
    config/          db pool
  schema.sql
  seed.js

frontend/
  src/
    pages/           one file per screen, split into role folders
    components/      Navbar, ProtectedRoute, shared table/form bits
    context/         AuthContext, ToastContext
    api/             axios instance
```