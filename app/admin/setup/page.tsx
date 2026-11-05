import {readAdminSession} from '../../../lib/supabase-backend';
import {getContent} from '../../../lib/content';
import {redirect} from 'next/navigation';
import AdminLogin from '../AdminLogin';
export const dynamic='force-dynamic';
export default async function SetupAdmin(){const auth=await readAdminSession(undefined,false);if(!auth)redirect('/admin');if(auth.user.credentialsReady)redirect('/admin');const state=await getContent();return <AdminLogin setup email={auth.user.email} logo={state.content.brand.logo||'/assets/brand-logo.jpg'}/>;}
