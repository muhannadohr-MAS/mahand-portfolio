import {backend,readAdminSession,applySession} from '../../../../lib/supabase-backend';
import {guardWrite,privateHeaders} from '../../../../lib/content';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 const auth=guardWrite(request)?await readAdminSession(request):null;
 if(!auth)return Response.json({error:'غير مصرح'},{status:403});
 if(Number(request.headers.get('content-length')||0)>6500000)return Response.json({error:'حجم الصورة يتجاوز 6 ميغابايت'},{status:413});
 const buffer=await request.arrayBuffer();if(buffer.byteLength>6000000||buffer.byteLength<12)return Response.json({error:'حجم غير صالح'},{status:413});
 const b=new Uint8Array(buffer);let type='';if(b[0]===255&&b[1]===216&&b[2]===255)type='image/jpeg';else if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10&&b[6]===26&&b[7]===10)type='image/png';else if(String.fromCharCode(...b.slice(0,4))==='RIFF'&&String.fromCharCode(...b.slice(8,12))==='WEBP')type='image/webp';
 if(!type)return Response.json({error:'ارفع صورة JPG أو PNG أو WEBP'},{status:400});
 try{const result=await backend('upload',{method:'POST',bytes:buffer,accessToken:auth.accessToken});return applySession(new Response(result.body,{status:result.status,headers:{...privateHeaders,'Content-Type':'application/json'}}),request,auth.tokens);}catch{return Response.json({error:'تعذر رفع المرفق إلى Supabase'},{status:503});}
}
