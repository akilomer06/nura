// Disposable isolated data for browser QA. Never uses the owner's admin password/catalog.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {scryptSync} from 'node:crypto';
import {createServer} from 'vite';
import react from '@vitejs/plugin-react';
import {localAdmin} from '../server/local-admin.mjs';
const fixture=await fs.mkdtemp(path.join(os.tmpdir(),'nura-admin-ui-'));
await fs.mkdir(path.join(fixture,'src'));await fs.copyFile('src/catalog.json',path.join(fixture,'src/catalog.json'));
await fs.mkdir(path.join(fixture,'.nura-admin'));const salt='disposable-qa-only';
await fs.writeFile(path.join(fixture,'.nura-admin/credentials.json'),JSON.stringify({salt,hash:scryptSync('Fixture-catalog-qa-2026',salt,64).toString('hex')}));
const server=await createServer({configFile:false,root:process.cwd(),plugins:[react(),localAdmin({root:fixture})],server:{host:'127.0.0.1',port:5189,strictPort:true,fs:{deny:['**/.nura-admin/**','.env*']}}});await server.listen();console.log('Disposable admin QA: http://127.0.0.1:5189/admin');
async function stop(){await server.close();if(path.dirname(fixture)===os.tmpdir()&&path.basename(fixture).startsWith('nura-admin-ui-'))await fs.rm(fixture,{recursive:true,force:true,maxRetries:3});process.exit(0);}
process.on('SIGINT',stop);process.on('SIGTERM',stop);
