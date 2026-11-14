# Step 6 — release beta and device QA

**Status:** release preflight, accessibility improvements, JavaScript render-error recovery and a device QA plan are implemented. Signed binaries, physical QA and store beta distribution are blocked by missing toolchains, signing material, devices and store accounts.

## Release preparation completed

- `mobile/scripts/check-beta.mjs` validates the public HTTPS URL, matching native link domains, platform toolchain and signing inputs without printing credentials. Run `npm run beta:check:android` or `npm run beta:check:ios` from `mobile`.
- `npm run beta:bundle:android` runs that preflight before Gradle, preventing an attempted release bundle with incomplete local signing configuration.
- Android release Gradle configuration reads upload keystore path, passwords, alias and version from environment/project properties. iOS project has an Associated Domains entitlement, but needs an Apple signing team and a Mac archive.
- Android hardware Back now leaves camera AR or Saved designs cleanly. A top-level React error boundary offers a return to catalogue after a JavaScript render error. Native process crashes still require a fresh launch and native crash logs.
- Catalogue category controls, product actions, saved-design actions and AR rotation controls have explicit accessibility labels. Category and saved-design actions have at least 44-point touch height. VoiceOver and TalkBack acceptance remains a device task.
- The ten bundled GLBs total about 17.1 MB. Actual installed size, memory and thermal behaviour are unmeasured.

## Current preflight result

| Platform | Missing now |
|---|---|
| Android | Public HTTPS `WEB_BASE_URL`, matching `nesttLinkDomain`, JDK 17+, Android SDK, upload keystore and its four `NESTT_UPLOAD_*` values. No `java` or `adb` was found on this Windows machine. |
| iOS | Public HTTPS `WEB_BASE_URL`, matching `NESTT_LINK_DOMAIN`, Mac/Xcode/CocoaPods, and Apple signing team. iOS archives cannot be built on Windows. |
| Distribution | Google Play Console and App Store Connect app records, store URLs, beta tester groups, and account access. |

The Android bundle command was executed here and stopped at preflight with the eight missing inputs above; Gradle was not run. A user-scope JDK install was attempted through the package manager, which reported no applicable installer. No signing key was generated or stored in the repository.

## Build and beta distribution runbook

### Android

1. Confirm the final package ID `com.nesttroomar` before the first Play upload. Set the HTTPS website and link domain, install JDK/SDK, create and back up the upload keystore outside source control, then set the four `NESTT_UPLOAD_*` variables.
2. Run `npm ci`, then `npm run beta:bundle:android`. This checks release inputs before calling Gradle. Increase `NESTT_VERSION_CODE` for every upload. Keep the AAB and build log as release artifacts; do not commit them.
3. Create a Play Console internal test release and upload the signed AAB. With Play App Signing, use the **Play app-signing** SHA-256 certificate in the website's `assetlinks.json`; the upload-key fingerprint is a different certificate. Add tester accounts and confirm the opt-in link on a clean phone. [Android signing](https://developer.android.com/studio/publish/app-signing), [Play internal testing](https://support.google.com/googleplay/android-developer/answer/9845334).

### iPhone

1. On a Mac, set the HTTPS link domain, Apple Team ID, final bundle ID and unique build number. Run `npm ci`, `npx pod-install`, and `npm run beta:check:ios` after selecting the Xcode signing team.
2. Open `mobile/ios/NesttRoomAR.xcworkspace` in Xcode, archive the Release configuration for a physical iPhone, and validate the archive. Upload it to App Store Connect, then assign it to an internal TestFlight group. Confirm install and Universal Links on a clean iPhone. [Apple distribution](https://developer.apple.com/documentation/Xcode/distributing-your-app-for-beta-testing-and-releases), [TestFlight](https://developer.apple.com/testflight/).

## Physical device matrix to fill before accepting Step 6

Record the exact device, OS version, build number, result, screenshot/video and crash log for each run. Include at least one older and one newer supported phone per platform; the actual models depend on available ARCore and ARKit devices.

| Scenario | Android older | Android newer | iPhone older | iPhone newer |
|---|---|---|---|---|
| Clean store install, cold start, permissions | Pending | Pending | Pending | Pending |
| Product QR with app closed and running | Pending | Pending | Pending | Pending |
| Floor scan, preview, true-size check with a measured reference | Pending | Pending | Pending | Pending |
| Place 3 models; drag, rotate, undo, remove | Pending | Pending | Pending | Pending |
| Save, force-close, reopen on a new floor origin | Pending | Pending | Pending | Pending |
| Screenshot share and recipient browser preview | Pending | Pending | Pending | Pending |
| Tracking lost, model load failure, background/foreground | Pending | Pending | Pending | Pending |
| Camera denied, unsupported AR, 3D fallback | Pending | Pending | Pending | Pending |
| TalkBack/VoiceOver labels, focus order and large text | Pending | Pending | Pending | Pending |
| Ten-minute AR session: FPS, memory, battery and temperature | Pending | Pending | Pending | Pending |

For the ten-minute session, record median and worst sustained frame rate, peak memory, warm-up time and any thermal throttling. Investigate sustained frame rate below 30 FPS, visibly drifting furniture, app termination, missing camera frames or failed screenshot sharing before accepting a beta build. Use Android Studio/`adb` logs and Xcode Instruments/device logs; no production telemetry is configured in this static demo.

## Acceptance gate

Step 6 is complete only when both signed store beta builds are installed from Play internal testing and TestFlight, the matrix is filled with passing evidence, QR association works on clean and installed devices, and release blockers are resolved. The current code-level checks do not replace that gate.
