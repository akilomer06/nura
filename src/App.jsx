import React,{useState,useEffect,useRef,useMemo,useLayoutEffect,createContext,useContext} from 'react';
import {ArrowLeft,ArrowRight,ArrowDown,ArrowUpRight,X,Plus,Minus,Search,SlidersHorizontal,Menu,ShoppingBag,Check,MessageCircle,Mail,ChevronDown,RotateCcw} from 'lucide-react';
import {StoreProvider,useStore,CurrencySelect} from './store.jsx';
import BrandLogo from './BrandLogo.jsx';
import {bottleArtwork} from './bottle-artwork.mjs';
import {browseFormat} from './browse-format.mjs';
import './brand.css';
const Admin=React.lazy(()=>import('./Admin.jsx'));
import {FORMATS,variantPrice,addItem,restoreCart,cartTotal,filterProducts,recommend} from './domain.mjs';
import {pages,mainLinks,supportLinks} from './content.js';
import './styles.css';
import SceneGallery from './SceneGallery.jsx';
import HeroStory from './HeroStory.jsx';
import {FEATURED_IDS,featuredProducts,shelfHeight,homeRevealLayers,clampReveal,HOME_REVEAL_SCREENS,HOME_HOLD_SCREENS} from './collection-layout.mjs';
import './scene.css';
import './collection-pages.css';
import './home-experience.css';

const Navigation=createContext(null);
const scrollBehavior=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth';
const initialLocation=()=>location.pathname+location.search;
const initialBrowseFormat=()=>{let saved='oil';try{saved=sessionStorage.getItem('nura-browse-format')||'oil';}catch{}return browseFormat(location.pathname,location.search,saved);};
function Link({to,children,onClick,...props}){const navigate=useContext(Navigation);return <a href={to} {...props} onClick={e=>{onClick?.(e);if(!e.defaultPrevented&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&e.button===0){e.preventDefault();navigate(to);}}}>{children}</a>;}
function Brand(){return <Link to="/" className="brand" aria-label="NURA home"><BrandLogo/></Link>;}
function Eyebrow({children,...props}){return <p className="eyebrow" {...props}>{children}</p>;}
function IconButton({label,children,...props}){return <button className="icon-button" aria-label={label} {...props}>{children}</button>;}
function TextLink({to,children,...props}){return <Link to={to} className="text-link" {...props}>{children}<ArrowUpRight size={17}/></Link>;}

function useModal(ref,onClose){
 const closeRef=useRef(onClose);closeRef.current=onClose;
 useEffect(()=>{
  const previous=document.activeElement,oldOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  const root=document.getElementById('site-shell');root?.setAttribute('inert','');
  const element=ref.current;const focusables=()=>[...element.querySelectorAll('button:not([disabled]),a[href],input,select,[tabindex="0"]')].filter(x=>x.getClientRects().length);
  (element.querySelector('[data-autofocus]')||focusables()[0]||element).focus();
  const handler=e=>{if(e.key==='Escape'){e.preventDefault();closeRef.current();}if(e.key==='Tab'){const list=focusables();if(!list.length){e.preventDefault();return;}if(e.shiftKey&&document.activeElement===list[0]){e.preventDefault();list.at(-1).focus();}else if(!e.shiftKey&&document.activeElement===list.at(-1)){e.preventDefault();list[0].focus();}}};
  element.addEventListener('keydown',handler);
  return ()=>{document.body.style.overflow=oldOverflow;root?.removeAttribute('inert');element.removeEventListener('keydown',handler);if(previous?.isConnected)previous.focus({preventScroll:true});};
 },[]);
}
function Modal({title,onClose,children,className=''}){const ref=useRef(null);useModal(ref,onClose);return <div className={`modal-backdrop ${className.includes('scene-product-dialog')?'scene-product-backdrop':''}`} onClick={e=>{if(e.target===e.currentTarget)onClose();}}><section className={`modal ${className}`} role="dialog" aria-modal="true" aria-label={title} ref={ref} tabIndex={-1}>{children}</section></div>;}
function Bottle({product,reflection=false,large=false,eager=false,format='oil'}){
 const artwork=bottleArtwork(product,format);
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[product.id,artwork]);
 if(failed)return <div className="bottle-unavailable"><BrandLogo/><small>{product.name}</small><span className="image-note">Image unavailable</span></div>;
 return <img className={`bottle ${reflection?'bottle-reflection':''} ${large?'bottle-large':''}`} src={artwork} srcSet={artwork.startsWith('/assets/bottles/')?`${artwork.replace('.webp','-small.webp')} 220w, ${artwork} 500w`:undefined} sizes={large?'(max-width: 700px) 60vw, 25vw':'(max-width: 700px) 50vw, 17vw'} alt={reflection?'':`${product.name} — NURA bottle`} aria-hidden={reflection||undefined} loading={eager?'eager':'lazy'} fetchPriority={eager?'high':'auto'} onError={()=>setFailed(true)} draggable={false}/>;
}
function Quantity({value,onChange,label='Quantity'}){return <div className="quantity" aria-label={label}><button aria-label={`Decrease ${label.toLowerCase()}`} disabled={value<=1} onClick={()=>onChange(Math.max(1,value-1))}><Minus size={13}/></button><output aria-label={label}>{value}</output><button aria-label={`Increase ${label.toLowerCase()}`} disabled={value>=99} onClick={()=>onChange(Math.min(99,value+1))}><Plus size={13}/></button></div>;}

function Header({expanded,bagCount,onMenu,onBag,onFilter,count}){return <header className={`site-header ${expanded?'header-expanded':''}`}><Brand/><nav className="scroll-nav" aria-label="Main navigation">{mainLinks.map(([url,label])=><Link key={url} to={url}>{label}</Link>)}</nav><div className="header-tools">{onFilter&&<button className="filter-trigger" onClick={onFilter}><SlidersHorizontal size={14}/><span>Explore & filter</span><small>{count}</small></button>}<CurrencySelect/><div className="header-actions"><button onClick={onMenu} className="menu-toggle" aria-label="Open menu"><Menu size={17}/><span>Menu</span></button><span className="header-divider"/><button className="bag-toggle" onClick={onBag} aria-label={`Open bag, ${bagCount} items`}><span>Bag</span><span className="bag-count">{bagCount}</span></button></div></div></header>;}
function MenuPanel({onClose}){return <Modal title="Navigation menu" onClose={onClose} className="menu-panel"><div className="panel-top"><span className="eyebrow">NURA / EXPLORE</span><IconButton label="Close menu" onClick={onClose}><X size={22}/></IconButton></div><nav className="large-menu">{mainLinks.map(([url,label],i)=><Link key={url} to={url} onClick={onClose}><small>0{i+1}</small>{label}<ArrowUpRight size={22}/></Link>)}</nav><div className="menu-secondary"><Link to="/perfume" onClick={onClose}>Perfumes</Link><Link to="/perfume-oil" onClick={onClose}>Perfume oils</Link><Link to="/bespoke" onClick={onClose}>Bespoke Experience</Link><Link to="/admin" onClick={onClose}>Catalog studio</Link>{supportLinks.map(([url,label])=><Link key={url} to={url} onClick={onClose}>{label}</Link>)}</div><a className="menu-contact" href="https://wa.me/919003954228" target="_blank" rel="noreferrer">A personal conversation <ArrowUpRight size={17}/></a></Modal>;}
function Bag({cart,setCart,onClose}){const {products,money,orderUrl,currency}=useStore();const total=cartTotal(cart,products);return <Modal title="Your bag" onClose={onClose} className="bag-panel"><div className="panel-top"><h2>Your bag <sup>{cart.reduce((n,i)=>n+i.quantity,0)}</sup></h2><IconButton label="Close bag" onClick={onClose}><X size={22}/></IconButton></div>{cart.length?<><div className="bag-items">{cart.map(item=>{const product=products.find(p=>p.id===item.id);return <article className="bag-item" key={item.key}><Link to={`/products/${product.id}?format=${item.format}&size=${item.size}`} onClick={onClose} className="bag-art"><Bottle product={product} format={item.format}/></Link><div className="bag-item-info"><Link to={`/products/${product.id}?format=${item.format}&size=${item.size}`} onClick={onClose}><h3>{product.name}</h3></Link><p>{FORMATS[item.format].label} · {item.size} ml</p><span>{money(variantPrice(product,item.format,item.size)*item.quantity)}</span><div className="bag-item-controls"><Quantity label={`${product.name} quantity`} value={item.quantity} onChange={quantity=>setCart(cart.map(i=>i.key===item.key?{...i,quantity}:i))}/><button className="subtle-button" onClick={()=>setCart(cart.filter(i=>i.key!==item.key))} aria-label={`Remove ${product.name}, ${FORMATS[item.format].label}, ${item.size} ml`}>Remove</button></div></div></article>;})}</div><div className="bag-bottom"><div className="subtotal"><span>Item subtotal</span><strong>{money(total)}</strong></div><p>Availability and shipping confirmed personally.{currency!=='INR'&&' Indicative conversion; final quote in INR.'}</p><a className="primary-button" href={orderUrl(cart)} target="_blank" rel="noreferrer">Order on WhatsApp <MessageCircle size={18}/></a><span className="bag-disclaimer">Your message opens in WhatsApp. Send it when you’re ready.</span></div></>:<div className="empty-bag"><ShoppingBag size={34} strokeWidth={1}/><h3>A little space for<br/><i>something personal.</i></h3><p>Your bag is empty. Explore the collection<br/>and find a fragrance to make your own.</p><button className="text-link" onClick={onClose}>Return to the collection <ArrowRight size={17}/></button></div>}</Modal>;}

function HomeExperience({format,selectedFormat,selectedId,onSceneMotion,restorePosition=0}){
 const {products,setSceneReady}=useStore(),navigate=useContext(Navigation);
 const featured=useMemo(()=>featuredProducts(products),[products]);
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),[fallback,setFallback]=useState(false),[ready,setReady]=useState(false);
 const initialEnd=!!selectedId||location.hash==='#featured-perfumes';
 const openingEnabled=useRef(!initialEnd&&scrollY<1&&restorePosition<1).current;
 const [phase,setPhase]=useState(initialEnd?'collection':'stone');
 const track=useRef(),stage=useRef(),story=useRef(),reveal=useRef(initialEnd?1:0),phaseRef=useRef(phase),sceneReady=useRef(false),pendingFocus=useRef(false);
 const metrics=useRef({top:0,height:innerHeight,outro:0}),selection=useRef(selectedId),staticRef=useRef(false);
 const staticMode=reduced||fallback||featured.length===0;selection.current=selectedId;staticRef.current=staticMode;
 useEffect(()=>{const media=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(media.matches);media.addEventListener('change',change);return()=>media.removeEventListener('change',change);},[]);
 const updateLayers=React.useCallback((value,cameraMoving=false,openingProgress=1)=>{
  if(!track.current)return;
  const layers=homeRevealLayers(value),outro=selection.current?0:metrics.current.outro;
  story.current?.setProgress(staticRef.current?0:layers.storyProgress,openingProgress);
  track.current.style.setProperty('--home-progress',String(value));
  track.current.style.setProperty('--home-brand-opacity',String(layers.brandOpacity));
  track.current.style.setProperty('--home-edit-opacity',String(layers.collectionOpacity*(1-outro)*(cameraMoving?0:1)));
  track.current.style.setProperty('--home-label-opacity',String(layers.collectionOpacity));
  track.current.dataset.revealProgress=value.toFixed(4);
  const next=selection.current?'collection':layers.selectionReady&&sceneReady.current&&!cameraMoving&&outro<.98?'collection':layers.brandOpacity>=.5?'stone':outro>=.98?'footer':'transition';
  if(phaseRef.current!==next){phaseRef.current=next;setPhase(next);}
  if(next==='collection'&&pendingFocus.current){pendingFocus.current=false;requestAnimationFrame(()=>track.current?.querySelector('.scene-zone:not(:disabled),.home-static-niche')?.focus({preventScroll:true}));}
 },[]);
 const explore=React.useCallback((behavior='smooth')=>{
  if(staticRef.current){const el=document.getElementById('featured-perfumes');if(el){window.scrollTo({top:el.getBoundingClientRect().top+scrollY-90,behavior:'instant'});if(pendingFocus.current){pendingFocus.current=false;requestAnimationFrame(()=>el.querySelector('button')?.focus({preventScroll:true}));}}return;}
  const {top,height}=metrics.current;if(behavior==='instant')reveal.current=1;
  window.scrollTo({top:top+height*HOME_REVEAL_SCREENS,behavior});
 },[]);
 useLayoutEffect(()=>{
  if(staticMode)return;
  const update=()=>{if(selection.current)return;const m=metrics.current;reveal.current=clampReveal((scrollY-m.top)/(m.height*HOME_REVEAL_SCREENS));m.outro=clampReveal((scrollY-m.top-m.height*(HOME_REVEAL_SCREENS+HOME_HOLD_SCREENS))/(m.height*.28));};
  const measure=()=>{
   if(!stage.current||!track.current)return;
   const old=metrics.current,height=stage.current.clientHeight,top=track.current.getBoundingClientRect().top+scrollY;
   const fraction=(scrollY-old.top)/old.height;
   if(old.measured&&Math.abs(height-old.height)>2&&fraction>=0&&fraction<=HOME_REVEAL_SCREENS+HOME_HOLD_SCREENS&&!selection.current)window.scrollTo({top:top+fraction*height,behavior:'instant'});
   metrics.current={top,height,outro:0,measured:true};update();
  };
  measure();const observer=new ResizeObserver(measure);observer.observe(stage.current);
  window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',measure);
  const hash=()=>{if(location.hash==='#featured-perfumes'&&!selection.current)explore('instant');};
  window.addEventListener('hashchange',hash);hash();
  return()=>{observer.disconnect();window.removeEventListener('scroll',update);window.removeEventListener('resize',measure);window.removeEventListener('hashchange',hash);};
 },[staticMode,explore]);
 useEffect(()=>{if(staticMode){sceneReady.current=true;setReady(true);setSceneReady(true);onSceneMotion(false);reveal.current=1;metrics.current.outro=0;updateLayers(1);}},[staticMode,selectedId]);
 const onReady=()=>{sceneReady.current=true;setReady(true);setSceneReady(true);};
 const focusEdit=()=>{const m=metrics.current;if(scrollY<m.top+m.height*HOME_REVEAL_SCREENS*.999||scrollY>m.top+m.height*(HOME_REVEAL_SCREENS+HOME_HOLD_SCREENS))explore('instant');};
 const exploreHero=e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();pendingFocus.current=e.detail===0;explore(staticMode?'instant':'smooth');};
 const invitation=<Link className="shelf-invitation" to="/shelf"><span><small>THE COMPLETE COLLECTION</small><strong>Open the fragrance shelf</strong><span>Explore all {products.length} fragrances</span></span><ArrowUpRight size={25} strokeWidth={1}/></Link>;
 const choose=p=>navigate(`/products/${p.id}?format=${format}&view=featured`);
 const selectedProduct=featured.find(p=>p.id===selectedId);
 return <section className={`home-experience home-campaign ${staticMode?'home-static':''} ${ready?'home-ready':''} ${selectedId?'collection-detail-open':''}`} style={{'--home-track-height':`${(1+HOME_REVEAL_SCREENS+HOME_HOLD_SCREENS)*100}svh`,'--home-featured-top':`${HOME_REVEAL_SCREENS*100}svh`}} data-home-phase={phase} ref={track} aria-label="NURA — the art of fragrance">
  {staticMode?<><HeroStory ref={story} staticMode onExplore={exploreHero} LinkComponent={Link}/><section id="featured-perfumes" className="home-static-collection" aria-label="Five featured fragrances"><div className="home-static-grid">{featured.map(p=><button key={p.id} className="home-static-niche" onClick={()=>choose(p)} aria-label={`Explore ${p.name}`}><Bottle product={p} format={format} eager/><span>{p.name}</span></button>)}</div><div className="home-static-edit"><Eyebrow>THE HOUSE EDIT / FIVE FRAGRANCES</Eyebrow>{invitation}</div></section>{selectedProduct&&<div className="home-static-closeup" aria-hidden="true"><Bottle product={selectedProduct} format={selectedFormat} large eager/></div>}</>:<>
   <div className="home-stage" ref={stage}>
    <SceneGallery selectedFormat={selectedFormat} layout="featured" items={featured} index={0} selectedId={selectedId} revealProgressRef={reveal} openingEnabled={openingEnabled} onRevealProgress={updateLayers} interactionEnabled={phase==='collection'} onReady={onReady} onFallback={()=>setFallback(true)} onProductFocus={focusEdit} onMotion={onSceneMotion} onIndexChange={()=>{}} onSelect={choose}/>
    <HeroStory ref={story} openingEnabled={openingEnabled} interactive={phase==='stone'&&!selectedId} onExplore={exploreHero} LinkComponent={Link}/>
    <div className="home-edit" inert={phase!=='collection'||undefined} aria-hidden={phase!=='collection'||undefined}><Eyebrow>THE HOUSE EDIT / FIVE FRAGRANCES</Eyebrow>{invitation}</div>
   </div>
   <div id="featured-perfumes" className="home-featured-anchor" aria-hidden="true"/>
  </>}
 </section>;
}

function ShelfCollection({format,selectedFormat,filters,setFilters,selectedId,onSceneMotion,onFilter}){
 const {products,setSceneReady}=useStore(),navigate=useContext(Navigation),marker=useRef();
 const [width,setWidth]=useState(document.documentElement.clientWidth),[top,setTop]=useState(270);
 const filtered=useMemo(()=>filterProducts(products,{...filters,format}),[products,filters,format]);
 const items=selectedId&&!filtered.some(p=>p.id===selectedId)?products:filtered;
 useLayoutEffect(()=>{const measure=()=>{setWidth(document.documentElement.clientWidth);if(marker.current)setTop(marker.current.getBoundingClientRect().top+scrollY);};measure();window.addEventListener('resize',measure);return()=>window.removeEventListener('resize',measure);},[]);
 return <section className={`shelf-collection ${selectedId?'collection-detail-open':''}`} aria-label="The fragrance shelf">
  <div className="shelf-heading"><div><Eyebrow>NURA / THE COMPLETE COLLECTION</Eyebrow><h1>The fragrance <i>shelf.</i></h1><p>Find your own expression. Come closer to a fragrance.</p></div><div className="shelf-heading-controls"><span>{String(filtered.length).padStart(2,'0')} FRAGRANCES</span><button onClick={onFilter}><SlidersHorizontal size={14}/> Refine the shelf</button></div></div>
  <div className="shelf-grid-space" ref={marker} style={{height:shelfHeight(items.length,width)}}>
   <SceneGallery selectedFormat={selectedFormat} layout="shelf" shelfTop={top} items={items} index={0} selectedId={selectedId} onReady={()=>setSceneReady(true)} onMotion={onSceneMotion} onIndexChange={()=>{}} onSelect={p=>navigate(`/products/${p.id}?format=${format}&view=shelf`)}/>
   {!filtered.length&&<div className="shelf-empty"><h2>No fragrances found.</h2><button className="text-link" onClick={()=>setFilters({query:'',family:'All',gender:'All',sort:'collection'})}>Reset filters <RotateCcw size={15}/></button></div>}
  </div>
 </section>;
}
function FilterPanel({filters,setFilters,format,onFormat,onClose}){const {products}=useStore();const count=filterProducts(products,{...filters,format}).length;const update=(key,value)=>setFilters(f=>({...f,[key]:value}));return <Modal title="Explore the collection" onClose={onClose} className="filter-panel"><div className="panel-top"><h2>A scent for <i>you.</i></h2><IconButton label="Close filters" onClick={onClose}><X/></IconButton></div><p className="muted">Follow a note, a feeling, a familiar name.</p><label className="search-field"><Search size={18}/><input data-autofocus aria-label="Search fragrances or notes" placeholder="Search fragrances or notes" value={filters.query} onChange={e=>update('query',e.target.value)}/>{filters.query&&<button aria-label="Clear search" onClick={()=>update('query','')}><X size={16}/></button>}</label><fieldset><legend>FORMAT</legend><div className="choice-row">{Object.entries(FORMATS).map(([key,f])=><button className={format===key?'chosen':''} aria-pressed={format===key} key={key} onClick={()=>onFormat(key)}>{f.label}</button>)}</div></fieldset><fieldset><legend>FRAGRANCE FAMILY</legend><div className="chip-row">{['All',...new Set(products.map(p=>p.family))].map(f=><button key={f} className={filters.family===f?'chosen':''} aria-pressed={filters.family===f} onClick={()=>update('family',f)}>{f}</button>)}</div></fieldset><div className="filter-selects"><label>GENDER PREFERENCE<select value={filters.gender} onChange={e=>update('gender',e.target.value)}><option>All</option><option>Unisex</option><option>Men</option><option>Women</option></select></label><label>SORT BY<select value={filters.sort} onChange={e=>update('sort',e.target.value)}><option value="collection">Collection order</option><option value="price-up">Price: low to high</option><option value="price-down">Price: high to low</option><option value="name">Name: A–Z</option></select></label></div><div className="filter-bottom"><button className="subtle-button" onClick={()=>setFilters({query:'',family:'All',gender:'All',sort:'collection'})}>Reset filters</button><button className="primary-button" onClick={onClose}>Explore {count} fragrance{count===1?'':'s'} <ArrowRight size={17}/></button></div></Modal>;}

function ProductDetail({product,format:defaultFormat,size:defaultSize,onClose,onAdd,onNavigate,ready,onVariant,onBag,bagCount,navigationProducts,returnLabel}){
 const {products,money,currency}=useStore();
 const [format,setFormat]=useState(defaultFormat),[size,setSize]=useState(defaultSize),[quantity,setQuantity]=useState(1),[added,setAdded]=useState(false);
 const navigation=navigationProducts||products,index=navigation.findIndex(p=>p.id===product.id),timer=useRef();
 useEffect(()=>{setFormat(defaultFormat);setSize(defaultSize);setAdded(false);},[product.id,defaultFormat,defaultSize]);
 useEffect(()=>{setQuantity(1);},[product.id]);
 useEffect(()=>()=>clearTimeout(timer.current),[]);
 const update=(f,s)=>{setFormat(f);setSize(s);setAdded(false);onVariant(f,s);};
 return <Modal title={`${product.name} details`} onClose={onClose} className={`product-dialog scene-product-dialog ${ready?'detail-settled':'detail-arriving'}`}><div className="detail-top"><Link to="/" onClick={e=>{e.preventDefault();onClose();}} className="detail-wordmark" aria-label="NURA home"><BrandLogo/></Link><div className="detail-header-actions"><CurrencySelect/><button className="bag-toggle" aria-label={`Open bag, ${bagCount} items`} onClick={onBag}>Bag <span className="bag-count">{bagCount}</span></button><IconButton label="Close product details" onClick={onClose}><X size={23}/></IconButton></div></div><div className="detail-layout"><div className="detail-info"><Eyebrow>N° {product.number} / {product.family.toUpperCase()} / {product.gender.toUpperCase()}</Eyebrow><h1>{product.name}</h1><p className="detail-description">{product.description}</p><dl className="notes">{Object.entries(product.notes).map(([key,value])=><div key={key}><dt>{key==='heart'?'HEART':key.toUpperCase()}</dt><dd>{value}</dd></div>)}</dl><div className="purchase-controls"><fieldset><legend>CHOOSE YOUR FORMAT</legend><div className="choice-row">{Object.entries(FORMATS).map(([f,info])=><button key={f} aria-pressed={format===f} className={format===f?'chosen':''} onClick={()=>update(f,info.sizes[0])}>{info.label}{format===f&&<Check size={13}/>}</button>)}</div></fieldset><fieldset><legend>SIZE</legend><div className="size-row">{FORMATS[format].sizes.map(s=><button key={s} aria-pressed={size===s} className={size===s?'chosen':''} onClick={()=>update(format,s)}>{s} ml</button>)}</div></fieldset><div className="price-row"><div><strong data-testid="variant-price">{money(variantPrice(product,format,size))}</strong><small>{FORMATS[format].label} · {size} ml · {currency}{currency!=='INR'?' · indicative':''}</small></div><Quantity value={quantity} onChange={setQuantity}/></div><button disabled={product.available===false} className={`primary-button add-button ${added?'added':''}`} onClick={()=>{onAdd(product,format,size,quantity);setAdded(true);clearTimeout(timer.current);timer.current=setTimeout(()=>setAdded(false),2400);}}>{product.available===false?'Currently unavailable':added?'Added to your bag':'Add to bag'}{added?<Check size={18}/>:<Plus size={18}/>}</button><p className="purchase-note">Personal ordering via WhatsApp. Delivery across India.</p><div role="status" className="sr-only">{added?`${quantity} ${product.name}, ${FORMATS[format].label}, ${size} ml added to bag`:''}</div></div><div className="detail-bottom"><button className="back-link" onClick={onClose}><ArrowLeft size={14}/> {returnLabel||'Back to the collection'}</button><div className="detail-pagination"><IconButton label="Previous perfume" disabled={index===0} onClick={()=>onNavigate(navigation[index-1],format)}><ArrowLeft size={15}/></IconButton><span>{String(index+1).padStart(2,'0')} / {String(navigation.length).padStart(2,'0')}</span><IconButton label="Next perfume" disabled={index===navigation.length-1} onClick={()=>onNavigate(navigation[index+1],format)}><ArrowRight size={15}/></IconButton></div></div></div></div></Modal>;
}

function Footer(){return <footer className="glass-footer-wrap" id="scene-footer"><div className="glass-footer"><div className="glass-footer-row"><div><Brand/><p className="glass-letter">A house of curation. A fragrance of your own.</p></div><a className="glass-contact" href="mailto:info@nura.in"><span>Write to the house</span><ArrowRight size={22} strokeWidth={1}/></a></div><div className="glass-footer-base"><nav aria-label="Customer information">{[['/shipping','Shipping'],['/shipping-returns','Returns'],['/contact','Contact'],['/about','The house']].map(([url,label])=><Link key={url} to={url}>{label}</Link>)}</nav><span>© {new Date().getFullYear()} NURA BY BIN SADHIK</span></div></div></footer>;}
function EditorialPage({page}){return <main className="editorial-page"><div className="editorial-intro"><Eyebrow>{page.eyebrow}</Eyebrow><h1>{page.title.split('\n').map((line,i)=><React.Fragment key={line}>{i>0&&<br/>}{i===1?<i>{line}</i>:line}</React.Fragment>)}</h1><p>{page.intro}</p></div><div className="editorial-body">{page.sections.map(([title,text])=><section key={title}><h2>{title}</h2><p>{text}</p></section>)}{page.cta&&<a className="primary-button" href={`https://wa.me/919003954228?text=${encodeURIComponent(page.message)}`} target="_blank" rel="noreferrer">{page.cta}<MessageCircle size={18}/></a>}<TextLink to="/collections">Explore the collection</TextLink></div></main>;}
function Contact(){return <main className="contact-page section-wrap"><Eyebrow>AT YOUR SERVICE</Eyebrow><h1>Good conversations.<br/><i>Beautiful discoveries.</i></h1><p className="contact-intro">For a recommendation, a question about your order,<br/>or simply a place to begin.</p><div className="contact-grid"><a href="https://wa.me/919003954228" target="_blank" rel="noreferrer"><MessageCircle size={24} strokeWidth={1}/><span className="eyebrow">WHATSAPP</span><h2>Let’s talk fragrance.</h2><p>Personal recommendations and order support.</p><span>+91 90039 54228 <ArrowUpRight size={16}/></span></a><a href="mailto:info@nura.in"><Mail size={24} strokeWidth={1}/><span className="eyebrow">EMAIL</span><h2>A note to the house.</h2><p>General enquiries, gifting and feedback.</p><span>info@nura.in <ArrowUpRight size={16}/></span></a></div><div className="contact-footnote"><p><span className="eyebrow">OUR HOURS</span>Monday–Saturday, 10 am–7 pm IST<br/>Sunday closed</p><p><span className="eyebrow">OUR HOUSE</span>Exclusively online. Delivery across India.<br/><Link to="/store-locator">Official channels <ArrowUpRight size={13}/></Link></p></div></main>;}
function Finder(){const {products}=useStore();const [step,setStep]=useState(0),[answers,setAnswers]=useState({family:'All',time:'Any',gender:'All'});const questions=[{title:'What draws you in?',subtitle:'Begin with a scent family. There are no wrong answers.',key:'family',options:[['Woody','Woods & warmth','Sandalwood, cedar and oud'],['Floral','Petals & light','Jasmine, blossom and soft florals'],['Sweet','Something indulgent','Vanilla, praline and creamy notes'],['Spicy','Depth & character','Warm spices, leather and amber'],['Citrus','A fresh beginning','Citrus, fruit and brighter notes'],['All','An open mind','Let the collection surprise me']]},{title:'When will you wear it?',subtitle:'Picture a moment you would like to make your own.',key:'time',options:[['Day','The everyday','Something to carry through the day'],['Night','After dusk','For evenings and special moments'],['Any','Whenever it feels right','A scent without a schedule']]},{title:'Whose story is it?',subtitle:'A preference to guide your exploration, never a rule.',key:'gender',options:[['All','My own','Explore the whole collection'],['Women','For her','Including shared compositions'],['Men','For him','Including shared compositions'],['Unisex','To share','Fragrances beyond gender']]}];const question=questions[step];return <main className="finder-page section-wrap"><Eyebrow>THE FRAGRANCE FINDER / {step<3?`0${step+1} OF 03`:'YOUR EXPLORATION'}</Eyebrow>{question?<><div className="finder-progress">{questions.map((q,i)=><span key={q.key} className={i<=step?'complete':''}/>)}</div><h1>{question.title}</h1><p className="finder-subtitle">{question.subtitle}</p><div className="finder-options">{question.options.map(([value,label,description])=><button key={value} onClick={()=>{setAnswers(a=>({...a,[question.key]:value}));setStep(step+1);}}><span>{label}</span><small>{description}</small><ArrowUpRight size={20}/></button>)}</div>{step>0&&<button className="back-link" onClick={()=>setStep(step-1)}><ArrowLeft size={15}/> Previous question</button>}</>:<><h1>A place to <i>begin.</i></h1><p className="finder-subtitle">Three fragrances to explore, guided by the preferences you shared.</p><div className="finder-results">{recommend(products,answers).map(p=><Link className="finder-result" key={p.id} to={`/products/${p.id}`}><div className="finder-art"><Bottle product={p}/></div><Eyebrow>{p.family}</Eyebrow><h2>{p.name}</h2><p>{p.description}</p><span className="text-link">Come closer <ArrowUpRight size={15}/></span></Link>)}</div><div className="finder-end"><button className="back-link" onClick={()=>{setStep(0);setAnswers({family:'All',time:'Any',gender:'All'});}}><RotateCcw size={15}/> Start again</button><a className="text-link" href="https://wa.me/919003954228?text=Hello%20NURA%2C%20I%20would%20like%20a%20personal%20fragrance%20recommendation." target="_blank" rel="noreferrer">Ask for a recommendation <ArrowUpRight size={16}/></a></div></>}</main>;}

function Storefront(){
 const {products,loaded}=useStore();
 const [route,setRoute]=useState(initialLocation),[panel,setPanel]=useState(null),[cart,setCart]=useState(()=>{try{return restoreCart(JSON.parse(localStorage.getItem('nura-bag-v1')),products);}catch{return [];}});
 const [headerExpanded,setHeaderExpanded]=useState(false),[format,setFormat]=useState(initialBrowseFormat),[filters,setFilters]=useState({query:'',family:'All',gender:'All',sort:'collection'}),[toast,setToast]=useState(''),[sceneBusy,setSceneBusy]=useState(false);
 const heroRef=useRef(null),toastTimer=useRef(),collectionReturn=useRef(location.search.includes('view=featured')?'/':'/shelf'),scrollReturn=useRef(location.search.includes('view=featured')?innerHeight*HOME_REVEAL_SCREENS:0),pendingRestore=useRef(null),routeRef=useRef(route);routeRef.current=route;
 const path=route.split('?')[0].replace(/\/+$/,'')||'/',params=new URLSearchParams(route.split('?')[1]||''),product=path.startsWith('/products/')?products.find(p=>p.id===path.split('/')[2]):null;
 const isHome=path==='/'||!!product&&params.get('view')==='featured'&&FEATURED_IDS.includes(product.id);
 const isShelf=['/shelf','/collections','/perfume','/perfume-oil'].includes(path)||!!product&&!isHome;
 const navigationProducts=isHome?featuredProducts(products):products;
 const productFormat=FORMATS[params.get('format')]?params.get('format'):format;
 const productSize=FORMATS[productFormat].sizes.includes(Number(params.get('size')))?Number(params.get('size')):FORMATS[productFormat].sizes[0];
 const navigate=(url,{preserveScroll=false}={})=>{
  const previous=routeRef.current.split('?')[0],next=url.split('?')[0];
  if(next.startsWith('/products/')&&!previous.startsWith('/products/')){collectionReturn.current=isHome?'/':isShelf?previous:'/shelf';scrollReturn.current=isHome||isShelf?scrollY:0;}
  history.replaceState({...history.state,nuraScroll:scrollY},'',location.href);
  history.pushState({nuraScroll:preserveScroll||next.startsWith('/products/')?scrollY:0},'',url);setRoute(url);setPanel(null);
  setFormat(browseFormat(next,url.split('?')[1]||'',format));
  if(!preserveScroll&&!next.startsWith('/products/'))window.scrollTo({top:0,behavior:'instant'});
 };
 const closeProduct=()=>{navigate(`${collectionReturn.current.split('?')[0]}?format=${productFormat}`,{preserveScroll:true});requestAnimationFrame(()=>window.scrollTo({top:scrollReturn.current,behavior:'instant'}));};
 useEffect(()=>{const previous=history.scrollRestoration;history.scrollRestoration='manual';const onPop=()=>{pendingRestore.current=history.state?.nuraScroll??0;setRoute(initialLocation());setPanel(null);setFormat(browseFormat(location.pathname,location.search,initialBrowseFormat()));};window.addEventListener('popstate',onPop);return()=>{history.scrollRestoration=previous;window.removeEventListener('popstate',onPop);};},[]);
 useLayoutEffect(()=>{if(!loaded||pendingRestore.current===null)return;window.scrollTo({top:pendingRestore.current,behavior:'instant'});pendingRestore.current=null;window.dispatchEvent(new Event('scroll'));},[route,loaded]);
 useEffect(()=>{setCart(c=>restoreCart(c,products));},[products]);
 useEffect(()=>{try{sessionStorage.setItem('nura-browse-format',format);}catch{}},[format]);
 useEffect(()=>{try{localStorage.setItem('nura-bag-v1',JSON.stringify(cart));}catch{}},[cart]);
 useEffect(()=>{document.title=path==='/admin'?'Catalog studio — NURA':product?`${product.name} — NURA by Bin Sadhik`:isShelf?'The fragrance shelf — NURA':pages[path]?`${pages[path].title.replace('\n',' ')} — NURA`:path==='/create'?'Fragrance Finder — NURA':path==='/contact'?'Contact — NURA':'NURA — A house of curation';},[path,product,isShelf]);
 useEffect(()=>{if(!isHome){setHeaderExpanded(true);return;}setHeaderExpanded(false);const observer=new IntersectionObserver(([entry])=>setHeaderExpanded(!entry.isIntersecting),{threshold:0,rootMargin:'-80px 0px 0px 0px'});if(heroRef.current)observer.observe(heroRef.current);return()=>observer.disconnect();},[isHome,loaded]);
 useEffect(()=>()=>clearTimeout(toastTimer.current),[]);
 useLayoutEffect(()=>{if(product)setSceneBusy(true);},[product?.id]);
 const add=(p,f,s,q)=>{setCart(c=>addItem(c,p,f,s,q));setToast(`${p.name} added to your bag`);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),3000);};
 if(path==='/admin')return <React.Suspense fallback={<p className="admin-loading">Opening studio…</p>}><Admin/></React.Suspense>;
 if(!loaded)return <div className="store-loading" role="status">NURA<span>Opening the collection</span></div>;
 return <Navigation.Provider value={navigate}>
  <div id="site-shell" className={`${isHome||isShelf?'scene-page':'content-page'} ${isHome?'home-page':isShelf?'shelf-page':''}`}>
   <a href="#main-content" className="skip-link">Skip to content</a>
   <Header expanded={headerExpanded} bagCount={cart.reduce((n,item)=>n+item.quantity,0)} onMenu={()=>setPanel('menu')} onBag={()=>setPanel('bag')} onFilter={isShelf?()=>setPanel('filters'):null} count={filterProducts(products,{...filters,format}).length}/>
   {isHome?<main id="main-content" ref={heroRef}><HomeExperience selectedFormat={productFormat} format={format} selectedId={product?.id||null} onSceneMotion={setSceneBusy} restorePosition={pendingRestore.current??0}/></main>:isShelf?<main id="main-content"><ShelfCollection selectedFormat={productFormat} format={format} filters={filters} setFilters={setFilters} selectedId={product?.id||null} onSceneMotion={setSceneBusy} onFilter={()=>setPanel('filters')}/></main>:<div id="main-content">{pages[path]?<EditorialPage page={pages[path]}/>:path==='/contact'?<Contact/>:path==='/create'?<Finder/>:<main className="not-found section-wrap"><Eyebrow>PAGE NOT FOUND</Eyebrow><h1>A different<br/><i>direction.</i></h1><p>We couldn’t find that page.</p><TextLink to="/shelf">Return to the shelf</TextLink></main>}</div>}
   <Footer/>
  </div>
  {product&&!panel&&<ProductDetail ready={!sceneBusy} navigationProducts={navigationProducts} returnLabel={isHome?'Back to the house edit':'Back to the fragrance shelf'} onBag={()=>setPanel('bag')} bagCount={cart.reduce((n,i)=>n+i.quantity,0)} onVariant={(f,s)=>{setFormat(f);const url=`/products/${product.id}?format=${f}&size=${s}&view=${isHome?'featured':'shelf'}`;history.replaceState({...history.state},'',url);setRoute(url);}} product={product} format={productFormat} size={productSize} onClose={closeProduct} onAdd={add} onNavigate={(p,f)=>navigate(`/products/${p.id}?format=${f}&view=${isHome?'featured':'shelf'}`)}/>}
  {panel==='menu'&&<MenuPanel onClose={()=>setPanel(null)}/>}
  {panel==='bag'&&<Bag cart={restoreCart(cart,products)} setCart={setCart} onClose={()=>setPanel(null)}/>}
  {panel==='filters'&&<FilterPanel filters={filters} setFilters={setFilters} format={format} onFormat={setFormat} onClose={()=>setPanel(null)}/>}
  <div className={`toast ${toast?'toast-visible':''}`} role="status">{toast&&<><Check size={15}/>{toast}<button onClick={()=>{closeProduct();setPanel('bag');setToast('');}}>View bag <ArrowUpRight size={14}/></button></>}</div>
 </Navigation.Provider>;
}

export default function App(){return <StoreProvider><Storefront/></StoreProvider>;}
