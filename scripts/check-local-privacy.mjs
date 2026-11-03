import fs from 'node:fs/promises';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
const root=path.resolve('.nura-admin'),file=path.join(root,`privacy-probe-${randomUUID()}.txt`);
await fs.mkdir(root,{recursive:true});await fs.writeFile(file,'temporary non-sensitive access-control probe',{flag:'wx'});
try{
 for(const url of [`http://127.0.0.1:5188/.nura-admin/${path.basename(file)}`,`http://127.0.0.1:5188/@fs/${file.replaceAll('\\','/')}`]){const response=await fetch(url);console.log(response.status,new URL(url).pathname.startsWith('/@fs/')?'absolute file access':'direct file access');if(response.status!==403)throw new Error('Private catalog directory is accessible.');}
}finally{await fs.unlink(file);try{await fs.rmdir(root);}catch(e){if(e.code!=='ENOTEMPTY')throw e;}}
