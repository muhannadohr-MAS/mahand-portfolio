import 'server-only';
import {headers} from 'next/headers';
export type AdminUser={userId:string;email:string;credentialsReady:boolean};
export type SessionTokens={access_token:string;refresh_token:string;expires_in?:number};
export type AdminSession={user:AdminUser;accessToken:string;tokens?:SessionTokens};
const accessName='mas_sb_access',refreshName='mas_sb_refresh';
function config(){const values=process.env as Record<string,string>;if(!values.SUPABASE_URL||!values.SUPABASE_PORTFOLIO_BRIDGE_KEY)throw new Error('Supabase backend unavailable');return values;}
export async function backend(op:string,{method='GET',body,bytes,id,accessToken,clientKey}:{method?:string;body?:unknown;bytes?:ArrayBuffer;id?:string;accessToken?:string;clientKey?:string}={}){
 const values=config();const url=values.SUPABASE_URL+'/functions/v1/mas-portfolio-api?op='+encodeURIComponent(op)+(id?'&id='+encodeURIComponent(id):'');
 return fetch(url,{method,headers:{'x-portfolio-bridge':values.SUPABASE_PORTFOLIO_BRIDGE_KEY,apikey:values.SUPABASE_PUBLISHABLE_KEY||'',...(accessToken?{'x-admin-access':accessToken}:{}),...(clientKey?{'x-client-key':clientKey}:{}),'Content-Type':bytes?'application/octet-stream':'application/json'},body:bytes||(body?JSON.stringify(body):undefined),cache:'no-store',signal:AbortSignal.timeout(25000)});
}
export function cookieValue(h:Headers,name:string){const pair=(h.get('cookie')||'').split(';').map(p=>p.trim()).find(p=>p.startsWith(name+'='));if(!pair)return'';try{return decodeURIComponent(pair.slice(name.length+1));}catch{return'';}}
function userFrom(value:any):AdminUser{return {userId:value.id,email:value.email,credentialsReady:!!value.credentialsReady};}
export async function readAdminSession(request?:Request,allowRefresh=true):Promise<AdminSession|null>{
 const h=request?.headers||await headers(),accessToken=cookieValue(h,accessName);
 try{
  if(accessToken){const result=await backend('me',{accessToken});if(result.ok){const {user}=await result.json() as any;return {user:userFrom(user),accessToken};}}
  const refresh_token=cookieValue(h,refreshName);if(request&&allowRefresh&&refresh_token){const result=await backend('refresh',{method:'POST',body:{refresh_token}});if(result.ok){const data=await result.json() as any;return {user:userFrom(data.user),accessToken:data.session.access_token,tokens:data.session};}}
 }catch{}
 return null;
}
export async function hasRefreshCookie(){return !!cookieValue(await headers(),refreshName);}
export function applySession(response:Response,request:Request,tokens?:SessionTokens){if(!tokens)return response;const secure=new URL(request.url).protocol==='https:'?'; Secure':'';for(const [name,value,age] of [[accessName,tokens.access_token,tokens.expires_in||3600],[refreshName,tokens.refresh_token,1209600]] as const){response.headers.append('Set-Cookie',name+'='+encodeURIComponent(value)+'; Path=/; HttpOnly; SameSite=Lax; Max-Age='+age+secure);}return response;}
export function clearSession(response:Response,request:Request){const secure=new URL(request.url).protocol==='https:'?'; Secure':'';for(const name of [accessName,refreshName])response.headers.append('Set-Cookie',name+'=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'+secure);return response;}
