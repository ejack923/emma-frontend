# Deadline Guard Frontend

This frontend is now developed as a standalone app.

## Modes

### `standalone` (default)

- no backend required
- email actions are saved to a browser-local outbox
- uploads stay browser-local
- barrister lists come from in-frontend fixtures
- chat uses a lightweight local response layer
- PDF diary extraction is intentionally unavailable in this mode

### `remote`

Use this when you want the frontend to talk to a separate API project.

Create a `.env` file from `.env.example` and set:

```bash
VITE_APP_INTEGRATION_MODE=remote
VITE_APP_API_BASE_URL=http://127.0.0.1:54322
```

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Notes

- The app no longer assumes the sibling `backend` project is present.
- Legacy files under `src/lib/api.ts` and `src/features/*` are older scaffolding and are not required for the extracted Law Support Hub app flows.
