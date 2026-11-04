export function browseFormat(path,search='',remembered='oil'){
 const explicit=new URLSearchParams(search).get('format');
 if(explicit==='perfume'||explicit==='oil')return explicit;
 if(path==='/perfume')return 'perfume';
 if(path==='/perfume-oil')return 'oil';
 return remembered==='perfume'?'perfume':'oil';
}
