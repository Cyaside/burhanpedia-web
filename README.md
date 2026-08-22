# Burhanpedia

Burhanpedia is a marketplace application with buyer, seller, driver, and administrator workflows. The Next.js frontend and NestJS backend are separate projects in one repository. Each has its own dependencies, lockfile, build, and tests.

## Repository layout

```text
burhanpedia-web/
├── frontend/   Next.js storefront and role-specific pages
├── backend/    NestJS API, worker, PostgreSQL migrations, and seed data
└── .github/    Project CI workflows
```

## Local development

Use Node.js 22–24 and Docker Compose. Create local environment files from `backend/.env.example` and `frontend/.env.example`. Check that `backend/.env` points to the intended local PostgreSQL database before running migrations or seed commands.

Start PostgreSQL and the API from `backend/`:

```bash
docker compose up -d --wait postgres
npm ci
npm run db:migrate
npm run db:seed
npm run start:dev
```

In a second terminal, start the frontend from `frontend/`:

```bash
npm ci
npm run dev -- -p 3001
```

The frontend runs at `http://localhost:3001` and proxies `/api/v1` to the API at `http://localhost:3000`. Image uploads require the optional S3-compatible storage service described in the [backend guide](backend/README.md). Run the worker separately with `npm run worker:dev` from `backend/` to process background jobs.

## Verification

Run lint, type checking, tests, and builds from each project directory. The frontend Playwright suite requires a running API, PostgreSQL test data, and a built frontend server. See the [frontend guide](frontend/README.md) and [backend guide](backend/README.md) for commands. CI definitions are in `.github/workflows/`.

## Production status

Production payment and wallet funding are not implemented. Demo top-up is disabled in production, so paid checkout is not ready for public use. Before deploying commerce, complete a production funding/payment integration and verify backup, restore, monitoring, and rollback procedures. Do not load demo seed data into production.

## Documentation

- [Backend setup and operations](backend/README.md)
- [Frontend setup and verification](frontend/README.md)
- [Image acknowledgements](frontend/ACKNOWLEDGEMENTS.md)
