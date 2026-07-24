# Burhanpedia Frontend

Next.js storefront dan dashboard Burhanpedia. Proyek ini berdiri sendiri di dalam folder `frontend/` dan berkomunikasi dengan backend hanya melalui HTTP API.

## Development

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Default development URL adalah `http://localhost:3000`. Jika backend juga memakai port 3000, jalankan frontend dengan:

```bash
npm run dev -- -p 3001
```

## Environment

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

Frontend tidak boleh mengimpor source code backend. Kontrak data mengikuti OpenAPI backend.
