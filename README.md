# Flea Market Web

Next.js frontend for the flea market settlement app.

## Designer Preview Mode

Use mock mode when running this frontend without the backend/API server.

```bash
cp .env.example .env.local
```

Set the frontend data source to mock:

```env
NEXT_PUBLIC_DATA_SOURCE=mock
NEXT_PUBLIC_MOCK_PERSISTENCE=localStorage
```

Then run:

```bash
npm install
npm run dev
```

The app will use frontend fixtures plus an in-browser mock store, so auth, receipt,
settlement, and log screens can render without local Supabase or the Nest API.

## API Mode

Use API mode when connecting this frontend back to the local or remote backend.

```env
NEXT_PUBLIC_DATA_SOURCE=api
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

Then run:

```bash
npm run dev
```
