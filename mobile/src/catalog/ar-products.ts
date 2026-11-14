export type ARProduct = {
  id: string;
  slug: string;
  name: string;
  category: string;
  categorySlug?: string;
  description: string;
  dimensionsMm: [number, number, number];
  placement: 'floor' | 'wall' | 'ceiling';
  floorOffsetMeters: number;
  source: number | { uri: string };
  modelUrl?: string;
  variantId?: string;
  sku?: string;
  price?: string;
  inStock?: boolean;
  image?: string;
  scale: [number, number, number];
  color: string;
  glyph: string;
};

// Sample dimensions are [long horizontal footprint, short horizontal footprint, vertical height].
// Floor offsets negate the GLB's transformed minimum Y so its base meets the detected plane.
// Kept as static requires so Metro bundles the free GLB files.
export const arProducts: ARProduct[] = [
  { id: 'sofa', slug: 'sofa', name: 'Sofa 02', category: 'Sofa', description: 'Sample sofa model for room preview.', dimensionsMm: [1807, 818, 709], placement: 'floor', floorOffsetMeters: 0, source: require('../../assets/models/nestt/sofa_02.glb'), scale: [1, 1, 1], color: '#d8cec0', glyph: '▰' },
  { id: 'lounge-chair', slug: 'lounge-chair', name: 'Modern Arm Chair', category: 'Lounge chair', description: 'Sample lounge chair model for room preview.', dimensionsMm: [987, 820, 1023], placement: 'floor', floorOffsetMeters: 0, source: require('../../assets/models/nestt/modern_arm_chair_01.glb'), scale: [1, 1, 1], color: '#d1d9d2', glyph: '▟' },
  { id: 'coffee-table', slug: 'coffee-table', name: 'Modern Coffee Table', category: 'Coffee table', description: 'Sample coffee table for room preview.', dimensionsMm: [1202, 600, 390], placement: 'floor', floorOffsetMeters: 0, source: require('../../assets/models/nestt/modern_coffee_table_01.glb'), scale: [1, 1, 1], color: '#d8d5ce', glyph: '▱' },
  { id: 'side-table', slug: 'side-table', name: 'Side Table 01', category: 'Side table', description: 'Sample side table for room preview.', dimensionsMm: [550, 450, 551], placement: 'floor', floorOffsetMeters: 0.002, source: require('../../assets/models/nestt/side_table_01.glb'), scale: [1, 1, 1], color: '#e0d9cd', glyph: '◫' },
  { id: 'bookshelf', slug: 'bookshelf', name: 'Steel Frame Shelves', category: 'Storage', description: 'Sample shelving model for room preview.', dimensionsMm: [1097, 502, 2141], placement: 'floor', floorOffsetMeters: 0.0011, source: require('../../assets/models/nestt/steel_frame_shelves_01.glb'), scale: [1, 1, 1], color: '#d3d1cc', glyph: '▥' },
  { id: 'ceiling-lamp', slug: 'ceiling-lamp', name: 'Modern Ceiling Lamp', category: 'Lighting', description: 'Sample lamp model for room preview.', dimensionsMm: [432, 432, 952], placement: 'ceiling', floorOffsetMeters: 0, source: require('../../assets/models/nestt/modern_ceiling_lamp_01.glb'), scale: [1, 1, 1], color: '#ded7cd', glyph: '◉' },
  { id: 'potted-plant', slug: 'potted-plant', name: 'Potted Plant 01', category: 'Decor', description: 'Sample plant model for room preview.', dimensionsMm: [634, 587, 1350], placement: 'floor', floorOffsetMeters: 0.014, source: require('../../assets/models/nestt/potted_plant_01.glb'), scale: [1, 1, 1], color: '#d5dbcf', glyph: '♧' },
  { id: 'books', slug: 'books', name: 'Encyclopedia Book Set', category: 'Decor', description: 'Sample book set for room preview.', dimensionsMm: [551, 163, 237], placement: 'floor', floorOffsetMeters: 0, source: require('../../assets/models/nestt/book_encyclopedia_set_01.glb'), scale: [1, 1, 1], color: '#d9d1c9', glyph: '▤' },
  { id: 'ceramic-vase', slug: 'ceramic-vase', name: 'Ceramic Vase 02', category: 'Decor', description: 'Sample vase model for room preview.', dimensionsMm: [218, 218, 309], placement: 'floor', floorOffsetMeters: -0.001, source: require('../../assets/models/nestt/ceramic_vase_02.glb'), scale: [1, 1, 1], color: '#dfd9d1', glyph: '♜' },
  { id: 'wall-mirror', slug: 'wall-mirror', name: 'Ornate Mirror 01', category: 'Wall decor', description: 'Sample mirror model for room preview.', dimensionsMm: [486, 26, 744], placement: 'wall', floorOffsetMeters: 0, source: require('../../assets/models/nestt/ornate_mirror_01.glb'), scale: [1, 1, 1], color: '#d8d4cb', glyph: '▯' },
];

let activeProducts = arProducts;
export const setARProducts = (products: ARProduct[]) => { activeProducts = products; };
export const getARProducts = () => activeProducts;
export const getARProduct = (id: string) => activeProducts.find((product) => product.id === id || product.slug === id);
