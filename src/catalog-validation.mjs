import {CURRENCIES,DEFAULT_RATES} from './currencies.mjs';
const text=(value,max,label,required=true)=>{if(typeof value!=='string'||value.length>max||(required&&!value.trim()))throw new Error(`${label} is required (up to ${max} characters).`);return value.trim();};
export function validateCatalog(input){
 if(!input||!Array.isArray(input.products)||input.products.length<1||input.products.length>300)throw new Error('A catalog must contain between 1 and 300 fragrances.');
 const ids=new Set();
 const products=input.products.map((p,i)=>{
  const id=text(p.id,90,'Product URL');if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)||ids.has(id))throw new Error('Product URLs must be unique lowercase slugs.');ids.add(id);
  const artwork=text(p.artwork,1000,'Bottle image');if(!/^\/assets\/[a-zA-Z0-9/_\.\-]+\.(webp|png|jpe?g)$/i.test(artwork))throw new Error('Choose a bottle image from the image library.');
  const prices={};for(const key of ['perfumePrice50ml','perfumePrice100ml','oilPrice6ml','oilPrice12ml']){if(!Number.isSafeInteger(p[key])||p[key]<1||p[key]>10000000)throw new Error('All four prices must be positive whole rupee amounts.');prices[key]=p[key];}
  return {id,name:text(p.name,90,'Name'),subtitle:text(p.subtitle||'',180,'Subtitle',false),description:text(p.description,1200,'Description'),family:text(p.family,60,'Scent family'),gender:['Unisex','Men','Women'].includes(p.gender)?p.gender:'Unisex',artwork,...prices,published:p.published!==false,available:p.available!==false,number:String(i+1).padStart(2,'0'),notes:Object.fromEntries(['top','heart','base'].map(key=>[key,text(p.notes?.[key],500,`${key} notes`)])),tags:Array.isArray(p.tags)?p.tags.slice(0,10).map(t=>text(t,60,'Tag')):[],bestFor:{time:Array.isArray(p.bestFor?.time)?p.bestFor.time.filter(t=>['Day','Night'].includes(t)):['Day','Night'],seasons:p.bestFor?.seasons||[],occasions:p.bestFor?.occasions||[]},performance:{longevity:String(p.performance?.longevity||''),projection:String(p.performance?.projection||'')}};
 });
 const rates={};for(const code of Object.keys(CURRENCIES)){const rate=Number(input.rates?.[code]??DEFAULT_RATES[code]);if(!Number.isFinite(rate)||rate<=0||rate>1000||(code==='INR'&&rate!==1))throw new Error('Currency rates must be positive, with INR fixed at 1.');rates[code]=rate;}
 return {products,rates};
}
