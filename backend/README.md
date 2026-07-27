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

Untuk upload gambar lokal, jalankan `docker compose up -d minio minio-init`.
Isi `S3_*` pada `.env` sesuai `.env.example`; bucket dibuat otomatis dan
hanya objek gambar yang dapat dibaca publik. Kredensial contoh hanya untuk
development, jangan digunakan di production. Upload berlangsung dua tahap:
seller meminta signed PUT URL, mengirim file langsung ke storage dengan
`Content-Type` yang dikembalikan, lalu memanggil endpoint complete. API akan
memeriksa ukuran, SHA-256, format dan dimensi gambar sebelum memasukkannya
ke katalog.

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

Panduan migration, backup, reset, dan pemulihan tersedia di
[`docs/runbooks/database.md`](../docs/runbooks/database.md).
