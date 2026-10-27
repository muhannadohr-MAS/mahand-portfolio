'use strict';
function safeSiteUrl(url){return typeof url==='string'&&(/^(https:\/\/|mailto:)/i.test(url)||/^#[a-zA-Z0-9_-]+$/.test(url)||/^\/(?!\/)[a-zA-Z0-9_/?=&#%-]*$/.test(url));}
function renderMembership(){
 const m=portfolio.presentation?.membership,section=document.querySelector('#membership');if(!m||!section)return;section.hidden=!m.enabled;
 const raed=portfolio.contact?.raed;
 section.querySelector('.membership-content').innerHTML=`<article class="membership-info"><span class="membership-seal" aria-hidden="true">✧</span><span class="category-tag">${text(m.subtitle)}</span><h3>${text(m.title)}</h3><h4>${text(m.cardTitle)}</h4><p>${text(m.description)}</p><dl><div><dt>رقم العضوية</dt><dd dir="ltr">${text(m.number)}</dd></div><div><dt>الإصدار</dt><dd dir="ltr">${text(m.issueDate)}</dd></div><div><dt>الانتهاء</dt><dd dir="ltr">${text(m.expiryDate)}</dd></div></dl>${raed&&/^https:\/\//i.test(raed)?`<a class="button primary" href="${text(raed)}" target="_blank" rel="noopener noreferrer">${text(m.linkLabel)} ↖</a>`:''}</article>${m.image?`<figure class="membership-card"><img src="${text(m.image)}" alt="${text(m.cardTitle)} — ${text(m.title)}" loading="lazy" draggable="false"><figcaption>${text(m.cardTitle)} · ${text(m.title)}</figcaption></figure>`:''}`;
}
function renderPresentation(){
 const settings=portfolio.presentation;if(!settings)return;
 const set=(selector,value)=>{const node=document.querySelector(selector);if(node)node.textContent=value;};
 const toggle=(selector,shown)=>{const node=document.querySelector(selector);if(node)node.hidden=!shown;};
 const h=settings.header,f=settings.footer,hero=settings.hero;
 const brand=document.querySelector('.site-header .brand');brand.querySelector('span').innerHTML=`${text(h.title)}<small>${text(h.subtitle)}</small>`;brand.setAttribute('aria-label',h.title+'، الرئيسية');brand.querySelector('img').hidden=!h.showLogo;document.querySelector('.site-header').hidden=!h.enabled;
 set('.hero-copy>.eyebrow',hero.eyebrow);set('.hero-note p',hero.note);set('.profile-card-top>span',hero.portraitTop);set('.portrait-caption>span',hero.portraitCaption);set('.portrait-caption>strong',hero.portraitQuote);set('.experience-float>span',hero.floatLabel);set('.qualification-float strong',hero.qualificationTitle);set('.qualification-float small',hero.qualificationSubtitle);
 toggle('.stats-strip',hero.showStats);toggle('.hero-visual',hero.showPortrait);toggle('.experience-float',hero.showExperienceBadge);toggle('.qualification-float',hero.showQualification);
 document.querySelector('.hero-grid').classList.toggle('hero-without-portrait',!hero.showPortrait);
 for(const [selector,label,url] of [['.hero-actions .primary',hero.primaryLabel,hero.primaryUrl],['.hero-actions .text-link',hero.secondaryLabel,hero.secondaryUrl]]){const a=document.querySelector(selector);a.textContent=label;a.hidden=!label||!safeSiteUrl(url);if(!a.hidden)a.href=url;}
 const footer=document.querySelector('footer');footer.hidden=!f.enabled;footer.querySelector('.footer-inner').innerHTML=`<span>${text(f.title)}<small>${text(f.subtitle)}</small></span><span class="footer-description">${text(f.description)}</span><div class="footer-links">${f.links.filter(l=>l.enabled&&safeSiteUrl(l.url)).map(l=>`<a href="${text(l.url)}" ${/^https:/i.test(l.url)?'target="_blank" rel="noopener noreferrer"':''}>${text(l.label)} ↖</a>`).join('')}<span class="footer-private">● معاينة خاصة</span></div>`;
 const main=document.querySelector('#main'),custom=portfolio.customSections||[];
 const rows=[...settings.sections,...custom.filter(s=>!settings.sections.some(r=>r.id==='custom-'+s.id)).map(s=>({id:'custom-'+s.id,label:s.title,title:s.title,intro:s.intro,enabled:s.enabled,showInNav:s.showInNav}))];
 const nav=[];
 for(const row of rows){
  const node=document.getElementById(row.id);if(!node)continue;
  const enabled=row.enabled&&(row.id!=='group-consultations'||portfolio.groupConsultations.enabled)&&(row.id!=='membership'||settings.membership.enabled);
  node.hidden=!enabled;main.appendChild(node);
  if(!row.id.startsWith('custom-')&&!['home','group-consultations'].includes(row.id)){
   const heading=node.querySelector('h2');if(heading)heading.textContent=row.title;
   const eyebrow=node.querySelector('.section-eyebrow,.eyebrow');if(eyebrow)eyebrow.textContent=row.eyebrow;
   const intro=node.querySelector('.section-description');if(intro)intro.textContent=row.intro;
  }
  if(enabled&&row.showInNav)nav.push({id:'section-'+row.id,label:row.label,url:h.navTargets?.[row.id]||'#'+(row.id==='home'?'about':row.id)});
 }
 document.querySelector('#customSectionsContent').hidden=true;
 nav.push(...h.links.filter(l=>l.enabled&&safeSiteUrl(l.url)).map(l=>({...l,id:'link-'+l.id})));
 const order=h.navOrder||[],rank=id=>{const index=order.indexOf(id);return index<0?order.length:index;};nav.sort((a,b)=>rank(a.id)-rank(b.id));
 const visible=nav.filter(l=>safeSiteUrl(l.url));
 const linkHTML=l=>`<a href="${text(l.url)}" ${/^https:/i.test(l.url)?'target="_blank" rel="noopener noreferrer"':''}>${text(l.label)}</a>`;
 document.querySelector('.site-header').classList.toggle('navigation-disabled',h.showNav===false||!visible.length);
 setupAdaptiveNavigation(document.querySelector('.desktop-nav'),visible,h.moreLabel);
 document.querySelector('#mobileNav').innerHTML=visible.map(linkHTML).join('');
 document.querySelectorAll('.desktop-nav a,#mobileNav a').forEach(a=>a.addEventListener('click',()=>{const more=document.querySelector('.more-nav');if(more)more.open=false;document.querySelector('#mobileNav').hidden=true;document.querySelector('#menuButton').setAttribute('aria-expanded','false');document.querySelector('#menuButton').setAttribute('aria-label','فتح قائمة التنقل');}));
 document.querySelector('#sortOrder').value=settings.credentialOrder;
 if(settings.copy)for(const [key,copy] of Object.entries(settings.copy)){document.querySelectorAll(`[data-edit="${key}"]`).forEach(node=>node.textContent=copy);}
}
