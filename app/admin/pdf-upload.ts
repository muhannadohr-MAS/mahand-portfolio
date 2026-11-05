// The original PDF stays on the owner's device. Only rendered page previews are uploaded.
export async function preparePdf(file:File,onProgress:(message:string)=>void,upload:(blob:Blob)=>Promise<string>){
 if(file.size>12000000)throw new Error('اختر ملف PDF لا يتجاوز 12 ميغابايت.');
 const buffer=new Uint8Array(await file.arrayBuffer());
 if(new TextDecoder().decode(buffer.slice(0,1024)).indexOf('%PDF-')<0)throw new Error('الملف ليس PDF صالحًا.');
 const pdfjs=await import('pdfjs-dist');
 pdfjs.GlobalWorkerOptions.workerSrc='/pdfjs/pdf.worker.min.mjs';
 const task=pdfjs.getDocument({data:buffer,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/',wasmUrl:'/pdfjs/wasm/'});
 try{
  const pdf=await task.promise;if(pdf.numPages>20)throw new Error('يمكن معاينة ملفات PDF حتى 20 صفحة. قسّم الملف إلى أجزاء أصغر.');
  const pages:string[]=[];
  for(let n=1;n<=pdf.numPages;n++){
   onProgress(`تجهيز صفحة ${n} من ${pdf.numPages}…`);
   const page=await pdf.getPage(n),base=page.getViewport({scale:1}),viewport=page.getViewport({scale:Math.min(2,1400/Math.max(base.width,base.height))});
   const canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height)+32;
   const context=canvas.getContext('2d');if(!context)throw new Error('تعذرت معالجة الملف.');
   context.fillStyle='#fffaf3';context.fillRect(0,0,canvas.width,canvas.height);
   await page.render({canvas,canvasContext:context,viewport}).promise;
   context.fillStyle='#9c7049';context.font='12px Arial';context.direction='ltr';context.fillText(`MUHANNAD SALAMA | VIEW ONLY | ${n}/${pdf.numPages}`,10,canvas.height-11);
   const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('تعذر تجهيز الصفحة.')),'image/jpeg',0.82));
   pages.push(await upload(blob));page.cleanup();canvas.width=canvas.height=0;
  }
  return pages;
 }finally{await task.destroy();}
}
