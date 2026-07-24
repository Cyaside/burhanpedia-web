# Burhanpedia Backend

NestJS API dan background worker untuk Burhanpedia. Proyek ini berdiri sendiri di dalam folder `backend/` dan tidak berbagi dependency atau source package dengan frontend.

## Requirement

- Node.js 22+
- Docker Desktop dengan Compose

## Development

```bash
cp .env.example .env
docker compose up -d postgres
npm ci
npm run db:migrate
npm run db:seed
npm run start:dev
```

API menggunakan prefix `http://localhost:3000/api/v1`.

Worker dijalankan pada terminal lain:

```bash
npm run worker:dev
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Database diakses langsung melalui `pg`. SQL hanya boleh berada pada repository, migration, seed, atau database infrastructure.
