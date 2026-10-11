// Author: Andrew Fisher. Read-only native-action checks; run under /tmp/gc500-browser.lock.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {open}=require('../../toolchain/harness/open_page');
const mobile=process.env.MOB==='1',out=process.env.OUTDIR||'/workspace/private-flow994/'+(mobile?'phone':'desktop');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex'),checks=[],failures=[];
const check=(ok,name,detail)=>{checks.push({name,pass:!!ok,...(detail===undefined?{}:{detail})});if(!ok)failures.push(name);console.log(JSON.stringify({step:name,pass:!!ok}));};
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const pageFile=process.env.PAGE;assert(pageFile,'PAGE required');
 const hash=sha(fs.readFileSync(pageFile));if(process.env.EXPECTED_SHA)assert.equal(hash,process.env.EXPECTED_SHA);
 const h=await open({pageFile:process.env.PUBLIC==='1'?undefined:pageFile,hash:'#today',W:mobile?390:1440,H:mobile?844:960,mobile}),p=h.page;
 p.setDefaultTimeout(15000);
 const evidence={author:'Andrew Fisher',mobile,public:process.env.PUBLIC==='1',sha256:hash,checks,failures};
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  await p.evaluate(()=>{go('costs');renderCosts();});
  await p.waitForTimeout(300);
  const before=await p.evaluate(()=>({record:JSON.stringify(S),ledger:JSON.stringify(pl770Model()),demob:JSON.stringify(demob816())}));
  check(await p.evaluate(()=>!!Flow994),'Flow controller installed');
  const navSnapshot=()=>p.evaluate(()=>[...document.querySelectorAll('#pane-costs > .finance857-nav button')].map(b=>({key:b.dataset.finance857||b.dataset.finance888,on:b.getAttribute('aria-pressed')})));
  for(const key of ['summary','pricing','fencing','runsheet','handover','transport']){
   await p.locator('#pane-costs > .finance857-nav [data-'+(key==='transport'?'finance888':'finance857')+'="'+key+'"]').click();
   await p.waitForTimeout(120);
   const nav=await navSnapshot();
   check(nav.filter(x=>x.on==='true').length===1&&nav.find(x=>x.key===key)?.on==='true','Costs selected section: '+key,nav);
   check(await p.locator('#pane-costs > [data-flow994-costback]').count()===(key==='summary'?0:1),'Costs explicit return visibility: '+key);
   if(key==='handover')await p.screenshot({path:path.join(out,'costs-handover.png')});
  }
  await p.locator('#pane-costs > [data-flow994-costback]').focus();await p.keyboard.press('Enter');await p.waitForTimeout(120);
  check(await p.evaluate(()=>state.financeView857==='summary'&&document.activeElement?.dataset.finance857==='summary'&&document.querySelector('main').scrollTop<2),'Back uses native Summary and returns focus/top');
  await p.evaluate(()=>{go('subhired');});
  const owners=await p.evaluate(()=>[...document.querySelectorAll('[data-supplier932-company]')].map(b=>b.dataset.supplier932Company));
  check(owners.length>0,'Native company tabs available');
  for(const owner of owners.slice(0,2)){
   await p.locator('[data-supplier932-company="'+owner+'"]').click();
   const kept=await p.evaluate(()=>{
    const fold=document.querySelector('[data-subhire975-units]');if(!fold)return null;
    fold.open=true;renderSubhired932();const opened=document.querySelector('[data-subhire975-units]').open;
    document.querySelector('[data-subhire975-units]').open=false;renderSubhired932();return {opened,closed:!document.querySelector('[data-subhire975-units]').open};
   });
   check(kept?.opened&&kept?.closed,'Company units immediate open/close survives native redraw: '+owner,kept);
  }
  if(owners.includes('event-portables')){
   await p.locator('[data-supplier932-company="event-portables"]').click();
   const kept=await p.evaluate(()=>{
    const rows=[...document.querySelectorAll('[data-subhire975-day]')];rows.forEach(n=>n.open=false);
    const history=document.querySelector('[data-subhire975-history]');if(history)history.open=true;
    renderSubhired932();return {days:rows.length,closed:[...document.querySelectorAll('[data-subhire975-day]')].every(n=>!n.open),history:document.querySelector('[data-subhire975-history]')?.open};
   });
   check(kept.closed&&kept.history,'Supplier delivery days/history retain viewing state',kept);
   // A DOM-only future-date fixture exercises the same keyed disclosure path if no deliveries remain.
   const fixture=await p.evaluate(()=>{
    const host=document.querySelector('[data-subhire975-plan]');if(!host)return false;
    const d=document.createElement('details');d.dataset.subhire975Day='__fixture__';host.append(d);d.open=false;
    Flow994.captureSubhired();d.remove();const fresh=document.createElement('details');fresh.dataset.subhire975Day='__fixture__';fresh.open=true;host.append(fresh);Flow994.restoreSubhired();const closed=!fresh.open;fresh.remove();return closed;
   });check(fixture,'Detached future delivery-day view state remains closed (DOM fixture)');
   if(owners.some(o=>o!=='event-portables')){
    await p.locator('[data-supplier932-company="'+owners.find(o=>o!=='event-portables')+'"]').click();
    await p.locator('[data-supplier932-company="event-portables"]').click();
    check(await p.locator('[data-subhire975-history]').evaluate(n=>n.open),'Supplier state survives switching companies');
   }
   await p.screenshot({path:path.join(out,'subhired.png')});
  }
  await p.evaluate(()=>go('coatesway'));
  const rows=await p.evaluate(()=>({actions:cwReds().filter(r=>r.go).length,buttons:[...document.querySelectorAll('[data-cwred-open]')].map(b=>({tag:b.tagName,type:b.type,tab:b.tabIndex,handler:typeof b.onclick}))}));
  check(rows.actions===rows.buttons.length&&rows.buttons.every(b=>b.tag==='BUTTON'&&b.type==='button'&&b.tab>=0&&b.handler==='function'),'Coates Way source actions are native keyboard buttons',rows);
  if(rows.buttons.length){
   await p.locator('[data-cwred-open]').first().focus();await p.keyboard.press('Enter');await p.waitForTimeout(150);
   check(await p.evaluate(()=>state.tab!=='coatesway'),'Coates Way Enter opens native destination');
  }
  // Edit-mode native-action fixture runs synchronously, so the service poll cannot restore
  // readonly mid-check. No Upload, save or write handler is invoked; original capability is restored.
  const docCheck=await p.evaluate(()=>{
   const previous={capability,readonly:SYNC.readonly,level:SYNC.level};
   try{
    capability=()=> 'edit';SYNC.readonly=false;SYNC.level='edit';go('docs');applyCapability();
    const toggle=document.querySelector('#docAdd815'),close=document.querySelector('#docAddClose994'),card=document.querySelector('#docAddCard');
    const controls=!!toggle&&!!close&&toggle.type==='button'&&close.type==='button';
    if(!controls)return {controls};
    if(state.docAdd815)toggle.click();
    toggle.focus();toggle.click();
    document.querySelector('#docTitle').value='Browser-only unsaved file selection';
    const dt=new DataTransfer();dt.items.add(new File(['No upload is invoked.'],'read-only-fixture.txt',{type:'text/plain'}));document.querySelector('#docFile').files=dt.files;
    const expanded=toggle.textContent==='Close add document'&&!card.hidden;
    close.focus();close.click();
    const closed=card.hidden&&toggle.textContent==='+ Add'&&document.activeElement===toggle;
    toggle.click();
    const retained=document.querySelector('#docTitle').value==='Browser-only unsaved file selection'&&document.querySelector('#docFile').files[0]?.name==='read-only-fixture.txt';
    return {controls,expanded,closed,retained};
   }finally{capability=previous.capability;SYNC.readonly=previous.readonly;SYNC.level=previous.level;go('costs');applyCapability();}
  });
  check(docCheck.controls,'Native upload form has one toggle and one Close (browser-only editable fixture)',docCheck);
  check(docCheck.expanded,'Document toggle describes expanded state');
  check(docCheck.closed,'Document native Close returns to original toggle');
  check(docCheck.retained,'Close/reopen preserves unsaved native file selection');
  const after=await p.evaluate(()=>({record:JSON.stringify(S),ledger:JSON.stringify(pl770Model()),demob:JSON.stringify(demob816())}));
  check(before.record===after.record,'Shared operational record unchanged');
  check(before.ledger===after.ledger,'Native P&L model unchanged');
  check(before.demob===after.demob,'Native Demob model unchanged');
  check(h.errors.length===0,'No browser errors',h.errors);
  check(h.counts.blocked===0,'No operational writes attempted',h.counts);
  check(process.env.PUBLIC!=='1'||h.counts.page===0,'Public mode uses no HTML substitution');
 }catch(e){failures.push(String(e.stack||e));}
 finally{evidence.counts=h.counts;evidence.errors=h.errors;fs.writeFileSync(path.join(out,'flow994.json'),JSON.stringify(evidence,null,2));await h.browser.close();}
 console.log(JSON.stringify({passed:checks.filter(x=>x.pass).length,total:checks.length,failures,out}));if(failures.length)process.exitCode=1;
})();
