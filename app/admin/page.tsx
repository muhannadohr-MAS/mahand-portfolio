import {getChatGPTUser} from '../chatgpt-auth';
import {getContent} from '../../lib/content';
import {backend,readAdminSession,hasRefreshCookie} from '../../lib/supabase-backend';
import {redirect} from 'next/navigation';
import AdminClient from './AdminClient';
import AdminLogin from './AdminLogin';
export const dynamic='force-dynamic';
export default async function AdminPage(){
 const auth=await readAdminSession(undefined,false);
 if(auth){if(!auth.user.credentialsReady)redirect('/admin/setup');const state=await getContent();return <AdminClient initial={state.content} initialVersion={state.version} email={auth.user.email}/>;}
 const nativeIdentity=await getChatGPTUser();let canBootstrap=false;
 if(nativeIdentity){try{const result=await backend('bootstrap-status',{method:'POST',body:{nativeIdentity:{userId:nativeIdentity.userId,email:nativeIdentity.email}}});if(result.ok)canBootstrap=!!((await result.json()) as any).available;}catch{}}
 let logo='/assets/brand-logo.jpg';try{logo=(await getContent()).content.brand.logo||logo;}catch{}
 return <AdminLogin logo={logo} canBootstrap={canBootstrap} hasRefresh={await hasRefreshCookie()} email={canBootstrap?nativeIdentity?.email:''}/>;
}
