# Nestt AR — React Native CLI app

This is a **bare React Native CLI** app for Android and iOS. It does not use Expo. ViroReact is manually linked in the native projects because the library does not support React Native autolinking.

## What is included

- Nestt-style product catalogue with 10 locally bundled free sample GLB models: eight floor AR models plus wall mirror and ceiling lamp 3D previews.
- QR deep-link entry using `nestt://ar?asset=coffee-table` (also accepts `product=`).
- Camera permission and ARCore/ARKit device-support checks.
- Horizontal floor detection and tap-to-place at the tapped point.
- Floor-model placement based on measured GLB bounds; tap an item to select, drag to move, rotate, add more items, or remove the selected item. Wall and ceiling placement are gated until their surfaces are implemented.
- Sample-model disclosure in the catalogue. These free models are not approved Nestt SKUs.
- Multiple named room designs saved locally, with reopen, rename and delete actions. Saving attempts an AR screenshot and keeps it in app storage.
- Share sheet sends the screenshot when available plus a link to a browser-based 3D layout preview.

## Requirements

- Node.js 22.11 or newer.
- Android: Android Studio, Android SDK, JDK 17, and a **physical ARCore-supported phone**. Viro AR is not supported on the Android emulator.
- iOS: macOS with Xcode and CocoaPods, plus a **physical ARKit-supported iPhone**. AR does not run in the iOS Simulator.

## Run on Android

From this directory, start Metro:

```sh
npm install
npm start
```

In another terminal, connect an ARCore-supported Android phone with USB debugging enabled, then run:

```sh
npm run android
```

## Run on iOS

On macOS, install native pods and launch on a connected iPhone:

```sh
npm install
npx pod-install
npm start
```

In another terminal:

```sh
npm run ios -- --device
```

## Test a QR deep link

The native app handles links in this form:

```text
nestt://ar?asset=coffee-table
nestt://room-planner
https://YOUR_DOMAIN/ar/coffee-table
https://YOUR_DOMAIN/room-planner
```

Supported `asset` values are the catalogue slugs: `sofa`, `lounge-chair`, `coffee-table`, `side-table`, `bookshelf`, `ceiling-lamp`, `potted-plant`, `books`, `ceramic-vase`, and `wall-mirror`. Production QR campaigns use the website's HTTPS product URL. With the app installed and link verification complete, the phone routes the same URL to the matching model in the app. Without the app, the website shows the 3D sample, store buttons when configured, and instructions to return to the same page after installing. The room-planner URL starts a sample coffee-table AR room; a shared layout link reopens its sample furniture after a new floor origin is selected. QR scanning does not silently carry product context through a store install; the customer returns to the page or scans again.

## App and API configuration

- Edit `src/config.ts` for the API and website URLs. For a physical Android phone, use the computer's LAN IP, for example `http://192.168.1.20:3001` and `http://192.168.1.20:3000`; `10.0.2.2` is for the Android emulator.
- The mobile AR demo currently uses the 10 bundled free GLB models and makes no backend requests. Room designs are saved on the phone with AsyncStorage, and screenshots in app document storage. Share links carry layout data in the URL and open the static web room planner. Anyone with a shared link can read the layout; the link contains no camera image or room map. The screenshot is attached separately by the phone's share sheet and is not hosted by Nestt.
- Set `WEB_BASE_URL` in `src/config.ts` to a reachable HTTPS website before sharing outside the computer. The default `http://localhost:3000` is only usable on the computer running the web app.
- Account, backend product catalogue, server-saved designs and cart/checkout are paused in this static demo. The Nest API endpoints and the additive migration at `../server/prisma/migrations/20261102000100_add_ar_catalog_design_and_cart` are available for the later integration phase.
- When the backend is ready, create products/variants with `POST /admin/products`, attach a model and verified `[width,height,depth]` millimetres with `PUT /admin/ar-assets/variants/:variantId`, then publish the matching product, variant and AR asset. The product AR catalogue endpoint is `GET /products/ar-catalog`.
- Set `nesttLinkDomain` in `android/gradle.properties` and `NESTT_LINK_DOMAIN` in the iOS Xcode build settings to the real HTTPS domain. Set `ANDROID_APP_ID`, `ANDROID_APP_SHA256_CERT_FINGERPRINTS`, `IOS_APP_ID`, and store URLs in the web environment before enabling production store links. The `.well-known` routes return association data only after these values are configured.
- Release Android signing uses `NESTT_UPLOAD_STORE_FILE`, `NESTT_UPLOAD_STORE_PASSWORD`, `NESTT_UPLOAD_KEY_ALIAS`, and `NESTT_UPLOAD_KEY_PASSWORD`; keep the keystore and passwords outside source control. iOS distribution requires the Apple team signing profile.

## Store release checklist

1. Install JDK 17 and Android Studio with the Android SDK / platform tools. Set `JAVA_HOME` and `ANDROID_HOME`; connect a physical ARCore phone for final camera and placement checks. Run `npm run beta:check:android` to see missing release inputs. On a Mac, run `npm run beta:check:ios` for the iPhone archive prerequisites.
2. Create the upload keystore with `keytool -genkeypair -v -keystore nestt-upload.keystore -alias nestt-upload -keyalg RSA -keysize 2048 -validity 10000`. Back it up securely; never commit the file or its passwords.
3. Set the four `NESTT_UPLOAD_*` signing variables, then build an Android App Bundle with `npm run beta:bundle:android`. This runs the preflight before Gradle. Output should be under `android/app/build/outputs/bundle/release/`.
4. Replace `nestt.example` with the final HTTPS host in `android/gradle.properties` and iOS `NESTT_LINK_DOMAIN`. Configure `ANDROID_APP_SHA256_CERT_FINGERPRINTS`, the real iOS Team ID + bundle ID, and both store URLs in the web deployment. Verify both `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` on that host.
5. On macOS, install CocoaPods, open `ios/NesttRoomAR.xcworkspace` in Xcode, set the Apple Team and distribution profile, then archive and upload the iOS build.
6. Submit the store listings, install each published build from its store, and scan the final HTTPS product QR on Android and iPhone. Confirm it opens the product in the camera AR screen; if the app is not installed, the landing page must show the correct store button.

The device test matrix and beta release runbook are in `../docs/step6-beta-release.md`. A JavaScript render error shows a return-to-catalogue screen; native AR process crashes require device logs and a fresh app launch.

## Remaining release validation

- GLBs currently include free sample models and sample dimensions, not verified Nestt SKUs. The customer catalogue displays database products only after the admin has created and published matching product variants and AR assets.
- Local save/reopen, camera screenshot capture code and layout preview sharing are implemented. Confirm screenshot contents and native share behaviour on physical Android and iPhone devices. Analytics dashboards, deferred after-install link recovery, final store listings and store submission still require deployment and app-store accounts.
- Verify dragging, floor placement, scale, login, checkout, link association and performance on real ARCore and ARKit phones. Windows can prepare Android builds but cannot run Xcode/CocoaPods for iOS.
