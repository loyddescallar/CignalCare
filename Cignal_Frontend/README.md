# Cignal Frontend (React + Vite)

## Quick start

1) Install dependencies

```bash
npm install
```

2) Configure API URL (optional)

By default, the frontend calls `http://localhost:4000/api`.

If you want to change it, copy `.env.example` to `.env` and update:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

3) Run

```bash
npm run dev
```

## Notes

- Ticket statuses match the backend/DB enum:
  - `Open`, `In Progress`, `Resolved`, `Closed`
- Chat attachments are served by the backend at:
  - `http://<backend-host>/uploads/messages/<filename>`
