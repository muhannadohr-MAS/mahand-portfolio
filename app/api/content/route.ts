import {privateHeaders} from '../../../lib/content';
import {getPublishedContent} from '../../../lib/public-content';
export const dynamic='force-dynamic';
export async function GET(){try{
 const result=await getPublishedContent();
 return Response.json(result,{headers:privateHeaders});
 }catch{return Response.json({error:'تعذر تحميل المحتوى'},{status:503,headers:privateHeaders});}}
