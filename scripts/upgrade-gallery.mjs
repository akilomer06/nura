import fs from 'node:fs/promises';
let source=await fs.readFile('src/main.jsx','utf8');
source=source.replace("import './styles.css';",`import './styles.css';\nimport SceneGallery from './SceneGallery.jsx';\nimport {visibleCount,maxGalleryIndex,clampIndex} from './scene-layout.mjs';\nimport './scene.css';`);
const start=source.indexOf('function Collection('),end=source.indexOf('function FilterPanel(',start);
source=source.slice(0,start)+`function Collection({format,index,setIndex,filters,setFilters,heroRef,onFilter,selectedId,onSceneMotion,sceneBusy}){
 const navigate=useContext(Navigation),[width,setWidth]=useState(innerWidth);
 const filtered=useMemo(()=>filterProducts(products,{...filters,format}),[filters,format]);
 const sceneItems=selectedId&&!filtered.some(p=>p.id===selectedId)?products:filtered;
 useEffect(()=>{setIndex(0);},[filters,format]);
 useEffect(()=>{const resize=()=>{setWidth(innerWidth);setIndex(i=>clampIndex(i,filtered.length,innerWidth));};window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[filtered.length]);
 const max=maxGalleryIndex(filtered.length,width),move=delta=>setIndex(i=>Math.max(0,Math.min(max,i+delta)));
 const handleKey=e=>{if(e.target.closest('input,select'))return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();move(e.key==='ArrowRight'?1:-1);}if(e.key==='Home'){e.preventDefault();setIndex(0);}if(e.key==='End'){e.preventDefault();setIndex(max);}};
 const first=filtered.length?Math.floor(index)+1:0,last=Math.min(filtered.length,Math.floor(index)+Math.floor(visibleCount(width)));
 return <section className={\`collection collection-3d \${selectedId?'collection-detail-open':''} \${sceneBusy?'scene-travelling':''}\`} ref={heroRef} aria-label="Fragrance collection" onKeyDown={handleKey} tabIndex={0}>
  <SceneGallery items={sceneItems} index={index} selectedId={selectedId} onMotion={onSceneMotion} onIndexChange={setIndex} onSelect={p=>navigate('/products/'+p.id+'?format='+format)}/>
  <div className="collection-topline"><Eyebrow>THE NURA COLLECTION</Eyebrow><button className="filter-trigger" onClick={onFilter}><SlidersHorizontal size={14}/> Explore & filter <span>{filtered.length}</span></button></div>
  {!filtered.length&&<div className="scene-no-results"><h2>No fragrances found.</h2><p>Try another note or scent family.</p><button className="text-link" onClick={()=>setFilters({query:'',family:'All',gender:'All',sort:'collection'})}>Reset filters <RotateCcw size={16}/></button></div>}
  <div className="collection-copy"><div><Eyebrow>FIFTEEN FRAGRANCES. YOUR OWN EXPRESSION.</Eyebrow><h1>A quiet kind of <i>presence.</i></h1><p>Perfumes and precious oils, chosen with intention.</p></div><div className="collection-controls"><p className="selection-hint"><span className="live-dot"/> HOVER TO DISCOVER. SELECT TO COME CLOSER.</p><div className="arrow-controls"><IconButton label="Previous fragrance" disabled={index<=0||!filtered.length} onClick={()=>move(-1)}><ArrowLeft size={18}/></IconButton><span className="collection-position" aria-live="polite">{String(first).padStart(2,'0')}{last>first?'–'+String(last).padStart(2,'0'):''}<span> / {String(filtered.length).padStart(2,'0')}</span></span><IconButton label="Next fragrance" disabled={index>=max||!filtered.length} onClick={()=>move(1)}><ArrowRight size={18}/></IconButton></div></div></div>
  <a className="scene-scroll-cue" href="#scene-footer" onClick={e=>{e.preventDefault();document.getElementById('scene-footer').scrollIntoView({behavior:scrollBehavior(),block:'end'});}}>THE HOUSE & INFORMATION <ArrowDown size={13}/></a>
 </section>;
}
`+source.slice(end);
const oldHome=source.indexOf('function HomeSections()'),oldFooter=source.indexOf('function Footer()',oldHome),afterFooter=source.indexOf('function EditorialPage(',oldFooter);
source=source.slice(0,oldHome)+`function Footer(){return <footer className="glass-footer-wrap" id="scene-footer"><div className="glass-footer"><div className="glass-footer-row"><div><Brand/><p className="glass-letter">A house of curation. A fragrance of your own.</p></div><a className="glass-contact" href="mailto:info@nura.in"><span>Write to the house</span><ArrowRight size={22} strokeWidth={1}/></a></div><div className="glass-footer-base"><nav aria-label="Customer information">{[['/shipping','Shipping'],['/shipping-returns','Returns'],['/contact','Contact'],['/about','The house']].map(([url,label])=><Link key={url} to={url}>{label}</Link>)}</nav><span>© {new Date().getFullYear()} NURA BY BIN SADHIK</span></div></div></footer>;}
`+source.slice(afterFooter);
source=source.replace("const [format,setFormat]=useState(defaultFormat)","const [format,setFormat]=useState(defaultFormat)");
source=source.replace("function ProductDetail({product,format:defaultFormat,size:defaultSize,onClose,onAdd,onNavigate})","function ProductDetail({product,format:defaultFormat,size:defaultSize,onClose,onAdd,onNavigate,ready})");
source=source.replace('className="product-dialog"','className={\`product-dialog scene-product-dialog \${ready?\'detail-settled\':\'detail-arriving\'}\`}');
source=source.replace('<div className="modal-backdrop" onClick=', '<div className={\`modal-backdrop \${className.includes(\'scene-product-dialog\')?\'scene-product-backdrop\':\'\'}\`} onClick=');
source=source.replace("const path=route.split('?')[0]","const [sceneBusy,setSceneBusy]=useState(false);\n const path=route.split('?')[0].replace(/\\/+$/,'')||'/'");
source=source.replace('heroRef={heroRef} onFilter={()=>setPanel(\'filters\')}/><HomeSections/>',"heroRef={heroRef} onFilter={()=>setPanel('filters')} selectedId={product?.id||null} onSceneMotion={setSceneBusy} sceneBusy={sceneBusy}/>");
source=source.replace('<div id="site-shell">','<div id="site-shell" className={isHome?\'scene-page\':\'content-page\'}>');
source=source.replace('<ProductDetail product={product}', '<ProductDetail ready={!sceneBusy} product={product}');
source=source.replace("onNavigate={(p,f)=>{setIndex(products.findIndex(x=>x.id===p.id));navigate(`/products/${p.id}?format=${f}`);}}","onNavigate={(p,f)=>{navigate(`/products/${p.id}?format=${f}`);}}");
await fs.writeFile('src/main.jsx',source);
console.log('Three-dimensional gallery connected; homepage editorial sections removed; glass footer installed.');
