# Nestt server authentication

NestJS authentication with PostgreSQL/Prisma, Zod request validation, Argon2id password hashing, six-digit email/SMS challenges, and signed access and rotating refresh JWTs. No `class-validator` or `class-transformer` is used.

## Architecture and trade-offs

- `AuthController` owns HTTP routes and Zod parsing. `AuthService` owns account flows. `AuthRepository` owns Prisma queries and transactions. `OtpService`, `TokenService`, and `AuthCrypto` isolate OTP, token, and cryptographic work. `MailService` and `SmsService` are separate provider adapters.
- Email signup creates a pending user; password login is disabled until the email code and signup password are verified. Requiring both prevents a pre-registration attacker from choosing a password that becomes active when the real email owner clicks the link. Phone OTP verification signs in an existing phone user or creates one. A signed-in user can link a new email or phone only after proving possession. Email linking also sets a password so the new email works for login.
- OTPs are six digits, expire after 10 minutes, allow five incorrect guesses, are HMAC-hashed at rest, and are consumed atomically from Redis. New requests replace older codes. Redis TTL-backed atomic counters cap sends and verification attempts by target and IP.
- Access JWTs last 15 minutes; refresh JWTs last 30 days and rotate on use. Redis stores HMAC-hashed refresh tokens and active access-token IDs with TTLs. Protected requests check Redis, so logout, rotation, password reset, role changes, and account deactivation revoke access immediately. Reuse of a rotated refresh token revokes its session family.
- Email and phone are unique columns. If a customer has already created separate accounts with both identifiers, linking returns `409`; account merging needs a separate, support-reviewed flow. This prevents accidental account takeover.
- SMTP and Twilio are configured through environment variables. Public email request endpoints return generic responses even when an address does not exist or email delivery fails; delivery failures are logged. SMS delivery failure returns `503`, so callers can retry. Provider delivery is synchronous; a durable outbox is the next step if guaranteed delivery during provider outages is required.

## Folder structure

```text
prisma/
  schema.prisma
  migrations/
  seed.ts
prisma.config.ts
src/
  config/                       Zod environment validation and app/database/JWT/Redis config
  common/guards/                JWT access guard
  common/pipes/                 Zod validation pipe
  database/                     Prisma module and service
  modules/
    auth/                       Routes, service, repository, DTO schemas
      services/                 OTP, token, and crypto services
    users/                      User module extension point + addresses/
    products/                   Product module extension point + variants/
    categories/ inventory/ cart/ wishlist/ orders/
    payments/ shipping/ coupons/ reviews/ notifications/ uploads/ admin/
  providers/
    mail/                       SMTP adapter
    sms/                        Twilio adapter
    payment-gateway/ storage/   Integration extension points
test/                           HTTP contract tests
```

The order module supports authenticated checkout, order tracking, cancellation, returns, and management endpoints. Each order has one payment record; SSLCommerz attempts and COD cash collection are recorded as transactions under that payment. Gateway checkout processing remains a separate integration. Reusable addresses reference a Thana and order/address text is snapshotted; delivery fees resolve from Division → District → Thana, with optional zone-level defaults.
Swagger is available at `/docs` in non-production environments by default. Set `SWAGGER_ENABLED=false` to disable it locally; production defaults to disabled.

## Database schema

| Model                                            | Key fields                                                                                                        | Purpose                                                         |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `User`                                           | `name`, optional unique `email`/`phone`, `role`, `status`, verification timestamps, `passwordHash`, `authVersion` | Customer identity with access status and optional login methods |
| `Permission`, `RolePermission`, `UserPermission` | permission keys/actions/resources and grants                                                                      | Role and user permission assignments                            |
| `AuditLog`                                       | actor/target, action, resource, old/new JSON                                                                      | Security and administrative audit records                       |

## Setup

1. Copy `.env.example` to `.env` and replace every placeholder. Use independent random secrets of at least 32 characters. Generate `PAYMENT_CONFIG_ENCRYPTION_KEY` with `openssl rand -hex 32`; changing or losing this key makes existing gateway credentials impossible to decrypt. Payment configuration endpoints require an active `ADMIN` or `SUPER_ADMIN` account. Set `APP_BASE_URL` to the client site that handles `/verify-email`; it must collect the signup password and POST the email, code, and password to the verification endpoint. Set `TRUST_PROXY_HOPS` only to the number of trusted reverse proxies in front of the server. Configure `REDIS_URL` for the shared Redis instance used by OTP challenges, rate limits, and token sessions. Keep Redis persistence enabled and avoid eviction of auth keys.
   For the local Nestt setup, run the Next.js storefront at `http://localhost:3000` and the Nest API at `http://localhost:3001`; configure the web app's `BACKEND_API_URL` to `http://localhost:3001` and restart it after changing `.env.local`.
2. Create a PostgreSQL database matching `DATABASE_URL`.
3. Run `yarn install`, `yarn prisma:generate`, and `yarn prisma:migrate`. For local manual testing, set `SEED_DEMO_EMAIL` and `SEED_DEMO_PASSWORD`, then run `yarn prisma:seed`; the script refuses to seed in production.
4. Run `yarn build` and `yarn start:prod` (or `yarn start:dev` locally).

To seed development accounts for `SUPER_ADMIN`, `ADMIN`, `MANAGER`, and `SUPPORT` in one command, set `SEED_ROLE_PASSWORD` (at least 12 characters) and run `yarn prisma:seed:roles`. The command refuses to run when `NODE_ENV=production`.

To seed the role permission catalog and role grants in a development database, run `yarn prisma:seed:permissions`. It creates permission entries for the admin panel resources/actions, synchronizes grants for `SUPER_ADMIN`, `ADMIN`, `MANAGER`, and `SUPPORT`, and leaves `CUSTOMER` grants untouched. It refuses to run when `NODE_ENV=production`.

To seed SEO metadata for the live storefront routes plus `robots.txt` and `sitemap.xml`, set `APP_BASE_URL` to the public storefront origin and run `yarn prisma:seed:seo`. The idempotent seed uses the configured site origin for canonical links and sitemap URLs and refuses to run in production.

The app validates required environment variables at startup and refuses example secrets or a non-HTTPS client URL in production. Protect the secret variables in your deployment system and use TLS for the API and database connection.

## API

All bodies are JSON. Phone numbers use E.164 format such as `+8801712345678`. Codes are six-digit strings. Protected routes require `Authorization: Bearer <accessToken>`.

| Method | Route                             | JSON body                                                                  | Result                                                                                 |
| ------ | --------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| POST   | `/auth/email/signup`              | `{email,password}`                                                         | `202`, verification sent when eligible                                                 |
| POST   | `/auth/email/resend-verification` | `{email}`                                                                  | `202`                                                                                  |
| POST   | `/auth/email/verify`              | `{email,code,password}`                                                    | Verified public user                                                                   |
| POST   | `/auth/email/login`               | `{email,password}`                                                         | User and access/refresh tokens                                                         |
| POST   | `/auth/email/forgot-password`     | `{email}`                                                                  | `202`, generic response                                                                |
| POST   | `/auth/email/reset-password`      | `{email,code,password}`                                                    | Password changed; sessions revoked                                                     |
| POST   | `/auth/phone/request-otp`         | `{phone}`                                                                  | `202`, SMS sent                                                                        |
| POST   | `/auth/phone/verify-otp`          | `{phone,code}`                                                             | User and access/refresh tokens                                                         |
| POST   | `/auth/link/email/request`        | `{email}`                                                                  | `202`, protected                                                                       |
| POST   | `/auth/link/email/verify`         | `{email,code,password}`                                                    | Linked user, protected                                                                 |
| POST   | `/auth/link/phone/request`        | `{phone}`                                                                  | `202`, protected                                                                       |
| POST   | `/auth/link/phone/verify`         | `{phone,code}`                                                             | Linked user, protected                                                                 |
| POST   | `/auth/token/refresh`             | `{refreshToken}`                                                           | Rotated access/refresh tokens                                                          |
| POST   | `/auth/logout`                    | `{refreshToken}`                                                           | Refresh token revoked                                                                  |
| GET    | `/auth/me`                        | —                                                                          | Current public user, protected                                                         |
| GET    | `/admin/payment-config`           | —                                                                          | Provider status and non-secret configuration; active `ADMIN` or `SUPER_ADMIN` required |
| PUT    | `/admin/payment-config/ssl`       | Provider fields; credential fields can be omitted to keep existing secrets | Save SSLCommerz settings                                                               |
| GET    | `/addresses`                      | —                                                                          | List the signed-in user's saved addresses                                             |
| POST   | `/addresses`                      | `label?, fullName, phone, thanaId, addressLine, postalCode?, isDefaultShipping?, isDefaultBilling?` | Save an address against the normalized Thana hierarchy                               |
| PATCH  | `/addresses/:id`                  | Any saved address fields                                                    | Update an address owned by the signed-in user                                         |
| DELETE | `/addresses/:id`                  | —                                                                          | Delete an address; existing order snapshots remain intact                            |
| POST   | `/orders`                         | `items, addressId` or `shippingAddress` including `thanaId`; `paymentMethod?` (`CASH_ON_DELIVERY` or `SSL_COMMERZ`) | Create an order and exactly one Payment record                       |
| GET    | `/orders/delivery-areas`          | —                                                                          | Delivery areas, districts, and thanas for checkout, protected                          |
| GET    | `/admin/orders/delivery-areas`    | —                                                                          | Configured delivery hierarchy                                                         |
| PUT    | `/admin/orders/delivery-areas`    | Division, district, thana, zone, fee, deliverability, free threshold        | Create or update a thana delivery fee                                                 |
| GET    | `/admin/orders/delivery-zones`    | —                                                                          | Zone-level default fees                                                              |
| PUT    | `/admin/orders/delivery-zones`    | Zone, flat fee, free threshold, estimated days, active/free flags           | Create or update zone-level default fee                                               |

The token response uses `accessToken`, `refreshToken`, `tokenType: "Bearer"`, and `expiresIn: 900` (seconds). `400` means invalid input, `401` invalid credentials/code/token, `409` identifier conflict, `429` rate limit, and `503` provider outage. Never log codes, passwords, tokens, or full request bodies.

### Blog content

Blog content is blog-only; there is no generic post/content type. Public routes return only `PUBLISHED` blogs. Blog list responses contain `items`, `total`, `page`, `limit`, and `pages`; optional query filters are `search`, `category` (category slug), `tag` (tag slug), `featured`, and `sort` (`newest`/`oldest`).

`blogs.content` is stored and returned as-is, with a 100,000-character maximum. The API does not sanitize HTML. The frontend should render content as text or sanitize it before rendering HTML; do not insert this field into the DOM as trusted HTML.

| Method              | Route                          | Access                | Purpose                                    |
| ------------------- | ------------------------------ | --------------------- | ------------------------------------------ |
| GET                 | `/blogs`                       | Public                | Published blog list and filters            |
| GET                 | `/blogs/categories`            | Public                | Visible blog categories                    |
| GET                 | `/blogs/tags`                  | Public                | Tags used by published blogs               |
| GET                 | `/blogs/:slug`                 | Public                | Published blog detail                      |
| GET                 | `/blogs/footer`                | Public                | Footer settings                            |
| GET                 | `/blogs/policies`              | Public                | Published policy content keys              |
| GET/POST            | `/admin/blogs`                 | `ADMIN`/`SUPER_ADMIN` | List and create blogs                      |
| GET                 | `/admin/blogs/:slug`           | `ADMIN`/`SUPER_ADMIN` | Read draft or published blog               |
| PUT/DELETE          | `/admin/blogs/:id`             | `ADMIN`/`SUPER_ADMIN` | Update or delete by ID                     |
| GET/POST/PUT/DELETE | `/admin/blog-categories[/:id]` | `ADMIN`/`SUPER_ADMIN` | Manage categories                          |
| GET/POST/PUT/DELETE | `/admin/blog-tags[/:id]`       | `ADMIN`/`SUPER_ADMIN` | Manage tags                                |
| GET/PUT             | `/admin/footer-settings`       | `ADMIN`/`SUPER_ADMIN` | Read and update footer settings            |
| GET/PUT             | `/admin/policy-settings`       | `ADMIN`/`SUPER_ADMIN` | Read and update allowlisted policy content |

## Checks

Run `yarn test`, `yarn test:e2e`, `yarn lint`, and `yarn build`. Unit tests cover validation, OTP attempts and replay, refresh reuse revocation, phone flow, rate limiting, and delivery cleanup. HTTP tests cover route validation and access protection without external services. The migration is generated and validated, but a live PostgreSQL/provider integration run requires deployment credentials.

Blog search keeps its existing case-insensitive substring behavior. The migration `20261028000500_add_blog_search_trigram_indexes` enables PostgreSQL `pg_trgm` and adds GIN trigram indexes for blog title, excerpt, and content; deployment databases must permit creating this PostgreSQL extension. The indexes improve substring search without adding an application dependency, at the cost of additional index storage and write work.
