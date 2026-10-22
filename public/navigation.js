'use strict';
// Keep the longest ordered prefix that fits; reserve the disclosure only on overflow.
function navigationFitCount(widths,available,gap,moreWidth){
 if(!widths.length)return 0;
 const total=widths.reduce((sum,width)=>sum+width,0)+gap*(widths.length-1);
 if(total<=available+0.5)return widths.length;
 let used=moreWidth,count=0;
 for(const width of widths){if(used+gap+width>available+0.5)break;used+=gap+width;count++;}
 return count;
}
function setupAdaptiveNavigation(nav,items,moreLabel){
 const header=document.querySelector('.site-header'),wrap=header.querySelector('.nav-wrap');
 const linkHTML=item=>`<a data-nav-item href="${text(item.url)}" ${/^https:/i.test(item.url)?'target="_blank" rel="noopener noreferrer"':''}>${text(item.label)}</a>`;
 nav.innerHTML=items.map(linkHTML).join('')+`<details class="more-nav" hidden><summary>${text(moreLabel||'المزيد')} <span aria-hidden="true">⌄</span></summary><div></div></details>`;
 const links=[...nav.querySelectorAll('[data-nav-item]')],more=nav.querySelector('.more-nav'),menu=more.querySelector('div');
 let frame=0;
 const fit=()=>{
  frame=0;header.classList.remove('nav-compact');
  if(!nav.getBoundingClientRect().width)return;
  const mobile=document.querySelector('#mobileNav'),button=document.querySelector('#menuButton');
  if(mobile&&!mobile.hidden){mobile.hidden=true;button?.setAttribute('aria-expanded','false');button?.setAttribute('aria-label','فتح قائمة التنقل');}
  const focused=document.activeElement,wasOpen=more.open;
  for(const link of links)nav.insertBefore(link,more);
  more.hidden=false;more.style.visibility='hidden';
  const gap=parseFloat(getComputedStyle(nav).columnGap)||0,moreWidth=more.getBoundingClientRect().width;
  const widths=links.map(link=>link.getBoundingClientRect().width),available=nav.clientWidth;
  const count=navigationFitCount(widths,available,gap,moreWidth);
  links.slice(count).forEach(link=>menu.appendChild(link));
  more.style.visibility='';more.hidden=count===links.length;more.open=wasOpen&&!more.hidden;
  if(count<links.length&&available<moreWidth)header.classList.add('nav-compact');
  if(links.includes(focused)){if(menu.contains(focused)&&!more.hidden)more.open=true;focused.focus({preventScroll:true});}
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(fit);};
 const observer=new ResizeObserver(schedule);observer.observe(wrap);observer.observe(header.querySelector('.brand'));
 window.addEventListener('resize',schedule,{passive:true});
 document.fonts?.ready.then(schedule);
 document.addEventListener('click',event=>{if(!more.contains(event.target))more.open=false;});
 more.addEventListener('keydown',event=>{if(event.key==='Escape'&&more.open){more.open=false;more.querySelector('summary').focus();event.preventDefault();}});
 fit();
}
