# Product detail demo catalog

From `server`, run `npm run prisma:seed:product-details` against a migrated development database. Set `APP_BASE_URL` to the storefront URL so variant media, 3D models and guide links resolve from the browser. The default storefront URL is `http://localhost:3000`.

The seed upserts ten products with `demo-` slugs and two finish variants each. It creates any missing catalog categories and the Color attribute. It checks the bundled assets before opening a database transaction. The general product seed can be run independently.

Go to `/products/demo-alder-tufted-loveseat` for the first example. Each product has a dimensions image and a setup guide. Each variant has a main photo, a second angle, a GLB and a USDZ. The storefront serves these files from `web/public/assets/demo-catalog`.

Prices, stock, assembly details and guarantee terms are sample catalog data. The guarantee PDF is labeled for development use.

## Models and license

All base models are available from Poly Haven under [CC0](https://polyhaven.com/license). The demo GLBs center the model on the floor and include embedded textures. The alternate finish uses adjusted material colors from the same geometry. The USDZ and gallery images are derived from each variant's 3D model.

| Demo product | Source model | Artist |
| --- | --- | --- |
| Alder Tufted Loveseat | [Sofa 02](https://polyhaven.com/a/sofa_02) | Kirill Sannikov |
| Linden Timber Lounge Chair | [Modern Arm Chair 01](https://polyhaven.com/a/modern_arm_chair_01) | Vibrant Nordic |
| Mora Stone-top Coffee Table | [Modern Coffee Table 01](https://polyhaven.com/a/modern_coffee_table_01) | Amin |
| Nora Open Shelf Side Table | [Side Table 01](https://polyhaven.com/a/side_table_01) | James Ray Cock |
| Linwood Open Bookcase | [Steel Frame Shelves 01](https://polyhaven.com/a/steel_frame_shelves_01) | James Ray Cock |
| Briar Tufted Dining Chair | [Dining Chair 02](https://polyhaven.com/a/dining_chair_02) | James Ray Cock |
| Harbor Drawer Cabinet | [Drawer Cabinet](https://polyhaven.com/a/drawer_cabinet) | Ulan Cabanilla |
| Elmstead Single Metal Bed Frame | [Old Bed Frame](https://polyhaven.com/a/old_bed_frame) | Luca B |
| Ellis Round Dining Table | [Round Wooden Table 02](https://polyhaven.com/a/round_wooden_table_02) | Ulan Cabanilla |
| Form Double-pedestal Desk | [Metal Office Desk](https://polyhaven.com/a/metal_office_desk) | Ulan Cabanilla |

## Gallery backdrop

The gallery renders use a studio backdrop made with the built-in ImageGen tool. Prompt brief follows.

> An empty warm ivory plaster studio cyclorama with a seamless pale greige floor, subtle wall and floor texture, and soft light from the upper left. The wide composition leaves room for furniture renders. Keep the stage clear of people, decor and text.
