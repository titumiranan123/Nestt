# NESTT customer dashboard PNG designs

Six desktop design boards following the existing web storefront. Saved Room Designs is excluded. Wishlist is the sixth page.

Each PNG includes a complete main page plus interaction detail panels at the bottom. The 20 detail panels show selected interaction states, dialogs, forms, validation and confirmations; they are not 20 additional full-page screenshots.

1. [Overview](01-overview.png) — Empty overview; active order tracking; quick account action.
2. [My Orders](02-my-orders.png) — Filter orders; no results; open order details.
3. [Order Details & Tracking](03-order-details-tracking.png) — Cancel an eligible pending order; request a return on a delivered order; return form; return confirmation. Cancellation and returns are separate lifecycle branches.
4. [My Addresses](04-my-addresses.png) — Add or edit an address; validation; saved confirmation and delete confirmation.
5. [Profile & Security](05-profile-security.png) — Edit details; verify email; change password; success confirmations.
6. [Wishlist](06-wishlist.png) — Choose options; add to bag; empty wishlist and remove/undo.

## Design system

- Reference: web/output/product-details-1440.png, web/app/globals.css, web/lib/fonts.ts and web/components/navigation/Navbar.tsx.
- White and cream #f7f5f1 backgrounds, charcoal #1c1b18, muted #76736d, thin #e5e0d8 borders, coral #e95f3d accents and red NESTT branding.
- Serif editorial headings from the existing product page with Inter-style UI text.
- Shared storefront header, account sidebar, active state, rectangular actions and warm furniture photography.
- English interface copy and BDT prices, matching the current storefront.
- All names, contact details, dates, orders and payment references are fictional illustration data.

## Flow

Overview -> My Orders -> Order Details & Tracking.
Wishlist -> Choose options -> Add to bag -> View bag.
My Addresses -> Add/edit -> Validate -> Save; delete is a separate confirmation action.
Profile & Security -> Edit -> Verify a changed contact -> Save; change password is a separate Security action.
Cancellation is available only for eligible pending orders. Returns belong to delivered orders. The lifecycle examples on the tracking board are alternative states.

## Files

Open index.html for a local gallery. PROMPTS.md records the complete prompts. Generated using the built-in Imagegen tool. Source application code has not been changed. These PNGs are design concepts, and not a working dashboard.

