/* Author: Andrew Fisher. Isolated native Save practice; every service write is captured. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page'));
const out=process.env.OUT||'/workspace/private-gc5001010-p33';fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',mode:process.env.LIVE==='1'?'public':'candidate',checks:[],errors:[],blocked:0};
function check(name,ok,detail){report.checks.push({name,ok,detail});assert(ok,name+': '+JSON.stringify(detail));}
(async()=>{
 for(const mobile of [true,false]){
  const label=mobile?'phone':'desktop',h=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE||path.resolve(__dirname,'../../build/GC500_v10.10/GC500_Delivery_Control_hosted.html'),mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});
  try{
   const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:120000});
   const version=await p.evaluate(()=>SYNC.backend.readVersion821());
   await p.route('**/api/version',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({version,level:'edit'})}));
   await p.evaluate(()=>{
    capability=()=> 'edit';canEdit=()=>true;mayWrite=()=>true;whoAmI=()=> 'Practice operator';SYNC.readonly=false;SYNC.level='edit';
    window.__p331010writes=[];SYNC.db.doc=path=>({set:body=>{__p331010writes.push({path,body});return new Promise(()=>{});},delete:()=>{__p331010writes.push({path,body:null});return new Promise(()=>{});}});
    go('timeline');openAsset('P33');
    document.querySelectorAll('#drawer details').forEach(d=>d.open=true);
   });
   const fixture=await p.evaluate(()=>{
    const form=[...document.querySelectorAll('#drawer [data-unit925-form]')].find(f=>f.dataset.source&&!f.dataset.doc);
    if(!form)return {found:false,forms:[...document.querySelectorAll('#drawer [data-unit925-form]')].map(f=>({doc:!!f.dataset.doc,source:!!f.dataset.source}))};
    const card=form.closest('[data-unit925-id]'),nested=form.querySelector('details');
    window.__p33Source=form.dataset.source;window.__p33Id=card.dataset.unit925Id;
    const note=form.querySelector('[name="note"]');note.value='Persistence practice only';nested.open=true;form.querySelector('[type="submit"]').scrollIntoView({block:'center'});
    return {found:true,id:card.dataset.unit925Id,source:form.dataset.source,beforeDoc:form.dataset.doc};
   });
   check(label+' P33 original unit has first metadata Save fixture',fixture.found,fixture);
   const pos=()=>({drawer:document.querySelector('#drawer').scrollTop,body:document.querySelector('#drawer .db').scrollTop,on:document.querySelector('#drawer').classList.contains('on')});
   const beforeSave=await p.evaluate(pos);
   await p.evaluate(()=>{const form=[...document.querySelectorAll('#drawer [data-unit925-form]')].find(f=>f.dataset.source===__p33Source);form.querySelector('[type="submit"]').focus({preventScroll:true});form.requestSubmit();});
   await p.waitForTimeout(180);
   const afterSave=await p.evaluate(()=>{
    const form=[...document.querySelectorAll('#drawer [data-unit925-form]')].find(f=>f.dataset.source===__p33Source);
    return {on:document.querySelector('#drawer').classList.contains('on'),drawer:document.querySelector('#drawer').scrollTop,body:document.querySelector('#drawer .db').scrollTop,nestedOpen:form?.querySelector('details')?.open,doc:form?.dataset.doc,note:form?.querySelector('[name="note"]')?.value,feedback:form?.querySelector('[data-unit925-result]')?.textContent,kept:bump.kept};
   });
   check(label+' P33 first metadata Save keeps nested details open',afterSave.on&&afterSave.nestedOpen&&!!afterSave.doc&&afterSave.note==='Persistence practice only',afterSave);
   check(label+' P33 metadata Save stays at reading position',Math.abs(beforeSave.drawer-afterSave.drawer)<40&&Math.abs(beforeSave.body-afterSave.body)<40,{beforeSave,afterSave});
   check(label+' native Save kept result remains observable',afterSave.kept===true,afterSave.kept);
   await p.evaluate(()=>{document.querySelectorAll('#drawer details').forEach(d=>d.open=true);document.querySelector('#noteBox').value='Lower notes Save practice';document.querySelector('#noteSave').scrollIntoView({block:'center'});document.querySelector('#noteSave').focus({preventScroll:true});});
   const beforeNotes=await p.evaluate(pos);
   await p.locator('#noteSave').click();await p.waitForTimeout(180);
   const afterNotes=await p.evaluate(pos);
   check(label+' P33 lower note Save remains open and scrolled',afterNotes.on&&Math.abs(beforeNotes.drawer-afterNotes.drawer)<40&&Math.abs(beforeNotes.body-afterNotes.body)<40,{beforeNotes,afterNotes});
   check(label+' P33 note reaches local native record once',await p.evaluate(()=>S.notes.P33==='Lower notes Save practice'));
   await p.evaluate(()=>Idle1006.refreshDrawer());await p.waitForTimeout(80);
   const afterRemote=await p.evaluate(pos);
   check(label+' P33 later document/remote refresh keeps lower section',afterRemote.on&&Math.abs(afterRemote.drawer-afterNotes.drawer)<40&&Math.abs(afterRemote.body-afterNotes.body)<40,{afterNotes,afterRemote});
   await p.screenshot({path:out+'/'+label+'-p33-save.png'});
   await p.locator('#dclose').click();
   for(const tab of ['timeline','today','costs','demob','fencing']){
    await p.evaluate(tab=>{go(tab);document.querySelectorAll('#pane-'+state.tab+' details').forEach(d=>d.open=true);},tab);
    const before=await p.evaluate(()=>{const pane=document.querySelector('#pane-'+state.tab),details=[...pane.querySelectorAll('details')];if(details.length)details[Math.floor(details.length/2)].scrollIntoView({block:'center'});return {tab:state.tab,folds:details.map(d=>Persistence1010.key(d,pane)),top:document.querySelector('main').scrollTop};});
    await p.evaluate(()=>bump());await p.waitForTimeout(100);
    const after=await p.evaluate(()=>{const pane=document.querySelector('#pane-'+state.tab);return {tab:state.tab,folds:[...pane.querySelectorAll('details[open]')].map(d=>Persistence1010.key(d,pane)),top:document.querySelector('main').scrollTop};});
    check(label+' '+tab+' local Save preserves open disclosures',before.tab===after.tab&&before.folds.every(k=>after.folds.includes(k)),{beforeCount:before.folds.length,afterCount:after.folds.length});
    check(label+' '+tab+' local Save preserves reading position',Math.abs(before.top-after.top)<40,{before:before.top,after:after.top});
   }
   await p.evaluate(()=>{go('timeline');const first=document.querySelector('#pane-timeline details');if(first)first.open=false;bump();});
   check(label+' deliberately closed disclosure stays closed',!await p.locator('#pane-timeline details').first().evaluate(d=>d.open));
   await p.evaluate(()=>{openAsset('P33');document.querySelector('#dclose').click();Idle1006.redraw();});
   check(label+' explicit Close is not undone after Save or sync',!await p.locator('#drawer').evaluate(d=>d.classList.contains('on')));
   await p.waitForFunction(()=>__p331010writes.some(w=>w.path.startsWith('notes/'))&&__p331010writes.some(w=>w.path.startsWith('loads/')),null,{timeout:10000});
   check(label+' metadata and notes native writes captured locally',await p.evaluate(()=>__p331010writes.some(w=>w.path.startsWith('notes/'))&&__p331010writes.some(w=>w.path.startsWith('loads/'))));
   report.errors.push(...h.errors);report.blocked+=h.counts.blocked;
  }finally{await h.browser.close();}
 }
 check('zero browser errors',report.errors.length===0,report.errors);check('zero operational writes',report.blocked===0,report.blocked);
 fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,checks:report.checks.length,errors:report.errors,blocked:report.blocked,out}));
})().catch(e=>{report.failure=String(e);fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
