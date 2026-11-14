# Step 4 — local design and share

**Status:** implementation and a fresh-browser sample preview verified; physical Android/iPhone acceptance pending.

## Implemented customer flow

1. Arrange floor models in camera AR and enter a room name.
2. Save design: the app stores the layout in AsyncStorage and attempts a Viro screenshot. A successful image is copied from Viro's temporary location into app document storage. The layout still saves if capture fails.
3. Open Saved designs to view multiple rooms, reopen a room in AR, rename it, share it, or delete it. Reopening resets AR tracking and requires choosing a new floor origin; saved coordinates are relative to that new origin.
4. Share through the native share sheet. The app attaches the screenshot when available and sends a URL with the 3D layout. The web room planner reads that URL and displays the items and model links. Mobile rotations are converted from degrees to radians for the browser and back when the app opens a shared URL.

## Data and privacy

- The app saves up to 50 named designs locally. There is no backend request for these flows.
- Screenshots remain in app storage until shared or deleted. Viro captures its renderer; whether a device's output includes the camera background must be checked on each platform. No screenshot is uploaded by Nestt.
- The layout URL contains model identifiers, positions and rotations. Anyone with the URL can view it. It contains no camera frame or AR room map.
- The recipient's web page reconstructs the furniture layout in a generic 3D room; it does not reconstruct the sender's real room or physical anchors. The screenshot is shared as a separate attachment.
- `WEB_BASE_URL` currently defaults to `http://localhost:3000`, so remote recipients cannot open the link until a reachable HTTPS deployment is configured.

## Verification performed

- Mobile TypeScript (`npx tsc --noEmit`) passed.
- Mobile lint passed with four existing warnings in the unused Cart screen and no errors.
- Next.js production build passed, including `/room-planner` and the ten `/ar/[slug]` routes.
- A fresh browser opened a sample shared URL: one Sofa appeared in the item list, the 3D canvas mounted, `/ar/sofa` appeared as its model link, and the browser reported no console errors. This checks a sample link, not every device or a full multi-item comparison.

## Acceptance still needed on physical devices

1. On an ARCore Android phone and ARKit iPhone, save two named layouts, close/relaunch the app, reopen each, select a floor, and check positions.
2. Confirm screenshot file exists and visually shows the intended scene. Check capture while models are loading and when tracking is lost.
3. Share to a messaging app on both platforms. Confirm the image attachment and full URL survive, and open the URL in a fresh browser on a different device.
4. Compare all item counts, positions and rotations in the browser against the sender's layout; check the exact model preview links.
5. Rename and delete a design; confirm the deletion persists after relaunch and removes its local screenshot.

No Android SDK/JDK or macOS/Xcode plus connected AR phones were available in this workspace, so native builds and device acceptance could not be run here.
