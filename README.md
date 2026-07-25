# AttendHQ — Employee Attendance Management System

A production-ready attendance management system for a ~20-person company, with secure QR-based
check-in/check-out, role-based dashboards, leave management, and exportable reports.

**Stack:** React (Vite) + Tailwind CSS · Node.js/Express · MySQL (Sequelize) · JWT + refresh tokens

---

## 1. Folder Structure

```
attendance-system/
├── backend/
│   ├── src/
│   │   ├── config/        # env loader, Sequelize connection
│   │   ├── models/        # Sequelize models + associations
│   │   ├── middleware/    # auth, role guard, validation, rate limit, errors, upload
│   │   ├── controllers/   # route handlers (business logic)
│   │   ├── routes/        # Express routers
│   │   ├── validators/    # express-validator rule sets
│   │   ├── utils/         # jwt, password, qr, export, logger, audit helpers
│   │   └── seeders/       # super admin + demo data seeder
│   ├── uploads/            # profile photos (gitignored)
│   ├── logs/                # winston log files (gitignored)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/            # axios instance + typed service modules
│   │   ├── components/     # common/, layout/, ErrorBoundary, ProtectedRoute
│   │   ├── context/        # AuthContext, ThemeContext
│   │   ├── hooks/          # useAuth, useTheme, useFetch
│   │   ├── pages/           # auth/, admin/, employee/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── database/
│   └── schema.sql          # reference normalized MySQL schema (FKs + indexes)
├── docker-compose.yml
└── README.md
```

---

## 2. Database Schema

See [`database/schema.sql`](./database/schema.sql) for the full DDL. Summary of tables:

| Table | Purpose |
|---|---|
| `users` | Super Admin / Admin / Employee accounts |
| `departments`, `designations` | Org lookup tables |
| `refresh_tokens` | Hashed, revocable refresh tokens (session management) |
| `password_reset_tokens` | Hashed, time-limited reset tokens |
| `qr_tokens` | Rotating, opaque per-employee QR secure tokens |
| `qr_scan_logs` | Every scan attempt (success/failure) for audit |
| `attendances` | One row per employee per day; unique on `(user_id, attendance_date)` |
| `leaves` | Leave requests + approval workflow |
| `audit_logs` | Security-relevant actions across the app |

The app auto-creates/updates these tables via Sequelize (`sequelize.sync()`), but `schema.sql` is
provided for teams that prefer to provision the database by hand or through migration tooling.

---

## 3. Backend Setup

```bash
cd backend
cp .env.example .env      # then edit secrets, DB credentials, etc.
npm install
```

Create the database (or let `docker-compose` do it for you):

```sql
CREATE DATABASE attendance_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Run the app (development, with auto-restart):

```bash
npm run dev
```

Seed a Super Admin account + starter departments/designations:

```bash
npm run seed
```

The Super Admin login will be whatever you set `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` to in
`.env` (defaults: `superadmin@company.com` / `ChangeMe@123` — **change this before production**).

### Required environment variables

See `.env.example` for the full list. At minimum, change these before production:

- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `QR_SECRET` — long, random, unique strings
- `DB_PASSWORD` — a real MySQL password
- `SUPER_ADMIN_PASSWORD`
- `COOKIE_SECURE=true` once served over HTTPS

---

## 4. Frontend Setup

```bash
cd frontend
cp .env.example .env      # optional in dev; Vite proxies /api to localhost:5000
npm install
npm run dev
```

The app runs at `http://localhost:5173` and proxies `/api` + `/uploads` requests to the backend
(`http://localhost:5000`) via `vite.config.js` — no CORS issues in development.

For production, `npm run build` outputs static files to `frontend/dist/`, served by any static
host or the included Nginx image (see Docker section).

---

## 5. Authentication Flow

- **Login** issues a short-lived JWT **access token** (15 min, returned in the response body and
  also set as an httpOnly cookie) and a long-lived, opaque **refresh token** (7 days, httpOnly
  cookie only, hashed in the DB, revocable).
- The frontend keeps the access token in memory (not localStorage) and attaches it via
  `Authorization: Bearer`.
- On a 401, the axios interceptor automatically calls `/api/auth/refresh` (using the refresh
  cookie), rotates the refresh token, and retries the original request — giving a seamless
  session that survives page reloads without ever putting a long-lived secret in `localStorage`.
- **Logout** revokes the refresh token server-side and clears cookies.
- **Forgot/Reset password**: a hashed, 30-minute-expiry token is generated; in this reference
  build (no SMTP configured) the raw token is returned in the API response only in development
  mode — wire up a real email provider (SES, SendGrid, etc.) before production and stop returning
  `devResetToken`.
- **Session timeout**: enforced server-side via JWT expiry + refresh token expiry/revocation; a
  deactivated employee is locked out immediately (checked on every request, not just at login).

---

## 6. QR Attendance — How It Stays Secure

1. Each employee's QR code encodes **only** a random 256-bit token, HMAC-signed with a server
   secret (`QR_SECRET`) — never their name, ID, email, or any other detail.
2. Scanning submits the payload to `POST /api/qr/scan`. The server verifies the HMAC signature
   first (rejecting tampered codes), then looks up the token in `qr_tokens` to resolve the
   employee — the QR image itself is meaningless without the database.
3. Tokens expire after `QR_TOKEN_ROTATE_MINUTES` (default 24h) and can be force-rotated by an
   admin at any time (e.g., if a code is compromised); rotating deactivates the previous token.
4. One check-in and one check-out per employee per calendar day are enforced at the database
   level (`UNIQUE(user_id, attendance_date)`) and in application logic.
5. Every scan — success or failure (invalid signature, expired token, duplicate, inactive user)
   — is written to `qr_scan_logs` with IP and device info for audit review at
   `GET /api/qr/scan-logs`.

---

## 7. REST API Reference

All endpoints are prefixed with `/api`. Protected routes require a valid access token.
Responses follow `{ success, message, data }`; errors follow `{ success: false, message, errors }`.

### Auth (`/api/auth`)
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/login` | Public | Email + password login |
| POST | `/refresh` | Public (cookie) | Rotate refresh token, issue new access token |
| POST | `/logout` | Authenticated | Revoke refresh token, clear cookies |
| GET | `/me` | Authenticated | Current user profile |
| POST | `/forgot-password` | Public | Request password reset |
| POST | `/reset-password` | Public | Complete password reset with token |
| POST | `/change-password` | Authenticated | Change own password |

### Employees (`/api/employees`)
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/` | Admin+ | Create employee/admin |
| GET | `/` | Admin+ | List employees (search, filter, paginate) |
| GET | `/:id` | Authenticated | Get one employee |
| PUT | `/:id` | Admin+ | Update employee |
| DELETE | `/:id` | Super Admin | Permanently delete |
| PATCH | `/:id/status` | Admin+ | Activate/deactivate |
| GET | `/:id/qrcode` | Self or Admin+ | Get current QR image |
| POST | `/:id/qrcode/rotate` | Admin+ | Force-rotate QR token |
| POST | `/:id/photo` | Self or Admin+ | Upload profile photo |

### Attendance (`/api/attendance`)
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/today` | Authenticated | My attendance for today |
| GET | `/history` | Authenticated | My attendance history |
| POST | `/leave` | Authenticated | Request leave |
| GET | `/leave` | Authenticated | List leave requests (own, or all for admins) |
| GET | `/` | Admin+ | All employees' attendance (filterable) |
| POST | `/manual` | Admin+ | Manually create/correct a record |
| PATCH | `/leave/:id/decision` | Admin+ | Approve/reject leave |

### QR (`/api/qr`)
| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/scan` | Authenticated | Submit a QR scan (check_in/check_out) |
| GET | `/scan-logs` | Admin+ | View scan audit log |

### Dashboard (`/api/dashboard`)
| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/admin` | Admin+ | Totals, present/absent/late, dept breakdown |
| GET | `/admin/calendar` | Admin+ | Monthly attendance calendar data |
| GET | `/employee` | Authenticated | My today/MTD summary + leave balance |

### Reports (`/api/reports`) — Admin+
| Method | Path | Description |
|---|---|---|
| GET | `/` | JSON report (daily/weekly/monthly, dept/employee filters) |
| GET | `/export/excel` | Download `.xlsx` |
| GET | `/export/pdf` | Download `.pdf` |
| GET | `/employee/:id` | Employee-wise report for a date range |

### Meta (`/api/meta`)
| Method | Path | Access | Description |
|---|---|---|---|
| GET/POST/PUT/DELETE | `/departments` | Varies | Department CRUD |
| GET/POST/PUT/DELETE | `/designations` | Varies | Designation CRUD |

---

## 8. Security Checklist (implemented)

- ✅ SQL injection protection — all queries via Sequelize parameterized ORM calls
- ✅ XSS mitigation — request body sanitization + React's default output escaping
- ✅ Helmet security headers, `X-Frame-Options`, `X-Content-Type-Options`
- ✅ CORS locked to `CLIENT_URL`, credentials enabled
- ✅ Rate limiting (global + stricter on auth/QR-scan endpoints)
- ✅ express-validator input validation on every mutating endpoint
- ✅ bcrypt (cost 12) password hashing; strong-password policy enforced
- ✅ Short-lived JWT access tokens + revocable, hashed refresh tokens
- ✅ httpOnly, SameSite cookies for tokens; `COOKIE_SECURE=true` in production (HTTPS-only)
- ✅ Role-based authorization middleware on every admin/super-admin route
- ✅ Audit log of security-relevant events (logins, employee changes, QR rotation, leave decisions)
- ✅ Centralized error handler — no stack traces or internals leak in production responses
- ✅ Secrets loaded from environment variables only, never hardcoded
- ✅ HTTP Parameter Pollution protection (`hpp`)
- ✅ File upload validation (MIME allowlist, size cap, randomized filenames)

CSRF: because the API uses `Authorization: Bearer` for the access token (not solely
cookie-based auth) and strict CORS, classic CSRF is largely mitigated; the refresh-token cookie
uses `SameSite=Lax/None+Secure` to further reduce cross-site risk. If you extend the app to rely
purely on cookie auth, add a CSRF token middleware (e.g. `csrf-csrf`) for state-changing routes.

---

## 9. Deployment

### Option A — Docker Compose (recommended for a quick production deploy)

```bash
cp backend/.env.example backend/.env   # fill in real secrets
# Then, from the repo root:
JWT_ACCESS_SECRET=$(openssl rand -hex 32) \
JWT_REFRESH_SECRET=$(openssl rand -hex 32) \
QR_SECRET=$(openssl rand -hex 32) \
SUPER_ADMIN_PASSWORD='Choose_A_Strong_One!1' \
DB_PASSWORD='choose_a_db_password' \
docker compose up -d --build
```

This brings up MySQL, the Node API (port 5000), and an Nginx-served React build (port 80) that
proxies `/api` and `/uploads` to the backend. Then seed the super admin:

```bash
docker compose exec backend npm run seed
```

### Option B — Manual VM / bare metal

1. Provision MySQL 8; create the `attendance_system` database.
2. `backend`: `npm install --omit=dev`, set real `.env`, run behind a process manager
   (`pm2 start src/server.js --name attendance-api`) or systemd, behind Nginx/Caddy as a
   reverse proxy terminating TLS.
3. `frontend`: `npm run build`, serve `dist/` via Nginx/Caddy/any static host, proxying `/api`
   and `/uploads` to the backend as shown in `frontend/nginx.conf`.
4. Set `COOKIE_SECURE=true` and `NODE_ENV=production` once served over HTTPS.
5. Point DNS/TLS at your reverse proxy; only expose ports 80/443 publicly.

### Option C — Managed platforms

- **Backend**: any Node host (Render, Railway, Fly.io, EC2, etc.) + managed MySQL
  (PlanetScale-compatible schema, RDS, Cloud SQL). Set all env vars from `.env.example`.
- **Frontend**: static hosting (Vercel, Netlify, S3+CloudFront) — set `VITE_API_URL` to your
  backend's public URL and update `CLIENT_URL`/CORS on the backend accordingly.

### Production hardening notes

- Replace `sequelize.sync({ alter: true })` with versioned migrations (`sequelize-cli`) before
  going live — `sync` is convenient for first boot/demos but unsafe for ongoing schema changes.
- Wire up a real transactional email provider for password resets instead of the
  development-only `devResetToken` response.
- Put the app behind a WAF/reverse proxy (Cloudflare, AWS ALB + WAF) for additional DDoS/rate
  protections beyond the built-in `express-rate-limit`.
- Back up the MySQL database on a schedule; `attendances` and `audit_logs` are your compliance
  record of who worked when.

---

## 10. Default Login (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | value of `SUPER_ADMIN_EMAIL` | value of `SUPER_ADMIN_PASSWORD` |

Create Admin and Employee accounts from the Super Admin's **Employees** page — each new employee
automatically gets a QR code generated on creation, viewable/downloadable from their profile or
the Employees list.
