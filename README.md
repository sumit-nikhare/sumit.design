# Sumit Design Portfolio

Personal portfolio site with case studies plus a lightweight task/job tracker and timer utility.
Built with static HTML + Tailwind CSS and a small Node/Vercel serverless API for the task tracker.

## Highlights
- Portfolio pages and case studies under `work/`
- Task/job tracker with filters, sorting, subtasks, and follow-ups
- Export/import to JSON (`planner-export.json`)
- Light/dark theme toggle with saved preference

## What's inside
- Portfolio pages: `index.html`, `about.html`, `work.html`, and case studies under `work/`
- Utilities: `task.html` (task/job tracker) and `timer.html`
- Tailwind CSS source + output: `src/input.css` and `src/output.css`
- Front-end JS: `src/theme.js` (theme toggle) and `src/task.js` (task tracker logic)
- Serverless API (Vercel-style): `api/`
- Database schema: `sql/schema.sql`

## File structure
```
.
├── api/                 # serverless functions (auth + data)
├── assets/              # images, icons, media
├── components/          # shared HTML snippets
├── sql/                 # Postgres schema
├── src/                 # JS + Tailwind input/output
├── work/                # case studies and subpages
├── task.html            # task/job tracker UI
├── timer.html           # timer utility
├── index.html
├── about.html
└── work.html
```

## Tech stack
- HTML + vanilla JS
- Tailwind CSS (via `@tailwindcss/cli`)
- Vercel serverless functions
- Vercel Postgres (`@vercel/postgres`)
- Auth: JWT + HTTP-only cookie (`planner_token`)

## Local setup
### 1) Install dependencies
```bash
npm install
```

### 2) Build Tailwind CSS
One-time build:
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css
```

Watch mode:
```bash
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

### 3) Serve the site locally
```bash
python3 -m http.server
```
Then open `http://localhost:8000`.

## Task tracker usage
- Sign up or log in from `task.html`.
- Tasks support start/end time (IST), subtasks, and completion state.
- Jobs track company/role, status, applied date, follow-up date, and follow-ups.
- Filters and sorting are tab-specific (Tasks vs Jobs).
- Changes auto-save to `/api/data` when authenticated.

## Task tracker backend (optional)
The task/job tracker in `task.html` requires the API for storage and sync.

### API endpoints
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/data`
- `PUT /api/data`

### Auth rules
- Username: 3-32 chars, letters/numbers plus `.`, `_`, `-`
- Password: minimum 8 chars
- Cookie: `planner_token`, HTTP-only, `SameSite=Lax`, secure in production
- Token TTL: 30 days

### Database schema
Apply `sql/schema.sql` to your Postgres instance:
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL,
  username_lower TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_data (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### Environment variables
Set these for the API runtime:
- `AUTH_SECRET` (JWT signing secret)
- Vercel Postgres connection vars used by `@vercel/postgres` (for example `POSTGRES_URL`)

### Local dev (API)
This repo is structured for Vercel. For local API testing you can use:
```bash
vercel dev
```
Make sure your Postgres connection variables are available in the environment.

## Data model (export/import)
Exported JSON shape:
```json
{
  "version": 1,
  "exportedAt": "2026-01-17T05:15:02.138Z",
  "tasks": [
    {
      "id": "PT-001",
      "code": "PT-001",
      "title": "Draft case study",
      "done": false,
      "expanded": true,
      "startUtcMs": 1768617000000,
      "endUtcMs": 1768661400000,
      "subtasks": [
        { "id": "ST-01", "code": "ST-01", "text": "Outline", "done": false }
      ],
      "subSeq": 1
    }
  ],
  "jobs": [
    {
      "id": "JB-001",
      "code": "JB-001",
      "company": "Acme",
      "role": "Product Designer",
      "status": "Applied",
      "link": "https://example.com",
      "notes": "Sent portfolio",
      "appliedUtcMs": 1768617000000,
      "nextUtcMs": 1768703400000,
      "done": false,
      "expanded": true,
      "followUps": [
        { "id": "FU-01", "code": "FU-01", "text": "Email recruiter", "done": false }
      ],
      "followSeq": 1
    }
  ],
  "ui": {
    "tasks": { "showCompleted": true, "filterMode": "all", "sortMode": "created", "searchQuery": "" },
    "jobs": { "showCompleted": true, "filterMode": "all", "sortMode": "applied", "searchQuery": "" }
  },
  "seq": { "task": 1, "job": 1 }
}
```
Notes:
- Time values are stored as UTC milliseconds and shown in IST (Asia/Kolkata).
- Import accepts the full object above or a legacy array of tasks.

## Theme toggle
- Uses `src/theme.js`.
- Persists preference in `localStorage` under the key `theme`.

## Testing
- No automated tests are configured (`npm test` is not defined).

## Project notes
- `src/output.css` is generated. Rebuild it after changes to `src/input.css`.
- Authentication uses a signed cookie named `planner_token`.
