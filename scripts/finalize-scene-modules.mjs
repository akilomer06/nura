import fs from 'node:fs/promises';
let scene=await fs.readFile('src/SceneGallery.jsx','utf8');
scene=scene.replace('floor.position.set(center,.10,16)','floor.position.set(center,.45,16)').replace('sin(vUv.y*210.0+uTime*.23)*.0005','sin(vUv.y*210.0+uTime*.23)*.00015').replace('sin(vUv.y*570.0-uTime*.13)*.00018','sin(vUv.y*570.0-uTime*.13)*.00008');
await fs.writeFile('src/SceneGallery.jsx',scene);
const app=(await fs.readFile('src/main.jsx','utf8')).replace("import {createRoot} from 'react-dom/client';\n",'').replace('function App(){','export default function App(){').replace("createRoot(document.getElementById('root')).render(<App/>);",'');
await fs.writeFile('src/App.jsx',app);
await fs.writeFile('src/main.jsx',`import React from 'react';\nimport {createRoot} from 'react-dom/client';\nimport App from './App.jsx';\n\ncreateRoot(document.getElementById('root')).render(<App/>);\n`);
console.log('Stable React refresh boundary established. Stone UVs use physical proportions.');
