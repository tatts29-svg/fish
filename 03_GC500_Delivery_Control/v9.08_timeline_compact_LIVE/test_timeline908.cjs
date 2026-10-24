// Author: Andrew Fisher. GET-only checks for presentation, native actions and narrow/wide layout.
const fs=require('fs'),path=require('path'),{open}=require('../toolchain/harness/open_page');
(async()=>{let s;try{
 const out=process.env.EVIDENCE_DIR;if(!out||!path.isAbsolute(out))throw Error('Use an absolute private evidence directory');fs.mkdirSync(out,{recursive:true});
 s=await open({pageFile:process.env.PAGE,hash:'#timeline',W:1440,H:1300});const p=s.page;
 await p.context().route('**/*',r=>r.request().method()==='GET'?r.fallback():r.abort());
 await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
 const checks=[],ok=(name,pass,detail)=>checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});
 const preserved=await p.evaluate(()=>{
  const before=JSON.stringify(S),d=programmeDays().find(x=>x.iso==='2026-10-08');
  const normal=html=>{const t=document.createElement('template');t.innerHTML=html;return {controls:[...t.content.querySelectorAll('button,a,input,select,textarea,summary')].map(e=>({tag:e.tagName,text:(()=>{const c=e.cloneNode(true);if(c.matches('.ldl'))c.querySelectorAll('.ld-t').forEach(x=>x.remove());return c.textContent.replace(/\s+/g,' ').trim();})(),attrs:[...e.attributes].filter(a=>!['style','class'].includes(a.name)).map(a=>[a.name,a.value]).sort()})),refs:[...t.content.querySelectorAll('[data-tl846-ref]')].map(e=>({id:e.dataset.tl846Ref,text:e.textContent.replace(/\s+/g,' ').trim(),stage:e.querySelector('.tl841-gantry')?.dataset.tl841Stage,lights:[...e.querySelectorAll('.tl841-unit')].map(x=>x.className)}))};};
  const arrivals=html=>{const t=document.createElement('template');t.innerHTML=html;return [...t.content.querySelectorAll('.ld-t')].map(e=>e.outerHTML);};
  const stable=v=>JSON.stringify(v.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
  const rows=dpLoads(d).map((g,i)=>{const raw=ldLineBefore908(d,g,i+1,false,true),next=timeline908Arrange(raw),a=normal(raw),b=normal(next);return {id:ldId(d,g),controls:stable(a.controls)===stable(b.controls)&&JSON.stringify(arrivals(raw))===JSON.stringify(arrivals(next)),refs:JSON.stringify(a.refs)===JSON.stringify(b.refs),idempotent:timeline908Arrange(next)===next};});
  const raw=ldLineBefore908(d,dpLoads(d)[0],1,false,true),t=document.createElement('template');t.innerHTML=raw;
  const allocation=document.createElement('span');allocation.className='synthetic-readonly-allocation';allocation.textContent='Synthetic current allocation retained';t.content.querySelector('.tl846-identity').append(allocation);
  const extra=document.createElement('span');extra.className='synthetic-future-control';extra.textContent='Synthetic extension retained';t.content.querySelector('.tl846-controls').append(extra);
  const arranged=timeline908Arrange(t.innerHTML),tt=document.createElement('template');tt.innerHTML=arranged;
  return {rows,allocation:tt.content.querySelectorAll('.synthetic-readonly-allocation').length===1,extension:tt.content.querySelectorAll('.synthetic-future-control').length===1,unchanged:before===JSON.stringify(S)};
 });
 ok('every native action, field, link and summary is retained once',preserved.rows.every(r=>r.controls));
 ok('references, text, stage and all native lights remain identical',preserved.rows.every(r=>r.refs));
 ok('arrangement is idempotent and retains future read-only allocation/extensions',preserved.rows.every(r=>r.idempotent)&&preserved.allocation&&preserved.extension);
 ok('rendering changes no operational record',preserved.unchanged);
 const geometry=[];
 for(const width of (process.env.WIDTHS?process.env.WIDTHS.split(',').map(Number):[1440,2560,3840,390])){
  await p.setViewportSize({width,height:width===390?1800:1300});
  await p.evaluate(()=>{state.day='2026-10-08';state.tlView='day';go('timeline');render();});await p.waitForTimeout(350);
  const card=p.locator('#pane-timeline .ld.compact908').filter({has:p.locator('[data-tl846-ref="WC09"]')}).first();await card.scrollIntoViewIfNeeded();
  const g=await card.evaluate(e=>{const box=x=>{const r=x.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};return {width:innerWidth,card:box(e),main:box(e.querySelector('.ldl')),utility:box(e.querySelector('.timeline908-utility')),plan:box(e.querySelector('.timeline908-plans')),overflow:e.scrollWidth>e.clientWidth+1||document.documentElement.scrollWidth>innerWidth+1,lights:e.querySelectorAll('.tl841-unit').length,folds:e.querySelectorAll('.timeline908-plans>details').length,align:getComputedStyle(e.querySelector('.ld-c')).textAlign};});geometry.push(g);
  ok(width+'px: compact card fits without horizontal overflow',!g.overflow&&g.card.h<(width===390?820:400),g);
  ok(width+'px: native five lights and four planning folds retained',g.lights===5&&g.folds===4);
  ok(width+'px: identity left-aligned and planning row below content',g.align==='left'&&g.plan.y>=g.main.y+g.main.h-1);
  await card.screenshot({path:path.join(out,'WC09-'+width+'.png')});
  await card.locator('.traffic903 summary').click();
  ok(width+'px: traffic fold opens within viewport',await card.locator('.traffic903').evaluate(e=>{const r=e.querySelector('select').getBoundingClientRect();return e.open&&r.left>=0&&r.right<=innerWidth+1;}));
  await card.locator('.traffic903 summary').click();
 }
 // Work at an ordinary phone viewport for the actual interaction checks.
 await p.setViewportSize({width:390,height:844});
 await p.evaluate(()=>{state.day='2026-10-08';state.tlView='day';go('timeline');render();});
 const interaction=await p.evaluate(()=>{
  const before=JSON.stringify(S),card=()=>[...document.querySelectorAll('#pane-timeline .ld.compact908')].find(e=>e.querySelector('[data-tl846-ref="WC09"]'));
  card().querySelector('.ldl').click();const opened=card().classList.contains('on')&&card().querySelector('.ldl').getAttribute('aria-expanded')==='true';card().querySelector('.ldl').click();
  const closed=!card().classList.contains('on');card().querySelector('[data-tl841-open]').click();const dialog=!!document.querySelector('#timeline841-dialog[open]');document.querySelector('[data-tl841-close]').click();const restored=document.activeElement===card().querySelector('[data-tl841-open]');
  const printButton=card().querySelector('[data-tl841-print]'),expectedPrint={day:printButton.dataset.tl841Print,only:Number(printButton.dataset.tl841Only)};const original=timeline841Print;let captured=null;timeline841Print=(day,only)=>{captured={day,only};};try{card().querySelector('[data-tl841-print]').click();}finally{timeline841Print=original;}
  const down=card().querySelector('[data-flow891-move="down"]');if(down)down.click();
  return {opened,closed,dialog,restored,captured,expectedPrint,unchanged:before===JSON.stringify(S),readonly:capability()==='view'};
 });
 ok('load opens and closes through its original native button',interaction.opened&&interaction.closed);
 ok('progress dialog opens, closes and restores focus',interaction.dialog&&interaction.restored);
 ok('print action still targets its original day and load',JSON.stringify(interaction.captured)===JSON.stringify(interaction.expectedPrint),interaction.captured);
 ok('read-only interactions and reorder do not change records',interaction.unchanged&&interaction.readonly);
 ok('no browser errors or operational network writes',s.errors.length===0&&s.counts.blocked===0,{errors:s.errors,blocked:s.counts.blocked});
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({checks,preserved,geometry,interaction,errors:s.errors},null,2));
 checks.forEach(c=>console.log((c.pass?'PASS ':'FAIL ')+c.name));console.log(checks.filter(c=>c.pass).length+'/'+checks.length);if(checks.some(c=>!c.pass))process.exitCode=1;
}finally{if(s)await s.browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
