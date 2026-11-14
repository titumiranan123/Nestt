# Step 3 — camera AR interaction

**Code status:** Implemented in the bare React Native app. **Acceptance status:** Requires physical Android ARCore and iPhone ARKit device runs before this step can be marked complete.

## Implemented

- The centre camera hit test renders a translucent GLB preview over a detected floor; the plane selector commits content at the customer's tap position. Small planes under 0.8 m and classified ceilings are ignored.
- Tracking state distinguishes initializing, normal, limited and unavailable. The screen shows guidance, Retry AR and a website 3D preview action when tracking is lost.
- Placed models report loading and failure events. Failed loads show Retry AR / 3D preview rather than a silent blank scene.
- An edit history supports Undo for add, drag, rotate and remove. Continuous drag updates are grouped using an inactivity window.
- The product tray and scene only permit floor assets; wall and ceiling samples remain 3D previews. The AR model size and base offset use the Step 2 asset audit.
- Unsupported AR hardware has a 3D preview action. Camera denial offers a shortcut to app settings. A design can only be saved after a plane is selected.

## Device acceptance checklist

Run on at least one ARCore Android phone and one ARKit iPhone, with the site reachable from the phone.

1. Cold launch from the catalogue and from `nestt://ar?asset=coffee-table`. Camera permission should appear only at AR entry. Denial should show a usable settings action.
2. Slowly scan a floor. A small surface should not report **FLOOR FOUND**. On a large surface, a translucent model should follow the centre hit point. Tap a highlighted area; the solid model should appear where tapped and stay in place as the phone moves.
3. Measure the coffee table's long axis against a 1.2 m reference and the shelf against roughly 2.14 m height. Reject an obviously wrong scale or a floating/sunken base.
4. Add at least three different floor models; tap to select, drag on the plane, rotate both ways, remove, and Undo each action. Check no duplicate or lost model after repeated drags.
5. Move through low light or temporarily obscure the camera. The limited/lost tracking message and Retry AR action should work; the design should remain recoverable when tracking returns.
6. Reopen a saved design and choose a fresh floor. Items should reappear relative to that new origin. Share should stay disabled until a floor is selected.
7. Open wall mirror or ceiling lamp. They should open 3D preview and should not be added to the floor tray.
8. Observe load failure and retry on a development build with a deliberately unavailable model source. The customer should see an error and a usable preview action.

## Environment needed

This Windows workspace has neither a Java installation nor Android SDK/platform tools available on PATH, and iOS builds require macOS/Xcode. Native execution and the device checklist therefore cannot be completed here. Set `WEB_BASE_URL` in `mobile/src/config.ts` to an HTTPS or LAN URL that the phone can reach for 3D fallback.

Reference API behaviour: [ViroARPlaneSelector](https://viro-community.readme.io/docs/viroarplaneselector), [ViroReact AR scene hit tests and callbacks](https://github.com/ReactVision/viro/blob/main/CHANGELOG.md).
