import {backend,readAdminSession} from './supabase-backend';
import {z} from 'zod';
import seed from '../data/seed.json';
import {presentationSchema,mergePresentation} from './presentation';

const str=z.string().max(6000), short=z.string().max(500);
const asset=z.string().refine(v=>v===''||/^\/api\/preview\/[a-zA-Z0-9_-]+$/.test(v)||v==='/assets/brand-logo.jpg','مسار المرفق غير صالح').nullable().optional();
const credential=z.object({enabled:z.boolean().optional(),id:short,title:short.min(1),organization:short.optional(),details:str.optional(),year:z.number().int().min(1950).max(2100).nullable().optional(),hours:z.number().min(0).max(10000).nullable().optional(),asset,asset_type:z.literal('image').optional(),sort_order:z.number().optional()});
const hex=z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const contentSchema=z.object({
 profile:z.array(z.object({full_name:short.min(1),job_title:short,bio:str,organization:short.optional(),avatar_url:asset,stat1_value:short,stat1_label:short,stat2_value:short,stat2_label:short,stat3_value:short,stat3_label:short,stat4_value:short,stat4_label:short})).length(1),
 experiences:z.array(z.object({enabled:z.boolean().optional(),id:short,job_title:short.min(1),organization:short.min(1),date_from:short,date_to:short,sort_order:z.number().optional()})).max(200),
 qualifications:z.array(credential).max(300),certificates:z.array(credential).max(300),documents:z.array(credential).max(100),
 customSections:z.array(z.object({id:short.regex(/^[a-zA-Z0-9_-]+$/),title:short.min(1),intro:str,layout:z.enum(['text','cards','gallery','pdf']),showInNav:z.boolean(),enabled:z.boolean(),sort_order:z.number().optional(),items:z.array(z.object({enabled:z.boolean().optional(),pages:z.array(z.string().regex(/^\/api\/preview\/[a-zA-Z0-9_-]+$/)).max(20).optional(),fileName:short.optional(),id:short.regex(/^[a-zA-Z0-9_-]+$/),title:short,body:str,image:asset,url:z.string().max(1500).refine(v=>!v||/^https:\/\//i.test(v)),linkLabel:short})).max(100)})).max(20).default([]),
 groupConsultations:z.object({enabled:z.boolean(),title:short.min(1),intro:str.min(1),audience:str,topics:z.array(z.object({id:short.min(1),title:short.min(1),description:str})).min(1).max(12),format:short,duration:short,pricing:short,outcomes:z.array(short.min(1)).min(1).max(12),steps:z.array(z.object({title:short.min(1),description:str})).min(1).max(8),ctaLabel:short.min(1),confirmationNote:str}).default(seed.groupConsultations),
 presentation:presentationSchema,
 services:z.array(z.object({enabled:z.boolean().optional(),id:short,title:short.min(1),description:str,category:z.enum(['individuals','corporate']),price:short,order_url:z.string().max(1500).refine(v=>!v||/^https:\/\//i.test(v)),sort_order:z.number().optional()})).max(100),
 contact:z.object({email:short,whatsapp:z.string().max(30).regex(/^\+?[0-9 ]*$/),raed:z.string().max(1500).refine(v=>!v||/^https:\/\//i.test(v))}),
 brand:z.object({logo:asset,dark:hex,accent:hex,highlight:hex,background:hex})
});
export async function getContent(){
 const result=await backend('read');if(!result.ok)throw new Error('Supabase content unavailable');
 const state=await result.json() as {content:any;version:number;updatedAt:string};const content=state.content,legacy=!content.presentation;
 const documents=(content.documents??[]).map((item:any)=>legacy?{...item,details:item.details||seed.documents.find(d=>d.id===item.id)?.details||''}:item);
 const serviceName=(title:string)=>title.replace(/[أإآ]/g,'ا').replace(/[\u064B-\u065Fـ]/g,'').replace(/\s+/g,' ').trim();
 const extra=legacy?seed.services.filter(s=>['management-consulting','group-management-consulting'].includes(s.id)&&!content.services.some((r:any)=>r.id===s.id||serviceName(r.title)===serviceName(s.title))):[];
 return {content:{...content,documents,services:[...content.services,...extra],presentation:mergePresentation(content.presentation),groupConsultations:content.groupConsultations??seed.groupConsultations,customSections:content.customSections??[]},version:state.version,updatedAt:state.updatedAt};
}
export async function authorizeAdmin(request?:Request){return (await readAdminSession(request))?.user||null;}
export function guardWrite(request:Request){if(request.headers.get('x-portfolio-admin')!=='1')return false;if(request.headers.get('sec-fetch-site')==='cross-site')return false;const origin=request.headers.get('origin');return !!origin&&origin===new URL(request.url).origin;}
export const privateHeaders={'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'};
