# Backend Architecture Overview

## Technology Stack

- **NestJS**: Main backend framework for building scalable server-side applications.
- **Prisma**: ORM for database access and management.
- **Supabase**: Provides authentication, storage, and real-time features.

---

## Backend Flow

1. **Client Request**: The frontend sends HTTP requests (REST or GraphQL) to the NestJS backend.
2. **NestJS Controller**: Receives the request, validates input, and calls the appropriate service.
3. **NestJS Service**: Contains business logic. Interacts with Prisma for database operations and Supabase for authentication/storage.
4. **Prisma ORM**: Handles database queries, mutations, and transactions.
5. **Supabase Integration**:
   - **Authentication**: User login/register flows use Supabase Auth.
   - **Storage**: Product images or files are uploaded to Supabase Storage.
   - **Real-time**: Optionally, product or order updates can use Supabase's real-time features.
6. **Response**: NestJS sends the processed response back to the client.

---

## Connections & Integrations

- **NestJS <-> Prisma**: Prisma Client is injected into NestJS services for database access.
- **NestJS <-> Supabase**: Supabase client SDK is used in NestJS services for authentication, storage, and real-time features.
- **Prisma <-> Database**: Prisma connects to the underlying database (e.g., PostgreSQL) defined in `schema.prisma`.
- **Supabase <-> Database**: Supabase manages its own PostgreSQL instance for auth and storage, but can be used alongside your main database.

---

## Example Flow: Product Creation

1. User submits product form (frontend).
2. NestJS controller receives request, validates data.
3. Service uploads product image to Supabase Storage.
4. Service creates product record in database via Prisma.
5. Service returns success response to frontend.

---

## Notes

- Use environment variables for Supabase and database credentials.
- Ensure proper error handling and validation in controllers/services.
- For advanced features (e.g., order tracking, notifications), consider using Supabase real-time or external services.
