# Burhanpedia

Burhanpedia adalah aplikasi e-commerce multi-role untuk Buyer, Seller, Driver, dan Admin. Repository ini sengaja mempertahankan frontend dan backend sebagai dua proyek independen agar dependency, build, test, dan deployment keduanya tidak saling mengunci.

## Struktur repository

```text
burhanpedia-web/
├── frontend/   # Next.js storefront dan dashboard
├── backend/    # NestJS API, worker, PostgreSQL migrations
├── docs/       # Requirement, keputusan arsitektur, dan runbook
└── .github/    # CI frontend, backend, dan integration
```

Tidak ada root workspace, root package manager, atau shared source package. Jalankan perintah dari folder proyek yang sedang dikerjakan.

## Menjalankan frontend

```bash
cd frontend
npm ci
npm run dev
```

Frontend tersedia di `http://localhost:3001` pada konfigurasi development.

## Menjalankan backend

```bash
cd backend
docker compose up -d postgres
npm ci
npm run db:migrate
npm run db:seed
npm run start:dev
```

Backend tersedia di `http://localhost:3000/api/v1`. Detail konfigurasi selalu disimpan di `backend/.env.example`.

## Dokumentasi

- [Requirement Burhanpedia](docs/requirements.md)
- Runbook operasional: `docs/runbooks/`

Dokumen master overhaul sengaja tidak disimpan di repository ini.
