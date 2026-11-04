# NURA hero implementation — 4 November 2026

The homepage now uses the supplied perfume and oil artwork over the existing stone room. The existing header, stone colour map, emerald lights, five featured fragrances, full shelf, product details, format preference, bag, prices and admin remain in place.

The page begins with the existing NURA logo centred above “A fragrance of your own.” on the same stone scene. After a 0.6-second hold, a 1.5-second reveal opens into the left-hand introduction and right-hand products. Scrolling can advance this immediately; there is no scroll lock or Skip button. The opening shares the renderer's clock and does not replay on a resize or restored visit farther down the page. Reduced motion keeps the branding in ordinary page flow.

Scrolling then turns the main perfume bottle and moves it left. Chapters two through four reveal their HTML wording in the centre. The oil stays on the right. Scrolling upward reverses the same product timeline.

## Motion and integration

- `src/hero-story.mjs`: editable opening slogan/timing, copy, chapter windows, desktop/tablet/phone positions, yaw, camera values and scroll distances. Main yaw moves from 0° to −27°, through 0°, to +22°, settling at +9°.
- `src/HeroStory.jsx`: semantic headings, accessible active chapters, functional collection/shelf links, original-image fallback, resize measurement and imperative DOM transforms.
- `src/hero-story.css`: responsive compositions, centred later chapters, restrained shadows/reflections and original-image-to-actor handoff.
- `src/hero-product.mjs`: reconstructed rounded glass body and cylindrical cap with the supplied photographic artwork; shared studio environment and resource disposal.
- `scripts/create-hero-brand.mjs` and `public/assets/brand/nura-logo-bottle.svg`: the approved outlined emblem, NURA wordmark and byline in the existing bottle-label gold. Both hero bottles use it; the perfume uses an attached 3D front decal and the oil/static presentation uses the same SVG. Placement is shared through `HERO_CONFIG.branding`; the original source images remain untouched.
- `src/SceneGallery.jsx`: integrates that actor into the existing renderer/camera/animation loop. Retains a completed frame at rest, pauses unnecessary work when hidden/offscreen, handles context loss and exposes sampled frame intervals for review. Hero rendering uses 1.5× resolution; the existing desktop collection retains 2×.
- `src/collection-layout.mjs`: maps the story and wall reveal to the existing responsive camera endpoint.
- `src/App.jsx`: connects the new hero to native scrolling, keyboard Explore, static fallback and the existing collection.
- `public/assets/hero/`: exact original PNG copies and visually lossless WebP versions. Visible RGB pixels and all alpha values match their originals. WebPs total 2,970,658 bytes, versus 5,279,686 bytes for the PNGs; PNGs remain available for image recovery.
- `tests/hero-story.test.mjs`, `tests/hero-assets.test.mjs`, `tests/home-reveal.test.mjs`: focused timeline, yaw, fitting, continuity, reversal, camera endpoint and artwork-fidelity checks.

There are 300svh of four-chapter scroll travel, followed by 100svh revealing the existing five-perfume wall and a 40svh hold. Including the sticky viewport, the section occupies 540svh. No wheel interception or scroll snapping was introduced. The collection and direct featured product links resolve to the completed wall.

## Product accuracy and remaining assets

The ZIP contains front PNGs, not verified GLB/GLTF models or side/back photographs. The new actor is a **3D reconstruction with original photographic front artwork**, not a verified product scan. Its depth, hidden glass surfaces and cap circumference are inferred. It uses solid geometry and perspective rotation; no CSS perspective warp is presented as 3D. The oil remains original photography with restrained translation.

For an exact physical model, supply left/right three-quarter views, straight side and back views, top/base views, bottle dimensions/depth, a cap close-up, or an approved GLB/GLTF. At the user's request, the previously blank hero labels now carry the existing NURA logo; no fragrance names, sizes or unseen packaging claims were added. Reduced motion, unavailable WebGL and a failed hero actor retain the branded front-facing presentation and ordinary collection buttons.

## Verification

- `npm test`: all **32 tests passed**.
- `npm run build`: passed, including metadata for 31 routes. Vite retains its large-main-chunk advisory because Three.js is in the existing main bundle.
- Browser review: desktop opening/25/50/75/100%, 1024×768 tablet, 390×844 phone and 320×740 narrow layout; no horizontal overflow in the checked phone layouts. These are browser viewport simulations, not physical phone tests.
- Checked forward scrolling, fast reversal, resizing, the existing five-perfume wall, keyboard Explore/focus, all five close-ups, format-preserving next navigation, return to the completed wall, the full shelf CTA and browser Back.
- Tested reduced-motion and WebGL-unavailable branches using isolated QA fixtures which boot the real app with the corresponding platform condition. Five static product buttons and all chapter copy remain accessible.
- Temporarily withheld the oil WebP and confirmed automatic recovery to its original PNG. The WebP was restored afterward.
- Before the final rotation change, the normal page produced no browser warnings/errors. After the final rotating actor was integrated and refined, the normal page again produced no captured warnings/errors. Expected errors occurred only in the deliberate failure fixtures.
- Sampled active rotating-hero requestAnimationFrame intervals before adding the brand opener: desktop mean **10.8 ms**, 95th percentile **18.3 ms**, 90 samples; phone-size viewport mean **6.3 ms**, 95th percentile **6.2 ms**, 240 samples. These are limited spot measurements, not a GPU trace or a guarantee of 60 FPS on other hardware. Some desktop samples exceeded the 16.7 ms target.
- The brand-opening update was reviewed in the running browser on desktop and a phone-sized viewport: the logo/slogan appear first, the bottle composition appears automatically, and an immediate scroll advances the opening before its timer finishes. No horizontal overflow remained in the checked layouts. Opening screenshots are saved alongside the product-phase previews.

Actual browser screenshots and QA fixtures are in the git-ignored `source-recovery/hero-review-20261104/` directory. Desktop and 390px captures cover all five requested milestones. The stone background and header were intentionally retained; the ZIP's slate background was inspected but not substituted, following the user's explicit instruction.
