import artwork from './bottle-artwork.json' with {type:'json'};

// Oil is the initial default; the collection and detail view share the chosen format.
export function bottleArtwork(product,format='oil'){
 const specific=format==='perfume'?product.perfumeArtwork:product.oilArtwork;
 if(specific)return specific;
 const bundled=artwork[product.id];
 return bundled&&product.artwork?.startsWith(`/assets/bottles/${product.id}`)?bundled[format==='perfume'?'perfume':'oil']:product.artwork;
}
