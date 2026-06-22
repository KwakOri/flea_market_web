# Flea Market Web

Next.js frontend for the flea market settlement app.

## Requirements

- Node.js 20.9.0 or newer
- npm

## Designer Preview Mode

Use mock mode when running this frontend without the backend/API server.

Mock mode is the default even without a local env file. To persist edits across
browser refreshes, create `.env.local` from the example:

```bash
cp .env.example .env.local
```

Then run:

```bash
npm install
npm run dev
```

The app will use frontend fixtures plus an in-browser mock store, so auth, receipt,
settlement, and log screens can render without local Supabase or the Nest API.

`.env.example` is only a template file. Next.js does not load it directly.

## API Mode

Use API mode only when connecting this frontend back to the local or remote backend.

```env
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Then run:

```bash
npm run dev
```
