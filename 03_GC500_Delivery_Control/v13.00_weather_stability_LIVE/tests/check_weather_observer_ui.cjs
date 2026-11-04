/* Author: Andrew Fisher. Native read-only staff mount and equipment observer regression. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {open}=require('../../toolchain/harness/open_page');
const PAGE=process.env.PAGE,LIVE=process.env.LIVE==='1',OUT=process.env.OUT;
assert((PAGE||LIVE)&&OUT&&path.isAbsolute(OUT),'PAGE or LIVE=1 and private absolute OUT required');
const repo=path.resolve(__dirname,'../../..'),out=path.resolve(OUT);
assert(out!==repo&&!out.startsWith(repo+path.sep),'Evidence must stay outside repository');
fs.mkdirSync(OUT,{recursive:true,mode:0o700});

// Preserve each native callback and observe only the animation-frame work it schedules.
// A delivered observer callback alone is not evidence of an expensive decoration.
const init=`(()=>{
 const NativeObserver=window.MutationObserver,nativeFrame=window.requestAnimationFrame;
 const fresh=()=>({batches:0,controlOnlyBatches:0,mixedBatches:0,scheduled:0,ran:0});
 const probe=window.__observer1300={on:false,origin:null,created:{demobmap:0,singles:0},stats:{},reset(){this.stats={demobmap:fresh(),singles:fresh()};}};probe.reset();
 window.requestAnimationFrame=function(callback){
  const kind=probe.on&&probe.origin,bucket=kind&&probe.stats[kind];if(bucket)bucket.scheduled++;
  return nativeFrame.call(this,function(time){if(bucket)bucket.ran++;return callback.call(this,time);});
 };
 window.MutationObserver=class extends NativeObserver{
  constructor(callback){
   const source=String(callback),kind=source.includes('hold(decorate)')?'singles':source.includes('soon()')&&source.includes('.ov1236')?'demobmap':null;
   if(kind)probe.created[kind]++;
   super((records,observer)=>{
    const previous=probe.origin;
    if(kind&&probe.on){const bucket=probe.stats[kind],control=records.map(m=>!!m.target.closest?.('.dc996-controls'));bucket.batches++;if(control.every(Boolean))bucket.controlOnlyBatches++;else if(control.some(Boolean))bucket.mixedBatches++;probe.origin=kind;}
    try{return callback(records,observer);}finally{probe.origin=previous;}
   });
  }
 };
})();`;

(async()=>{
 const s=await open({pageFile:LIVE?undefined:PAGE,hash:'#demob',mobile:true,W:390,H:844,dpr:1,init});
 const p=s.page,consoleErrors=[];p.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text().slice(0,180));});
 try{
  await p.waitForFunction(()=>window.DailyStaff988&&window.Singles1238&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:120000});
  await p.evaluate(()=>{DM816.sel=todayIso();DM816.view='everything';go('demob');});
  await p.waitForFunction(()=>!!document.querySelector('#pane-demob .staff988')&&!!document.querySelector('#pane-demob .sgv1238'));await p.waitForTimeout(800);

  const mount=await p.evaluate(()=>{
   const before=document.querySelector('#pane-demob .staff988'),raw=DailyStaff988.html(before.dataset.staff988Day),temp=document.createElement('template'),record=JSON.stringify(S);temp.innerHTML=raw;
   const structuralEqual=before.isEqualNode(temp.content.firstElementChild),rawSerializationDiffers=before.outerHTML!==raw;
   for(let i=0;i<12;i++)DailyStaff988.refresh();
   window.__observer1300.pollNode=before;window.__observer1300.footerCalls=0;
   const native=syncFooter;window.__observer1300.nativeFooter=native;syncFooter=function(){__observer1300.footerCalls++;return native.apply(this,arguments);};
   return {structuralEqual,rawSerializationDiffers,nodeRetained:document.querySelector('#pane-demob .staff988')===before,recordUnchanged:JSON.stringify(S)===record};
  });
  for(const [name,value]of Object.entries(mount))assert(value,'unchanged native mount: '+name);
  await p.waitForTimeout(9100);
  const polling=await p.evaluate(()=>{const result={footerCalls:__observer1300.footerCalls,nodeRetained:document.querySelector('#pane-demob .staff988')===__observer1300.pollNode};syncFooter=__observer1300.nativeFooter;delete __observer1300.nativeFooter;return result;});
  assert(polling.footerCalls>=2,'At least two native polling/footer refreshes must occur');assert(polling.nodeRetained,'Unchanged staff section must survive native polling');

  const changedFacts=await p.evaluate(()=>{
   const native=DailyStaff988.day,day=demobSel816(demob816()),before=document.querySelector('#pane-demob .staff988'),record=JSON.stringify(S),token=before.dataset.staff988Token;
   try{
    DailyStaff988.day=function(iso){const facts=native(iso);return iso===day?{...facts,count:1,names:['Native regression staff'],unnamed:0,token:facts.token+'-regression'}:facts;};
    DailyStaff988.refresh();const after=document.querySelector('#pane-demob .staff988');
    return {nodeChanged:after!==before,freshName:after.querySelector('.staff988-names').textContent.includes('Native regression staff'),freshCount:after.querySelector('.staff988-heading strong').textContent==='1 available',freshToken:after.dataset.staff988Token!==token,recordUnchanged:JSON.stringify(S)===record};
   }finally{DailyStaff988.day=native;DailyStaff988.refresh();}
  });
  for(const [name,value]of Object.entries(changedFacts))assert(value,'changed native facts: '+name);
  await p.waitForTimeout(700);

  const measure=async action=>{
   await p.evaluate(()=>{__observer1300.reset();__observer1300.on=true;});
   const actionResult=await p.evaluate(action);
   await p.waitForTimeout(650);
   const stats=await p.evaluate(()=>{__observer1300.on=false;return __observer1300.stats;});
   return {action:actionResult,stats};
  };
  const pause=await measure(()=>{const button=document.querySelector('#pane-demob [data-dc996-pause]'),before=button.textContent,record=JSON.stringify(S);button.click();return {labelChanged:button.textContent!==before,recordUnchanged:JSON.stringify(S)===record};});
  assert(pause.action.labelChanged);assert(pause.action.recordUnchanged);
  for(const [name,counts]of Object.entries(pause.stats)){assert(counts.controlOnlyBatches>0,name+' must observe the native pause label');assert.equal(counts.scheduled,0,name+' must ignore pause-label changes');assert.equal(counts.ran,0,name+' must not decorate for pause-label changes');}
  const resume=await measure(()=>{const button=document.querySelector('#pane-demob [data-dc996-pause]'),before=button.textContent;button.click();return {labelChanged:button.textContent!==before};});
  assert(resume.action.labelChanged);
  for(const [name,counts]of Object.entries(resume.stats)){assert(counts.controlOnlyBatches>0,name+' must observe the native resume label');assert.equal(counts.ran,0,name+' must not decorate for resume-label changes');}

  const equipment=await measure(()=>{const view=document.querySelector('#pane-demob .sgv1238'),record=JSON.stringify(S),parent=view.parentElement;view.replaceWith(view.cloneNode(true));return {outsideIgnoredSubtree:!parent.closest('.sgv1238,.pg1238,.dl1238,.dc996-controls'),recordUnchanged:JSON.stringify(S)===record};});
  assert(equipment.action.outsideIgnoredSubtree);assert(equipment.action.recordUnchanged);
  for(const [name,counts]of Object.entries(equipment.stats))assert(counts.ran>0,name+' must still decorate after an equipment view replacement');
  const mixed=await measure(()=>{document.querySelector('#pane-demob [data-dc996-pause]').click();const view=document.querySelector('#pane-demob .sgv1238');view.replaceWith(view.cloneNode(true));return {nativeControlAndEquipmentChanged:true};});
  for(const [name,counts]of Object.entries(mixed.stats)){assert(counts.mixedBatches>0,name+' must receive both mutation types in one batch');assert(counts.ran>0,name+' must retain genuine equipment work in a mixed batch');}

  const draft=await p.evaluate(()=>{
   const nativeDay=DailyStaff988.day,nativeCapability=capability,readonly=SYNC.readonly,level=SYNC.level,record=JSON.stringify(S),day=todayIso();
   try{
    capability=()=> 'edit';SYNC.readonly=false;SYNC.level='edit';DailyStaff988.refresh();
    const box=document.querySelector('#pane-demob .staff988'),details=box.querySelector('[data-staff988-edit]'),extra=box.querySelector('[data-staff988-extra]'),other=box.querySelector('[data-staff988-other]'),choice=box.querySelector('[data-staff988-choice]');
    if(!details||!extra||!other)throw new Error('Native editable availability controls are required');
    details.open=true;extra.value='3';other.value='Unsaved regression name';if(choice)choice.checked=!choice.checked;
    const selected=choice?.checked,token=box.dataset.staff988Token;other.dispatchEvent(new Event('input',{bubbles:true}));
    DailyStaff988.day=function(iso){const facts=nativeDay(iso);return iso===day?{...facts,count:2,names:['Concurrent regression staff'],unnamed:1,token:facts.token+'-concurrent'}:facts;};
    DailyStaff988.refresh();syncFooter();
    const retained=document.querySelector('#pane-demob .staff988'),sameNode=retained===box,tokenRetained=retained.dataset.staff988Token===token;
    renderDemob816();const redrawn=document.querySelector('#pane-demob .staff988');
    return {sameNode,tokenRetained,openAfterRender:!!redrawn.querySelector('[data-staff988-edit][open]'),extraRetained:redrawn.querySelector('[data-staff988-extra]').value==='3',nameRetained:redrawn.querySelector('[data-staff988-other]').value==='Unsaved regression name',choiceRetained:!choice||redrawn.querySelector('[data-staff988-choice]').checked===selected,recordUnchanged:JSON.stringify(S)===record};
   }finally{DailyStaff988.day=nativeDay;capability=nativeCapability;SYNC.readonly=readonly;SYNC.level=level;}
  });
  for(const [name,value]of Object.entries(draft))assert(value,'open native draft: '+name);
  const created=await p.evaluate(()=>__observer1300.created);assert.equal(created.demobmap,1);assert.equal(created.singles,1);
  assert.deepEqual(s.errors,[]);assert.deepEqual(consoleErrors,[]);assert.equal(s.counts.blocked,0);
  const report={author:'Andrew Fisher',passed:true,live:LIVE,candidateSha256:PAGE?crypto.createHash('sha256').update(fs.readFileSync(PAGE)).digest('hex'):null,mount,polling,changedFacts,pause,resume,equipment,mixed,draft,created,errors:s.errors,consoleErrors,attemptedRecordWrites:s.counts.blocked};
  fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2)+'\n');
  console.log('PASS native staff retention through polling, changed facts, open draft and weather-control/equipment observer regression; 0 errors, 0 console errors, 0 attempted record writes');
 }finally{await s.browser.close();}
})().catch(error=>{fs.writeFileSync(path.join(OUT,'failure.json'),JSON.stringify({message:error.message,stack:error.stack},null,2)+'\n');console.error(String(error.message).split('\n')[0]+'; details saved in private evidence');process.exitCode=1;});
