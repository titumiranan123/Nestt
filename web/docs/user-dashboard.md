# Customer dashboard frontend

The six approved desktop concepts are implemented as responsive Next.js account routes. The storefront header links to `/account`; its shopping bag opens `/account?bag=1`. Saved Room Designs is intentionally excluded.

| Route                  | Features                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/account`             | Computed account statistics, next delivery, recent orders, default address and wishlist previews.                                                                      |
| `/account/orders`      | Status tabs, keyboard navigation, search, date filtering, pagination and buy again.                                                                                    |
| `/account/orders/[id]` | Item and payment summary, shipping address, delivery updates, printable sample invoice, eligible cancellation and item returns. Unknown orders have a recovery screen. |
| `/account/addresses`   | Add/edit/delete, validation, optional postal code, separate default shipping/billing addresses and automatic default reassignment.                                     |
| `/account/profile`     | Profile editing, dirty state, cancel edits, cleared verification after contact changes, security tab, password reset and leaving/resuming the demo.                    |
| `/account/wishlist`    | Remove/undo, sorting, empty state, product/finish selection, quantity, unavailable products and a shared bag drawer.                                                   |

## Data and scope

This is a complete **frontend preview**, not an authenticated customer portal. The visible demo notice is intentional. `lib/account/data.ts` contains fictional sample data and existing storefront image assets. `components/account/AccountProvider.tsx` owns the demo state, stored at `nestt.account.preview.v1` in localStorage. No credentials, passwords or session tokens are stored there. Private browsing, unavailable storage and incompatible saved data show a notice and fall back to a usable in-memory preview.

Changes to orders, returns, addresses, wishlist, bag and profile persist across refreshes on the same origin/browser. Leaving the demo does not revoke a server session or erase saved preview changes. The invoice is a printable sample document, not a tax invoice. The bag does not accept payments or perform checkout. Out-of-stock products cannot be added. Bag quantities are checked against demo stock across finishes.

The password reset dialog is the only live account-service integration added here. It calls the same-origin `/api/account/password-reset` route, which forwards only the existing public `auth/email/forgot-password` and `auth/email/reset-password` actions to `BACKEND_API_URL`. Without that server environment variable, it shows an unavailable message rather than a simulated success. Codes and passwords remain ephemeral form state and are cleared on success/unmount. Tests intercept this request and never send real verification emails.

## Connecting live accounts

The existing backend supplies authenticated `/auth/me`, `/orders`, order cancellation/returns, `/cart` and invoice download endpoints. The customer profile/address/wishlist APIs and a web customer session are not implemented in the existing backend/frontend contract. Before live use:

1. Establish the customer session and protected account routes. Prefer server-managed secure HttpOnly cookies. Do not use the preview flag as authentication.
2. Replace the provider's demo reads/mutations with authenticated requests, loading/error states and server validation. Map real UUIDs and server order snapshots; sample order codes are not backend UUIDs.
3. Implement customer-owned profile, address and wishlist contracts, including real verification and geography data.
4. Use real stock, shipping, payment/checkout, invoice and courier information. The server must enforce ownership, stock, cancellation and return policies.

Shared UI lives in `components/account`; routes are thin entry points. Account styling is scoped to `.account-app` and imports the existing Inter font. The header is reused. The account layout has `noindex, nofollow` metadata, modal focus containment via native dialogs, reduced-motion support, announced feedback and responsive tables/navigation.

## Checks

`npm run build` runs the Next.js production build and TypeScript checks. Browser flow checks live in `scripts/check-account.cjs`. They use an isolated browser context and cover all six routes at 1440, 768, 390 and 360px, image loading, overflow, filters, pagination, cancellations, returns, addresses, defaults, wishlist undo, bag stock/persistence, profile verification state, service failures and leaving/resuming the demo.

With the web app running on port 3005 and Chrome installed, an isolated test runtime can be used without changing this project's dependencies:

```powershell
npm install --prefix "$env:LOCALAPPDATA\NesttQa" playwright
$env:PLAYWRIGHT_MODULE = "$env:LOCALAPPDATA\NesttQa\node_modules\playwright"
$env:ACCOUNT_BASE_URL = 'http://localhost:3005'
node scripts/check-account.cjs
```

Screenshots and a successful run report are saved under `output/account-dashboard`. Automated accessibility scans with axe WCAG A/AA checks were also performed on all six default desktop pages. Automated scans do not replace manual assistive-technology testing.
