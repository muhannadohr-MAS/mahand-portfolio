import {getContent,privateHeaders} from '../../../lib/content';
export const dynamic='force-dynamic';
export async function GET(){try{
 const {content}=await getContent();const result:any={...content};
 for(const key of ['experiences','qualifications','certificates','documents','services'])result[key]=(result[key]??[]).filter((row:any)=>row.enabled!==false);
 result.documents=result.documents.map(({asset,asset_type,...row}:any)=>row);
 result.customSections=(result.customSections??[]).filter((section:any)=>section.enabled).map((section:any)=>({...section,items:section.items.filter((item:any)=>item.enabled!==false)}));
 return Response.json(result,{headers:privateHeaders});
 }catch{return Response.json({error:'تعذر تحميل المحتوى'},{status:503,headers:privateHeaders});}}
