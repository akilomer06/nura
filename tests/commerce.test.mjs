import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {FORMATS,variantPrice,addItem,restoreCart,cartTotal,whatsappUrl,filterProducts,recommend} from '../src/domain.mjs';
const catalog=JSON.parse(await fs.readFile(new URL('../src/catalog.json',import.meta.url)));
const original=JSON.parse(await fs.readFile(new URL('../source-recovery/catalog-original.json',import.meta.url)));

test('all 15 products preserve their original names, URLs, notes and 60 variant prices',()=>{
 assert.equal(catalog.length,15);assert.equal(new Set(catalog.map(p=>p.id)).size,15);
 let variants=0;
 for(const p of catalog){const source=original.find(s=>s.id===p.id);assert.ok(source);assert.equal(p.name,source.name);assert.deepEqual(p.notes,source.notes);for(const [format,info] of Object.entries(FORMATS))for(const size of info.sizes){assert.equal(variantPrice(p,format,size),source[`${format==='oil'?'oil':'perfume'}Price${size}ml`]);variants++;}}
 assert.equal(variants,60);
});
test('bag merges identical variants and keeps format and size separate',()=>{
 let bag=addItem([],catalog[0],'perfume',50,2);bag=addItem(bag,catalog[0],'perfume',50,1);bag=addItem(bag,catalog[0],'perfume',100,1);bag=addItem(bag,catalog[0],'oil',6,2);bag=addItem(bag,catalog[0],'oil',12,1);
 assert.equal(bag.length,4);assert.equal(bag[0].quantity,3);assert.equal(cartTotal(bag,catalog),3*2390+3790+2*520+890);
});
test('invalid variants cannot produce an order and quantities remain bounded',()=>{
 assert.throws(()=>variantPrice(catalog[0],'oil',50));assert.throws(()=>variantPrice(catalog[0],'spray',50));assert.throws(()=>addItem([],null,'oil',6,1));assert.equal(addItem([],catalog[0],'oil',6,1000)[0].quantity,99);assert.equal(addItem([],catalog[0],'oil',6,-1)[0].quantity,1);
});
test('restored browser data is validated and prices are taken from the catalog',()=>{
 const restored=restoreCart([{id:'al-zaf',format:'oil',size:6,quantity:2,price:1},{id:'unknown',format:'oil',size:6,quantity:1},{id:'al-zaf',format:'oil',size:50,quantity:1},{id:'al-harun',format:'oil',size:6,quantity:-5}],catalog);
 assert.equal(restored.length,1);assert.equal(cartTotal(restored,catalog),1040);assert.deepEqual(restoreCart(null,catalog),[]);
});
test('WhatsApp message includes exact variants, quantities, line totals and subtotal',()=>{
 let cart=addItem([],catalog[0],'oil',12,2);cart=addItem(cart,catalog[1],'perfume',100,1);
 const url=new URL(whatsappUrl(cart,catalog));assert.equal(url.hostname,'wa.me');assert.equal(url.pathname,'/919003954228');const message=url.searchParams.get('text');assert.match(message,/AL-ZAF — Perfume Oil, 12 ml × 2 — ₹1,780/);assert.match(message,/Al-Harun — Perfume, 100 ml × 1 — ₹4,490/);assert.match(message,/Item subtotal: ₹6,270/);assert.match(message,/shipping charges/);assert.equal(whatsappUrl([],catalog),null);
});
test('search, combined filters, price sorting and empty states use the selected format',()=>{
 assert.ok(filterProducts(catalog,{query:'sandalwood'}).length>0);assert.equal(filterProducts(catalog,{query:'AL-ZAF'})[0].id,'al-zaf');assert.ok(filterProducts(catalog,{family:'Floral'}).every(p=>p.family==='Floral'));assert.equal(filterProducts(catalog,{gender:'Women'}).length,0);assert.equal(filterProducts(catalog,{query:'no-such-fragrance'}).length,0);assert.equal(filterProducts(catalog,{format:'oil',sort:'price-up'})[0].id,'al-zaf');assert.equal(filterProducts(catalog,{format:'perfume',sort:'price-down'})[0].id,'al-kamrah');assert.ok(filterProducts(catalog,{family:'Floral',query:'jasmine'}).every(p=>p.family==='Floral'));
});
test('finder recommends existing products with the requested family first',()=>{
 const matches=recommend(catalog,{family:'Floral',time:'Day',gender:'Unisex'});assert.equal(matches.length,3);assert.ok(matches.every(p=>p.family==='Floral'));assert.equal(new Set(matches.map(p=>p.id)).size,3);
});
