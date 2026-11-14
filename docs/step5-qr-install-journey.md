# Step 5 — QR and install journey

**Status:** code and browser landing checks complete; production association and installed/clean-device acceptance pending.

## Customer paths

| Entry | App installed and verified | App absent |
|---|---|---|
| Product QR, for example `/ar/coffee-table` | Android App Link / iOS Universal Link opens the matching sample model. Floor models enter camera AR after capability and permission checks. Wall and ceiling models offer 3D preview. | HTTPS page shows the exact sample model, install buttons when store URLs are configured, and instructions to return to that page or rescan after installing. |
| Hero → `/room-planner` | App link starts camera AR with a sample coffee table and lets the customer add more floor models. | Web room planner opens. Its app button and store links explain how to continue. Desktop QR opens a new room on the phone. |
| Shared layout URL | The app restores supported floor samples relative to a newly selected floor origin. | Web browser displays the static 3D layout; its app button can carry the current layout into the app. |

The actual Oslo product page links to the sample room designer with a disclosure. No sample GLB is presented as an exact Oslo SKU.

## Implemented configuration

- Android manifest declares verified HTTPS `/ar/*` and `/room-planner` links plus `nestt://` manual launch links. The app receives warm and cold links through React Native Linking.
- iOS has an Associated Domains entitlement and AppDelegate forwarding for custom URL schemes and Universal Links.
- The website serves `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` when actual app IDs and signing data are configured. They return 503 while unconfigured, so an incomplete association is not presented as valid.
- QR codes contain the HTTPS landing page, not an app-only scheme. A customer without the app can therefore see the model and install path.
- The install path is a return-to-page flow. Automatic recovery of the original product after a store install needs a separately approved deferred-link service or platform-specific install attribution and is not claimed here.

## Production values required

1. Deploy the web app on the final public HTTPS host. Set Android `nesttLinkDomain` in `mobile/android/gradle.properties` and iOS `NESTT_LINK_DOMAIN` in Xcode build settings to that exact host. Set mobile `WEB_BASE_URL` to the same HTTPS origin.
2. Set web `ANDROID_APP_ID` to the final Android application ID and `ANDROID_APP_SHA256_CERT_FINGERPRINTS` to the installed build's signing SHA-256 fingerprint. For Play App Signing, use the Play app-signing certificate fingerprint. Set `IOS_APP_ID` to the actual Apple Team ID plus bundle ID.
3. After the store listings exist, set `ANDROID_STORE_URL` and `IOS_STORE_URL` on the web deployment. Until then, the pages state that install links are unpublished.
4. Serve both association files over HTTPS without redirects and with JSON content type. Verify the files on the public domain; localhost and LAN addresses do not verify as production app links.

## Checks performed here

- Mobile TypeScript and lint passed (lint has four existing CartScreen warnings and no errors). Web production build passed.
- Browser opened `/ar/coffee-table`: matching model title, manual app link, return-after-install instructions and QR were present. Browser opened `/room-planner`: app CTA contained the current sample layout, with floor Y values included.
- No JDK/Android SDK, macOS/Xcode, physical AR phones, public domain, signing fingerprints or store listings were available to complete native and production verification.

## Device acceptance

1. On a clean Android phone and iPhone, scan the same public HTTPS product QR. Confirm the exact landing page, appropriate store button and a usable path back to the same product after install.
2. Install a signed build. On Android, run `adb shell pm verify-app-links --re-verify com.nesttroomar` and `adb shell pm get-app-links com.nesttroomar`, then scan the QR from the camera and tap the link from another app. On iOS, verify the Associated Domains entitlement and open the link from an external app; Safari may keep a same-domain link in Safari.
3. Repeat with the app closed and already running. Confirm `coffee-table` opens that model, `/room-planner` opens a new room, and a shared layout restores its floor items.
4. Check a wall/ceiling model opens its 3D preview rather than attempting floor AR. Check unsupported AR and denied camera permission paths.
