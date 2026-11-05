import 'server-only';
import {unstable_cache} from 'next/cache';
import {getContent} from './content';

export const PUBLIC_CONTENT_TAG='portfolio-published-content';

// Cache only published data, never an authenticated session or the admin payload.
export function publishedContent(content:any){
 const result:any={...content};
 for(const key of ['experiences','qualifications','certificates','documents','services'])result[key]=(result[key]??[]).filter((row:any)=>row.enabled!==false);
 result.documents=result.documents.map(({asset,asset_type,...row}:any)=>row);
 result.customSections=(result.customSections??[]).filter((section:any)=>section.enabled).map((section:any)=>({...section,items:section.items.filter((item:any)=>item.enabled!==false)}));
 return result;
}

export const getPublishedContent=unstable_cache(
 async()=>publishedContent((await getContent()).content),
 ['portfolio-published-content-v1'],
 {revalidate:300,tags:[PUBLIC_CONTENT_TAG]}
);
