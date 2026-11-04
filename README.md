# NURA — A house of curation

The homepage opens with the centred NURA logo and introduction on the original stone background. Native scrolling pulls the camera back to reveal the five featured fragrances, followed by the footer. The 240svh sequence uses one renderer and camera, with a reduced-motion and WebGL fallback. The perfume-flow sequence is inactive.

The approved user-supplied emblem, NURA lettering and byline are traced into outlined vectors, using the existing ivory and champagne palette. The signature is used in the header, hero, product view, footer, admin, bottle labels and browser icon. `python scripts/trace-brand.py` recreates the SVG assets, `node scripts/export-brand.mjs` exports the PNG files, and `node scripts/typeset-bottles.mjs` renders labels on both packaging formats. The downloadable `public/nura-brand-kit.zip` contains the updated assets.

First visits use the gold-cap oil bottles and Perfume Oil (6 ml). Choosing Perfume changes the whole shelf to black-cap spray bottles; the chosen format survives closing a product, next/previous navigation, reopening products and refreshing the same browser tab. A 560 ms cross-dissolve keeps both photographs at their native proportions and on the same shelf baseline, with synchronized reflections and a restrained depth settle. Reduced motion changes the image immediately. Explicit format links remain supported. All 15 fragrances have matching labels for both formats, with no volume printed on the bottle images.

The hero introduces NURA's house-of-curation positioning with a short description, two clear links and quiet details about the five-fragrance edit and perfume/oil formats. Its original stone colour image and palette are preserved.

NURA’s redesigned storefront: a real Three.js basalt room with recessed compartments, emerald hover lighting, reflections, 15 isolated bottle images, perfume/oil variants, a persistent bag and WhatsApp ordering. The homepage moves from stone to the five featured fragrances, then a floating glass footer. The complete collection lives on its own fragrance shelf page. Brand and service content lives on separate pages.

## Run locally

Requires Node.js 22.12+ or 24+.

```sh
npm install
npm run dev
```

Vite normally serves at http://127.0.0.1:5173. If the port is occupied, use `npm run dev -- --port 5188`.

```sh
npm test
npm run build
npm run preview
```

## Product data and content

- `src/catalog.json`: all 15 fragrances; original slugs, names, scent notes, and 60 prices recovered from the public NURA bundle. Descriptions have been edited for brevity. INR is the base price. Eight indicative display currencies are restored from the old storefront.
- `src/content.js`: the supporting pages and navigation. No unverified donation percentages, impact statistics, testimonials or promotion claims are presented.
- `source-recovery/catalog-original.json` and `source-recovery/variant-inventory.csv`: the unedited catalog and a price audit. Original public HTML/JS and product images are archived here for provenance; they are not included in the production build.
- No original Git repository or backend credentials were present. This is a new React/Vite implementation recovered from the public site, rather than an edit to the original Next.js source.

## Images

`public/assets/bottles/` contains two optimized transparent WebP resolutions for each fragrance. The images were edited with the built-in `image_gen` tool from the supplied NURA imagery. The same artwork is intentionally reused for perfume and oil, as requested. Physical packaging is not inferred for other formats or sizes.

The current `*-oil-v2.webp` set standardizes all fragrances to the same gold-capped perfume-oil bottle, as requested. Printed volumes and the manufacturing line have been removed. The master AL-ZAF edit preserves the gold cap, amber glass, emerald label, NURA emblem and wordmark; subsequent edits change only the fragrance name. Complete prompts and built-in imagegen provenance are in `source-recovery/oil-v2-*.json`; the 15 large and small outputs are in `public/assets/bottles/`.

Earlier extraction prompts (superseded): “Extract ONLY the single [fragrance] NURA bottle from this supplied product image as a premium studio ecommerce cutout with genuine transparent background. Preserve the source bottle’s exact shape, cap design and color, amber liquid, green gold label and all readable branding. Preserve source details rather than redesign. Full bottle visible, centered, straight-on front view. Remove all background, smoke, props, packaging, table and scenery. Refine studio lighting and dimensional glass highlights. No new text, numbers, ornament, backdrop or pedestal.” Complete per-image prompts and output provenance are saved in `source-recovery/*-generation.json`. The AL-ZAF treatment was established first, then applied to the collection.

`public/assets/stone.webp` is the original generated basalt texture and remains unchanged. Prompt: “Front-facing macro photograph of a dark charcoal basalt stone wall, organic fine rock grain, subtle fissures, nearly black with faint forest-green undertones, edge-to-edge stone only, soft grazing light, no bottles, niches, words or graphics.” Each niche has actual back, side, ceiling and shelf geometry. The five homepage fragrances share a rounded-glass master model, with label decals sampled directly from the original product pixels. The full 15-fragrance shelf retains its product image layers. No Basalte images or source code are shipped.

`src/hero-bottle.mjs` builds the shared glass body, gold cap, internal clipped amber volume, surface meniscus and scroll-driven oil meshes. The surface flow is projected onto the separate stone geometry, not a background graphic. `src/stone-formation.mjs` owns the sculpture and localized emerald lighting. The sculpture-only `stone-mineral-v1.webp` variant adds subtle natural gold deposits; the background texture is untouched. See `source-recovery/cinematic-v2-notes.md` for its built-in imagegen prompt and validation details.

`src/SceneGallery.jsx` owns the shared WebGL room, planar reflection with a two-pass Gaussian blur and subtle ripple distortion, lighting and camera. `src/scene-layout.mjs` defines finite camera bounds and the reference’s 1.5-second cubic-bezier(.62,0,.22,1) push-in / 1.35-second return. Product selection approaches the existing compartment; it does not replace it with a close-up photograph. The details appear after the move, with staggered text. Hover/focus lights only the corresponding niche; selection keeps that niche lit. A CSS geometry fallback remains available when WebGL cannot initialize.

## Behavior

- The homepage hero scrolls down into exactly five featured fragrances: Althaïr, Erba Pura, Delighted Dior, Al Marj and Sheikh Musk. The desktop edit is one wall; smaller screens arrange the five in two rows. There are no carousel arrows, range counter or hover instructions. “Open the fragrance shelf” links to `/shelf`.
- `HomeExperience` in `src/App.jsx` owns a 360svh sequence: one viewport scene, 220svh of native animation scrolling and a 40svh completed-wall hold. `homeStoryState` synchronizes camera, bottle, cap, oil, light and chapter state; the existing animation loop smooths progress without per-frame React rendering. The story reveals mineral detail, flowing essence, filling and cap closure before the same bottle docks in its original niche. Names and shelf access appear after settling. Upward scrolling reverses the sequence, and product selection takes priority.
- All five homepage bottles share geometry, glass, cap, reflection environment and per-fragrance source label textures. Resting exposure is 0.38, full hover/focus exposure is 1, and non-selected neighbours are heavily dimmed. This slightly brighter resting exposure follows the later emerald-lighting brief. On touch, a single tap illuminates and opens a fragrance.
- “Explore the five,” its keyboard activation, and `#featured-perfumes` resolve to the completed wall. Browser back restores the saved page position before the next scene frame. The stone uses shallow relief geometry and a grazing light; boundary blending in its material avoids hard texture seams. No new motion dependency was added.
- Reduced motion and WebGL initialization failure use a static branded stone opening and five ordinary product buttons in normal document flow. Those buttons retain product details and buying controls. `scripts/home-accessibility-qa.mjs reduced` or `no-webgl` serves an isolated browser test mode on port 5190 without changing OS preferences; this fixture is excluded from the production entry point.
- `/shelf` displays all published fragrances in stationary rows of real stone compartments, with five columns on desktop and three on smaller screens. Ordinary vertical page scrolling reaches every row; there is no horizontal carousel. The same camera zoom and return operate in both views. Shelf reflections use blurred, independently rendered bottle layers; the homepage retains its planar water-floor reflection.
- `src/collection-layout.mjs` defines the featured IDs, responsive shelf coordinates and scroll projection. The shelf uses one viewport-sized WebGL canvas, rather than an oversized canvas or a renderer per product.
- Product routes remain `/products/<original-slug>`. Optional `format=oil|perfume` and `size=6|12|50|100` restore a valid selected variant. `view=featured|shelf` preserves the display context; ordinary direct links default to the full shelf. Back restores the original page and scroll position. Previous/next traverses the five featured fragrances on the homepage, and the complete catalog on the shelf.
- `/perfume`, `/perfume-oil` and `/collections` remain aliases for the shelf, with the corresponding format where specified. Search, family/gender filters and sorting remain available on the shelf.
- Bag items are keyed by fragrance + format + size, validated when restored from browser storage, and priced from the catalog. Quantities range from 1 to 99.
- WhatsApp links prepare an itemized order for +91 90039 54228. The visitor sends the message themselves; the site does not send orders or payments. Availability, shipping and payment details are confirmed by the NURA team.
- No working newsletter/contact submission endpoint was recoverable. Those forms are omitted; email and WhatsApp links remain usable.
- The Fragrance Finder uses local, deterministic matching against the actual catalog and opens the recommended product routes.

## Deployment

`npm run build` produces `dist/`. It can be hosted as a static SPA. `vercel.json` preserves direct-route access on Vercel. Product and supporting routes receive static HTML metadata and product JSON-LD during the build.

The existing `nura-i33k.vercel.app` project requires its owner’s Vercel access or linked Git repository to replace. Nothing in this checkout contains that access. Never place account tokens in source files.

## Validation

`npm test` verifies the 60 prices and original notes, variant separation, totals, persisted-cart validation, WhatsApp encoding, filtering/sorting, fragrance recommendations, camera bounds, world-space travel and easing continuity. Story tests cover exact five-model docking endpoints, finite reversible transforms, wall clearance, in-frame travel, hidden interior reset during the macro shot and stage boundaries at 1440, 1024, 390 and 320px. `node scripts/inspect-assets.mjs` checks the original bottle assets. Latest storyboard captures and validation are recorded in `source-recovery/cinematic-v2-notes.md`; earlier `continuous-*` and `stone-scent-*` captures document preceding iterations.

## Catalog studio

Open `/admin` locally and create your own password (minimum 12 characters) on first use. No default owner password has been created. The password is hashed with scrypt; an HttpOnly, SameSite cookie protects the session. Only loopback connections and same-origin writes are accepted. Vite blocks access to `.nura-admin/`, and this directory is excluded from Git and production output.

The studio adds fragrances, uploads bottle images, edits descriptions/notes, changes all four variant prices, reorders the wall, and manages published/draft and available/unavailable status. Existing product URLs are locked. Currency conversions can be maintained separately. New images are validated and re-encoded as WebP; the upload limit is 6 MB. Catalog saves are atomic, retain a previous snapshot, and detect conflicting edits in other windows.

Saved data persists in `.nura-admin/catalog.json`; image uploads persist in `public/assets/uploads/`. The local storefront refreshes after a save and on focus. Export the catalog for a portable backup. Back up both the private catalog and uploaded images before moving the project to another computer.

`npm run build` reads the saved catalog, exports only published products to `dist/catalog.json`, and generates matching product metadata and routes. Upload the resulting build to publish local edits. The current static Vercel deployment has no live editing backend: its `/admin` page reports that explicitly and cannot pretend to save. A hosted admin needs a separate persistent backend and sign-in integration; no unrelated Supabase project has been modified.

The currency selector supports INR, USD, SAR, AED, GBP, SGD, MYR and EUR. Rates are the original NURA configuration, not a live FX feed. Converted prices and WhatsApp messages are labelled indicative; converted orders also include the INR subtotal.

`npm test` additionally verifies admin authentication, same-origin protection, optimistic locking, saved prices, draft filtering, upload validation, and converted order totals. `scripts/admin-ui-qa.mjs` runs an isolated disposable studio on port 5189 for browser tests without touching the owner’s credentials or catalog.

