/* Author: Andrew Fisher. Isolated native Save practice; every service write is captured. */
const fs=require('fs'),path=require('path'),assert=require('assert'),crypto=require('crypto');
const {open}=require(path.resolve(__dirname,'../../toolchain/harness/open_page'));
const {curlFetch}=require(path.resolve(__dirname,'../../toolchain/harness/curlfetch'));
const out=process.env.OUT||'/workspace/private-gc5001010-p33';fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',mode:process.env.LIVE==='1'?'public':'candidate',checks:[],errors:[],blocked:0,publicLoads:[]};
function check(name,ok,detail){report.checks.push({name,ok,detail});assert(ok,name+': '+JSON.stringify(detail));}
(async()=>{
 for(const mobile of [true,false]){
  const label=mobile?'phone':'desktop',h=await open({pageFile:process.env.LIVE==='1'?undefined:process.env.PAGE||path.resolve(__dirname,'../../build/GC500_v10.10/GC500_Delivery_Control_hosted.html'),mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});
  try{
   const p=h.page;
   if(process.env.LIVE==='1'){
    assert(process.env.EXPECTED_SHA,'LIVE verification requires EXPECTED_SHA');
    // Capture the actual network response before Chromium evicts this large HTML
    // from its inspector cache. This is the harness's fresh GET, not a local build.
    let bytes;
    await p.route(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:\?.*)?$/,async route=>{
     const request=route.request();assert(request.method()==='GET');
     const response=await curlFetch(request.url(),request.headers(),'GET');assert(response.status===200);
     bytes=Buffer.from(response.body);await route.fulfill(response);
    },{times:1});
    await p.reload({waitUntil:'load',timeout:180000});assert(bytes,'Actual public navigation response was not captured');
    const received={viewport:label,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,localPageSubstitutions:h.counts.page};report.publicLoads.push(received);
    check(label+' exact public build received without local substitution',received.sha256===process.env.EXPECTED_SHA&&received.localPageSubstitutions===0,received);
    if(mobile)fs.writeFileSync(out+'/actual-public-page.html',bytes);
   }
   await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:120000});
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
    return {found:true,id:card.dataset.unit925Id,source:form.dataset.source,beforeDoc:form.dataset.doc,nestedKey:Persistence1010.key(nested,document.querySelector('#drawer'))};
   });
   check(label+' P33 original unit has first metadata Save fixture',fixture.found,fixture);
   if(process.env.LIVE==='1')check(label+' note guidance makes no unconditional shared-save claim',await p.locator('#noteBox').evaluate(el=>el.parentElement.querySelector('.hint')?.textContent.trim()==='Use Save note to record your changes.'));
   const pos=()=>({drawer:document.querySelector('#drawer').scrollTop,body:document.querySelector('#drawer .db').scrollTop,on:document.querySelector('#drawer').classList.contains('on')});
   const beforeSave=await p.evaluate(pos);
   await p.evaluate(()=>{const form=[...document.querySelectorAll('#drawer [data-unit925-form]')].find(f=>f.dataset.source===__p33Source);form.querySelector('[type="submit"]').focus({preventScroll:true});form.requestSubmit();});
   await p.waitForTimeout(180);
   const afterSave=await p.evaluate(()=>{
    const form=[...document.querySelectorAll('#drawer [data-unit925-form]')].find(f=>f.dataset.source===__p33Source);
    return {on:document.querySelector('#drawer').classList.contains('on'),drawer:document.querySelector('#drawer').scrollTop,body:document.querySelector('#drawer .db').scrollTop,nestedOpen:form?.querySelector('details')?.open,nestedKey:form?.querySelector('details')&&Persistence1010.key(form.querySelector('details'),document.querySelector('#drawer')),doc:form?.dataset.doc,note:form?.querySelector('[name="note"]')?.value,feedback:form?.querySelector('[data-unit925-result]')?.textContent,kept:bump.kept};
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
   if(process.env.LIVE==='1')check(label+' pending note Save reports on-device status only',await p.locator('#flash').textContent()==='Note saved on this device.');
   await p.evaluate(()=>Idle1006.refreshDrawer());await p.waitForTimeout(80);
   const afterRemote=await p.evaluate(pos);
   check(label+' P33 later document/remote refresh keeps lower section',afterRemote.on&&Math.abs(afterRemote.drawer-afterNotes.drawer)<40&&Math.abs(afterRemote.body-afterNotes.body)<40,{afterNotes,afterRemote});
   await p.screenshot({path:out+'/'+label+'-p33-save.png'});
   const scrollIntent=await p.evaluate(()=>{
    Idle1006.refreshDrawer();const dr=document.querySelector('#drawer'),sc=dr.scrollHeight>dr.clientHeight+1?dr:dr.querySelector('.db');
    sc.dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:-300}));sc.scrollTop=Math.max(0,sc.scrollTop-300);window.__p33IntentScroller=sc;return {top:sc.scrollTop,anchor:document.querySelector('#noteSave').getBoundingClientRect().top};
   });
   await p.waitForTimeout(80);
   const afterIntent=await p.evaluate(()=>({top:__p33IntentScroller.scrollTop,anchor:document.querySelector('#noteSave').getBoundingClientRect().top,intent:Persistence1010.intent}));
   check(label+' queued layout correction yields to fresh scroll intent',Math.abs(afterIntent.top-scrollIntent.top)<3||Math.abs(afterIntent.top-scrollIntent.top)<40&&Math.abs(afterIntent.anchor-scrollIntent.anchor)<3,{before:scrollIntent,after:afterIntent});
   const newReference=await p.evaluate(()=>{Idle1006.refreshDrawer();openAsset('WC70');return {drawer:document.querySelector('#drawer').scrollTop,body:document.querySelector('#drawer .db').scrollTop};});await p.waitForTimeout(80);
   const afterReference=await p.evaluate(()=>({ref:state.sel,drawer:document.querySelector('#drawer').scrollTop,body:document.querySelector('#drawer .db').scrollTop}));
   check(label+' queued P33 layout correction cannot move another reference',afterReference.ref==='WC70'&&Math.abs(afterReference.drawer-newReference.drawer)<40&&Math.abs(afterReference.body-newReference.body)<40,{before:newReference,after:afterReference});
   await p.locator('#drawer [data-nav934-back]').click();await p.evaluate(()=>Idle1006.redraw());
   check(label+' Back returns normally and stays closed after refresh',!await p.locator('#drawer').evaluate(d=>d.classList.contains('on')));
   for(const tab of ['timeline','today','costs','demob','fencing','workforce']){
    await p.evaluate(tab=>{go(tab==='workforce'?'costs':tab);document.querySelectorAll('#pane-'+state.tab+' details').forEach(d=>d.open=true);},tab);
    // Day-document menus deliberately allow one open menu: let native toggle rules settle.
    await p.waitForTimeout(80);
    // Today materialises lazy panels and holds their headings for at most 1.5 s.
    // Record the reading position after that initial layout finishes, as a user reading then saving does.
    if(tab==='today')await p.waitForTimeout(1700);
    await p.evaluate(()=>document.querySelector('main').dispatchEvent(new WheelEvent('wheel',{bubbles:true,deltaY:100})));
    const before=await p.evaluate(tab=>{const pane=document.querySelector('#pane-'+state.tab),scope=tab==='workforce'?document.querySelector('#workforce')||pane:pane,details=[...scope.querySelectorAll('details[open]')];if(details.length)details[Math.floor(details.length/2)].scrollIntoView({block:'center'});else scope.scrollIntoView({block:'center'});return {tab:state.tab,folds:details.map(d=>Persistence1010.key(d,pane)),top:document.querySelector('main').scrollTop};},tab);
    const immediate=await p.evaluate(()=>{const pane=document.querySelector('#pane-'+state.tab),m=document.querySelector('main'),kept=Persistence1010.capture(pane,false),pre={sameMain:kept.main===m,top:m.scrollTop,heldTop:kept.mainTop,doc:kept.documentTop};bump();return {top:m.scrollTop,height:m.scrollHeight,focus:document.activeElement.id,tab:state.tab,pre};});await p.waitForTimeout(100);
    const after=await p.evaluate(()=>{const pane=document.querySelector('#pane-'+state.tab);return {tab:state.tab,folds:[...pane.querySelectorAll('details[open]')].map(d=>Persistence1010.key(d,pane)),top:document.querySelector('main').scrollTop,height:document.querySelector('main').scrollHeight,focus:document.activeElement.id};});
    check(label+' '+tab+' local Save preserves open disclosures',before.tab===after.tab&&before.folds.every(k=>after.folds.includes(k)),{beforeCount:before.folds.length,afterCount:after.folds.length,missing:before.folds.filter(k=>!after.folds.includes(k))});
    check(label+' '+tab+' local Save preserves reading position',Math.abs(before.top-after.top)<40,{before:before.top,after:after.top,immediate,afterHeight:after.height,afterFocus:after.focus});
   }
   const dialogState=await p.evaluate(()=>{
    const dialog=document.createElement('dialog');dialog.innerHTML='<div class="db" style="height:100px;overflow:auto"><details open><summary>Practice nested dialog</summary><div style="height:500px">Practice only</div></details></div>';document.body.append(dialog);dialog.showModal();const db=dialog.querySelector('.db');db.scrollTop=150;
    bump();Idle1006.redraw();const kept=dialog.open&&db.scrollTop===150&&dialog.querySelector('details').open;
    dialog.close();Idle1006.redraw();const closed=!dialog.open;dialog.remove();return {kept,closed};
   });
   check(label+' independent dialog and nested body scroller remain open',dialogState.kept,dialogState);
   check(label+' explicitly closed independent dialog stays closed',dialogState.closed,dialogState);
   const documentScroll=await p.evaluate(()=>{
    const html=document.documentElement,body=document.body,oldHtml=html.getAttribute('style'),oldBody=body.getAttribute('style'),space=document.createElement('div');space.style.height='4000px';body.append(space);html.style.setProperty('overflow','auto','important');html.style.height='auto';body.style.setProperty('overflow','auto','important');body.style.height='auto';body.style.display='block';
    window.scrollTo(0,400);const before=document.scrollingElement.scrollTop,pane=document.querySelector('#pane-'+state.tab),held=Persistence1010.capture(pane,false);window.scrollTo(0,0);Persistence1010.restore(pane,held,false);const after=document.scrollingElement.scrollTop;
    space.remove();if(oldHtml===null)html.removeAttribute('style');else html.setAttribute('style',oldHtml);if(oldBody===null)body.removeAttribute('style');else body.setAttribute('style',oldBody);window.scrollTo(0,0);return {before,after};
   });
   check(label+' body-scrolling responsive surface retains reading position',documentScroll.before>0&&documentScroll.before===documentScroll.after,documentScroll);
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
