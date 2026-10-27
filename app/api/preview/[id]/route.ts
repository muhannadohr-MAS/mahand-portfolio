import {backend} from '../../../../lib/supabase-backend';
export const dynamic='force-dynamic';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
 // A navigation or download request cannot retrieve a source document. The app
 // only serves its reduced image previews as same-origin image subresources.
 const ref=request.headers.get('referer');let sameOrigin=false;
 try{sameOrigin=!!ref&&new URL(ref).origin===new URL(request.url).origin;}catch{}
 const destination=request.headers.get('sec-fetch-dest');
 const imageRequest=destination==='image'||(process.env.NODE_ENV==='development'&&!destination);
 if(!imageRequest||!sameOrigin)return new Response('المعاينة متاحة داخل الموقع فقط.',{status:403,headers:{'Cache-Control':'no-store','Content-Type':'text/plain; charset=utf-8'}});
 const {id}=await params;if(!/^[a-zA-Z0-9_-]+$/.test(id))return new Response('Not found',{status:404});
 const headers={'Cache-Control':'private, no-store','Content-Disposition':'inline','X-Content-Type-Options':'nosniff','Cross-Origin-Resource-Policy':'same-origin','Referrer-Policy':'same-origin'};
 try{const result=await backend('preview',{id});if(!result.ok)return new Response('Not found',{status:result.status===404?404:503});return new Response(result.body,{headers:{...headers,'Content-Type':result.headers.get('content-type')||'image/jpeg'}});}catch{return new Response('Preview unavailable',{status:503});}
}
