'use strict';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const arabic = n => new Intl.NumberFormat('ar-SA').format(n);
const hoursLabel = n => `${arabic(n)} ${n >= 3 && n <= 10 ? 'ساعات' : 'ساعة'}`;
const categories = {qualifications:'مؤهل مهني / دورة',certificates:'شهادة شكر وتقدير',documents:'وثيقة عمل حر'};
const domains = {training:'التدريب والتطوير',hr:'الموارد البشرية',business:'تطوير الأعمال'};
const fileIcon = '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M13 5h15l9 9v28H13z"/><path d="M28 5v10h9M19 24h12M19 30h12M19 36h7"/></svg>';
let portfolio, credentials = [], filtered = [], visibleLimit = 9, activeType = 'all', modalIndex = -1, lastFocus;
const text = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u064B-\u065F\u0670ـ]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').toLowerCase().replace(/\s+/g,' ').trim();
const cleanArabic = value => String(value ?? '').replace(/الأجتماعية/g,'الاجتماعية').replace(/الإجتماعية/g,'الاجتماعية').replace(/الأستشارات/g,'الاستشارات').replace(/الإستشارات/g,'الاستشارات').replace(/الأبداعي/g,'الإبداعي').replace(/اقامة/g,'إقامة').replace(/اخلاقيات/g,'أخلاقيات').replace(/توظيفخريجي/g,'توظيف خريجي').replace(/بمنطة/g,'بمنطقة').replace(/أحد مشغلين برنامج طاقات /g,'أحد مشغّلي برنامج طاقات').replace(/\s+/g,' ').trim();
function domainFor(item) {return item.job_title.includes('موارد') ? 'hr' : item.job_title.includes('تطوير أعمال') ? 'business' : 'training';}
function dateValue(value) {const [m,y] = String(value ?? '').split('/').map(Number); return (y || 0)*12 + (m || 0);}
function dateLabel(value) {const months=['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];const [m,y]=String(value ?? '').split('/').map(Number);return m&&y ? `${months[m-1]} ${arabic(y).replace(/٬/g,'')}` : value;}
function renderExperience(domain='all') {
 const rows = portfolio.experiences.filter(row => domain === 'all' || domainFor(row) === domain);
 const order=portfolio.presentation?.experienceOrder||'manual';if(order!=='manual')rows.sort((a,b)=>(dateValue(b.date_from)-dateValue(a.date_from))*(order==='oldest'?-1:1));
 $('#experienceCount').textContent=`${arabic(rows.length)} ${rows.length===1?'خبرة مهنية':'خبرات مهنية'} · ${order==='manual'?'ترتيب الملف':order==='oldest'?'الأقدم أولاً':'الأحدث أولاً'}`;
 $('#experienceList').innerHTML=rows.map(row=>`<article class="timeline-item"><div><p class="experience-date" dir="rtl">${text(dateLabel(row.date_from))} — ${text(dateLabel(row.date_to))}</p><h3>${text(cleanArabic(row.job_title))}</h3><p class="organization">${text(cleanArabic(row.organization))}</p><span class="experience-domain">${text(domains[domainFor(row)])}</span></div><span class="experience-year" aria-hidden="true">${text(String(row.date_from).split('/')[1]||'')}</span></article>`).join('');
 $$('.experience-filters button').forEach(btn=>{const on=btn.dataset.exp===domain;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',on);});
}
function filePlaceholder(item) {return `<span class="file-placeholder ${item.asset_type==='pdf'?'pdf':''}">${fileIcon}<span>${item.asset_type==='pdf'?'ملف PDF':'وثيقة مهنية'}</span></span>`;}
function cardHTML(item) {
 if(item.category==='documents')return `<article class="credential-card freelance-card" data-category="documents"><div class="credential-body"><span class="category-tag documents">مجال عمل حر</span><h3>${text(item.title)}</h3><p>${text(item.details||'خدمات مهنية تُحدد حسب الاحتياج ونطاق العمل.')}</p><span class="freelance-note">وثيقة عمل حر · عرض المسمى والخدمات</span></div></article>`;
 const image=item.asset && item.asset_type==='image' ? `<img src="${text(item.asset)}" alt="" loading="lazy" decoding="async">` : filePlaceholder(item);
 return `<button type="button" class="credential-card" data-id="${text(item.id)}" data-category="${item.category}" aria-haspopup="dialog" aria-label="عرض تفاصيل: ${text(item.title)}"><span class="credential-image">${image}<span class="preview-arrow" aria-hidden="true">↖</span></span><span class="credential-body"><span class="card-topline"><span class="category-tag ${item.category}">${categories[item.category]}</span><span class="card-year">${item.year ? text(item.year) : 'السنة غير محددة'}</span></span><h3>${text(item.title)}</h3><span class="card-org">${text(item.organization||'وثيقة عمل حر')}${item.details?`<br>${text(item.details)}`:''}</span><span class="card-foot"><span>${item.asset?'معاينة الشهادة ↖':'عرض التفاصيل ↖'}</span><span>${item.hours?hoursLabel(item.hours) : item.asset_type==='pdf'?'معاينة فقط':item.asset?'للعرض فقط':'دون مرفق'}</span></span></span></button>`;
}
function renderCredentials() {
 const query=normalize($('#search').value), year=$('#yearFilter').value, order=$('#sortOrder').value;
 filtered=credentials.filter(item=>(activeType==='all'||item.category===activeType)&&(year==='all'||(year==='unknown'?!item.year:String(item.year)===year))&&normalize(`${item.title} ${item.organization} ${item.details||''} ${item.year||''}`).includes(query));
 if(order==='newest') filtered.sort((a,b)=>(b.year||0)-(a.year||0)||a.originalIndex-b.originalIndex);
 else if(order==='oldest') filtered.sort((a,b)=>(a.year||9999)-(b.year||9999)||a.originalIndex-b.originalIndex);
 else filtered.sort((a,b)=>a.originalIndex-b.originalIndex);
 $('#credentialsGrid').innerHTML=filtered.slice(0,visibleLimit).map(cardHTML).join('');
 $('#resultsCount').textContent=`${arabic(filtered.length)} من ${arabic(credentials.length)} شهادة ومؤهل ووثيقة`;
 $('#emptyState').hidden=filtered.length>0;
 $('#resetFilters').hidden=!query&&activeType==='all'&&year==='all'&&order===(portfolio.presentation?.credentialOrder||'original');
 $('#loadMoreWrap').hidden=!filtered.length||filtered.length<=visibleLimit;
 $('#shownCount').textContent=`عرض ${arabic(Math.min(visibleLimit,filtered.length))} من ${arabic(filtered.length)}`;
 $$('.credential-filters button').forEach(btn=>{const on=btn.dataset.type===activeType;btn.classList.toggle('active',on);btn.setAttribute('aria-pressed',on);});
}
function resetFilters(){activeType='all';$('#search').value='';$('#yearFilter').value='all';$('#sortOrder').value=portfolio.presentation?.credentialOrder||'original';visibleLimit=9;renderCredentials();}
function renderModal() {
 const item=filtered[modalIndex]; if(!item)return;
 $('#dialogTitle').textContent=item.title;
 $('#dialogOrg').textContent=item.organization||'وثيقة عمل حر';
 $('#dialogCategory').textContent=categories[item.category];
 $('#dialogCategory').className=`category-tag ${item.category}`;
 $('#dialogPosition').textContent=`${arabic(modalIndex+1)} من ${arabic(filtered.length)} في النتائج الحالية`;
 $('#dialogMeta').innerHTML=`<div><dt>السنة</dt><dd>${item.year?text(item.year):'غير محددة'}</dd></div>${item.hours?`<div><dt>المدة التدريبية</dt><dd>${hoursLabel(item.hours)}</dd></div>`:''}`;
 const viewer=$('#documentViewer');viewer.classList.remove('zoomed');viewer.scrollTop=0;viewer.scrollLeft=0;
 if(item.asset_type==='image'&&item.asset){viewer.innerHTML=`<img src="${text(item.asset)}" alt="${text(item.title)}" draggable="false">`;}
 else if(item.asset_type==='pdf'&&item.asset){viewer.innerHTML=`<iframe src="${text(item.asset)}" title="${text(item.title)}" loading="lazy"></iframe>`;}
 else {viewer.innerHTML=`<div class="no-attachment">${fileIcon}<h3>لا يتوفر مرفق لهذه الوثيقة</h3><p>يمكنك الاطلاع على المعلومات المسجلة هنا. ستظهر نسخة الوثيقة عند إضافتها إلى الملف.</p></div>`;}
 $('#zoomImage').hidden=!item.asset||item.asset_type!=='image';$('#zoomImage').innerHTML='تكبير الصورة <span aria-hidden="true">⊕</span>';
 $('#dialogHelp').textContent=item.asset_type==='pdf'?'المرفق متاح للمعاينة داخل الموقع فقط.':item.asset?'يمكنك تكبير المعاينة لقراءة الشهادة بوضوح.':'المعلومات المعروضة مأخوذة من الملف الأصلي.';
 $('#previousCert').disabled=modalIndex===0;$('#nextCert').disabled=modalIndex===filtered.length-1;
}
function openModal(id){modalIndex=filtered.findIndex(item=>item.id===id);if(modalIndex<0)return;lastFocus=document.activeElement;renderModal();$('#certificateDialog').showModal();document.body.style.overflow='hidden';$('#closeDialog').focus();}
function closeModal(){$('#certificateDialog').close();}
function showError(){
 $('#experienceList').innerHTML='<p class="loading-message">تعذر تحميل البيانات. أعد تحميل الصفحة للمحاولة مرة أخرى.</p>';
 $('#resultsCount').textContent='تعذر تحميل الشهادات. أعد تحميل الصفحة للمحاولة مرة أخرى.';
}
async function init(){
 try{
  const response=await fetch('/api/content');if(!response.ok)throw new Error('Portfolio unavailable');portfolio=await response.json();
  credentials=['qualifications','certificates','documents'].flatMap(category=>(portfolio[category]||[]).map(item=>({...item,title:cleanArabic(item.title),organization:cleanArabic(item.organization),category}))).map((item,originalIndex)=>({...item,originalIndex}));
  const profile=portfolio.profile?.[0];if(profile){$('#heroRole').textContent=profile.job_title;$('#heroBio').textContent=profile.bio; const heading=$('.hero h1');const words=profile.full_name.split(' ');heading.innerHTML=words.length>1?text(words.slice(0,-1).join(' '))+'<br><span>'+text(words.at(-1))+'</span><i aria-hidden="true">.</i>':text(profile.full_name); const img=$('.portrait-window img');if(profile.avatar_url)img.src=profile.avatar_url;const stats=$$('.stats-strip>div');[1,2,3].forEach(n=>{stats[n-1].querySelector('strong').textContent=profile['stat'+n+'_value'];stats[n-1].querySelector('span').textContent=profile['stat'+n+'_label'];});const float=$('.experience-float>strong');float.textContent=profile.stat1_value;}
  applyBrand();renderServices();renderGroupConsultations();renderCustomSections();renderMembership();renderPresentation();
  const counts=[...$$('.stats-strip strong')];counts[3].textContent=portfolio.certificates.length;$('.count-label strong').textContent=String(portfolio.experiences.length).padStart(2,'0');
  $('#totalCredentials').textContent=credentials.length;
  $$('.credential-filters button').forEach(btn=>{btn.querySelector('span').textContent=btn.dataset.type==='all'?credentials.length:portfolio[btn.dataset.type].length;});
  $$('.experience-filters button').forEach(btn=>{const count=portfolio.experiences.filter(item=>btn.dataset.exp==='all'||domainFor(item)===btn.dataset.exp).length;btn.querySelector('span').textContent=String(count).padStart(2,'0');});
  const years=[...new Set(credentials.map(item=>item.year).filter(Boolean))].sort((a,b)=>b-a);
  $('#yearFilter').innerHTML='<option value="all">جميع السنوات</option>'+years.map(year=>`<option value="${year}">${year}</option>`).join('')+'<option value="unknown">دون سنة محددة</option>';
  renderExperience();renderCredentials();
 }catch(error){showError();console.error(error);}
}
$('#menuButton').addEventListener('click',()=>{const open=$('#menuButton').getAttribute('aria-expanded')==='true';$('#menuButton').setAttribute('aria-expanded',!open);$('#menuButton').setAttribute('aria-label',open?'فتح قائمة التنقل':'إغلاق قائمة التنقل');$('#mobileNav').hidden=open;});
$$('#mobileNav a').forEach(link=>link.addEventListener('click',()=>{$('#mobileNav').hidden=true;$('#menuButton').setAttribute('aria-expanded','false');$('#menuButton').setAttribute('aria-label','فتح قائمة التنقل');}));
$$('.experience-filters button').forEach(btn=>btn.addEventListener('click',()=>{if(portfolio)renderExperience(btn.dataset.exp);}));
$$('.credential-filters button').forEach(btn=>btn.addEventListener('click',()=>{if(!portfolio)return;activeType=btn.dataset.type;visibleLimit=9;renderCredentials();}));
$('#search').addEventListener('input',()=>{if(!portfolio)return;visibleLimit=9;renderCredentials();});
['#yearFilter','#sortOrder'].forEach(selector=>$(selector).addEventListener('change',()=>{if(!portfolio)return;visibleLimit=9;renderCredentials();}));
$('#resetFilters').addEventListener('click',resetFilters);$('#emptyReset').addEventListener('click',resetFilters);
$('#loadMore').addEventListener('click',()=>{const oldLimit=visibleLimit;visibleLimit+=9;renderCredentials();const cards=$$('.credential-card');cards[oldLimit]?.focus({preventScroll:true});});
$('#credentialsGrid').addEventListener('click',event=>{const card=event.target.closest('.credential-card');if(card)openModal(card.dataset.id);});
$('#closeDialog').addEventListener('click',closeModal);
$('#certificateDialog').addEventListener('click',event=>{if(event.target===$('#certificateDialog')){const rect=$('#certificateDialog').getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)closeModal();}});
$('#certificateDialog').addEventListener('close',()=>{document.body.style.overflow='';lastFocus?.focus({preventScroll:true});});
$('#previousCert').addEventListener('click',()=>{if(modalIndex>0){modalIndex--;renderModal();}});
$('#nextCert').addEventListener('click',()=>{if(modalIndex<filtered.length-1){modalIndex++;renderModal();}});
$('#zoomImage').addEventListener('click',()=>{const zoomed=$('#documentViewer').classList.toggle('zoomed');$('#zoomImage').innerHTML=zoomed?'ملاءمة الصورة <span aria-hidden="true">⊖</span>':'تكبير الصورة <span aria-hidden="true">⊕</span>';});
$('#documentViewer').addEventListener('contextmenu',e=>e.preventDefault());
$('#documentViewer').addEventListener('dragstart',e=>e.preventDefault());
document.addEventListener('keydown',event=>{
 if($('#certificateDialog').open){if(event.key==='ArrowLeft'&&modalIndex<filtered.length-1){event.preventDefault();modalIndex++;renderModal();}if(event.key==='ArrowRight'&&modalIndex>0){event.preventDefault();modalIndex--;renderModal();}return;}
 if(event.key==='/'&&!['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)){event.preventDefault();$('#search').scrollIntoView({block:'center'});$('#search').focus({preventScroll:true});}
 if(event.key==='Escape'&&!$('#mobileNav').hidden){$('#mobileNav').hidden=true;$('#menuButton').setAttribute('aria-expanded','false');$('#menuButton').focus();}
});
function applyBrand(){const brand=portfolio.brand;if(!brand)return;const root=document.documentElement;const colors={'--navy':brand.dark,'--navy-deep':brand.dark,'--teal':brand.accent,'--gold':brand.highlight,'--paper':brand.background};Object.entries(colors).forEach(([key,value])=>{if(/^#[a-f0-9]{6}$/i.test(value))root.style.setProperty(key,value);});if(brand.logo)$$('.brand-logo').forEach(img=>img.src=brand.logo);}
function renderServices(filter='all') {const rows=(portfolio.services||[]).filter(r=>filter==='all'||r.category===filter);$('#servicesGrid').innerHTML=rows.map((r,i)=>{const contact=portfolio.contact||{};let href=r.order_url||'';if(!href&&contact.whatsapp)href='https://wa.me/'+contact.whatsapp.replace(/[^0-9]/g,'')+'?text='+encodeURIComponent('السلام عليكم، أود الاستفسار عن خدمة: '+r.title);if(!href)href=contact.raed||'mailto:'+contact.email;const valid=/^(https:\/\/|mailto:)/i.test(href);return `<article class="service-card"><div class="service-top"><span class="service-number">${String(i+1).padStart(2,'0')}</span><span class="category-tag">${r.category==='individuals'?'للأفراد':'للمؤسسات والشركات'}</span></div><h3>${text(r.title)}</h3><p>${text(r.description)}</p><div class="service-bottom"><span>${text(r.price||'حسب الاتفاق')}</span>${valid?`<a href="${text(href)}" target="_blank" rel="noopener noreferrer">استفسر عن الخدمة <span aria-hidden="true">↖</span></a>`:''}</div></article>`;}).join('')||'<p class="section-description">لا توجد خدمات ضمن هذه الفئة حاليًا.</p>';$$('.service-filters button').forEach(b=>{const on=b.dataset.service===filter;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on);});}
$$('.service-filters button').forEach(b=>b.addEventListener('click',()=>{if(portfolio)renderServices(b.dataset.service);}));
function renderGroupConsultations(){
 const settings=portfolio.groupConsultations, section=$('#group-consultations');
 const enabled=!!settings&&settings.enabled!==false;section.hidden=!enabled;$$('[data-group-nav]').forEach(a=>a.hidden=!enabled);if(!enabled)return;
 $('#groupConsultationsHeading').textContent=settings.title;$('#groupConsultationsIntro').textContent=settings.intro;
 const topics=settings.topics||[],steps=settings.steps||[];
 $('#groupConsultationsContent').innerHTML=`<p class="consultation-audience"><span aria-hidden="true">↗</span>${text(settings.audience)}</p><div class="consultation-layout"><aside class="consultation-format"><span class="consultation-mark" aria-hidden="true">✳</span><h3 data-edit="groupAsideTitle">حوار مشترك.<br>ورؤية أكثر وضوحًا.</h3><p data-edit="groupAsideBody">مساحة لمناقشة الحالة الإدارية والاستفادة من وجهات نظر متعددة.</p><dl><div><dt>طريقة التقديم</dt><dd>${text(settings.format)}</dd></div><div><dt>مدة الجلسة</dt><dd>${text(settings.duration)}</dd></div><div><dt>التكلفة</dt><dd>${text(settings.pricing)}</dd></div></dl></aside><div class="consultation-topics"><p class="consultation-label" data-edit="groupTopicsLabel">محاور يمكن مناقشتها</p>${topics.map((topic,i)=>`<article class="consultation-topic"><span class="topic-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><div><h3>${text(topic.title)}</h3><p>${text(topic.description)}</p></div></article>`).join('')}<div class="consultation-outcomes"><h3 data-edit="groupOutcomesTitle">ماذا نهدف أن تحقق المجموعة؟</h3><ul>${(settings.outcomes||[]).map(outcome=>`<li>${text(outcome)}</li>`).join('')}</ul></div></div></div><div class="consultation-steps" aria-label="خطوات تنسيق الاستشارة">${steps.map((step,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span><h3>${text(step.title)}</h3><p>${text(step.description)}</p></div>`).join('')}</div><div class="consultation-request"><div class="consultation-request-copy"><p class="eyebrow" data-edit="groupRequestEyebrow">لنبدأ من احتياج مجموعتك</p><h3 data-edit="groupRequestTitle">ما التحدّي الذي ترغبون في مناقشته؟</h3><p data-edit="groupRequestBody">اختر المحور، وأضف وصفًا مختصرًا لتسهيل تنسيق الجلسة.</p></div><div class="consultation-request-fields"><label for="consultationTopic">محور الاستشارة</label><select id="consultationTopic"><option value="">أرغب في تحديد المحور معكم</option>${topics.map(topic=>`<option value="${text(topic.id)}">${text(topic.title)}</option>`).join('')}</select><label for="consultationChallenge">وصف مختصر للاحتياج <span>(اختياري)</span></label><textarea id="consultationChallenge" rows="3" maxlength="1000" placeholder="مثال: نرغب في تحسين توزيع المهام ومتابعة أداء الفريق…"></textarea><a class="button primary" id="requestGroupConsultation" target="_blank" rel="noopener noreferrer">${text(settings.ctaLabel)} <span aria-hidden="true">↖</span></a><p class="consultation-confirmation">${text(settings.confirmationNote)}</p></div></div>`;
 const updateRequest=()=>{const contact=portfolio.contact||{},topic=topics.find(t=>t.id===$('#consultationTopic').value),challenge=$('#consultationChallenge').value.trim();const message='السلام عليكم، أرغب في تنسيق استشارة إدارية جماعية.\nالمحور: '+(topic?.title||'يُحدد بعد مناقشة الاحتياج')+(challenge?'\nالاحتياج: '+challenge:'');const number=(contact.whatsapp||'').replace(/[^0-9]/g,'');let href=number?'https://wa.me/'+number+'?text='+encodeURIComponent(message):contact.email?'mailto:'+contact.email+'?subject='+encodeURIComponent(settings.title)+'&body='+encodeURIComponent(message):contact.raed;const link=$('#requestGroupConsultation');if(href&&/^(https:\/\/|mailto:)/i.test(href)){link.href=href;link.hidden=false;}else{link.removeAttribute('href');link.hidden=true;}};
 $('#consultationTopic').addEventListener('change',updateRequest);$('#consultationChallenge').addEventListener('input',updateRequest);updateRequest();
}

function renderCustomSections(){
 const sections=(portfolio.customSections||[]).filter(section=>section.enabled);$$('[data-custom-nav]').forEach(node=>node.remove());
 $('#customSectionsContent').innerHTML=sections.map(section=>`<section class="custom-content-section section-pad custom-layout-${text(section.layout)}" id="custom-${text(section.id)}" aria-labelledby="custom-heading-${text(section.id)}"><div class="container"><div class="section-heading"><div><p class="eyebrow section-eyebrow">المزيد من مهند</p><h2 id="custom-heading-${text(section.id)}">${text(section.title)}</h2>${section.intro?`<p class="section-description custom-copy">${text(section.intro)}</p>`:''}</div></div><div class="custom-content-items">${section.items.filter(item=>item.enabled!==false).map(item=>`<article class="custom-content-item">${section.layout==='pdf'&&item.pages?.length?`<details class="pdf-preview"><summary>معاينة ${text(item.fileName||item.title)} <span>${arabic(item.pages.length)} صفحة ↓</span></summary><div class="pdf-pages">${item.pages.map((page,i)=>`<figure><img src="${text(page)}" alt="${text(item.title)} — صفحة ${i+1}" loading="lazy" draggable="false"><figcaption>صفحة ${arabic(i+1)} من ${arabic(item.pages.length)}</figcaption></figure>`).join('')}</div></details>`:''}${section.layout!=='pdf'&&item.image?`<img src="${text(item.image)}" alt="${text(item.title||section.title)}" loading="lazy" draggable="false">`:''}<div>${item.title?`<h3>${text(item.title)}</h3>`:''}${item.body?`<p class="custom-copy">${text(item.body)}</p>`:''}${item.url&&/^https:\/\//i.test(item.url)?`<a class="text-link" href="${text(item.url)}" target="_blank" rel="noopener noreferrer">${text(item.linkLabel||'اعرف المزيد')} <span aria-hidden="true">↖</span></a>`:''}</div></article>`).join('')}</div></div></section>`).join('');
 const links=sections.filter(section=>section.showInNav).map(section=>`<a href="#custom-${text(section.id)}" data-custom-nav>${text(section.title)}</a>`).join('');
 if(links){$('.desktop-nav').insertAdjacentHTML('beforeend',`<details class="more-nav" data-custom-nav><summary>المزيد <span aria-hidden="true">⌄</span></summary><div>${links}</div></details>`);$('#mobileNav').insertAdjacentHTML('beforeend',links);$$('[data-custom-nav] a,a[data-custom-nav]').forEach(link=>link.addEventListener('click',()=>{const more=$('.more-nav');if(more)more.open=false;$('#mobileNav').hidden=true;$('#menuButton').setAttribute('aria-expanded','false');$('#menuButton').setAttribute('aria-label','فتح قائمة التنقل');}));}
}

init();
