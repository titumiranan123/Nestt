export type ArAsset = {
  slug: string;
  name: string;
  category: string;
  description: string;
  fileName: string;
  dimensionsMm: [number, number, number];
  sourceId: string;
  sourceUrl: string;
  placement: "floor" | "wall" | "ceiling";
};

export const arAssets: ArAsset[] = [
  { slug: "sofa", name: "Sofa 02", category: "Sofa", description: "A sample sofa model for exploring a living room layout.", fileName: "sofa_02.glb", dimensionsMm: [1807, 709, 818], sourceId: "sofa_02", sourceUrl: "https://polyhaven.com/a/sofa_02", placement: "floor" },
  { slug: "lounge-chair", name: "Modern Arm Chair", category: "Lounge chair", description: "A sample lounge chair model for your room.", fileName: "modern_arm_chair_01.glb", dimensionsMm: [820, 1023, 987], sourceId: "modern_arm_chair_01", sourceUrl: "https://polyhaven.com/a/modern_arm_chair_01", placement: "floor" },
  { slug: "coffee-table", name: "Modern Coffee Table", category: "Coffee table", description: "Preview a coffee table model in 3D or AR.", fileName: "modern_coffee_table_01.glb", dimensionsMm: [600, 390, 1202], sourceId: "modern_coffee_table_01", sourceUrl: "https://polyhaven.com/a/modern_coffee_table_01", placement: "floor" },
  { slug: "side-table", name: "Side Table 01", category: "Side table", description: "A sample side table model for your room.", fileName: "side_table_01.glb", dimensionsMm: [550, 551, 450], sourceId: "side_table_01", sourceUrl: "https://polyhaven.com/a/side_table_01", placement: "floor" },
  { slug: "bookshelf", name: "Steel Frame Shelves", category: "Bookshelf", description: "Preview a bookshelf model in 3D or AR.", fileName: "steel_frame_shelves_01.glb", dimensionsMm: [1097, 2141, 502], sourceId: "steel_frame_shelves_01", sourceUrl: "https://polyhaven.com/a/steel_frame_shelves_01", placement: "floor" },
  { slug: "ceiling-lamp", name: "Modern Ceiling Lamp", category: "Lighting", description: "A sample lamp model for room visualization.", fileName: "modern_ceiling_lamp_01.glb", dimensionsMm: [432, 952, 432], sourceId: "modern_ceiling_lamp_01", sourceUrl: "https://polyhaven.com/a/modern_ceiling_lamp_01", placement: "ceiling" },
  { slug: "potted-plant", name: "Potted Plant 01", category: "Decor", description: "Preview a potted plant model in 3D or AR.", fileName: "potted_plant_01.glb", dimensionsMm: [587, 1350, 634], sourceId: "potted_plant_01", sourceUrl: "https://polyhaven.com/a/potted_plant_01", placement: "floor" },
  { slug: "books", name: "Encyclopedia Book Set", category: "Decor", description: "A sample decorative book set for room visualization.", fileName: "book_encyclopedia_set_01.glb", dimensionsMm: [551, 237, 163], sourceId: "book_encyclopedia_set_01", sourceUrl: "https://polyhaven.com/a/book_encyclopedia_set_01", placement: "floor" },
  { slug: "ceramic-vase", name: "Ceramic Vase 02", category: "Decor", description: "Preview a ceramic vase model in 3D or AR.", fileName: "ceramic_vase_02.glb", dimensionsMm: [218, 309, 218], sourceId: "ceramic_vase_02", sourceUrl: "https://polyhaven.com/a/ceramic_vase_02", placement: "floor" },
  { slug: "wall-mirror", name: "Ornate Mirror 01", category: "Wall decor", description: "Preview a wall mirror model in 3D or AR.", fileName: "ornate_mirror_01.glb", dimensionsMm: [486, 744, 26], sourceId: "ornate_mirror_01", sourceUrl: "https://polyhaven.com/a/ornate_mirror_01", placement: "wall" },
];

export function getArAsset(slug: string) {
  return arAssets.find((asset) => asset.slug === slug);
}

export function getArAssetUrl(asset: ArAsset) {
  return `/glb/${asset.fileName}`;
}
