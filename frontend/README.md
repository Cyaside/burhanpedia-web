# Burhanpedia frontend

The frontend is Burhanpedia's web application. It includes the public marketplace and dedicated views for buyers, sellers, drivers, and administrators. It communicates with the backend through HTTP and does not connect to PostgreSQL directly.

## How it works

| Area | Location | Responsibility |
| --- | --- | --- |
| Routes | `src/app/` | Pages for discovery, product details, cart, checkout, orders, and role-specific workspaces. |
| Components | `src/components/` and `src/sections/` | Navigation, storefront cards, forms, and reusable interface elements. |
| API client | `src/lib/api/` | Requests and response types for marketplace features. |
| Sessions | `src/lib/auth.ts` | Current account, active role, and page access checks. |
| Data fetching | `src/components/providers/` | React Query setup for loading and refreshing server data. |
| Visual assets | `src/styles/` and `public/` | Shared styling and brand assets. |
| Browser tests | `tests/` | Playwright coverage for marketplace journeys. |

### Requests and sessions

The browser sends API requests to `/api/v1/*` on the web application's origin. Next.js forwards them to `BACKEND_ORIGIN`. The API client includes session cookies, attempts one refresh when a session expires, and presents API errors consistently. Access checks in the UI hide actions that do not belong to the active role; the backend independently enforces permissions and ownership.

### Marketplace journeys

- Public pages load categories, stores, and products from the API. Product lists can be filtered and extended without loading the entire catalog at once.
- Buyers select a variant and quantity, add it to a cart stored by the backend, review a server-calculated checkout quote, and place an order.
- Sellers update their store and inventory and process incoming orders. Drivers claim and progress deliveries. Administrators use dedicated operational views.

The browser displays the latest server state; it does not calculate final order totals or act as the source of truth for stock and order status.

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

## Deployment

Deploy the frontend with a compatible API and worker release. Configure the public origin, backend rewrite target, secure cookies, and image URL consistently across services.

Image credits and source links are listed in [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md).
