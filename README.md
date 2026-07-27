# Expense Voucher Management System

Full-stack app for ABC Company's expense voucher workflow: employees create and
submit vouchers, the Director approves/rejects them, and the Accounts Team
monitors everything for reimbursement — with role dashboards and search/filter/
sort/print on top.

Stack: React (Vite) + Tailwind on the frontend, Node.js/Express + MySQL on the
backend, JWT auth, Multer for signature image uploads.

## 1. Project setup

### Prerequisites
- Node.js 18+
- MySQL 8+ running locally (or reachable)

### Database
```bash
mysql -u root -p < backend/schema.sql
```
This creates the `expense_voucher_db` database with `users` and `vouchers` tables.

### Backend
```bash
cd backend
cp .env.example .env      # fill in your MySQL credentials + a JWT secret
npm install
npm run seed               # creates one demo user per role
npm run dev                 # http://localhost:5000
```

Seeded demo accounts (password for all: `Password@123`):
| Role | Email |
|---|---|
| Employee | employee@demo.com |
| Director | director@demo.com |
| Accounts | accounts@demo.com |

### Frontend
```bash
cd frontend
cp .env.example .env       # VITE_API_BASE_URL, defaults to http://localhost:5000
npm install
npm run dev                 # http://localhost:5173
```

The Vite dev server proxies `/api` and `/uploads` to the backend, so the two
run independently in development.

## 2. Database schema

**`users`** — one row per person, `role` is `employee | director | accounts`.
`department_name` and `employee_code` are only meaningful for employees.

**`vouchers`** — one row per voucher.
- `status` is `draft | pending | approved | rejected`. "Submitted" and
  "Pending Approval" from the spec are collapsed into a single `pending`
  state, since nothing in the workflow distinguishes them once submitted.
- `employee_id` / `director_id` are FKs into `users`.
- `employee_signature_path` / `director_signature_path` store the relative
  `/uploads/signatures/...` path to the uploaded image; the file itself lives
  on disk under `backend/uploads/signatures`.
- A `CHECK (amount > 0)` constraint enforces the "amount must be positive" rule
  at the DB layer in addition to backend validation.
- `voucher_number` is generated server-side as `VCH-<year>-<sequence>`
  (e.g. `VCH-2026-0007`) and is unique.

See `backend/schema.sql` for the full DDL.

## 3. API documentation

All responses share the envelope `{ success, message, data }` (or `errors`
on failure). Protected routes require `Authorization: Bearer <token>`.

### Auth
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | Public | `{ email, password }` → `{ token, user }` |
| GET | `/api/auth/me` | Any authenticated user | Returns the current user |

### Vouchers
| Method | Route | Access | Notes |
|---|---|---|---|
| POST | `/api/vouchers` | Employee | multipart form; creates a **draft** |
| PUT | `/api/vouchers/:id` | Employee (owner) | Draft only |
| DELETE | `/api/vouchers/:id` | Employee (owner) | Draft only |
| POST | `/api/vouchers/:id/submit` | Employee (owner) | Draft → Pending; requires a signature already on file |
| GET | `/api/vouchers/mine` | Employee | All of the caller's own vouchers |
| GET | `/api/vouchers` | Director, Accounts | Optional `?status=` filter |
| GET | `/api/vouchers/pending` | Director | Vouchers awaiting approval |
| GET | `/api/vouchers/dashboard/employee` | Employee | Total/draft/pending/approved/rejected counts + total amount claimed |
| GET | `/api/vouchers/dashboard/director` | Director | Pending count, approved/rejected today, total pending amount, recent activity |
| GET | `/api/vouchers/dashboard/accounts` | Accounts | Totals by status, total approved expense amount, recent approved vouchers |
| GET | `/api/vouchers/:id` | Owner employee, Director, Accounts | 403 if an employee requests someone else's voucher |
| POST | `/api/vouchers/:id/approve` | Director | multipart, requires `directorSignature` file |
| POST | `/api/vouchers/:id/reject` | Director | requires `rejectionReason` in body |

Create/update accept multipart form fields: `voucherDate`, `expenseDate`,
`departmentName`, `expenseTitle`, `expenseCategory`, `expenseDescription`,
`amount`, and an optional `employeeSignature` file.

### Search, filter, and sort (bonus point)

`GET /api/vouchers` and `GET /api/vouchers/mine` both accept the same query
params: `search` (matches voucher number or employee name), `department`,
`category`, `status`, `dateFrom`/`dateTo` (expense date range),
`amountMin`/`amountMax`, and `sortBy` (`created_at` | `voucher_date` |
`expense_date` | `amount` | `voucher_number` | `status`) with `sortOrder`
(`asc`/`desc`). All are optional and combine with AND.

## 4. Notes / assumptions

- Collapsed "Submitted" and "Pending Approval" into one `pending` status,
  there's no separate action between them in the actual workflow.
- Signature isn't required to save a draft, only to submit it.
- Voucher numbers are just `VCH-<year>-<sequence>`, auto-generated.
- Signature uploads: PNG/JPG/WEBP only, 2MB cap by default (`MAX_UPLOAD_MB`).
- No re-approving a rejected voucher — once it leaves `pending` it's final.
- "Total Amount Claimed" on the employee dashboard = pending + approved +
  rejected (drafts don't count, nothing's been claimed yet).
- Print/download is just `window.print()` with a print stylesheet that hides
  the nav and action buttons — didn't want to pull in a PDF lib for this.

## 5. Project structure

```
expense-voucher-system/
├── backend/
│   ├── schema.sql
│   ├── seed.js
│   ├── .env.example
│   └── src/
│       ├── config/db.js
│       ├── controllers/
│       ├── middleware/         # auth, file upload, error handling
│       ├── routes/
│       ├── utils/
│       ├── app.js
│       └── server.js
└── frontend/
    ├── .env.example
    └── src/
        ├── api/axios.js
        ├── context/AuthContext.jsx
        ├── components/
        └── pages/{employee,director,accounts}/
```
