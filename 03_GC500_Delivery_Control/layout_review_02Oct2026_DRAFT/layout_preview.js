/* Author: Andrew Fisher. PRIVATE DRAFT only: existing components, read-only view changes.
 * No saved state, pricing, DATA, source records or unclaimed tabs are changed. */
(() => {
 'use strict';
 const P={version:'private-layout-02Oct2026',mode:'day',day:null,area:null,log:[]};
 window.layoutPreview02=P;
 const $=(s,r=document)=>r.querySelector(s),all=(s,r=document)=>[...r.querySelectorAll(s)],text=e=>(e?.textContent||'').trim();
 const card=(pane,title)=>all('h3',pane).find(e=>text(e).startsWith(title))?.closest('.card');
 const mark=(id,before,after)=>P.log.push({id,before,after});
 function reveal(e){for(let d=e;d;d=d.parentElement)if(d.tagName==='DETAILS')d.open=true;let sc=e.parentElement;while(sc&&!(sc.scrollHeight>sc.clientHeight&&/auto|scroll/.test(getComputedStyle(sc).overflowY)))sc=sc.parentElement;if(sc)sc.scrollTo({top:sc.scrollTop+e.getBoundingClientRect().top-Math.max(sc.getBoundingClientRect().top,$('#tabs')?.getBoundingClientRect().bottom||0)-12,behavior:'instant'});else e.scrollIntoView({block:'start',behavior:'instant'});}
 function jump(tab,id){if(tab==='fencing'&&id==='layout-docket-register')P.mode='all';go(tab);setTimeout(()=>{apply(tab);let e=document.getElementById(id);if(id==='layout-accommodation')e=$('[data-sfold="costs|accommodation"]');if(e)reveal(e);},450);}
 function show(e,visible){e.hidden=!visible;if(visible)e.style.removeProperty('display');else e.style.setProperty('display','none','important');}
 function link(label,tab,id){const b=document.createElement('button');b.type='button';b.className='linkish';b.textContent=label;b.dataset.layoutHome=id;b.onclick=()=>jump(tab,id);return b;}
 function home(e,label,id){if(!e)return;const before=text(e);e.replaceChildren(link(label,'costs',id));mark('R2 '+id,before,label);}
 function fold(e,title){if(!e)return;const d=document.createElement('details');d.className='plfold765';d.dataset.layoutFold=title;const s=document.createElement('summary');s.textContent=title;d.append(s);e.before(d);d.append(e);return d;}
 function previewNotice(p){const n=document.createElement('div');n.className='notice warn';n.dataset.layoutDraft='';n.textContent='Layout preview — proposed arrangement for review. Read only; the live page is unchanged.';const h=$('.panehead',p)||$('h2',p);if(h)h.after(n);else p.prepend(n);}
 function alignDay(){const strip=$('#layout-docket-register .daystrip');if(P.mode!=='day'||!strip||!strip.clientWidth)return;const on=$('[data-fday][aria-pressed="true"]',strip);if(!on)return;const r=on.getBoundingClientRect(),box=strip.getBoundingClientRect(),want=strip.scrollLeft+r.left-box.left-Math.max(0,(strip.clientWidth-r.width)/2);strip.scrollTo({left:Math.max(0,Math.min(want,strip.scrollWidth-strip.clientWidth)),behavior:'instant'});}
 let resizeFrame=0;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(alignDay);});
 function fencing(p){
  const register=card(p,'Docket register'),dayCard=card(p,'Fencing by day'),areaCard=card(p,'By area'),week=card(p,'By week');if(!register||!dayCard||!areaCard||!week)throw Error('Fencing components missing');
  register.id='layout-docket-register';const table=$('table',register),rows=all('tbody > tr',table),dockets=allDockets();
  const records=rows.map(row=>{const id=$('[data-docket]',row)?.dataset.docket||$('.mono',row)?.textContent.trim();return{row,d:dockets.find(d=>String(d.id)===id)||dockets.find(d=>text(row.cells[0]).includes(String(d.id)))};});
  if(records.filter(x=>x.d).length!==rows.length)throw Error('Every register row must match its docket');
  const originalArea=$('table',areaCard),areaRows=all('tbody > tr',originalArea),strip=$('.daystrip',dayCard),dates=all('[data-fday]',dayCard).map(b=>b.dataset.fday);
  P.day=P.day||dates[dates.length-1];P.area=P.area||text(areaRows[0]?.cells[0]?.querySelector('b'));
  const controls=document.createElement('div');controls.className='filters';controls.dataset.layoutFilters='';
  const view=document.createElement('div'),summary=document.createElement('div');summary.className='dayhead';
  const areaSelect=document.createElement('select');areaSelect.setAttribute('aria-label','Area for docket register');areaSelect.style.maxWidth='100%';areaSelect.style.minWidth='0';areaSelect.innerHTML=areaRows.map(r=>{const name=text($('b',r.cells[0]));return '<option value="'+esc(name)+'">'+esc(name)+'</option>';}).join('');
  const areaWrap=originalArea.closest('.tblwrap');
  // Keep the existing day card's face component, which carries its vertical packing.
  all('[data-fday]',strip).forEach(b=>{if(!$('.dface',b)){const face=document.createElement('span');face.className='dface';while(b.firstChild)face.append(b.firstChild);b.append(face);}});
  const normal=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
  function filter(){
   const chosen=records.filter(({d})=>P.mode==='all'||P.mode==='day'&&d.date===P.day||P.mode==='area'&&normal(d.location)===normal(P.area));
   records.forEach(r=>show(r.row,chosen.includes(r)));
   all('[data-layout-mode]',controls).forEach(b=>b.setAttribute('aria-pressed',b.dataset.layoutMode===P.mode));
   show(strip,P.mode==='day');show(areaSelect,P.mode==='area');show(areaWrap,P.mode==='area');areaSelect.value=P.area;
   all('[data-fday]',strip).forEach(b=>{const selected=b.dataset.fday===P.day;b.setAttribute('aria-pressed',selected);b.classList.toggle('on',selected);});
   alignDay();
   areaRows.forEach(r=>show(r,normal(text($('b',r.cells[0])))===normal(P.area)));
   const chosenCost=chosen.filter(r=>r.d.usable).reduce((s,r)=>s+r.d.cost_total,0),scope=P.mode==='day'?fmtDate(P.day):P.mode==='area'?P.area:'All recorded dockets';
   summary.innerHTML='<div><h3>'+esc(scope)+'</h3><p>'+chosen.length+' of '+records.length+' dockets'+(P.mode==='area'?' — area status, drawing and aggregate below':' · '+esc(money(chosenCost))+' Revenue at the card, ex GST')+'</p></div>';if(areaNote)show(areaNote,P.mode==='area');
   P.fencing={registerRows:records.length,visibleRows:chosen.length,mode:P.mode,day:P.day,area:P.area,ids:records.map(x=>x.d.id)};
  }
  for(const [key,label] of [['all','All dockets'],['day','By day'],['area','By area']]){const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.layoutMode=key;b.onclick=()=>{P.mode=key;filter();};controls.append(b);}
  all('[data-fday]',strip).forEach(b=>b.onclick=()=>{P.day=b.dataset.fday;filter();});areaSelect.onchange=()=>{P.area=areaSelect.value;filter();};
  view.append(controls,strip,areaSelect,summary,areaWrap);$('h3',register).after(view);
  const areaNote=all('p',areaCard).find(x=>text(x).includes('Areas are the words'));if(areaNote)view.append(areaNote);
  mark('R1 docket register', {dayCopies:all('tbody tr',dayCard).length,areaGroups:areaRows.length,registerRows:records.length},'One original register; date/area filters plus selected-area provenance and aggregate');
  dayCard.remove();areaCard.remove();
  const kpis=$('.kpis',p);kpis.after(week);week.after(register);
  for(const title of ['Rates —','Purchase orders','Paid to Advanced','Green book','Blue book','CW4']){const c=card(p,title);if(c&&c!==register&&c!==week)fold(c,text($('h3',c)));}
  filter();
 }
 function costs(p){
  const glance=$('#costs765',p),tiles=all('.cj765-tile',glance),X=cj764Model(),M=moneySummary();
  ['layout-revenue','layout-direct-costs','layout-difference','layout-month-end'].forEach((id,i)=>tiles[i].id=id);
  const revNote=$('.cj765-note',tiles[0]);revNote.textContent=revNote.textContent.replace(money0(X.revenue.record)+' on the contracts','The recorded Revenue comes from the contracts');
  const top=$('#pl752 .pl-kpis',p);if(top)home(top,'Summary totals ↑','costs765');
  all('#pl752 .pl-ln.total',p).forEach(e=>{const label=text($('.pl-lb',e));home($('.pl-amt',e),'Summary ↑',/Difference/i.test(label)?'layout-difference':/Revenue/i.test(label)?'layout-revenue':'layout-direct-costs');});
  all('#pl752 tr.pl-grand',p).forEach(r=>{if(/^Total revenue/.test(text(r.cells[0])))home(r.querySelector('.num'),'Summary ↑','layout-revenue');});
  const ledgerMetrics=all('#pl770 > .fin745-metrics > .fin745-metric',p);ledgerMetrics.forEach((e,i)=>{if(i!==2)e.remove();});
  const gm=$('#pl770 > .fin745-metrics',p);if(gm)gm.style.gridTemplateColumns='minmax(0,1fr)';
  // The before-overheads comparison remains intact. Tracker difference is a different basis.
  if(ledgerMetrics[3]){const ratio=text(ledgerMetrics[3].querySelector('small')).match(/^\d+% of revenue/);if(ratio)$('.cj765-note',tiles[2]).append(' · '+ratio[0]);}
  all('#pl770 tr.acc761-grand',p).forEach(r=>{const label=text(r.cells[1]);if(/^Total revenue|^Direct costs known/.test(label))for(const c of [r.cells[2],r.cells[3]])home(c,'Summary ↑',/^Total revenue/.test(label)?'layout-revenue':'layout-direct-costs');});
  const futureMetrics=all('#costs764 > .fin745-metrics > .fin745-metric',p);futureMetrics.forEach((e,i)=>{if(i!==1)e.remove();else e.id='layout-still-to-come';});
  const futureGrid=$('#costs764 > .fin745-metrics',p);if(futureGrid)futureGrid.style.gridTemplateColumns='minmax(0,1fr)';
  const futureTotal=all('#costs764 tr.acc761-tot',p).find(r=>text(r.cells[0]).startsWith('Direct costs ·'));
  if(futureTotal){home(futureTotal.cells[1],'Summary ↑','layout-direct-costs');home(futureTotal.cells[2],'Forecast ↑','layout-still-to-come');home(futureTotal.cells[3],'Summary ↑','layout-direct-costs');}
  const knownBasis=$('#costs764 > .fin745-basis',p);if(knownBasis)knownBasis.innerHTML=knownBasis.innerHTML.replace('('+esc(money0(X.plKnown))+')','(see At a glance above)');
  const costRows=all('.costtbl tbody > tr',p),fenced=costRows.filter(r=>r.querySelector('[data-docket]'));
  if(fenced.length){const ids=new Set(fenced.map(r=>r.querySelector('[data-docket]').dataset.docket)),src=allCosts().filter(c=>ids.has(String(c.docket))),sum=src.reduce((s,c)=>s+(Number(c.amount)||0),0),r=fenced[0].cloneNode(false);
   const labels=['All dates','Fencing Revenue',src.length+' charge lines from the docket register',money(sum),'—','Advanced Temporary Fencing','STPS · Revenue','The job','Source dockets',''];
   labels.forEach((v,i)=>{const c=document.createElement('td');c.textContent=v;if(i===3)c.className='num';r.append(c);});r.cells[9].append(link('Docket register →','fencing','layout-docket-register'));fenced[0].before(r);fenced.forEach(e=>e.remove());mark('R1 Costs fencing lines',{rows:src.length,sum},'One total line with link to original register');
  }
  for(const [id,title] of [['pl770','Ledger lines and recovery — before-overheads comparison retained'],['costs764','Costs to job end — forecast, wage basis and unpriced work'],['rehire766','Rehire by branch — supplier costs and recovery'],['accruals761','Month-end for Finance — selected month and accrual proposal'],['finance745','Actuals, forecast & Finance journals — month and whole-job labour outlook']])fold($('#'+id,p),title);
  P.costs={revenueRecord:M.charge.total,revenueEnd:X.revenue.job,knownToday:X.known,costsEnd:X.job,pricedWages:X.wages.job,retainedBeforeOverheads:pl770Model().gm,retainedMonth:acc761Model(acc761Month()).label};
 }
 function runsheet(p){const c=card(p,'Running totals — the whole job');if(!c)return;c.id='layout-running-totals';
  all('tbody > tr',c).forEach(r=>{const cell=r.cells[11];if(cell&&/^Everyone/.test(text(r.cells[0]))&&/\$/.test(text(cell))){const amount=text(cell);cell.replaceChildren(link('Costs →','costs','layout-accommodation'));mark('R4 accommodation '+text(r.cells[0]),amount,'Costs accommodation detail; person subtotals, nights and every other column retained');}});
 }
 function replaceDollar(e,id,homeId){if(!e)return;const amount=/\$(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})?/g,walk=document.createTreeWalker(e,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){const before=n.textContent;n.textContent=homeId==='finance745'?before.replace(/\$(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{2})? partial labour outlook/g,'a partial labour outlook'):before.replace(amount,'the figure on Costs');if(before!==n.textContent)mark(id,before,n.textContent);}e.append(' ',link('Costs →','costs',homeId));}
 function questions(p){
  all('[data-question-id^="tr-miss-"] .qwhy',p).forEach(e=>replaceDollar(e,'R4 carrier transport','costs764'));
  replaceDollar($('[data-question-id="lb-rates"] .qwhy',p),'R4 partial whole-job labour outlook','finance745');
  all('[data-question-id="card-covered753"] .qrows > li',p).forEach(e=>{const before=text(e),changed=before.replace(/ · \$[\d,]+(?:\.\d+)? ex GST$/,'');if(changed!==before){e.textContent=changed+' · ';e.append(link('rate and charge →','costs','card748'));mark('R5 contract-line charge',before,changed);}});
 }
 function apply(tab){const p=document.getElementById('pane-'+tab);if(!p||p.dataset.layoutApplied==='yes')return;const fn={fencing,costs,runsheet,questions}[tab];if(!fn)return;p.dataset.layoutApplied='yes';previewNotice(p);fn(p);}
 P.apply=apply;P.jump=jump;
 for(const [name,tab] of [['renderFencing','fencing'],['renderCosts','costs'],['renderRunsheet','runsheet'],['renderQuestions','questions']]){const old=window[name];window[name]=function(...args){const p=document.getElementById('pane-'+tab);if(p)delete p.dataset.layoutApplied;const r=old.apply(this,args);queueMicrotask(()=>apply(tab));return r;};}
 queueMicrotask(()=>{for(const tab of ['fencing','costs','runsheet','questions']){const p=document.getElementById('pane-'+tab);if(p?.children.length)apply(tab);}});
})();
