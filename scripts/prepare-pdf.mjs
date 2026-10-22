import {cpSync,mkdirSync} from 'node:fs';
mkdirSync('public/pdfjs',{recursive:true});
for(const name of ['build/pdf.worker.min.mjs','cmaps','standard_fonts','wasm','LICENSE'])cpSync('node_modules/pdfjs-dist/'+name,'public/pdfjs/'+(name.includes('/')?'pdf.worker.min.mjs':name),{recursive:true});
