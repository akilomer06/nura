# NURA packaging and brand preparation

The logo geometry is traced from the user-supplied reference in `scripts/brand-reference.png`, with the website's existing ivory #EFEADE and champagne #C7B385. Bottle printing uses restrained gold #D1B76C. Neither the reference background nor its colour gradient is used.

The built-in image-generation tool was used in edit mode to prepare two transparent blank packaging masters, preserving the supplied bottle designs. Exact traced SVG lettering and fragrance names were then typeset as native vector label artwork with `scripts/typeset-bottles.mjs`, producing 15 oil and 15 spray images plus small versions in `public/assets/bottles/*-brand-v5*.webp`. The latest exports retain native master resolution and use lossless compression; no letter has an added stroke or altered weight. The desktop scene uses 2x supersampling for fine label text.

## Final oil master prompt

Use case: precise-object-edit. Edit target: attached existing gold cap perfume oil bottle. Change ONLY the printing in the interior green label: remove the central star emblem and all lettering NURA, BY BIN SADHIK and ALTHAIR, leaving an entirely blank dark emerald green flat front label panel. Preserve the gold ornate perimeter and flourishes ABOVE and BELOW the green panel. Preserve exact bottle silhouette, proportions, gold cylindrical cap, amber liquid, rounded glass body, highlights, transparent background. Keep original bottle and label colours. Full bottle front view, centred, uncropped. Label interior blank with subtle natural texture, no new logo, no text, no volume ml text, no props or scenery. This blank is for accurate vector label typesetting separately. Preserve true transparency.

Input: `public/assets/bottles/althair-pdm-oil-v2.webp`. Saved master: `public/assets/packaging/oil-master.png`.

## Final perfume master prompt

Use case: precise-object-edit. Image 1 is the existing NURA spray perfume bottle, the edit target. Change ONLY the printing inside the dark green front label: remove ALL lettering and central emblem, including NURA, BY BIN SADHIK, ALTHAIR, PARFUMS DE MARLY, 50ml, and bottom text. The interior green label should be entirely blank, dark emerald green with subtle natural material texture. Preserve the ornate gold label perimeter and flourishes above and below the label. Keep exactly the same rectangular rounded glass bottle shape, proportions, black textured cylindrical cap, amber liquid, reflections, highlights and original colour palette. Full bottle uncropped centered front view, transparent background. No lettering, logos or volume markings anywhere. This is a blank master for exact vector typesetting separately. No extra props, no background, no overglow. Keep true transparency.

Input: `public/assets/bottles/althair-pdm.webp`. Saved master: `public/assets/packaging/perfume-master.png`.
