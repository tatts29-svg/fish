/* Author: Andrew Fisher. Fit the paper before cropping photographs; keep every supplied picture. */
function dpGrid899(pg) {
 for(const pics of pg.querySelectorAll('.dp-pics')) {
 const n=pics.querySelectorAll(':scope > .dp-fig').length,c=Math.min(4,Math.max(1,n)),r=Math.ceil(n/c);
 pics.style.setProperty('--c',String(c));pics.style.setProperty('--r',String(r));
 pics.style.minHeight=(r*41+(r-1)*2)+'mm';
 pics.closest('.dp-ph').style.minHeight=(r*41+(r-1)*2+5)+'mm';
 }
}
function dpFits899(pg) {
 const b=pg.getBoundingClientRect(),inside=e=>{const r=e.getBoundingClientRect();return r.top>=b.top-1&&r.bottom<=b.bottom+1&&r.left>=b.left-1&&r.right<=b.right+1;};
 return pg.scrollHeight<=pg.clientHeight+1&&[...pg.children].every(inside)&&[...pg.querySelectorAll('.dp-win')].every(e=>e.getBoundingClientRect().height>=36*96/25.4-1);
}
function dpCompact899(pg) {
 pg.classList.add('dp-compact899');pg.style.setProperty('--k','.8');
 const hero=pg.querySelector('.dp-hero');if(hero)hero.style.flexBasis='47mm';
 dpHeroFit(pg);if(hero)hero.style.flexBasis='47mm';
}
function dpChunks899(section) {
 // Photos are kept, with at most eight per sheet. Other sections split only at complete blocks.
 if(section.classList.contains('dp-ph')) {
  const figs=[...section.querySelectorAll('.dp-fig')],out=[];
  for(let i=0;i<figs.length;i+=8){const s=section.cloneNode(false);s.append(section.querySelector('h2').cloneNode(true));const p=section.querySelector('.dp-pics').cloneNode(false);p.replaceChildren(...figs.slice(i,i+8));s.append(p);out.push(s);}
  return out;
 }
 const children=[...section.children],heading=children.find(e=>e.tagName==='H2'),body=children.filter(e=>e!==heading);
 if(body.length<2)return [section];
 return body.map(e=>{const s=section.cloneNode(false);if(heading)s.append(heading.cloneNode(true));s.append(e);return s;});
}
function dpPaginate899(pg) {
 const header=pg.querySelector(':scope > .dp-hd'),hero=pg.querySelector(':scope > .dp-hero'),foot=pg.querySelector(':scope > .dp-ft');
 if(!header||!hero||!foot)return [pg];
 const content=[...pg.children].filter(e=>e!==header&&e!==hero&&e!==foot&&!e.classList.contains('dp782'));
 const sections=content.flatMap(e=>e.classList.contains('dp-ph')&&e.querySelectorAll('.dp-fig').length>8?dpChunks899(e):[e]),pages=[pg];
 content.forEach(e=>e.remove());
 const newPage=()=>{const next=pg.cloneNode(false);next.dataset.continuation899='1';next.append(header.cloneNode(true),hero.cloneNode(true),foot.cloneNode(true));pages.at(-1).after(next);pages.push(next);dpCompact899(next);return next;};
 let page=pg;
 while(sections.length) {
  const section=sections.shift();
  page.insertBefore(section,page.querySelector(':scope > .dp-ft'));dpGrid899(page);
  if(!dpFits899(page)&&page.querySelectorAll(':scope > .dp-sec').length>1){section.remove();page=newPage();page.insertBefore(section,page.querySelector(':scope > .dp-ft'));dpGrid899(page);}
  if(!dpFits899(page)&&section.classList.contains('dp-sec')){const chunks=dpChunks899(section);if(chunks.length>1){section.remove();sections.unshift(...chunks);}}
 }
 // Header lines have fixed reserved height, so numbering cannot alter the measured page fit.
 pages.forEach((p,i)=>{const label=document.createElement('span');label.className='dp-pages899';label.textContent=(i?'Continuation · ':'Collect all sheets · ')+'Sheet '+(i+1)+' of '+pages.length;p.querySelector('.dp-hd-r').append(label);p.dataset.sheet899=String(i+1);});
 return pages;
}
function dpFit(root) {
 const over=[];
 for(const pg of [...root.querySelectorAll('.dp-page')]) {
  if(pg.classList.contains('pl782')||pg.dataset.continuation899)continue;
  pg.style.setProperty('--k','1');dpHeroFit(pg);dpGrid899(pg);
  let k=1;
  const target=()=>[...pg.querySelectorAll('.dp-win')].every(e=>e.getBoundingClientRect().height>=52*96/25.4);
  while((!dpFits899(pg)||!target())&&k>.8){k=Math.round((k-.02)*100)/100;pg.style.setProperty('--k',String(k));}
  let pages=[pg];
  if(!dpFits899(pg)){dpCompact899(pg);if(!dpFits899(pg))pages=dpPaginate899(pg);}
  for(const page of pages){dpGrid899(page);if(!dpFits899(page))over.push('load '+pg.dataset.load+(pages.length>1?' sheet '+page.dataset.sheet899:''));}
 }
 root.__over=over;root.__fit899Ready=true;return over;
}
function dpPrintReady899(wrap) {
 if(wrap&&wrap.__fit899Ready&&!wrap.__over?.length)return true;
 flash('The load sheets are not ready to print safely. '+(wrap?.__over?.length?'An instruction block is too long for an A4 sheet: '+wrap.__over.join(', ')+'.':'Wait for the layout to finish.'));
 return false;
}
