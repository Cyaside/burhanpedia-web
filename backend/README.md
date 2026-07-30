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

Uji adapter terhadap MinIO lokal dengan `npm run smoke:storage` setelah
`S3_*` terisi. Script ini mengirim gambar uji, membacanya kembali, lalu
menghapus objek uji tersebut.

API menggunakan prefix `http://localhost:3000/api/v1`.

Worker dijalankan pada terminal lain:

```bash
npm run worker:dev
```

Worker memproses deadline pengiriman, refund idempotent, retry, dan dead-letter.
Event bisnis dipublikasikan secara atomik ke tabel `published_events` sebagai
feed internal yang durable; integrasi eksternal belum terpasang. Consumer
berikutnya harus membaca feed tersebut dengan cursor dan memprosesnya secara
idempotent. Simulasi hari berikutnya hanya tersedia di non-production;
connection pool production selalu menggunakan waktu database nyata.

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Benchmark katalog memakai database test terpisah. `npm run bench:catalog`
memuat 10.000 user, 1.000 toko, 100.000 produk, dan 300.000 varian,
menjalankan `EXPLAIN (ANALYZE, BUFFERS)` untuk daftar terbaru, harga, serta
pencarian, lalu melakukan rollback. Set `DATABASE_URL`/`MIGRATION_DATABASE_URL`
ke database test sebelum menjalankannya; jangan gunakan database produksi.

Database diakses langsung melalui `pg`. SQL hanya boleh berada pada repository, migration, seed, atau database infrastructure.

Panduan migration, backup, reset, dan pemulihan tersedia di
[`docs/runbooks/database.md`](../docs/runbooks/database.md).
