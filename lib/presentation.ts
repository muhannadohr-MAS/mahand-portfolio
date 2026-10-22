import {z} from 'zod';
import defaults from '../data/presentation.json';
const short=z.string().max(500),str=z.string().max(6000),id=short.regex(/^[a-zA-Z0-9_-]+$/);
export const siteUrl=z.string().max(1500).refine(v=>!v||/^https:\/\//i.test(v)||/^#[a-zA-Z0-9_-]+$/.test(v)||/^\/(?!\/)[a-zA-Z0-9_/?=&#%-]*$/.test(v)||/^mailto:[^\s<>]+@[^\s<>]+$/.test(v),'الرابط غير صالح');
const links=z.array(z.object({id,label:short.min(1),url:siteUrl,enabled:z.boolean()})).max(30);
export const presentationSchema=z.object({
 header:z.object({title:short,subtitle:short,enabled:z.boolean(),showLogo:z.boolean(),showNav:z.boolean().default(true),moreLabel:short.min(1).default('المزيد'),navOrder:z.array(id).max(60).default([]),navTargets:z.record(id,siteUrl).default({}),links}),
 footer:z.object({enabled:z.boolean(),title:short,subtitle:short,description:str,links}),
 hero:z.object({eyebrow:short,primaryLabel:short,primaryUrl:siteUrl,secondaryLabel:short,secondaryUrl:siteUrl,note:str,portraitTop:short,portraitCaption:short,portraitQuote:short,floatLabel:short,qualificationTitle:short,qualificationSubtitle:short,showStats:z.boolean(),showPortrait:z.boolean(),showQualification:z.boolean(),showExperienceBadge:z.boolean()}),
 membership:z.object({enabled:z.boolean(),title:short,subtitle:short,cardTitle:short,description:str,number:short,issueDate:short,expiryDate:short,image:z.string().nullable().refine(v=>v===null||v===''||/^\/api\/preview\/[a-zA-Z0-9_-]+$/.test(v)),linkLabel:short}),
 experienceOrder:z.enum(['manual','newest','oldest']),credentialOrder:z.enum(['original','newest','oldest']),
 copy:z.record(z.string().regex(/^[a-zA-Z]+$/),str).default(defaults.copy),
 sections:z.array(z.object({id,label:short,title:short,intro:str,eyebrow:short,enabled:z.boolean(),showInNav:z.boolean()})).max(30).refine(rows=>new Set(rows.map(r=>r.id)).size===rows.length,'يوجد قسم مكرر')
}).default({...defaults,experienceOrder:'manual',credentialOrder:'original'});
export function mergePresentation(value:any){return {...defaults,...value,header:{...defaults.header,...value?.header},footer:{...defaults.footer,...value?.footer},hero:{...defaults.hero,...value?.hero},membership:{...defaults.membership,...value?.membership},copy:{...defaults.copy,...value?.copy},sections:value?.sections??defaults.sections};}
