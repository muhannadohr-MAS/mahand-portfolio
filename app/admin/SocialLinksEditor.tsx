'use client';
const platforms=[['linkedin','LinkedIn'],['x','X'],['instagram','Instagram'],['facebook','Facebook'],['youtube','YouTube'],['tiktok','TikTok'],['snapchat','Snapchat'],['whatsapp','WhatsApp'],['telegram','Telegram'],['website','موقع آخر']];
type Link={id:string;platform:string;label:string;url:string;enabled:boolean};
type Social={enabled:boolean;links:Link[]};
export default function SocialLinksEditor({value,onChange}:{value:Social;onChange:(value:Social)=>void}){
 const patch=(index:number,fields:Partial<Link>)=>onChange({...value,links:value.links.map((r,i)=>i===index?{...r,...fields}:r)});
 const move=(index:number,offset:number)=>{const links=[...value.links];[links[index],links[index+offset]]=[links[index+offset],links[index]];onChange({...value,links});};
 return <section className="admin-panel"><h2>وسائل التواصل بجانب الصورة</h2><p className="admin-help">تظهر الروابط عموديًا بجانب الصورة الشخصية. أدخل الرابط الكامل بدءًا بـ https:// ثم اضغط «حفظ التغييرات». الرابط الفارغ أو المخفي لا يظهر للزوار.</p>
 <label className="admin-toggle"><input type="checkbox" checked={value.enabled} onChange={e=>onChange({...value,enabled:e.target.checked})}/><span>إظهار وسائل التواصل في الموقع</span></label>
 {value.links.length===0&&<p className="admin-help">لم تُضف أي روابط بعد.</p>}
 {value.links.map((link,index)=><div className="settings-link" key={link.id}><div className="admin-form-grid">
 <label className="admin-field"><span>المنصة {index+1}</span><select value={link.platform} onChange={e=>patch(index,{platform:e.target.value,label:platforms.find(p=>p[0]===e.target.value)?.[1]||link.label})}>{platforms.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
 <label className="admin-field"><span>اسم الرابط {index+1}</span><input value={link.label} maxLength={80} onChange={e=>patch(index,{label:e.target.value})}/></label>
 <label className="admin-field"><span>رابط الحساب {index+1}</span><input type="url" dir="ltr" value={link.url} placeholder="https://" maxLength={1500} onChange={e=>patch(index,{url:e.target.value.trim()})}/></label>
 </div><label className="admin-toggle"><input type="checkbox" checked={link.enabled} onChange={e=>patch(index,{enabled:e.target.checked})}/><span>إظهار هذا الرابط</span></label>
 <div className="record-actions"><button type="button" disabled={index===0} onClick={()=>move(index,-1)}>↑ لأعلى</button><button type="button" disabled={index===value.links.length-1} onClick={()=>move(index,1)}>↓ لأسفل</button><button type="button" className="subtle-danger" onClick={()=>onChange({...value,links:value.links.filter((_,i)=>i!==index)})}>حذف الرابط</button></div></div>)}
 <button type="button" className="button secondary" disabled={value.links.length>=20} onClick={()=>onChange({...value,links:[...value.links,{id:crypto.randomUUID(),platform:'linkedin',label:'LinkedIn',url:'',enabled:true}]})}>+ إضافة وسيلة تواصل</button>
 </section>;
}
