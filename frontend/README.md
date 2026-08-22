# Burhanpedia frontend

This Next.js project contains the public storefront and buyer, seller, driver, and administrator pages. It communicates with the backend through HTTP; it does not import backend source code.

## Local setup

Use Node.js 22–24. Create `.env.local` from `.env.example` if it does not exist, then run:

```bash
npm ci
npm run dev -- -p 3001
```

Open `http://localhost:3001`. The default `NEXT_PUBLIC_API_URL=/api/v1` keeps browser requests on the frontend origin. `BACKEND_ORIGIN=http://127.0.0.1:3000` controls the server-side proxy target. Set `IMAGE_PUBLIC_BASE_URL` to the public URL of the configured image bucket.

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
npm run audit:dead-code
npm run audit:dependencies
```

The Playwright suite requires the API, a seeded PostgreSQL test database, and a running production frontend build:

```bash
npm run start -- -p 3001
npm run test:e2e
```

The [integration CI workflow](../.github/workflows/integration-ci.yml) provisions the complete test stack.

## Production deployment

Configure the frontend origin, backend proxy target, and image public base URL for the target environment. Deploy the frontend alongside a compatible API and worker release. Paid checkout is not production-ready until a real wallet-funding or payment flow is available; the demo top-up control is not rendered in production.

Photography credits and source links are listed in [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md).
