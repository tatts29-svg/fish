/* Author: Andrew Fisher. Independent read-only selected-week UI review.
 * PAGE=/private/candidate.html OUT=/private/screens node fencing803_ui_review.cjs
 * Existing controls only; no record edits and no GL scene.
 */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const {open}=require('../../toolchain/harness/open_page');
const pageFile=process.env.PAGE||path.join(__dirname,'../../build/GC500_v8.03/GC500_Delivery_Control_hosted.html'),out=process.env.OUT||'/workspace/private-cw2-fencing/ui-review';fs.mkdirSync(out,{recursive:true});
const source=JSON.parse(fs.readFileSync(path.join(__dirname,'../cw2_plan_02Oct2026.json'),'utf8')),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const result={author:'Andrew Fisher',scope:'Independent browser review of the existing Fencing / CON WK2 component, plan-only candidate',candidateSha256:hash(fs.readFileSync(pageFile)),sourceSha256:source.source_sha256,rendererSha256:hash(fs.readFileSync(path.join(__dirname,'../fencing803_src.js'))),limitations:['Phone tables retain horizontal scrolling; long prerequisite lines are read by panning between their beginning and end.','This plan-only review does not establish editable requirement-confirmation behavior.'],checks:[],devices:[],errors:[],blockedWrites:0};
const save=()=>fs.writeFileSync(path.join(__dirname,'fencing803_ui_review.json'),JSON.stringify(result,null,2)+'\n');
const ck=(name,pass,detail)=>{result.checks.push({name,pass:!!pass,...(detail===undefined?{}:{detail})});save();};
(async()=>{
 for(const phone of [false,true]){
  const device=phone?'phone':'desktop',s=await open({pageFile,hash:'#fencing',W:phone?390:1440,H:phone?844:900,mobile:phone,dpr:1,gl:false}),p=s.page;
  try{
   p.on('console',m=>{if(m.type()==='error')result.errors.push(m.text().slice(0,240));});
   await p.waitForFunction(()=>SYNC.status==='live'&&typeof allDockets==='function'&&typeof renderFencing==='function',null,{timeout:180000});
   await p.evaluate(()=>go('fencing'));
   result.navigation=await p.evaluate(()=>({tab:state.tab,weeks:[...document.querySelectorAll('[data-fweek]')].map(x=>({key:x.dataset.fweek,text:x.innerText}))}));save();
   const before=await p.evaluate(()=>JSON.stringify(allDockets().map(d=>({id:d.id,date:d.date,quantities:d.quantities,cost:d.cost_total,usable:d.usable,lines:d.lines})).sort((a,b)=>String(a.id).localeCompare(String(b.id)))));
   const selectedWeek=await p.evaluate(()=>fenceByWeek(allDockets()).find(w=>w.progSheet==='CON WK2')?.week);assert(selectedWeek,'Existing week mapping must include CON WK2');
   const weekControl=p.locator('[data-fweek]').filter({hasText:new RegExp('^'+selectedWeek+'(?: ·.*)?$')});await weekControl.click();
   await p.waitForSelector('[data-cw2-plan803]');
   const dom=await p.evaluate(selectedWeek=>{
    const root=document.querySelector('[data-cw2-plan803]'),rows=[...root.querySelectorAll('[data-cw2-task803]')],text=root.innerText;
    return{selected:[...document.querySelectorAll('[data-fweek]')].find(e=>e.dataset.fweek===selectedWeek).getAttribute('aria-pressed'),text,rows:rows.map(r=>({id:r.dataset.cw2Task803,text:r.innerText,cells:[...r.cells].map(c=>c.innerText)})),days:[...root.querySelectorAll('.sect')].map(x=>x.innerText),warnings:[...root.querySelectorAll('.notice.warn')].map(x=>x.innerText),inputCount:root.querySelectorAll('input,button[data-complete],.chip.ok').length,viewport:innerWidth,pageWidth:document.documentElement.scrollWidth,wrappers:[...root.querySelectorAll('.tblwrap')].filter(e=>e.getBoundingClientRect().height>0).map(e=>({width:e.clientWidth,scrollWidth:e.scrollWidth,overflow:getComputedStyle(e).overflowX,tableWidth:e.querySelector('table').getBoundingClientRect().width}))};
   },selectedWeek);
   fs.writeFileSync(path.join(out,device+'-dom.json'),JSON.stringify(dom,null,2)+'\n');
   ck(device+': existing week control selects CON WK2',dom.selected==='true');
   ck(device+': 26 source tasks represented once, including the closed Monday notice',dom.rows.length===25&&new Set(dom.rows.map(r=>r.id)).size===25&&dom.text.includes('Public holiday — site closed.')&&source.rows.length===26);
   ck(device+': five scheduled days remain 5–9 October',dom.days.length===5&&/05 OCT 2026/i.test(dom.days[0])&&/09 OCT 2026/i.test(dom.days[4]),dom.days);
   const expected=source.rows.filter(r=>r.id!=='site-closed');
   ck(device+': every dated task location, description and source page is visible',expected.every(r=>{const row=dom.rows.find(x=>x.id===r.id);return row&&row.text.includes(r.location)&&row.text.includes(r.description)&&row.text.includes('Source p. '+r.page);}));
   ck(device+': all three unresolved source quantity conflicts remain visible',source.conflicts.every(c=>{const row=dom.rows.find(r=>r.id===c.row);return row&&row.text.includes('Awaiting confirmation')&&row.text.includes(c.summary)&&row.text.includes(c.detail);}));
   const friday=source.rows.find(r=>r.id==='scrim-fri');
   ck(device+': Friday heading discrepancy remains visible',dom.text.includes(friday.note)&&friday.note.includes('Friday 10th')&&friday.note.includes('Macintosh Park CZ fencing for stage build')&&friday.note.includes('Friday 9 October'));
   const missingNotes=expected.flatMap(r=>{const row=dom.rows.find(x=>x.id===r.id);return(!r.note||row.text.includes(r.note))&&(r.requirements||[]).every(q=>row.text.includes(q.text))?[]:[{id:r.id,note:r.note,requirements:r.requirements,displayed:row.text}];});
   ck(device+': all source prerequisites and notes remain visible',missingNotes.length===0,missingNotes);
   ck(device+': planned work is explicit with no completion control or green done status',/Planned quantity/i.test(dom.text)&&dom.inputCount===0);
   ck(device+': checklist-versus-completion explanation is visible',dom.text.includes('A checklist confirmation is not a completion docket.'));
   ck(device+': source basis and original PDF link are visible',dom.text.includes(source.basis)&&await p.locator('[data-cw2-plan803] .cw2source803 a').isVisible()&&/05_CW2_Fencing_Installation_Plan\.pdf/.test(await p.locator('[data-cw2-plan803] .cw2source803 a').getAttribute('href')));
   ck(device+': tables stay in local scroll containers without page-wide overflow',dom.pageWidth<=dom.viewport+1&&dom.wrappers.every(w=>w.width>0&&(w.scrollWidth<=w.width+1||['auto','scroll'].includes(w.overflow))),{viewport:dom.viewport,pageWidth:dom.pageWidth,wrappers:dom.wrappers});
   const focus=async(selector,file,position='center')=>{await p.locator(selector).evaluate((e,block)=>e.scrollIntoView({block}),position);if(position==='start')await p.evaluate(()=>scrollBy(0,-160));await p.screenshot({path:path.join(out,device+'-'+file+'.png')});};
   await focus('[data-cw2-plan803]','week-top','start');
   await focus('[data-cw2-task803="qps"]','qps-conflict');
   await focus('[data-cw2-task803="club-storage"]','club-conflict');
   await focus('[data-cw2-task803="helen-reconfigure"]','helen-conflict');
   await focus('[data-cw2-task803="scrim-fri"]','friday-note');
   if(phone){
    const accessible=await p.locator('[data-cw2-task803="qps"]').evaluate(row=>{const w=row.closest('.tblwrap');w.scrollLeft=w.scrollWidth;const cell=row.cells[2].getBoundingClientRect(),first=row.cells[0].getBoundingClientRect(),box=w.getBoundingClientRect(),sticky=getComputedStyle(row.cells[0]).position==='sticky',left=cell.left+parseFloat(getComputedStyle(row.cells[2]).paddingLeft);return{scrolled:w.scrollLeft,max:w.scrollWidth-w.clientWidth,cell:{left:cell.left,right:cell.right},stickyFirstRight:sticky?first.right:null,rightReachable:cell.right<=box.right+2&&cell.right>box.left,textStartClear:!sticky||left>=first.right};});
    ck('phone: prerequisite text remains readable beyond the first column',accessible.rightReachable&&accessible.textStartClear,accessible);await focus('[data-cw2-task803="qps"]','qps-prerequisites-end');
    const start=await p.locator('[data-cw2-task803="qps"]').evaluate(row=>{const w=row.closest('.tblwrap'),cell=row.cells[2];w.scrollLeft+=cell.getBoundingClientRect().left-w.getBoundingClientRect().left-1;const r=cell.getBoundingClientRect(),b=w.getBoundingClientRect();return{left:r.left,viewportLeft:b.left,firstColumnPosition:getComputedStyle(row.cells[0]).position,startReachable:r.left>=b.left&&r.left<=b.left+3};});
    ck('phone: start of QPS prerequisite is reachable by ordinary horizontal scroll',start.startReachable&&start.firstColumnPosition==='static',start);await focus('[data-cw2-task803="qps"]','qps-prerequisites-start');
   }
   await p.locator('[data-cw2-plan803] details summary').click();
   ck(device+': source history disclosure opens without replacing current tasks',await p.locator('[data-cw2-plan803] details').getAttribute('open')!==null&&await p.locator('[data-cw2-task803]').count()===25);
   await p.locator('[data-fweek]').filter({hasText:/^Week 6(?: ·.*)?$/}).click();await weekControl.click();
   const after=await p.evaluate(()=>JSON.stringify(allDockets().map(d=>({id:d.id,date:d.date,quantities:d.quantities,cost:d.cost_total,usable:d.usable,lines:d.lines})).sort((a,b)=>String(a.id).localeCompare(String(b.id)))));
   ck(device+': navigation and source-history inspection leave actual quantities and costs unchanged',before===after,{actualSnapshotSha256:hash(before)});
   result.devices.push({device,rows:dom.rows.length,closedMonday:1,days:dom.days,sourceConflicts:source.conflicts.length,actualSnapshotSha256:hash(after),screenshots:fs.readdirSync(out).filter(f=>f.startsWith(device+'-')&&f.endsWith('.png'))});
  }finally{result.errors.push(...s.errors);result.blockedWrites+=s.counts.blocked;await s.browser.close();save();}
 }
 ck('no page/console errors or attempted live writes',result.errors.length===0&&result.blockedWrites===0,{errors:result.errors,blockedWrites:result.blockedWrites});result.complete=true;save();console.log(JSON.stringify({checks:result.checks.length,failures:result.checks.filter(x=>!x.pass),devices:result.devices,errors:result.errors,blockedWrites:result.blockedWrites}));process.exitCode=result.checks.some(x=>!x.pass)?1:0;
})().catch(e=>{result.failure=e.stack;save();console.error(e.stack);process.exitCode=1;});
