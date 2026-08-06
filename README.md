# Flow ⚡ — AI Academic Workflow Platform

> Transform fragmented student workflows into structured academic execution plans using Google Gemini AI and Supabase.

---

## Features

| Feature | Description |
|---|---|
| 📄 **Ingest Studio** | Upload PDFs/images or paste text — Gemini extracts tasks, deadlines & weightage automatically |
| ✅ **Task Manager** | Full CRUD task board with priority, status, subject filtering |
| 📅 **Study Planner** | AI-generated 7-day optimised study schedule using Gemini Pro |
| 🤖 **AI Copilot** | Context-aware academic assistant with document awareness |
| 📊 **Dashboard** | Real-time overview of workload, deadlines, and subject distribution |
| ⚙️ **Settings** | Profile management — institution, preferred study hours |

---

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Framer Motion
- **Backend**: Node.js + Express (ESM modules)
- **Database**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **AI**: Google Gemini 2.5 Flash + Pro via `@google/genai`
- **Deployment**: Render

---

## Quick Start

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Gemini API Key](https://aistudio.google.com/apikey)

### 1. Clone & Install

```bash
git clone <repo-url>
cd flow
npm run install:all
```

### 2. Configure Environment

**Server** — create `server/.env` from `.env.example`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GEMINI_API_KEY=your-gemini-key
```

**Client** — create `client/.env` from `client/.env.example`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=/api/v1
```

### 3. Database Setup

Run the migration in your Supabase SQL editor:
```
supabase/migrations/20260806000000_init_schema.sql
```

### 4. Run

```bash
# Terminal 1 — Server
npm run dev:server

# Terminal 2 — Client
npm run dev:client
```

Visit `http://localhost:5173`

---

## Project Structure

```
flow/
├── .env.example              # Root env template
├── render.yaml               # Render deployment config
├── supabase/
│   └── migrations/           # Database schema + RLS
└── server/                   # Express API
    ├── routes/               # auth, ingest, tasks, planner, copilot
    ├── middleware/           # auth, rate limiting, validation
    ├── services/             # Gemini AI + Supabase clients
    └── utils/                # Error handler
└── client/                   # React + Vite frontend
    └── src/
        ├── pages/            # 7 pages
        ├── components/       # Reusable UI
        ├── context/          # Auth + Theme
        └── services/         # Axios API client
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/sync` | Sync/create user profile |
| POST | `/api/v1/ingest/file` | Upload file → extract tasks |
| POST | `/api/v1/ingest/text` | Text paste → extract tasks |
| GET | `/api/v1/tasks` | List tasks (with filters) |
| POST | `/api/v1/tasks` | Create manual task |
| PATCH | `/api/v1/tasks/:id` | Update task |
| DELETE | `/api/v1/tasks/:id` | Delete task |
| POST | `/api/v1/planner/generate` | Generate AI study plan |
| GET | `/api/v1/planner/current` | Get latest plan |
| POST | `/api/v1/copilot/chat` | AI chat |
| GET | `/api/v1/copilot/history` | Chat history |

---

## License

MIT
