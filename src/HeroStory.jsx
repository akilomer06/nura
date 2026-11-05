import React, {forwardRef, useImperativeHandle, useRef} from 'react';
import {ArrowDown} from 'lucide-react';
import {HERO_CONFIG} from './hero-story.mjs';
import './hero-story.css';

const HeroStory = forwardRef(function HeroStory({artwork, onExplore, staticMode=false, interactive=true}, ref) {
 const root = useRef();
 const captions = useRef([]);
 const current = useRef(-1);
 useImperativeHandle(ref, () => ({setProgress(progress, layers) {
  if (!root.current || staticMode) return;
  const {chapter, captionOpacity} = layers;
  if (chapter !== current.current) {
   captions.current.forEach((element,index)=>element?.setAttribute('aria-hidden',String(index!==chapter)));
   current.current = chapter;
   root.current.dataset.chapter = HERO_CONFIG.phases[chapter].name;
  }
  root.current.style.setProperty('--caption-opacity', captionOpacity);
  root.current.style.setProperty('--caption-y', `${(1-captionOpacity)*10}px`);
  root.current.style.setProperty('--story-progress', progress);
 }}), [staticMode]);
 const caption = (phase, index) => {
  const Title = index === 0 ? 'h1' : 'h2';
  return <div className="mountain-caption" key={phase.name} data-phase={phase.name} ref={element => {captions.current[index] = element;}} aria-hidden={index !== 0 || undefined}>
   <p className="mountain-eyebrow">{phase.eyebrow}</p>
   <Title>{phase.title}</Title>
   <p className="mountain-description">{phase.description}</p>
  </div>;
 };
 return <div className={`mountain-hero ${staticMode?'mountain-static':''}`} ref={root} data-chapter="origin" inert={!interactive||undefined}>
  <div className="mountain-preview" aria-hidden="true">{staticMode&&artwork&&<img src={artwork} alt="" decoding="async"/>}</div>
  <div className="mountain-shade" aria-hidden="true"/>
  <div className="mountain-editorial">
   <div className="mountain-captions">{(staticMode?HERO_CONFIG.phases.slice(0,1):HERO_CONFIG.phases).map(caption)}</div>
   <a className="mountain-explore" href="#featured-perfumes" onClick={onExplore}>Explore the collection <ArrowDown size={15} strokeWidth={1.5}/></a>
  </div>
  {!staticMode&&<div className="mountain-scroll" aria-hidden="true"><span>Scroll to follow</span><i/></div>}
 </div>;
});
export default HeroStory;
