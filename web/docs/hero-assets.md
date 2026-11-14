# Home page hero assets

The hero uses editable TypeScript/React markup and Tailwind utilities. No page or section is embedded as an SVG or flattened screenshot.

- `public/assets/hero/quality-living-room.webp`: a reconstructed photographic background based on the supplied Figma PNG. Created with the built-in image generation tool, then converted to WebP. It is a close reconstruction, not an original Figma image export.
- `public/assets/hero/living-room-preview.webp`: the small preview photograph extracted from the supplied PNG. The interactive preview control is rendered in React.
- `output/hero-desktop.png`: verified desktop implementation at the reference width.

## Background generation prompt

Use case: precise-object-edit. Edit target: the furniture website screenshot hero crop. Produce only the clean photographic background, preserving the scene and camera framing in an 8:5 landscape composition. Remove all interface text, logo, navigation, buttons, pagination, and the bottom-right inset thumbnail. Reconstruct the photo behind them. Preserve the cognac leather sofa, teal pillows, wooden coffee table with white bowl and black sculpture, framed artwork with an orange circle and tree, pendant, side furniture, curtains, and rug. Preserve the dark exposure and muted color grading. No text, logo, watermark, borders, or interface elements.

## Interaction scope

The pagination changes between three locally available room photographs and supports arrow keys and touch swipes. The thumbnail opens a room-photo preview, not a video player. Shop Now navigates to the existing recommended-products section. Try AR navigates to the existing furniture-experience section; true augmented reality still requires product-specific 3D models and an AR viewer.
