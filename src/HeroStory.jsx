import React,{forwardRef,useImperativeHandle,useLayoutEffect,useRef,useState} from 'react';
import {ArrowRight,ArrowDown} from 'lucide-react';
import {HERO_CONFIG,heroStoryState,heroEntranceLayers} from './hero-story.mjs';
import './hero-story.css';

const productAssets={perfume:{src:'/assets/hero/perfume-original.webp',backup:'/assets/hero/perfume-original.png',ratio:821/1916,alt:'NURA perfume — original black textured cap, amber glass and green gold-bordered label'},oil:{src:'/assets/hero/perfume-oil-original.webp',backup:'/assets/hero/perfume-oil-original.png',ratio:700/2048,alt:'NURA perfume oil — original gold cap, amber glass and green gold-bordered label'}};

const HeroStory=forwardRef(function HeroStory({onExplore,LinkComponent,staticMode=false,interactive=true,openingEnabled=false},ref){
 const root=useRef(),art=useRef(),panels=useRef([]),products=useRef({}),guide=useRef(),counter=useRef(),progress=useRef(),current=useRef(0),size=useRef({width:0,height:0});
 const [failures,setFailures]=useState({});
 const opening=useRef(openingEnabled?0:1),branding=useRef();
 const apply=(value,force=false,openingProgress=opening.current)=>{
  if(!force&&value===current.current&&openingProgress===opening.current)return;
  opening.current=openingProgress;
  current.current=value;const {width,height}=size.current;if(!width||!height)return;
  const state=heroStoryState(value,width,height);
  const entrance=heroEntranceLayers(openingProgress);
  if(root.current){root.current.style.setProperty('--campaign-arrival',String(entrance.sceneOpacity));root.current.dataset.openingProgress=openingProgress.toFixed(4);}
  if(branding.current&&!staticMode){branding.current.style.opacity=String(entrance.brandOpacity);branding.current.style.transform=`translate3d(0,${entrance.y}px,0) scale(${entrance.scale})`;branding.current.setAttribute('aria-hidden',String(entrance.brandOpacity<.5));}
  for(const key of ['perfume','oil']){
   const object=products.current[key];if(!object)continue;
   const baseHeight=height*.60,baseWidth=baseHeight*productAssets[key].ratio,pose=state[key];
   object.style.transform=`translate3d(${pose.x*width-baseWidth/2}px,${pose.base*height-baseHeight}px,0) scale(${pose.height/.60})`;
  }
  if(!staticMode)panels.current.forEach((panel,i)=>{
   if(!panel)return;const pose=state.copy[i];panel.style.opacity=String(pose.opacity);panel.style.transform=`translate3d(0,${pose.y}px,0)`;
   const hidden=pose.opacity*entrance.sceneOpacity<.5;panel.inert=hidden;panel.setAttribute('aria-hidden',String(hidden));
  });
  if(guide.current)guide.current.style.opacity=String(state.guideOpacity*entrance.sceneOpacity);
  if(counter.current)counter.current.textContent=String(state.chapter+1).padStart(2,'0');
  if(progress.current)progress.current.style.transform=`scaleX(${state.progress})`;
  if(root.current){root.current.dataset.storyProgress=state.progress.toFixed(4);root.current.dataset.chapter=String(state.chapter+1);}
 };
 useImperativeHandle(ref,()=>({setProgress:(value,openingProgress=1)=>apply(value,false,openingProgress)}));
 useLayoutEffect(()=>{
  const element=staticMode?art.current:root.current;if(!element)return;
  const measure=()=>{size.current={width:element.clientWidth,height:element.clientHeight};apply(current.current,true);};
  measure();const observer=new ResizeObserver(measure);observer.observe(element);return()=>observer.disconnect();
 },[staticMode]);
 const action=phase=>phase.action==='featured'?<a className="campaign-cta" href="#featured-perfumes" onClick={onExplore}>{phase.cta}<ArrowRight size={20} strokeWidth={1}/></a>:<LinkComponent className="campaign-cta" to="/shelf">{phase.cta}<ArrowRight size={20} strokeWidth={1}/></LinkComponent>;
 const brandOpening=<div className={`campaign-opening ${staticMode?'campaign-opening-static':''}`} ref={branding} style={!staticMode?{opacity:openingEnabled?1:0}:undefined} aria-hidden={!staticMode&&!openingEnabled||undefined}><img src="/assets/brand/nura-logo.svg?v=3" alt="NURA by Bin Sadhik" width="640" height="340" fetchPriority="high" draggable="false"/><span aria-hidden="true" className="campaign-opening-rule"/><p>{HERO_CONFIG.entrance.slogan}</p></div>;
 const copy=(phase,i,summary=false)=><article className={summary?'campaign-summary-copy':'campaign-copy'} key={phase.eyebrow} ref={summary?undefined:el=>{panels.current[i]=el;}} style={!staticMode?{opacity:i===0?1:0}:undefined} aria-hidden={!staticMode&&i!==0||undefined} inert={!staticMode&&i!==0||undefined}>
  <p className="campaign-eyebrow">{phase.eyebrow}</p>
  {i===0?<h1>{phase.title.map(line=><span key={line}>{line}</span>)}</h1>:<h2>{phase.title.map(line=><span key={line}>{line}</span>)}</h2>}
  {phase.subtitle&&<p className="campaign-subtitle">{phase.subtitle}</p>}
  <p className="campaign-description">{phase.description}</p>
  {phase.cta&&action(phase)}
 </article>;
 const artwork=<div className="campaign-products" ref={art} aria-label="Perfume and perfume oil, original product photography">
  {['oil','perfume'].map(key=><div className={`campaign-product campaign-${key}`} key={key} ref={el=>{products.current[key]=el;}} style={{aspectRatio:String(productAssets[key].ratio)}}>
   <span className="campaign-contact-shadow" aria-hidden="true"/>
   {(failures[key]||0)<2?<><img className="campaign-bottle" src={failures[key]?productAssets[key].backup:productAssets[key].src} alt={productAssets[key].alt} width={key==='perfume'?821:700} height={key==='perfume'?1916:2048} fetchPriority="high" loading="eager" decoding="async" draggable="false" onError={()=>setFailures(previous=>({...previous,[key]:(previous[key]||0)+1}))}/>
   <img className="campaign-bottle-logo" src={HERO_CONFIG.branding.src} alt="" aria-hidden="true" width="1280" height="680" style={{left:`${HERO_CONFIG.branding[key].left*100}%`,top:`${HERO_CONFIG.branding[key].top*100}%`,width:`${HERO_CONFIG.branding[key].width*100}%`}} draggable="false"/>
   <span className="campaign-mirror" aria-hidden="true"><img src={failures[key]?productAssets[key].backup:productAssets[key].src} alt="" draggable="false"/></span></>:<span className="campaign-asset-unavailable">{key==='perfume'?'Perfume':'Perfume oil'}<small>Image unavailable</small></span>}
  </div>)}
 </div>;
 if(staticMode)return <section className="campaign-static" aria-label="NURA fragrance introduction">{brandOpening}<div className="campaign-static-opening">{copy(HERO_CONFIG.phases[0],0)}{artwork}</div><div className="campaign-static-summary">{HERO_CONFIG.phases.slice(1).map((phase,i)=>copy(phase,i+1,true))}</div></section>;
 return <div className="campaign-hero" ref={root} style={{'--campaign-arrival':openingEnabled?0:1}} inert={!interactive||undefined} aria-hidden={!interactive||undefined}>
  <div className="campaign-copy-shade" aria-hidden="true"/>{artwork}
  <div className="campaign-copy-layers">{HERO_CONFIG.phases.map((phase,i)=>copy(phase,i))}</div>
  <div className="campaign-scroll" ref={guide}><span>SCROLL TO DISCOVER</span><ArrowDown size={17} strokeWidth={1}/></div>
  <div className="campaign-index" aria-hidden="true"><b ref={counter}>01</b><span><i ref={progress}/></span><small>04</small></div>
  {brandOpening}
 </div>;
});
export default HeroStory;
