import {backend,readAdminSession,applySession,clearSession,cookieValue} from '../../../../lib/supabase-backend';
import {guardWrite,privateHeaders} from '../../../../lib/content';
import {getChatGPTUser} from '../../../chatgpt-auth';
export const dynamic='force-dynamic';
export async function POST(request:Request,{params}:{params:Promise<{action:string}>}){
 if(!guardWrite(request))return Response.json({error:'طلب غير مصرح'},{status:403,headers:privateHeaders});
 const {action}=await params;
 try{
  if(action==='logout'){const auth=await readAdminSession(request,false);if(auth)await backend('logout',{method:'POST',accessToken:auth.accessToken});return clearSession(Response.json({ok:true},{headers:privateHeaders}),request);}
  if(action==='session'){const auth=await readAdminSession(request);if(!auth)return clearSession(Response.json({error:'انتهت الجلسة.'},{status:401,headers:privateHeaders}),request);return applySession(Response.json({next:auth.user.credentialsReady?'/admin':'/admin/setup'},{headers:privateHeaders}),request,auth.tokens);}
  if(action==='change-password'){
   const auth=await readAdminSession(request);if(!auth)return Response.json({error:'سجّل الدخول أولاً.'},{status:401});
   const raw=await request.text();if(raw.length>3000)return new Response('Too large',{status:413});
   const {currentPassword,password}=JSON.parse(raw);
   if(typeof currentPassword!=='string'||typeof password!=='string'||password.length<12||password.length>200)return Response.json({error:'استخدم كلمة مرور جديدة من 12 إلى 200 حرف.'},{status:400});
   const base=process.env.SUPABASE_URL!,key=process.env.SUPABASE_PUBLISHABLE_KEY!;
   const verify=await fetch(base+'/auth/v1/token?grant_type=password',{method:'POST',headers:{apikey:key,'Content-Type':'application/json'},body:JSON.stringify({email:auth.user.email,password:currentPassword}),cache:'no-store'});
   if(!verify.ok)return Response.json({error:'كلمة المرور الحالية غير صحيحة.'},{status:403});
   const verified=await verify.json();if(verified.user.id!==auth.user.userId)return new Response('Forbidden',{status:403});
   const changed=await fetch(base+'/auth/v1/user',{method:'PUT',headers:{apikey:key,Authorization:'Bearer '+verified.access_token,'Content-Type':'application/json'},body:JSON.stringify({password}),cache:'no-store'});
   if(!changed.ok)return Response.json({error:'تعذر تغيير كلمة المرور. تحقق من متطلبات كلمة المرور في Supabase.'},{status:400});
   return applySession(Response.json({ok:true},{headers:privateHeaders}),request,verified);
  }
  if(!['login','bootstrap','setup'].includes(action))return new Response('Not found',{status:404});
  if(Number(request.headers.get('content-length')||0)>3000)return new Response('Too large',{status:413});
  let result:Response;
  if(action==='bootstrap'){
   const nativeIdentity=await getChatGPTUser();if(!nativeIdentity)return Response.json({error:'يلزم حساب صاحب الموقع لإعداد الدخول أول مرة.'},{status:403});
   result=await backend('bootstrap',{method:'POST',body:{nativeIdentity:{userId:nativeIdentity.userId,email:nativeIdentity.email}}});
  }else{
   const raw=await request.text();if(raw.length>3000)return new Response('Too large',{status:413});const body=JSON.parse(raw);
   if(action==='setup'){
    const auth=await readAdminSession(request);if(!auth)return Response.json({error:'انتهت جلسة الإعداد. أعد الدخول.'},{status:401});
    if(auth.user.credentialsReady)return Response.json({error:'تم إعداد الحساب بالفعل.'},{status:409});
    result=await backend('setup-password',{method:'POST',body:{password:body.password},accessToken:auth.accessToken});
    const data=await result.json() as any;if(!result.ok)return Response.json(data,{status:result.status,headers:privateHeaders});return applySession(Response.json({next:'/admin'},{headers:privateHeaders}),request,auth.tokens);
   }
   if(typeof body.email!=='string'||typeof body.password!=='string')return Response.json({error:'أدخل البريد وكلمة المرور.'},{status:400});
   result=await backend('login',{method:'POST',body:{email:body.email.trim().toLowerCase(),password:body.password},clientKey:request.headers.get('cf-connecting-ip')||request.headers.get('x-real-ip')||'unknown'});
  }
  const data=await result.json() as any;if(!result.ok)return Response.json(data,{status:result.status,headers:privateHeaders});
  return applySession(Response.json({next:data.user.credentialsReady?'/admin':'/admin/setup'},{headers:privateHeaders}),request,data.session);
 }catch{return Response.json({error:'تعذّر الاتصال بخدمة الدخول. حاول مرة أخرى.'},{status:503,headers:privateHeaders});}
}
