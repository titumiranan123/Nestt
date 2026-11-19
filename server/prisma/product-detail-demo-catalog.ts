type Finish = { name: string; swatch: string };

export type DemoProduct = {
  slug: string;
  name: string;
  category: 'sofas-sectionals' | 'chairs-ottomans' | 'tables' | 'storage-cabinets' | 'beds-bedroom';
  room: string;
  price: number;
  dimensions: [width: number, depth: number, height: number];
  materials: string;
  description: string;
  features: [string, string, string];
  specs: Array<[label: string, value: string]>;
  care: Array<[title: string, description: string]>;
  assembly: { required: boolean; minutes: number; steps: [string, string, string] };
  finishes: [Finish, Finish];
  pairs: [string, string];
  whiteGlove?: boolean;
};

export const demoProducts: DemoProduct[] = [
  {
    slug: 'alder-tufted-loveseat', name: 'Alder Tufted Loveseat', category: 'sofas-sectionals',
    room: 'Living room', price: 62500, dimensions: [1807, 818, 709], materials: 'Leather upholstery, foam cushioning and timber trim',
    description: 'A compact two-seat sofa with deep button tufting, curved timber trim and a low back that keeps sightlines open. Its defined silhouette anchors a small sitting room or a reading corner.',
    features: ['Deep button tufting across the back and seat', 'Curved timber trim and rolled arms', 'Compact two-seat footprint for shorter walls'],
    specs: [['Configuration', 'Two seats'], ['Back profile', 'Low, button-tufted'], ['Base', 'Shaped timber feet']],
    care: [['Upholstery', 'Dust with a soft dry cloth and blot spills with a clean absorbent cloth. Use a leather care product only after testing it in a hidden spot.'], ['Timber trim', 'Wipe with a dry microfibre cloth and keep clear of standing water.'], ['Placement', 'Keep out of strong direct sunlight and away from heaters.']],
    assembly: { required: false, minutes: 10, steps: ['Remove all transit wrapping and locate the label beneath the seat.', 'Ask a second person to lift the sofa into place by its base.', 'Check that all feet touch the floor and add suitable floor protectors if needed.'] },
    finishes: [{ name: 'Charcoal Brown', swatch: '#403a31' }, { name: 'Deep Merlot', swatch: '#543039' }],
    pairs: ['mora-coffee-table', 'nora-side-table'], whiteGlove: true,
  },
  {
    slug: 'linden-lounge-chair', name: 'Linden Timber Lounge Chair', category: 'chairs-ottomans',
    room: 'Living room', price: 29800, dimensions: [820, 987, 1023], materials: 'Timber frame and dark leather cushions',
    description: 'The Linden pairs an exposed timber frame with a generous upholstered seat and tall back cushion. Set it beside a low table to make a reading spot with a small footprint.',
    features: ['Exposed angular timber frame', 'Separate seat and back cushions', 'Open arms keep the profile light'],
    specs: [['Configuration', 'Single seat'], ['Arm style', 'Open timber arms'], ['Back profile', 'Tall padded cushion']],
    care: [['Cushions', 'Brush dust from the seams with a soft cloth and blot spills immediately.'], ['Wood frame', 'Use a lightly damp soft cloth and dry the surface straight away.'], ['Floor protection', 'Check felt pads periodically and replace worn ones.']],
    assembly: { required: false, minutes: 5, steps: ['Remove the wrapping and place the frame upright.', 'Set the seat and back cushions in place and align their edges with the frame.', 'Check that the legs sit evenly before use.'] },
    finishes: [{ name: 'Ink Black', swatch: '#30302f' }, { name: 'Blue Slate', swatch: '#303849' }],
    pairs: ['nora-side-table', 'linwood-open-bookcase'],
  },
  {
    slug: 'mora-coffee-table', name: 'Mora Stone-top Coffee Table', category: 'tables',
    room: 'Living room', price: 24500, dimensions: [1202, 600, 390], materials: 'Stone-look top with timber frame and geometric inlays',
    description: 'Mora sets a textured rectangular top within a warm timber frame. Angular inlays give the surface a point of interest while a low stance keeps books and drinks within reach from a sofa.',
    features: ['Rectangular top with a contrasting stone texture', 'Angular timber inlay details', 'Low profile pairs with lounge seating'],
    specs: [['Top shape', 'Rectangular'], ['Top finish', 'Textured stone effect'], ['Use', 'Coffee table or low living-room surface']],
    care: [['Stone surface', 'Use coasters under drinks and wipe spills promptly with a soft damp cloth.'], ['Inlays', 'Avoid acidic cleaners and sharp scrapers around the inset edges.'], ['Moving the table', 'Lift under the frame instead of pulling the top.']],
    assembly: { required: true, minutes: 20, steps: ['Set the top face down on a padded surface.', 'Attach the frame at the marked points with the supplied hardware, tightening evenly by hand.', 'With a second person, turn the table upright and check that all feet are level.'] },
    finishes: [{ name: 'Warm Oak', swatch: '#9a7148' }, { name: 'Smoked Stone', swatch: '#5a4d46' }],
    pairs: ['alder-tufted-loveseat', 'linden-lounge-chair'],
  },
  {
    slug: 'nora-side-table', name: 'Nora Open Shelf Side Table', category: 'tables',
    room: 'Living room or bedroom', price: 9500, dimensions: [550, 450, 551], materials: 'Timber frame and shelves',
    description: 'A simple top and two open shelves make room for a lamp, books and smaller household items. Nora fits by a chair, sofa or bed where a full cabinet would feel too large.',
    features: ['Two open lower shelves for books and small baskets', 'Compact rectangular footprint', 'Exposed timber grain on all three surfaces'],
    specs: [['Shelf count', 'Two lower shelves plus tabletop'], ['Top shape', 'Rectangular'], ['Footprint', 'Compact side-table format']],
    care: [['Everyday cleaning', 'Wipe with a soft dry or lightly damp cloth. Dry the surface after cleaning.'], ['Protect the finish', 'Use a coaster and avoid placing hot items directly on the timber.'], ['Shelf care', 'Distribute books evenly across the lower shelf.']],
    assembly: { required: true, minutes: 15, steps: ['Lay the top, both shelves and leg pieces on a soft surface.', 'Fit the shelves between the legs and start all fasteners before tightening.', 'Stand the table upright, tighten the fixings evenly and check for rocking.'] },
    finishes: [{ name: 'Golden Oak', swatch: '#a17450' }, { name: 'Slate Oak', swatch: '#716d57' }],
    pairs: ['linden-lounge-chair', 'elmstead-bed-frame'],
  },
  {
    slug: 'linwood-open-bookcase', name: 'Linwood Open Bookcase', category: 'storage-cabinets',
    room: 'Living room or home office', price: 32900, dimensions: [1097, 502, 2141], materials: 'Steel uprights and timber shelves',
    description: 'Five timber shelves held between slim steel uprights give Linwood an open, industrial profile. The tall frame provides visible storage without closing off the wall behind it.',
    features: ['Five open timber shelves', 'Slim steel frame with a small visual footprint', 'Open back for easy access to wall outlets'],
    specs: [['Shelves', 'Five open tiers'], ['Back panel', 'Open'], ['Installation', 'Freestanding frame with wall restraint']],
    care: [['Timber', 'Dust with a soft dry cloth and wipe away spills promptly.'], ['Steel', 'Wipe with a slightly damp cloth and dry to protect the finish.'], ['Loading', 'Place heavier items on lower shelves and inspect the wall restraint regularly.']],
    assembly: { required: true, minutes: 45, steps: ['Lay out the uprights and crossbars on a protected floor and build the frame loosely.', 'Fit the shelves and square the frame before tightening its connectors.', 'Level the unit and install a wall restraint appropriate for the wall before loading shelves.'] },
    finishes: [{ name: 'Honey Timber', swatch: '#b48f61' }, { name: 'Spiced Timber', swatch: '#9a643c' }],
    pairs: ['form-office-desk', 'harbor-drawer-cabinet'], whiteGlove: true,
  },
  {
    slug: 'briar-dining-chair', name: 'Briar Tufted Dining Chair', category: 'chairs-ottomans',
    room: 'Dining room', price: 14200, dimensions: [434, 576, 973], materials: 'Tufted leather upholstery and timber legs',
    description: 'A tailored, high-backed dining chair with a stitched upholstered seat and dark timber legs. The armless shape makes it easy to pull up to a small dining table.',
    features: ['Tufted high back with stitched upholstery', 'Armless silhouette for dining tables', 'Tapered timber legs'],
    specs: [['Configuration', 'One chair'], ['Arm style', 'Armless'], ['Back profile', 'Tall and tufted']],
    care: [['Leather', 'Remove loose dust with a dry cloth and blot spills before they reach the seams.'], ['Legs', 'Use a soft cloth and avoid soaking the timber around the joints.'], ['Floor protection', 'Use suitable pads on hard floors and lift when moving the chair.']],
    assembly: { required: false, minutes: 5, steps: ['Remove the sleeve and lift the chair by the seat frame.', 'Check the feet and fit compatible floor pads if needed.', 'Set it on a level surface and check that it sits evenly before use.'] },
    finishes: [{ name: 'Saddle Brown', swatch: '#79543b' }, { name: 'Roasted Umber', swatch: '#5f3427' }],
    pairs: ['ellis-round-dining-table', 'harbor-drawer-cabinet'],
  },
  {
    slug: 'harbor-drawer-cabinet', name: 'Harbor Drawer Cabinet', category: 'storage-cabinets',
    room: 'Dining room or home office', price: 48700, dimensions: [1141, 488, 1881], materials: 'Timber drawer fronts and shelves on a steel frame',
    description: 'Harbor brings open shelf space and four horizontal drawers together in a narrow steel frame. Keep frequently used objects within reach and store smaller items behind the timber fronts.',
    features: ['Four drawers alongside open shelves', 'Slim dark steel frame', 'Timber fronts show visible grain'],
    specs: [['Drawer count', 'Four'], ['Storage type', 'Open shelves and enclosed drawers'], ['Installation', 'Level floor and suitable wall restraint']],
    care: [['Shelves and fronts', 'Dust the timber with a soft cloth and absorb spills quickly.'], ['Drawer movement', 'Clear loose objects from the runners and close drawers gently.'], ['Safe loading', 'Store denser items low and open one drawer at a time.']],
    assembly: { required: true, minutes: 45, steps: ['Lay out the steel uprights and shelf supports with a second person.', 'Fit the shelves and drawer module, then check that drawers open freely.', 'Level the cabinet and secure its wall restraint before loading it.'] },
    finishes: [{ name: 'Amber Timber', swatch: '#b78c56' }, { name: 'Cocoa Timber', swatch: '#92623b' }],
    pairs: ['ellis-round-dining-table', 'linwood-open-bookcase'], whiteGlove: true,
  },
  {
    slug: 'elmstead-bed-frame', name: 'Elmstead Single Metal Bed Frame', category: 'beds-bedroom',
    room: 'Bedroom', price: 23800, dimensions: [905, 2002, 1201], materials: 'Paint-finished steel rails and wire platform',
    description: 'Tubular rails, a tall open headboard and a wire platform give Elmstead the look of a vintage single bed. Its slim silhouette leaves more wall and floor visible in smaller rooms.',
    features: ['Open tubular headboard and footboard', 'Wire platform supports a single mattress', 'Vintage paint finish with visible patina'],
    specs: [['Configuration', 'Single bed frame'], ['Platform', 'Steel wire mesh'], ['Included', 'Frame and platform only']],
    care: [['Steel finish', 'Use a dry or lightly damp cloth to clean the rails. Dry joints thoroughly.'], ['Platform', 'Remove dust from the mesh when changing bedding.'], ['Connections', 'Inspect the frame fasteners periodically and tighten any that feel loose.']],
    assembly: { required: true, minutes: 35, steps: ['Connect the side rails to the headboard and footboard on a protected floor.', 'Set the wire platform into the frame and tighten opposite corners evenly.', 'Confirm the platform sits flush and the frame is stable before fitting a mattress.'] },
    finishes: [{ name: 'Aged Ivory', swatch: '#ddd4c4' }, { name: 'Patina Blue', swatch: '#677d89' }],
    pairs: ['nora-side-table', 'harbor-drawer-cabinet'], whiteGlove: true,
  },
  {
    slug: 'ellis-round-dining-table', name: 'Ellis Round Dining Table', category: 'tables',
    room: 'Dining room', price: 28600, dimensions: [796, 796, 746], materials: 'Stained timber top and paneled pedestal with metal supports',
    description: 'Ellis has a compact round top with a paneled centre support and slender legs. It works as a breakfast table or a small informal dining spot.',
    features: ['Round top suits compact dining areas', 'Panelled pedestal frees the tabletop edge', 'Visible grain and antiqued finish'],
    specs: [['Top diameter', '796 mm'], ['Base style', 'Panelled pedestal with metal supports'], ['Suggested seating', 'Two dining chairs']],
    care: [['Tabletop', 'Use placemats and coasters, then dry the surface after wiping.'], ['Finish', 'Keep away from prolonged sun and avoid abrasive cleaners.'], ['Base', 'Check the fasteners periodically if the table is moved often.']],
    assembly: { required: true, minutes: 25, steps: ['Place the round top on a padded surface with its underside facing up.', 'Centre the pedestal and start each connection before tightening its fasteners.', 'Lift the table upright with help and check that it stands level.'] },
    finishes: [{ name: 'Antique Teak', swatch: '#795b3f' }, { name: 'Burnished Walnut', swatch: '#51372a' }],
    pairs: ['briar-dining-chair', 'harbor-drawer-cabinet'],
  },
  {
    slug: 'form-office-desk', name: 'Form Double-pedestal Desk', category: 'tables',
    room: 'Home office', price: 46500, dimensions: [2000, 947, 788], materials: 'Painted steel cabinet and worktop with metal drawer pulls',
    description: 'A wide industrial-style workstation with drawer pedestals on both sides and a central knee space. The vintage finish and tapered legs give a substantial desk a defined profile.',
    features: ['Wide worktop for a monitor and reference material', 'Drawer storage on both sides', 'Tapered legs and exposed metal pulls'],
    specs: [['Base', 'Double pedestal'], ['Drawer access', 'Front-facing pulls'], ['Worktop width', '2000 mm']],
    care: [['Worktop', 'Clean with a damp soft cloth and dry the surface afterwards.'], ['Drawer runners', 'Remove grit with a soft brush and check that papers clear the runners.'], ['Painted steel', 'Avoid strong solvents and abrasive pads on the finish.']],
    assembly: { required: true, minutes: 40, steps: ['Ask a second person to position the two pedestals on a level, protected floor.', 'Align the worktop with the marked mounting points and fasten it to both pedestals.', 'Check that the desk is level, all connectors are tight and drawers move freely.'] },
    finishes: [{ name: 'Foundry Grey', swatch: '#757372' }, { name: 'Foundry Teal', swatch: '#485f63' }],
    pairs: ['linwood-open-bookcase', 'briar-dining-chair'], whiteGlove: true,
  },
];
