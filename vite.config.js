import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import {localAdmin} from './server/local-admin.mjs';
export default defineConfig({plugins:[react(),localAdmin()],server:{port:5173,strictPort:true,fs:{deny:['.env','.env.*','*.{crt,pem}','**/.git/**','**/.nura-admin/**']}},build:{sourcemap:true}});
