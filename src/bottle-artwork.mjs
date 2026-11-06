import artwork from './bottle-artwork.json' with {type:'json'};

// Oil is the initial default; the collection and detail view share the chosen format.
export function bottleArtwork(product,format='oil',preview=false){
 const specific=format==='perfume'?product.perfumeArtwork:product.oilArtwork;
 if(specific)return specific;
 const bundled=artwork[product.id];
 if(!bundled||!product.artwork?.startsWith(`/assets/bottles/${product.id}`))return product.artwork;
 const path=bundled[format==='perfume'?'perfume':'oil'];
 return preview?path.replace('.webp','-small.webp'):path;
}
