// Indicative display rates restored from the original NURA storefront, per INR.
export const CURRENCIES = {
 INR:{name:'Indian Rupee',rate:1}, USD:{name:'US Dollar',rate:.012},
 SAR:{name:'Saudi Riyal',rate:.045}, AED:{name:'UAE Dirham',rate:.044},
 GBP:{name:'British Pound',rate:.0095}, SGD:{name:'Singapore Dollar',rate:.016},
 MYR:{name:'Malaysian Ringgit',rate:.055}, EUR:{name:'Euro',rate:.011}
};
export const DEFAULT_RATES=Object.fromEntries(Object.entries(CURRENCIES).map(([code,value])=>[code,value.rate]));
export function displayMoney(value,currency='INR',rates=DEFAULT_RATES){
 const code=CURRENCIES[currency]?currency:'INR';
 const amount=value*(rates[code]??DEFAULT_RATES[code]);
 return new Intl.NumberFormat(code==='INR'?'en-IN':'en-GB',{style:'currency',currency:code,minimumFractionDigits:code==='INR'?0:2,maximumFractionDigits:code==='INR'?0:2}).format(amount);
}
