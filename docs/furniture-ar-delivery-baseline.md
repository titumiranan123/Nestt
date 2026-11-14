# Nestt furniture AR — delivery baseline and step gates

**Stage:** Step 1 requirements approved; Step 2 asset and native AR foundation completed in `glb-ar-foundation-audit.md`; Step 3 code implemented with physical-device acceptance still pending in `step3-ar-interaction.md`; Step 4 local design/share code implemented with physical-device acceptance still pending in `step4-local-design-share.md`; Step 5 QR/install journey code implemented with production-domain and physical-device acceptance pending in `step5-qr-install-journey.md`; Step 6 beta preparation is in progress and signed builds/device acceptance are pending in `step6-beta-release.md`. Step 7 production commerce integration is deferred by the customer; keep the mobile app in static sample mode until approved products, models and backend activation are provided.

## Confirmed direction

- Build one customer app for Android and iPhone with bare React Native CLI and native ARKit/ARCore through ViroReact. Expo is out of scope.
- The first usable version runs with the 10 free GLB assets already bundled in `mobile/assets/models/nestt` and `web/public/glb`. It does not depend on the unfinished NestJS backend.
- A customer can enter from a product QR or the app catalogue, grant camera access, scan a room surface, place furniture at verified physical size, drag, rotate, add more pieces, remove pieces, save a layout, reopen it, and share it.
- The website remains the install landing page and a 3D preview for recipients. The app provides live camera AR. The same HTTPS QR URL must reach the right product after the app is installed; the store path must explain how to return to that product until after-install link recovery is available.
- A later production phase must replace samples with approved Nestt product models, accurate SKU and price data, account storage, cart/checkout, store listings, and analytics. Backend integration starts only when the customer says it is ready.

## Customer flows and acceptance

| Flow | Required outcome | Acceptance evidence |
|---|---|---|
| Product QR, app installed | Opens the matching product in the app; one tap enters camera AR | Scan a real QR on Android and iPhone with the app closed and open |
| Product QR, app absent | Landing page shows the right product and correct platform store action | Scan on a clean device; after install the product can be reopened from the landing page |
| Direct app entry | Browse 10 sample models and start AR from a model | All 10 have a thumbnail/name, dimensions and clear sample label |
| AR entry | Check AR capability, request camera permission and guide floor scanning | Supported, unsupported and denied-permission paths each have a usable screen |
| Placement | Show a placement preview, commit on a detected compatible surface, then keep true size while the phone moves | A measured reference object and at least three placed models on each platform |
| Editing | Select, drag on the surface, rotate, add, remove and undo an accidental action | Item stays on the intended surface; controls work without duplicate gestures |
| Save and reopen | Store multiple named designs on the phone; reopening resets tracking and asks the customer to select a new room origin | Close/relaunch the app and reopen a design on both platforms |
| Share | Customer can share a screenshot and layout link; recipient opens a 3D preview without installing the app | Open the shared URL in a fresh browser and inspect the same item list and arrangement |
| Product handoff | In production, an AR item links to the exact approved SKU and cart action | SKU, dimensions and price match the source catalogue; no sample model is sold as a Nestt item |

## AR and model rules

1. Asset metadata uses a documented **width, height, depth** order in millimetres; AR transforms use metres. Measure each source GLB, validate orientation and pivot, and record its license. Never infer real scale from an unverified sample name.
2. Floor furniture uses horizontal planes. Wall mirrors require a vertical plane; ceiling fixtures require a ceiling-compatible placement method. Until those interactions are implemented and validated, label those models as 3D preview only in the AR catalogue.
3. Keep product scale locked during customer manipulation. Show a visible loading, tracking-lost and model-failed state. Provide an interactive 3D fallback when AR is unsupported.
4. A reopened layout is relative to a newly selected room origin. A share URL cannot recreate the sender's physical room anchors on another phone.
5. The camera image stays on device unless the customer explicitly saves or shares a screenshot. A share URL containing layout data is readable by anyone who has it; it must not contain camera frames or a room map.

## Implementation gates — ask before starting each next step

1. **Requirements baseline (this document):** scope, customer flows, acceptance and known dependencies are written down.
2. **Asset and native AR foundation:** audit all 10 GLBs, dimensions, surface type and native configuration; fix incorrect scale/orientation and define floor, wall and ceiling behaviour. Complete when each asset has measured metadata and the code enforces the right surface rule; physical-device acceptance is recorded in Steps 3 and 6.
3. **Camera AR interaction:** placement preview, stable hit-test placement, drag/rotate/add/remove/undo, tracking/error states and 3D fallback. Complete only after the device acceptance flows pass.
4. **Local design and share:** multiple named local designs, save/reopen, screenshot, share preview and privacy copy. Complete when a fresh browser reproduces a shared design.
5. **QR and install journey:** HTTPS app links/universal links, product context and store landing behaviour. Complete on clean and installed Android/iPhone devices.
6. **Release beta:** signed Android and iOS builds, device/performance matrix, accessibility, crash recovery and store beta distribution.
7. **Production commerce integration (when backend is ready):** approved SKU assets, account migration, cart/checkout and consent-based analytics. Complete when product and order data match the backend.

**Step 7 decision (2026-11-02):** The customer chose to keep the static sample app. A read-only database check found 0 products, 0 variants and 0 AR assets. No production SKU mapping, backend connection, schema migration, checkout activation or analytics collection should be performed yet.

## Current implementation gaps found in Step 1

- The React Native app has static models, camera entry, floor selection, drag/rotate/remove and local design links; these interactions have not been validated on physical Android and iPhone devices.
- The AR scene only selects horizontal planes. It currently offers wall mirror and ceiling lamp alongside floor objects.
- Dimensions are presented as real size, but the GLB measurement and width/height/depth convention have not been verified against the object transforms.
- Local save and a layout URL exist. Screenshot sharing, named design editing, undo, placement preview and 3D fallback are not complete.
- Store URLs, production HTTPS domain, signing and on-device QR install/open verification are pending. The development `WEB_BASE_URL` is `localhost` and must be replaced for a physical phone or public link.
- Account, SKU/catalogue, cart/checkout and analytics are deliberately paused while the backend is unfinished.

## Decisions needed before public launch

- Which production HTTPS domain and app store accounts will be used?
- Will wall and ceiling models be supported in the first beta, or shown as 3D previews until their surface interaction is ready?
- Which Android phones and iPhones are available for physical acceptance checks?
- Who approves final product dimensions, 3D models, licensing and SKU mapping?
