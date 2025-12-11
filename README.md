# Task Manager Frontend

Minimal deep-blue/white React + Vite UI for the Task Manager backend.

## Quick start

```bash
cd taskmanager_frontend
npm install
echo "VITE_API_URL=http://localhost:3000" > .env.local
npm run dev
```

Open http://localhost:5173.

## What it does
- Login/register via `/auth/*` and keep JWT in memory.
- Create tasks with title, description, status, due date, priority, assignee.
- List tasks from `/tasks` (expects `{ data, total, page, limit }`).
- Deep blue, minimal software look.

## Theming
- Colors: deep navy background, white/blue accents, soft glass panels.
- Components: hero, auth panel, task composer, task list.

## Notes
- API base defaults to `http://localhost:3000`; override with `VITE_API_URL`.
- Ensure backend CORS is enabled (it is by default).***
