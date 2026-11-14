# Step 2 — GLB and native AR foundation audit

**Date:** 2 November 2026  
**Scope:** 10 free Poly Haven GLBs in both the React Native bundle and the website. This does not certify a Nestt product's commercial dimensions.

**Result:** Step 2 code and asset audit complete. All 10 GLB headers and lengths are valid; both copies match by SHA-256. Mobile TypeScript and web production build passed. Mobile lint has six existing warning-level findings. Native compilation and physical-device placement remain for the later device acceptance steps.

## Method

Read each GLB's glTF JSON, walked the selected scene hierarchy, applied node transforms to each mesh POSITION accessor box, and measured its world-space bounds in metres. The mobile and web GLB copies have matching SHA-256 hashes for all 10 files. Source/license records are in `web/public/glb/README.md`. The original shelf GLB measured 10974 × 21405 × 5021 mm, so a 0.1 root scale was added to both copies.

`dimensionsMm` in the mobile static sample catalogue means **longer horizontal footprint × shorter horizontal footprint × vertical height**. The website's asset metadata is **model X × Y × Z** for its Three.js fitter. Neither is the backend's future width × height × depth contract. AR scene units are metres. Model origin offset is derived from the transformed minimum Y; floor items use `positionY = -minimumY`. The normalized GLBs all use app scale 1.

| Sample | GLB X × Y × Z (mm) | AR scale | Sample footprint × height (mm) | Placement | Floor origin offset (m) |
|---|---:|---:|---:|---|---:|
| Sofa | 1807 × 709 × 818 | 1 | 1807 × 818 × 709 | Floor | 0 |
| Arm chair | 820 × 1023 × 987 | 1 | 987 × 820 × 1023 | Floor | 0 |
| Coffee table | 600 × 390 × 1202 | 1 | 1202 × 600 × 390 | Floor | 0 |
| Side table | 550 × 551 × 450 | 1 | 550 × 450 × 551 | Floor | +0.002 |
| Steel shelves | 1097 × 2141 × 502 | 1 | 1097 × 502 × 2141 | Floor | +0.0011 |
| Ceiling lamp | 432 × 952 × 432 | 1 | 432 × 432 × 952 | Ceiling | — |
| Potted plant | 587 × 1350 × 634 | 1 | 634 × 587 × 1350 | Floor | +0.014 |
| Books | 551 × 237 × 163 | 1 | 551 × 163 × 237 | Floor | 0 |
| Ceramic vase | 218 × 309 × 218 | 1 | 218 × 218 × 309 | Floor | −0.001 |
| Wall mirror | 486 × 744 × 26 | 1 | 486 × 26 × 744 | Wall | — |

Measurements are rounded to the nearest millimetre. The source furniture is Y-up. The sofa's origin is at its base; the mirror spans roughly −411 to +333 mm around its vertical origin. The lamp starts roughly 221 mm above its origin. These last two are not placed on a floor plane.

## Enforced behaviour

- Mobile floor AR and its product tray accept only assets marked `floor`. The scene checks placement again before rendering a model.
- The wall mirror and ceiling lamp remain in the catalogue and open the website 3D viewer. They are labelled as previews rather than being placed on the floor. The web viewer disables its AR button for those assets.
- The shelf GLB carries a 0.1 root scale, so both mobile and web render it at the intended sample size. Floor model Y uses its measured base offset, rather than half its height. Product cards state footprint and height explicitly.
- Opening an old local design filters out wall/ceiling items from floor AR. The next stage will add appropriate vertical/ceiling placement if that interaction is approved.

## Native configuration review

- Android manifest declares CAMERA, optional camera/ARCore support and URL intent filters. `settings.gradle`, `build.gradle` and `MainApplication.kt` include ViroReact native modules and the AR package.
- iOS Podfile includes ViroReact/ViroKit, Info.plist explains camera use and the project has app link entitlements.
- The configuration follows the [ViroReact bare React Native integration guide](https://viro-community.readme.io/docs/integrating-viroreact-with-react-native-no-expo). Native compilation and device rendering still require Android JDK/SDK or macOS/Xcode and supported physical devices. Those are acceptance tasks in the later device steps.

## Remaining for production assets

Each Nestt SKU needs an approved model, measured product dimensions, documented axis/pivot, placement mode, license, thumbnail, version, and performance budget. The 10 CC0 samples are only an AR demonstration set.
