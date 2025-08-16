## BurhanPedia — Project Tracker

Used so i dont forget what my current progress are.

Keep this file short and high-signal. Update the log as you make changes.

### Important : Run The Backend First since i configurate the frontend in 3001 (ts pmo)

### What’s Done (Current Snapshot)

- **Backend (NestJS + Prisma + PostgreSQL)**

  - Bootstrapped NestJS app (`src/main.ts`, `src/app.module.ts`).
  - Added `PrismaService` and wired it into `AppModule`.
  - Created `UserService` and `UserController` with `GET /users` → `prisma.user.findMany()`.
  - Prisma set up with PostgreSQL datasource and generated client output at `backend/generated/prisma`.
  - Prisma schema includes `User { id Int @id @default(autoincrement()), name String, email String @unique }`.
  - Initial migration created (`prisma/migrations/20250814042439_init`).

- **Frontend (Next.js App Router + Tailwind CSS 4)**
  - Next.js 15 app configured with React 19 and TypeScript.
  - Global layout at `src/app/layout.tsx` with basic metadata and global styles (`src/styles/index.css`).
  - Custom 404 page (`src/app/not-found.tsx`) using `Button` from `src/components/ui/button` and `public/burhan.jpg`.
  - **Landing Page**: Complete landing section with Hero component, search functionality, and animated badges.
  - **Authentication System**: Full login/register forms with role selection (buyer/seller/admin), form validation, and AuthLayout.
  - **Navigation**: Global navigation overlay with loading states and route transition handling.
  - Tailwind 4 via PostCSS plugin configured in `postcss.config.mjs`.

### Tech Stack Overview

- **Backend**

  - Framework: NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
  - Language: TypeScript 5
  - ORM: Prisma 6 (`@prisma/client`, `prisma`)
  - DB: Supabase using PostgreSQL (`pg`), `DATABASE_URL` in env
  - Testing: Jest + Supertest
  - Lint/Format: ESLint 9 + Prettier 3
  - Scripts: `start`, `start:dev`, `build`, `test`, `test:e2e`, `lint`, `format`

- **Frontend**
  - Framework: Next.js 15 (App Router) with React 19 + TypeScript
  - Styling: Tailwind CSS 4, PostCSS (`@tailwindcss/postcss`)
  - UI/Utils: Radix UI, shadcn/ui, carousel, form validation with react-hook-form + zod
  - State Management: React hooks for form state and navigation
  - Scripts: `dev`, `build`, `start`, `lint`

### Folder Structure (High-level)

- `backend/`
  - `src/` → `app.module.ts`, `main.ts`, `user/` (controller/service), `prisma/prisma.service.ts`
  - `prisma/` → `schema.prisma`, `migrations/`
  - `generated/prisma/` → Prisma client output
- `frontend/`
  - `src/app/` → `layout.tsx`, `not-found.tsx`, `login/page.tsx`, `register/page.tsx`
  - `src/components/ui/` → Complete shadcn/ui component library (button, card, form, input, tabs, dialog, etc.)
  - `src/sections/` → `landing/` (Hero, Header, AnimatedBadge), `login/` (LoginForm, RegisterForm, AuthLayout)
  - `src/components/navigation/` → `GlobalNavigationOverlay.tsx`
  - `src/lib/utils.ts`, `src/styles/`

### Running Locally

- **Backend**: from `backend/`
  - `npm run start:dev`
- **Frontend**: from `frontend/`
  - `npm run dev`

### Progress Log

- 2025-08-16

  - Backend: Added Product model and user relation in Prisma schema. Upload Products from Seller dashboard and User credentials info in admin dashboard
  - Frontend: Dedicated seperation for seller and admin dasboard

- 2025-08-15

  - Backend: Implement for login/register
  - Frontend: Dashboard placeholder
  - Deployement

- 2025-08-14

  - Backend: set up NestJS, Prisma, PostgreSQL; created `User` model, migration, and `GET /users` endpoint.
  - Frontend: Making Login/Register Page and role selection and adding Global loading overlay

- 2025-08-13
  - Frontend: set up Next.js App Router, Tailwind 4, global layout, 404 page.

### Log Template (copy/paste)

- YYYY-MM-DD
  - What I built/changed:
  - Why it matters:
  - Follow-ups/TODOs:
