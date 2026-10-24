// Author: Andrew Fisher. Read-only checks; local edit fixture never saves.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
let servedHash;
if(process.env.PUBLIC==='1'){
 const fetcher=require('../../toolchain/harness/curlfetch'),original=fetcher.curlFetch;
 fetcher.curlFetch=async function(url,...args){const r=await original(url,...args);if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))servedHash=sha(r.body);return r;};
}
const {open}=require('../../toolchain/harness/open_page');
const mobile=process.env.MOB==='1',publicMode=process.env.PUBLIC==='1';
const out=process.env.OUTDIR||'/workspace/private-gc500-v994/'+(mobile?'phone':'desktop');
fs.mkdirSync(out,{recursive:true});
const checks=[];function check(ok,name){checks.push({name,pass:!!ok});assert(ok,name);}
(async()=>{
 if(!publicMode)assert.equal(sha(fs.readFileSync(process.env.PAGE)),process.env.EXPECTED_SHA);
 const h=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#day/2026-10-12',mobile,W:mobile?390:1440,H:mobile?844:960}),p=h.page;
 const evidence={author:'Andrew Fisher',mobile,actualPublic:publicMode,sha256:process.env.EXPECTED_SHA,checks};
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  if(publicMode){check(h.counts.page===0,'Actual public HTML without substitution');check(servedHash===process.env.EXPECTED_SHA,'Public bytes match candidate');}
  const before=await p.evaluate(()=>({record:JSON.stringify(S),money:JSON.stringify(pl770Model())}));
  await p.evaluate(()=>{state.day='2026-10-12';go('timeline');renderTimeline();});
  const cards=await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline .bc984-day')].map(el=>{
   const m=DailyStaff988.day(el.dataset.day);
   return {day:el.dataset.day,names:m.names,shown:[...el.querySelectorAll('.bc984-names>span:not(.bc984-missing)')].map(n=>n.textContent),count:m.count,label:el.querySelector('.bc984-crew-count')?.textContent||''};
  }));
  check(cards.length>20,'Build retains the programme day cards');
  check(cards.every(c=>JSON.stringify(c.names)===JSON.stringify(c.shown)),'Weather cards retain exact native staff names');
  check(cards.every(c=>c.count===null?/not recorded/i.test(c.label):c.label.includes(String(c.count))),'Weather cards retain recorded count and unknown distinction');
  check(!(await p.locator('#pane-timeline .staff988').isVisible()),'Read-only Build has no repeated staff panel');
  await p.locator('#pane-timeline .bc984-more').scrollIntoViewIfNeeded();
  await p.screenshot({path:path.join(out,'build-no-duplicate.png')});
  await p.emulateMedia({media:'print'});
  check(!(await p.locator('#pane-timeline .staff988').isVisible()),'Print does not repeat weather-card staff');
  await p.emulateMedia({media:'screen'});
  const local=await p.evaluate(()=>{
   const original=capability,readonly=SYNC.readonly;
   const visible=n=>!!n?.getClientRects().length&&getComputedStyle(n).display!=='none';
   try{
    capability=()=> 'edit';SYNC.readonly=false;state.day='2026-10-14';renderTimeline();
    const get=()=>document.querySelector('#pane-timeline .staff988'),box=get(),fold=box.querySelector('[data-staff988-edit]');
    const result={height:box.getBoundingClientRect().height,editVisible:visible(fold),duplicatesHidden:[...box.querySelectorAll('.staff988-heading,.staff988-names,.staff988-empty')].every(n=>!visible(n))};
    fold.open=true;box.querySelector('[data-staff988-other]').value='Unsaved local draft';
    box.querySelector('[data-staff988-extra]').value='4';
    renderTimeline();DailyStaff988.refresh();syncFooter();
    result.draftRetained=get().querySelector('[data-staff988-other]').value==='Unsaved local draft'&&get().querySelector('[data-staff988-extra]').value==='4'&&get().querySelector('[data-staff988-edit]').open;
    get().querySelector('[data-staff988-edit]').open=false;DailyStaff988.refresh();
    result.closedHeight=get().getBoundingClientRect().height;
    state.day='2026-10-09';renderTimeline();result.pastHidden=!visible(get());
    return result;
   }finally{capability=original;SYNC.readonly=readonly;state.day='2026-10-12';renderTimeline();}
  });evidence.staffEditor=local;
  check(local.editVisible&&local.duplicatesHidden,'Edit mode keeps native editor without repeating summary');
  check(local.height<=58&&local.closedHeight<=58,'Closed editor is a compact single row');
  check(local.draftRetained,'Native refresh retains unsaved availability draft');
  check(local.pastHidden,'Past day has neither duplicate panel nor editable availability');
  await p.evaluate(()=>{go('plant');render();});
  const eq=await p.locator('#pane-plant .eqhead').evaluate(n=>({heading:n.querySelector('h3')?.textContent,color:getComputedStyle(n.querySelector('h3')).color,background:getComputedStyle(n).backgroundColor,pseudo:getComputedStyle(n,'::after').content}));
  check(eq.heading?.includes('Equipment')&&eq.color==='rgb(255, 255, 255)'&&eq.background==='rgb(35, 42, 46)'&&eq.pseudo==='none','Equipment heading has its original dark face and readable white text');
  await p.locator('#pane-plant .eqhead').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'equipment-heading.png')});
  await p.evaluate(()=>go('demob'));
  const dm=await p.locator('#pane-demob > .staff988').evaluate(n=>({color:getComputedStyle(n).color,pseudo:getComputedStyle(n,'::after').content,text:n.textContent,day:n.dataset.staff988Day,names:DailyStaff988.day(n.dataset.staff988Day).names}));
  check(dm.color==='rgb(237, 243, 246)'&&dm.pseudo==='none','Demob uses approved compact staff panel styling');
  check(dm.names.every(n=>dm.text.includes(n)),'Demob still displays its own native daily names');
  await p.locator('#pane-demob > .staff988').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(out,'demob-staff.png')});
  await p.evaluate(()=>go('change'));
  check((await p.locator('[data-chtl]').first().innerText())==='Open in Build','Change deliveries uses current Build terminology');
  await p.evaluate(()=>go('coatesway'));
  await p.waitForFunction(()=>document.querySelector('#cwMachineState')?.textContent.startsWith('On this service: build'),null,{timeout:30000});
  const meta=await p.locator('#cwMachineState').evaluate(n=>({inside:!!n.closest('#cwmachine > details.sfold > .sfoldbody'),count:document.querySelectorAll('#cwMachineState').length,extra:document.querySelectorAll('#cwmachine .presentation994-machine-info').length,button:!document.querySelector('#cwOpenMachine').disabled}));
  check(meta.inside&&meta.count===1&&meta.extra===0&&meta.button,'Healthy machine metadata shares native More info; Open remains available');
  check(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'No horizontal page overflow');
  const after=await p.evaluate(b=>({record:JSON.stringify(S)===b.record,money:JSON.stringify(pl770Model())===b.money}),before);
  check(after.record&&after.money,'Presentation preserves shared records and P&L');
  check(h.errors.length===0,'No browser errors');check(h.counts.blocked===0,'No operational writes');
  evidence.pass=true;evidence.errors=h.errors;evidence.writes=h.counts.blocked;
 }catch(e){evidence.pass=false;evidence.error=String(e.stack||e);throw e;}
 finally{fs.writeFileSync(path.join(out,'presentation.json'),JSON.stringify(evidence,null,2));await h.browser.close();console.log(JSON.stringify({pass:evidence.pass,checks:checks.length,mobile,actualPublic:publicMode}));}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
