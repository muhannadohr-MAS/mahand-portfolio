import {getContent,contentSchema,guardWrite,privateHeaders} from '../../../../lib/content';
import {backend,readAdminSession,applySession} from '../../../../lib/supabase-backend';
export const dynamic='force-dynamic';
export async function GET(request:Request){const auth=await readAdminSession(request);if(!auth)return Response.json({error:'يلزم دخول صاحب الموقع'},{status:403,headers:privateHeaders});try{return applySession(Response.json(await getContent(),{headers:privateHeaders}),request,auth.tokens);}catch{return Response.json({error:'تعذر تحميل المحتوى'},{status:503});}}
export async function PUT(request:Request){
 if(!guardWrite(request))return Response.json({error:'غير مصرح'},{status:403,headers:privateHeaders});const auth=await readAdminSession(request);if(!auth)return Response.json({error:'غير مصرح'},{status:403,headers:privateHeaders});
 if(Number(request.headers.get('content-length')||0)>1500000)return Response.json({error:'البيانات أكبر من الحد المسموح'},{status:413});
 let body;try{const raw=await request.text();if(raw.length>1500000)return Response.json({error:'البيانات كبيرة جداً'},{status:413});body=JSON.parse(raw);}catch{return Response.json({error:'بيانات غير صالحة'},{status:400});}
 const parsed=contentSchema.safeParse(body.content);if(!parsed.success)return Response.json({error:'راجع الحقول المطلوبة والروابط والتواريخ.',details:parsed.error.issues.map(i=>i.path.join('.'))},{status:400});
 if(!Number.isInteger(body.version)||body.version<0)return Response.json({error:'إصدار غير صالح'},{status:400});
 try{const result=await backend('save',{method:'PUT',body:{content:parsed.data,version:body.version},accessToken:auth.accessToken});return applySession(new Response(result.body,{status:result.status,headers:{...privateHeaders,'Content-Type':'application/json'}}),request,auth.tokens);}catch{return Response.json({error:'تعذر الحفظ في Supabase. حاول مرة أخرى.'},{status:503});}
}
