export const FORMATS = { perfume: { label:'Perfume', sizes:[50,100] }, oil: { label:'Perfume Oil', sizes:[6,12] } };
import {displayMoney} from './currencies.mjs';
export const money = displayMoney;
export const variantKey = (id,format,size) => `${id}:${format}:${size}`;
export function variantPrice(product,format,size) {
 if(!product || !FORMATS[format]?.sizes.includes(Number(size))) throw new Error('Unavailable variant');
 const price=product[`${format==='oil'?'oil':'perfume'}Price${Number(size)}ml`];
 if(!Number.isSafeInteger(price)||price<=0)throw new Error('Unavailable price');
 return price;
}
export function addItem(cart,product,format,size,quantity) {
 if(product?.available===false)throw new Error('This fragrance is currently unavailable.');
 variantPrice(product,format,size);
 const amount=Math.max(1,Math.min(99,Math.trunc(Number(quantity)||1)));
 const key=variantKey(product.id,format,size),existing=cart.find(item=>item.key===key);
 return existing?cart.map(item=>item.key===key?{...item,quantity:Math.min(99,item.quantity+amount)}:item):[...cart,{key,id:product.id,format,size:Number(size),quantity:amount}];
}
export function restoreCart(value,products) {
 if(!Array.isArray(value))return [];
 return value.slice(0,60).reduce((cart,item)=>{try {const p=products.find(p=>p.id===item.id);if(!Number.isInteger(item.quantity)||item.quantity<1)return cart;return addItem(cart,p,item.format,Number(item.size),item.quantity);}catch{return cart;}},[]);
}
export function cartTotal(cart,products) {return cart.reduce((total,item)=>total+variantPrice(products.find(p=>p.id===item.id),item.format,item.size)*item.quantity,0);}
export function whatsappUrl(cart,products,{currency='INR',rates}={}) {
 if(!cart.length)return null;
 const lines=cart.map(item=>{const p=products.find(p=>p.id===item.id);return `${p.name} — ${FORMATS[item.format].label}, ${item.size} ml × ${item.quantity} — ${money(variantPrice(p,item.format,item.size)*item.quantity,currency,rates)}`;});
 return 'https://wa.me/919003954228?text='+encodeURIComponent(['Hello NURA, I would like to order:','',...lines,'',`Item subtotal: ${money(cartTotal(cart,products),currency,rates)}`,...(currency==='INR'?[]:[`Indicative ${currency} conversion. Base subtotal: ${money(cartTotal(cart,products))} INR.`]),'Please confirm availability, shipping charges and payment details.'].join('\n'));
}
export function filterProducts(products,{query='',family='All',gender='All',sort='collection',format='perfume'}={}) {
 const q=query.trim().toLocaleLowerCase();
 const result=products.filter(p=>(family==='All'||p.family===family)&&(gender==='All'||p.gender===gender)&&(!q||`${p.name} ${p.family} ${Object.values(p.notes).join(' ')}`.toLocaleLowerCase().includes(q)));
 const price=p=>variantPrice(p,format,FORMATS[format].sizes[0]);
 if(sort==='price-up')result.sort((a,b)=>price(a)-price(b));
 if(sort==='price-down')result.sort((a,b)=>price(b)-price(a));
 if(sort==='name')result.sort((a,b)=>a.name.localeCompare(b.name));
 return result;
}
export function recommend(products,{family='All',time='Any',gender='All'}) {
 return products.map((p,index)=>({p,index,score:(family===p.family?6:0)+(time!=='Any'&&p.bestFor.time.includes(time)?2:0)+(gender!=='All'&&(p.gender===gender||p.gender==='Unisex')?1:0)})).sort((a,b)=>b.score-a.score||a.index-b.index).slice(0,3).map(x=>x.p);
}
