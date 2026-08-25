# Burhanpedia frontend

The frontend is a standalone Next.js application for the public storefront and the buyer, seller, driver, and administrator experiences. It communicates with the backend through HTTP; it does not import backend source code or connect to PostgreSQL directly.

## How it works

| Area | Location | Responsibility |
| --- | --- | --- |
| Routes | `src/app/` | App Router pages for catalog, stores, product details, cart, checkout, orders, and role-specific workspaces. |
| Feature UI | `src/components/` and `src/sections/` | Reusable navigation, storefront, seller, form, and UI components. |
| API boundary | `src/lib/api/` | Shared HTTP client and typed catalog, commerce, seller, and operations requests. |
| Session and roles | `src/lib/auth.ts` | Current-user query and client-side route guards. |
| Shared browser state | `src/components/providers/` | React Query provider for fetching, caching, and invalidation. |
| Styling and assets | `src/styles/` and `public/` | Design styles and local brand assets. |
| Browser tests | `tests/` | Playwright journeys across public and authenticated views. |

The browser requests `/api/v1/*` on the frontend origin. The rewrite in `next.config.ts` forwards those requests to `BACKEND_ORIGIN`, so session cookies remain on the same browser origin. The shared API client sends credentials, refreshes an expired session once, and turns API Problem Details responses into user-facing errors. Page-level role guards prevent inappropriate controls and routes from appearing, while the backend remains the authority for every permission and ownership check.

Catalog pages fetch categories, stores, and cursor-paginated products. The buyer flow selects a product variant, uses a server-side cart, requests a checkout quote, and submits checkout with an idempotency key. Seller, driver, and admin views call their respective backend endpoints; they do not mutate marketplace data locally as a source of truth.

## Configuration

Use Node.js 22–24. Copy `.env.example` to `.env.local` and set:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Browser-visible API path; `/api/v1` is the default for same-origin requests. |
| `BACKEND_ORIGIN` | API origin used by the Next.js rewrite, for example `http://127.0.0.1:3000`. |
| `IMAGE_PUBLIC_BASE_URL` | Public base URL for product and store images; must match the backend storage configuration. |

Start the backend and database first, then from `frontend/` run:

```bash
npm ci
npm run dev -- -p 3001
```

Open `http://localhost:3001`. See the [repository guide](../README.md) for the complete local stack.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
npm run audit:dead-code
npm run audit:dependencies
```

The Playwright suite needs a running API, seeded PostgreSQL test data, and a running frontend server. For example, after building the frontend, start it with `npm run start -- -p 3001` and run `npm run test:e2e` in another terminal. Tests cover desktop and mobile Chromium where applicable. The [integration CI workflow](../.github/workflows/integration-ci.yml) provisions the complete test stack.

## Deployment boundary

Deploy the frontend with a compatible API and worker release. Configure the public origin, backend rewrite target, secure cookies, and image URL consistently across services. Paid checkout is not ready for public production use until a real funding or payment flow exists; the demo top-up control is intentionally unavailable in production.

Image credits and source links are listed in [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md).
