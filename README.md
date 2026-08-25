# Burhanpedia

Burhanpedia is a marketplace application covering product discovery, multi-store checkout, seller operations, delivery, reviews, and administration. Its Next.js frontend and NestJS backend live in separate directories in one repository. Each project owns its dependencies, lockfile, configuration, and build; there is no root workspace or shared source package.

The application is suitable for local development and demonstration. It is **not ready to accept public paid orders**: production payment and wallet funding are not implemented, and demo top-up is disabled in production.

## Demo

These silent recordings use seeded demonstration data. The attachment URLs below render as inline video players on GitHub.

### Storefront and product discovery

https://github.com/user-attachments/assets/7ca6615c-5da3-4688-9ddb-84ed908af96f

### Buyer cart and checkout

https://github.com/user-attachments/assets/8cd7f68c-731c-4434-a25f-0782e071d29c

### Seller storefront and order management

https://github.com/user-attachments/assets/3808d62a-498c-44ad-9faf-fb2af5c52760

### Driver delivery flow

https://github.com/user-attachments/assets/408d544e-e2d1-46a0-be33-e9fa24a757e7

### Buyer review flow

https://github.com/user-attachments/assets/ce3635a1-09c9-4740-9d14-18f71066b838

### Administration

https://github.com/user-attachments/assets/41c2b1bd-b044-4228-bf44-37e2a7cbdfc0

## Architecture

```text
Browser
  │
  ▼
frontend/  Next.js pages, role-aware UI, and same-origin /api/v1 proxy
  │
  ▼
backend/   NestJS HTTP API ─────────── S3-compatible image storage
  │
  ▼
PostgreSQL  Catalog, identity, orders, jobs, and outbox
  ▲
  │
backend/   Separate worker process
```

The browser calls the frontend origin. Next.js forwards `/api/v1/*` requests to the API, including the session cookies. The API enforces authorization and owns business rules; frontend role checks only control navigation and presentation. PostgreSQL stores marketplace state and versioned SQL migrations. The worker runs independently from the HTTP process and handles scheduled order work and outbox publication.

| Directory | Responsibility |
| --- | --- |
| [`frontend/`](frontend/README.md) | Storefront, buyer checkout, seller, driver, and admin screens; API client and browser tests. |
| [`backend/`](backend/README.md) | HTTP API, domain services, PostgreSQL repositories, migrations, seed data, and worker. |
| [`.github/workflows/`](.github/workflows/) | Independent project checks and integration tests. |

## Run locally

Use Node.js 22–24 and Docker Compose. Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env.local`. Review `DATABASE_URL` before running migrations or seed commands; use a disposable local database.

From `backend/`:

```bash
docker compose up -d --wait postgres
npm ci
npm run db:migrate
npm run db:seed
npm run start:dev
```

From `frontend/` in another terminal:

```bash
npm ci
npm run dev -- -p 3001
```

Open `http://localhost:3001`. The frontend proxies `/api/v1` to the API at `http://localhost:3000`. Run `npm run worker:dev` from `backend/` in a separate terminal for background processing. Seller image uploads also require the optional MinIO service; see the [backend setup](backend/README.md).

For a larger local demonstration dataset, run `npm run db:seed:demo` from `backend/`. Never run development or demo seeds against production data.

## Verification and deployment boundary

Both projects expose independent `lint`, `typecheck`, and `build` scripts. Backend unit and integration tests and frontend Playwright tests are documented in their respective guides. The [integration workflow](.github/workflows/integration-ci.yml) exercises the combined stack.

Before a public commerce deployment, add a real payment or wallet-funding integration and rehearse backup, restore, monitoring, and rollback. Do not deploy demonstration accounts or data. The development top-up and simulated time controls are disabled in production.

## Project documentation

- [Frontend architecture and development](frontend/README.md)
- [Backend architecture and operations](backend/README.md)
- [Third-party image acknowledgements](frontend/ACKNOWLEDGEMENTS.md)
