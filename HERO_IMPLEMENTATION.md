# Althaïr · Essence of the Mountain

The homepage opens on an empty Althaïr oil bottle. Scrolling brings the glass closer, unscrews the cap, follows the oil down the ledge and into the bottle, closes the cap, then moves Althaïr into the first of the five featured niches. Scroll upward to reverse the sequence. “Explore the collection” goes straight to the finished wall.

Edit the captions and overall scroll length in `src/hero-story.mjs`. Camera framing and cues for the cap, flow, fill and shelf landing live in `src/collection-layout.mjs`. `src/HeroStory.jsx` and `src/hero-story.css` render the copy and static fallback. `src/App.jsx` connects the native scroll position to the shared renderer in `src/SceneGallery.jsx`.

The mountain uses the existing `public/assets/story-environment-v4.webp` projected onto shallow relief in `src/stone-formation.mjs`. The bottle and cap in `src/hero-bottle.mjs` are reconstructed geometry with the label from Althaïr’s existing artwork. The cap twists while threaded and lifts clear after the turn. `src/hero-oil.mjs` shapes the runoff, falling strand and drop, with reflections and ripples tied to scroll progress. The bottle contains a separate rising volume. The oil uses procedural animation. At the end of the landing, the model blends into the standard Althaïr shelf artwork so the existing product selection and format transitions can take over.

Run `npm run dev -- --port 5188` for a preview. Reduced motion and unavailable WebGL show a static introduction, followed by the five featured products and the link to the complete shelf.
