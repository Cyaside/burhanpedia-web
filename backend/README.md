# Burhanpedia API and worker

This project provides the HTTP API, background worker, PostgreSQL migrations, and database tools. It can be installed and built independently of the frontend.

## Local setup

Requirements: Node.js 22–24 and Docker Compose. Create `.env` from `.env.example` if it does not exist, then verify `DATABASE_URL` before running any database command.

```bash
docker compose up -d --wait postgres
npm ci
npm run db:migrate
npm run db:seed
npm run start:dev
```

The API listens on `http://localhost:3000/api/v1` by default. Start background processing in another terminal:

```bash
npm run worker:dev
```

For local image uploads, start MinIO and its bucket initialization service:

```bash
docker compose up -d --wait minio minio-init
```

Configure the `S3_*` variables from `.env.example`. Seller uploads use a signed URL; the API validates the uploaded object's size, checksum, format, and dimensions before publication. `npm run smoke:storage` exercises this flow against the configured storage endpoint.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test -- --runInBand
npm run build
npm run audit:dead-code
npm run audit:dependencies
```

Database and HTTP integration checks require a dedicated PostgreSQL test database. The CI workflow shows the environment and commands used for these checks. Never point test, seed, benchmark, or reset commands at a production database.

## Production runtime

Run migrations as a separate job through a direct PostgreSQL connection. Deploy the API (`npm run start:prod`) and worker (`npm run worker`) as separate processes from the same build. Production configuration requires secure cookies, a strong JWT secret, the public frontend origin, PostgreSQL, and S3-compatible image storage. See `.env.example` for configuration and verify backup, restore, monitoring, and rollback procedures before release.

The development wallet top-up and time simulation are disabled in production. No production funding or payment integration is provided, so the current checkout flow must not be offered for public paid orders.
