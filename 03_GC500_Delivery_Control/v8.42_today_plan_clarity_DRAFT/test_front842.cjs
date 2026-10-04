// Author: Andrew Fisher. Visible-summary assertions; no private fixtures.
'use strict';
const fmt=n=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('en-AU',{maximumFractionDigits:2}):'—';
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const percentage=s=>s.pct==null?'—':(s.pctKind==='lower-bound'?'≥':'')+fmt(Math.max(0,Math.min(100,s.pct)))+'%';
async function front842(page){return page.evaluate(()=>[...document.querySelectorAll('[data-tw840-area]')].map(card=>({id:card.dataset.tw840Area,text:card.textContent,counts:Object.fromEntries([...card.querySelectorAll('[data-tw842-quantity]')].map(n=>[n.dataset.tw842Quantity,n.textContent])),reading:card.querySelector('.tw840-reading')?.textContent,sr:card.querySelector('.tw840-sr')?.textContent,kind:card.querySelector('[data-tw842-pct-kind]')?.dataset.tw842PctKind,plan:card.querySelector('[data-tw842-plan]')?{status:card.querySelector('[data-tw842-plan]').dataset.status,title:card.querySelector('.tw842-plan h4').textContent,label:card.querySelector('.tw842-plan-head strong').textContent,values:[...card.querySelectorAll('.tw842-plan dd')].map(n=>n.textContent),text:card.querySelector('.tw842-plan').textContent,destination:card.querySelector('.tw842-plan [data-tw840-destination]')?.dataset.tw840Destination}:null,
 fenceRows:[...card.querySelectorAll('[data-tw840-fence-row]')].map(r=>({id:r.dataset.tw840FenceRow,label:r.querySelector('.tw841-fence-label').textContent,percent:r.querySelector('.tw841-fence-percent').textContent,known:r.querySelector('.tw841-fence-percent').dataset.known,values:Object.fromEntries([...r.querySelectorAll('[data-tw842-fence-value]')].map(v=>[v.dataset.tw842FenceValue,{value:v.querySelector('strong').textContent,unit:v.querySelector('small').textContent}])),plan:{status:r.querySelector('[data-tw842-fence-plan]').dataset.status,label:r.querySelector('[data-tw842-fence-plan]').textContent,provisional:r.querySelector('[data-tw842-fence-plan]').dataset.provisional,color:getComputedStyle(r.querySelector('[data-tw842-fence-plan]')).color},closedFold:!!r.closest('details:not([open])'),scroll:r.scrollWidth,client:r.clientWidth}))})));}
function assertFront842(check,label,summary,ui){
 for(const [id,s] of Object.entries(summary.byId)){if(id==='fencing')continue;const u=ui.find(c=>c.id===id);
  check(label+' '+id+' Total Done Left and qualified percent are upfront',!!u&&same(u.counts,{total:fmt(s.total),done:fmt(s.done),left:fmt(s.left)})&&u.reading===percentage(s)&&u.kind===s.pctKind,{expected:s,actual:u});
  check(label+' '+id+' plan status states reference basis and native Timeline destination',u.plan?.status===s.plan.status&&u.plan?.title==='On-site plan · '+new Date(summary.asOf+'T00:00:00Z').toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})&&u.plan?.label===s.plan.label&&same(u.plan.values,[fmt(s.plan.planned),fmt(s.plan.actual)])&&u.plan.text.includes(s.plan.basis)&&u.plan.destination==='timeline',u.plan);
  if(s.plan.early>0)check(label+' '+id+' early arrivals explicitly do not offset missing due references',u.plan.text.includes(fmt(s.plan.early))&&/counted separately/.test(u.plan.text),u.plan.text);
  if(s.pctKind==='lower-bound')check(label+' '+id+' lower-bound qualifier and review quantity remain visible',u.sr?.startsWith('At least ')&&u.reading.startsWith('≥')&&u.text.includes(fmt(s.reviewQuantity))&&/need review/.test(u.text)&&/not yet confirmed/.test(u.text),{sr:u.sr,text:u.text});
 }
 const fence=ui.find(c=>c.id==='fencing');
 check(label+' all fencing types stay upfront in one explicitly scoped Build card',fence&&same(fence.fenceRows.map(r=>r.id),summary.fencingRows.map(r=>r.id))&&fence.fenceRows.every(r=>!r.closedFold)&&/Build programme/.test(fence.text)&&!fence.reading,fence);
 for(const s of summary.fencingRows){const u=fence.fenceRows.find(r=>r.id===s.id),percent=s.pct!=null?(s.total>0&&s.done>s.total?'100% + extra work':fmt(Math.max(0,Math.min(100,s.pct)))+'% recorded'):s.loading?'Loading programme':s.kind==='recorded-only'?'Recorded work only':s.total===0?'No programme quantity':'Programme quantity unconfirmed';
  check(label+' '+s.id+' shows Total Recorded Left percent and dated plan without combining units',u&&u.label===s.label&&['total','done','left'].every(k=>u.values[k].value===fmt(s[k])&&u.values[k].unit===s.unit)&&u.percent===percent&&u.known===String(s.pct!=null)&&u.plan.status===s.plan.status&&u.plan.label===s.plan.label+(s.plan.provisional?' · source date check required':'')&&u.plan.provisional===String(!!s.plan.provisional)&&(!s.plan.provisional||u.plan.color==='rgb(255, 210, 168)')&&u.scroll<=u.client+1,{expected:s,actual:u});
 }
}
async function exerciseFront842(page,check,label,out){
 const path=require('path');
 const ids=['buildings','toilets','generators','lighting','equipment'];
 for(const id of ids){await page.locator('[data-tw840-jump='+id+']').click();await page.waitForTimeout(200);
  const layout=await page.locator('[data-tw840-area='+id+']').evaluate(card=>{const main=document.querySelector('main').getBoundingClientRect(),nav=document.querySelector('.tw840-nav').getBoundingClientRect(),rect=n=>{const r=n.getBoundingClientRect(),s=getComputedStyle(n);return {class:n.className,top:r.top,bottom:r.bottom,left:r.left,right:r.right,font:parseFloat(s.fontSize),shadow:s.textShadow,filter:s.filter};};return {main:{top:main.top,bottom:Math.min(main.bottom,innerHeight)},navBottom:nav.bottom,card:rect(card),nodes:[...card.querySelectorAll('[data-tw842-quantity],.tw840-reading,.tw842-plan-head strong')].map(rect),body:[...card.querySelectorAll('.tw840-scope,.tw842-counts-note,.tw842-plan h4,.tw842-plan dt')].map(rect),grid:getComputedStyle(card.parentElement).gridTemplateColumns,viewport:innerWidth};});
  check(label+' '+id+' headline quantities percent and plan fit in the category landing view',layout.nodes.length===5&&layout.nodes.every(n=>n.top>=layout.navBottom-1&&n.bottom<=layout.main.bottom+1&&n.left>=0&&n.right<=layout.viewport),layout);
  check(label+' '+id+' summary text is readable and unfiltered at native size',layout.body.every(n=>n.font>=(layout.viewport<600?15:16)&&n.shadow==='none'&&n.filter==='none')&&layout.nodes.every(n=>n.shadow==='none'&&n.filter==='none'),layout);
  if(label.startsWith('laptop'))check(label+' '+id+' uses two laptop columns',layout.grid.split(' ').length===2&&layout.card.right-layout.card.left>550,layout);
  if(id==='buildings'||id==='toilets')await page.screenshot({path:path.join(out,'today842-'+label+'-'+id+'-summary.png')});
 }
 await page.locator('[data-tw840-jump=fencing]').click();await page.waitForTimeout(200);await page.screenshot({path:path.join(out,'today842-'+label+'-fencing-summary.png')});
}
async function exerciseCounts842(page,check,label,model,out){
 const path=require('path');
 for(const id of ['buildings','toilets']){const summary=model.summary.byId[id],area=model.areas.find(a=>a.id===id);
  for(const mode of ['total','done','left']){
   const button=page.locator('[data-tw840-detail='+id+'][data-tw840-mode='+mode+']');await button.click();await page.waitForTimeout(120);
   const dialog=await page.locator('#gc500-work-dialog840').evaluate(d=>({open:d.open,title:d.querySelector('h2').textContent,subtitle:d.querySelector('.tw840-dialog-top p').textContent,percent:d.querySelector('.tw840-detail-summary>strong').textContent,definition:d.querySelector('.tw840-definition').textContent,rows:[...d.querySelectorAll('.tw840-detail-row')].map(r=>({key:r.querySelector('[data-tw840-reference]')?.dataset.tw840Reference,value:[...r.querySelector(':scope>strong').childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent).join('').trim(),text:r.textContent}))}));
   const expected=summary[mode==='total'?'total':mode==='done'?'done':'left'];
   check(label+' '+id+' '+mode+' detail matches the known headline quantity and percentage',dialog.open&&dialog.subtitle.includes(fmt(expected)+' '+area.unit)&&dialog.percent===percentage(summary)&&dialog.definition.includes(summary.basis),{expected,dialog});
   if(mode==='left'&&summary.reviewRefs.length){const review=dialog.rows.filter(r=>summary.reviewRefs.includes(r.key));
    check(label+' '+id+' review quantities remain in Left without implying failed installation',review.length===summary.reviewRefs.length&&review.every(r=>r.value===fmt(area.rows.find(a=>a.key===r.key).quantity)&&/review/i.test(r.text))&&/not confirmed complete/.test(dialog.title),review);
   }
   if(id==='toilets'&&mode==='left')await page.screenshot({path:path.join(out,'today842-'+label+'-toilets-left-detail.png')});
   await page.keyboard.press('Escape');await page.waitForFunction(token=>!document.querySelector('#gc500-work-dialog840').open&&document.activeElement?.dataset.tw840Focus===token,id+'-'+mode,{timeout:1500});
  }
 }
}
async function exercisePlanFolds842(page,check,label){
 for(const id of ['buildings','toilets','generators','lighting','equipment']){
  const fold=page.locator('[data-tw842-plan-fold='+id+']'),summary=fold.locator('summary');await summary.focus();await page.keyboard.press('Enter');await page.waitForTimeout(100);
  const before=await page.evaluate(()=>({focus:document.activeElement?.dataset.tw840Focus,main:document.querySelector('main').scrollTop}));await page.evaluate(()=>renderToday());await page.waitForTimeout(150);
  const after=await page.evaluate(()=>({focus:document.activeElement?.dataset.tw840Focus,main:document.querySelector('main').scrollTop}));
  check(label+' '+id+' plan basis fold opens by keyboard and survives refresh',await fold.evaluate(d=>d.open)&&before.focus===after.focus&&Math.abs(before.main-after.main)<=1,{before,after});
  await summary.focus();await page.keyboard.press('Enter');await page.waitForTimeout(80);
 }
}
async function exercisePrint842(page,check,label,out,basePrint){
 const fold=page.locator('[data-tw842-plan-fold=toilets]');await fold.locator('summary').click();
 await page.evaluate(()=>{window.__qaPlanPrint842={};const state=()=>[...document.querySelectorAll('[data-tw842-plan-fold]')].map(d=>({id:d.dataset.tw842PlanFold,open:d.open}));__qaPlanPrint842.before=state();window.addEventListener('beforeprint',()=>{__qaPlanPrint842.print=state();},{once:true});window.addEventListener('afterprint',()=>{__qaPlanPrint842.after=state();},{once:true});});
 await basePrint(page,check,label,out);const state=await page.evaluate(()=>__qaPlanPrint842);
 check(label+' native print opens every plan basis and restores its prior folded state',state.print?.length===5&&state.print.every(d=>d.open)&&same(state.before,state.after),state);
 await fold.locator('summary').click();
}
module.exports={front842,assertFront842,exerciseFront842,exerciseCounts842,exercisePlanFolds842,exercisePrint842,percentage,fmt};
