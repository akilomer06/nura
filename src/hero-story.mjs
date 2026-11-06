// Scroll cues and editorial copy for the Althaïr homepage.
export const HERO_CONFIG = {
 scrollScreens: 3.4,
 holdScreens: .4,
 product: 'althair-pdm',
 backdrop: '/assets/story-environment-v4.webp',
 mountain: {foot: .18, lip: .73, ledgeRise: .044},
 phases: [
  {start: 0, name: 'origin', eyebrow: 'NURA BY BIN SADHIK · ALTHAÏR', title: 'Essence of the Mountain', description: 'An empty vessel waits on the stone. Follow Althaïr from the first drop to the fragrance shelf.'},
  {start: .14, name: 'opening', eyebrow: '01 / THE AWAKENING', title: 'The vessel opens', description: 'Gold lifts from the glass, and the mountain comes into focus.'},
  {start: .34, name: 'essence', eyebrow: '02 / THE ESSENCE', title: 'A vein of gold', description: 'Amber oil gathers in a fissure and spills over the edge of the rock.'},
  {start: .49, name: 'capture', eyebrow: '03 / THE CAPTURE', title: 'Drop by drop', description: 'The stream meets the glass and slowly rises inside the vessel.'},
  {start: .67, name: 'completion', eyebrow: '04 / THE INFUSION', title: 'The finishing touch', description: 'The final drop settles. The gold cap returns to seal the bottle.'},
  {start: .81, name: 'docking', eyebrow: '05 / THE COLLECTION', title: 'A place in the collection', description: 'Althaïr takes the first niche alongside four fragrances from the house.'}
 ]
};

export const clampReveal = value => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
export function smoothRange(start, end, value) {
 const t = clampReveal((value - start) / (end - start));
 return t * t * t * (10 + t * (-15 + 6 * t));
}

export function homeRevealLayers(value) {
 const progress = clampReveal(value);
 const phases = HERO_CONFIG.phases;
 const chapter = phases.findLastIndex(phase => progress >= phase.start);
 const current = phases[chapter];
 const next = phases[chapter + 1];
 const enter = chapter === 0 ? 1 : smoothRange(current.start, current.start + .025, progress);
 const leave = next ? 1 - smoothRange(next.start - .022, next.start, progress) : 1;
 return {
  chapter,
  captionOpacity: enter * leave * (1 - smoothRange(.842, .887, progress)),
  collectionOpacity: smoothRange(.95, 1, progress),
  selectionReady: progress >= .999
 };
}
