# Cignal Backend (Node.js + Express + MySQL)

## Quick start

1) Install dependencies

```bash
npm install
```

2) Configure environment

- Copy `.env.example` to `.env`
- Update DB credentials + `JWT_SECRET`

3) Setup database

- Create/import the schema using `sql/cignal_system.sql`.

4) Run the server

```bash
npm run dev
# or
npm start
```

Server runs on the configured `PORT` (default: `4000`).

## Notes

- Uploaded message files are served from:
  - `GET /uploads/messages/<filename>`
- Ticket statuses (DB enum): `Open`, `In Progress`, `Resolved`, `Closed`
