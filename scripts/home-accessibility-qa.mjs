// Local, disposable browser-test modes. This server is never part of the production build.
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
const mode=process.argv[2]||'reduced';
if(!['reduced','no-webgl','hero-failure'].includes(mode))throw new Error('Use reduced, no-webgl or hero-failure.');
const script=mode==='reduced'?`const nativeMedia=window.matchMedia.bind(window);window.matchMedia=q=>q.includes('prefers-reduced-motion')?{matches:true,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}:nativeMedia(q);`:mode==='hero-failure'?`const nativeContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='2d'&&this.width===512&&this.height===896)return null;return nativeContext.call(this,type,...args);};`:`const nativeContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type==='webgl'||type==='webgl2'||type==='experimental-webgl')return null;return nativeContext.call(this,type,...args);};`;
const server=await createServer({configFile:false,plugins:[react(),{name:'home-accessibility-qa',transformIndexHtml(){return [{tag:'script',children:script,injectTo:'head-prepend'},...(mode==='reduced'?[{tag:'style',children:'*{animation:none!important;transition:none!important;scroll-behavior:auto!important}',injectTo:'head'}]:[])];}}],server:{host:'127.0.0.1',port:5190,strictPort:true,fs:{deny:['.env','.env.*','**/.nura-admin/**']}}});
await server.listen();console.log(`Home QA (${mode}): http://127.0.0.1:5190/`);
const stop=async()=>{await server.close();process.exit(0);};process.on('SIGINT',stop);process.on('SIGTERM',stop);
