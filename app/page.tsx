import home from '../data/home.json';
import {getContent} from '../lib/content';
export const dynamic='force-dynamic';

// Only the same published fields returned by /api/content may enter the HTML.
function publishedContent(content:any){
 const result:any={...content};
 for(const key of ['experiences','qualifications','certificates','documents','services'])result[key]=(result[key]??[]).filter((row:any)=>row.enabled!==false);
 result.documents=result.documents.map(({asset,asset_type,...row}:any)=>row);
 result.customSections=(result.customSections??[]).filter((section:any)=>section.enabled).map((section:any)=>({...section,items:section.items.filter((item:any)=>item.enabled!==false)}));
 return result;
}
export default async function Home(){
 let content:any=null;
 try{content=publishedContent((await getContent()).content);}catch{}
 if(content?.profile?.[0]?.avatar_url==='/api/preview/a31f4c87-fa46-4e0b-ae60-01503670014d')content.profile[0].avatar_url='/assets/muhannad-portrait.webp';
 const avatar=content?.profile?.[0]?.avatar_url;
 const safeAvatar=typeof avatar==='string'&&(/^\/api\/preview\/[a-zA-Z0-9_-]+$/.test(avatar)||avatar==='/assets/muhannad-portrait.webp')?avatar:'';
 // Do not request the old seed portrait while waiting for the current one.
 const html=home.replace(/<img\b[^>]*alt="الصورة الشخصية لمهند سلامة"[^>]*>/,
  '<img'+(safeAvatar?' src="'+safeAvatar+'"':'')+' alt="الصورة الشخصية لمهند سلامة" fetchpriority="high" loading="eager" decoding="async">');
 const data=content?JSON.stringify(content).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026'):null;
 return <>{safeAvatar&&<link rel="preload" as="image" href={safeAvatar} fetchPriority="high"/>}<div dangerouslySetInnerHTML={{__html:html}}/>{data&&<script id="portfolio-data" type="application/json" dangerouslySetInnerHTML={{__html:data}}/>}<script src="/navigation.js" defer/><script src="/site-layout.js" defer/><script src="/app.js" defer/></>;
}
