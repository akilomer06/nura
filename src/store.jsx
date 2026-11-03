import React,{createContext,useContext,useEffect,useState,useCallback} from 'react';
import seed from './catalog.json';
import {CURRENCIES,DEFAULT_RATES,displayMoney} from './currencies.mjs';
import {whatsappUrl} from './domain.mjs';
const Store=createContext(null);
export function StoreProvider({children}){
 const [sceneReady,setSceneReady]=useState(false),[loaded,setLoaded]=useState(false),[catalog,setCatalog]=useState({products:seed,rates:DEFAULT_RATES}),[currency,setCurrency]=useState(()=>{try{const code=localStorage.getItem('nura_currency');return CURRENCIES[code]?code:'INR';}catch{return 'INR';}});
 const refresh=useCallback(async()=>{for(const url of ['/api/catalog','/catalog.json'])try{const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(3000)});if(!response.ok)continue;const data=await response.json();if(Array.isArray(data.products)){setCatalog(data);break;}}catch{}setLoaded(true);},[]);
 useEffect(()=>{refresh();const update=()=>refresh(),timer=setInterval(()=>{if(!document.hidden)refresh();},30000);window.addEventListener('focus',update);window.addEventListener('nura-catalog-updated',update);return()=>{clearInterval(timer);window.removeEventListener('focus',update);window.removeEventListener('nura-catalog-updated',update);};},[refresh]);
 useEffect(()=>{try{localStorage.setItem('nura_currency',currency);}catch{}},[currency]);
 return <Store.Provider value={{...catalog,loaded,sceneReady,setSceneReady,currency,setCurrency,refresh,money:value=>displayMoney(value,currency,catalog.rates),orderUrl:cart=>whatsappUrl(cart,catalog.products,{currency,rates:catalog.rates})}}>{children}</Store.Provider>;
}
export const useStore=()=>useContext(Store);
export function CurrencySelect(){const {currency,setCurrency}=useStore();return <label className="currency-select" data-currency={currency}><span className="sr-only">Display currency — indicative exchange rates</span><select aria-label="Display currency" title="Indicative conversions. Final quote confirmed in INR." value={currency} onChange={e=>setCurrency(e.target.value)}>{Object.entries(CURRENCIES).map(([code,info])=><option key={code} value={code}>{code} · {info.name}</option>)}</select><span aria-hidden="true">⌄</span></label>;}
