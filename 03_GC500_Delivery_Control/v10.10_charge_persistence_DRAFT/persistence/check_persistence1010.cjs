/* Author: Andrew Fisher. GET-only refresh regression: disclosures, drafts, scroll and Close. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const source=path.resolve(__dirname,'..');
const {open}=require(path.resolve(source,'../toolchain/harness/open_page'));
const out=process.env.OUT||'/workspace/private-gc5001010-persistence-check';fs.mkdirSync(out,{recursive:true});
const report={author:'Andrew Fisher',checks:[],errors:[],blocked:0};
const check=(name,ok,detail)=>{report.checks.push({name,ok,detail});assert(ok,name+': '+JSON.stringify(detail));};
(async()=>{
 for(const mobile of [true,false]){
  const label=mobile?'phone':'desktop',h=await open({pageFile:process.env.PAGE||'/workspace/private-gc5001010-persistence.html',mobile,W:mobile?390:1440,H:mobile?844:1000,dpr:1});
  try{
   const p=h.page;await p.waitForFunction(()=>SYNC.status==='live'&&GC500Refresh904.report().settled,null,{timeout:120000});
   await p.evaluate(()=>{go('timeline');openAsset('WC09');});
   const selectors=['[data-profile1006-item="Pee Panel"]','[data-profile1006-item="FWF"]','[data-profile1006-item="Toilet Block 6m"]'];
   const opened=await p.evaluate(()=>{
    document.querySelectorAll('#drawer [data-charges952] details').forEach(d=>d.open=true);
    const charge=document.querySelector('#drawer [data-profile1006-item="Pee Panel"]');charge.scrollIntoView({block:'center'});
    return {total:document.querySelectorAll('#drawer [data-charges952] details').length,top:document.querySelector('#drawer').scrollTop,bodyTop:document.querySelector('#drawer .db').scrollTop};
   });
   await p.waitForTimeout(60);
   const before=await p.evaluate(()=>JSON.stringify(S));
   await p.evaluate(()=>{Idle1006.redraw();});await p.waitForTimeout(100);
   const refreshed=await p.evaluate(()=>({total:document.querySelectorAll('#drawer [data-charges952] details').length,open:document.querySelectorAll('#drawer [data-charges952] details[open]').length,on:document.querySelector('#drawer').classList.contains('on'),top:document.querySelector('#drawer').scrollTop,bodyTop:document.querySelector('#drawer .db').scrollTop}));
   check(label+' all arrived-charge folds remain open after shared redraw',refreshed.open===opened.total&&refreshed.total===opened.total&&refreshed.on,{opened,refreshed});
   check(label+' refresh preserves reading scroll',Math.abs(refreshed.top-opened.top)<3&&Math.abs(refreshed.bodyTop-opened.bodyTop)<3,{opened,refreshed});
   check(label+' refresh does not change native records',before===await p.evaluate(()=>JSON.stringify(S)));
   await p.evaluate(()=>{openAsset('WC09',{keep:true});});
   check(label+' ordinary same-reference refresh also preserves charge folds',await p.locator('#drawer [data-charges952] details[open]').count()===opened.total);
   await p.locator('#drawer [data-profile1006-item="Pee Panel"] > summary').click();
   await p.evaluate(()=>{Idle1006.refreshDrawer();});
   check(label+' user collapsed item remains collapsed; other items remain open',!await p.locator('#drawer '+selectors[0]).evaluate(el=>el.open)&&await p.locator('#drawer '+selectors[1]).evaluate(el=>el.open));
   await p.locator('#drawer [data-profile1006-item="Pee Panel"] > summary').click();
   await p.evaluate(()=>{syncRedraw();});await p.waitForTimeout(650);
   check(label+' scheduled live-sync redraw preserves open item',await p.locator('#drawer '+selectors[0]).evaluate(el=>el.open));
   await p.locator('#drawer [data-profile1006-item="Pee Panel"]').scrollIntoViewIfNeeded();
   await p.screenshot({path:out+'/'+label+'-pee-panel-open.png'});
   await p.locator('#dclose').click();
   await p.evaluate(()=>{Idle1006.redraw();});
   check(label+' explicit Close stays closed after subsequent refresh',!await p.locator('#drawer').evaluate(el=>el.classList.contains('on')));
   await p.evaluate(()=>{
    for(const d of document.querySelectorAll('#pane-timeline details'))d.open=true;
    document.querySelector('#pane-timeline .flow891-rules')?.scrollIntoView({block:'center'});
   });
   const folds=await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline details')].map(d=>[Persistence1010.key(d,document.querySelector('#pane-timeline')),d.open]));
   await p.evaluate(()=>{Idle1006.redraw();});
   const afterFolds=await p.evaluate(()=>[...document.querySelectorAll('#pane-timeline details')].map(d=>[Persistence1010.key(d,document.querySelector('#pane-timeline')),d.open]));
   check(label+' Build disclosures remain open across remote updates',folds.filter(([,v])=>v).every(([k])=>afterFolds.some(([a,b])=>a===k&&b)),{before:folds.length,after:afterFolds.length});
   await p.evaluate(()=>{openAsset('WC70');Idle1006.redraw();});
   check(label+' navigation to another reference never restores prior one',await p.evaluate(()=>state.sel==='WC70'&&document.querySelector('#drawerTitle').textContent.includes('WC70')));
   await p.locator('#dclose').click();
   const formChecks=await p.evaluate(()=>{
    const fixture=document.createElement('section');fixture.id='persistence1010-fixture';document.body.append(fixture);
    const html=(rate,newDefault)=>'<details data-profile1006-item="Pee Panel"><summary>Pee Panel × 6 · $'+rate+'</summary><input name="note" value="'+newDefault+'"><input name="remote" value="'+newDefault+'"><input name="attachment" type="file"><input name="status" type="checkbox" disabled></details><details data-profile1006-item="FWF"><summary>FWF × 4 · $60.00</summary></details>';
    fixture.innerHTML=html('123.00','old');const first=fixture.querySelector('details'),draft=fixture.querySelector('[name="note"]');first.open=true;draft.value='not submitted';draft.focus();draft.setSelectionRange(2,5);const files=new DataTransfer();files.items.add(new File(['practice'],'practice.txt',{type:'text/plain'}));fixture.querySelector('[name="attachment"]').files=files.files;
    const kept=Persistence1010.capture(fixture,true);fixture.innerHTML=html('456.00','new');Persistence1010.restore(fixture,kept,true);
    const result={open:fixture.querySelector('details').open,otherClosed:!fixture.querySelectorAll('details')[1].open,newMoney:fixture.querySelector('summary').textContent.includes('$456.00'),draft:fixture.querySelector('[name="note"]').value,remote:fixture.querySelector('[name="remote"]').value,focus:document.activeElement.name,selection:[document.activeElement.selectionStart,document.activeElement.selectionEnd],file:fixture.querySelector('[name="attachment"]').files[0]?.name};fixture.remove();return result;
   });
   check(label+' values refresh while open item identity remains stable',formChecks.open&&formChecks.otherClosed&&formChecks.newMoney&&formChecks.remote==='new',formChecks);
   check(label+' selected attachment survives without uploading',formChecks.file==='practice.txt',formChecks);
   check(label+' unsubmitted draft and focus/caret survive',formChecks.draft==='not submitted'&&formChecks.focus==='note'&&String(formChecks.selection)==='2,5',formChecks);
   // Existing unit stale-write snapshots remain the authority; do not silently rebase a draft.
   const native=await p.evaluate(()=>{
    capability=()=> 'edit';mayWrite=()=>true;SYNC.readonly=false;SYNC.level='edit';openAsset('WC09');
    const form=document.querySelector('#drawer [data-unit925-form]'),field=form?.querySelector('input[name="assetNo"]');
    if(!field)return {found:false};field.disabled=false;field.value='UNSAVED TEST';field.focus();
    const expected=form.dataset.expected,source=form.dataset.sourceToken;Idle1006.refreshDrawer();
    const f=document.querySelector('#drawer [data-unit925-form]'),next=f.querySelector('input[name="assetNo"]');
    return {found:true,value:next.value,expectedPreserved:f.dataset.expected===expected,sourcePreserved:f.dataset.sourceToken===source};
   });
   check(label+' existing unit draft and stale-write tokens retained',native.found&&native.value==='UNSAVED TEST'&&native.expectedPreserved&&native.sourcePreserved,native);
   report.errors.push(...h.errors);report.blocked+=h.counts.blocked;
  }finally{await h.browser.close();}
 }
 check('no browser errors',report.errors.length===0,report.errors);check('no operational writes attempted',report.blocked===0,report.blocked);
 fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:true,checks:report.checks.length,errors:report.errors,blocked:report.blocked,out}));
})().catch(e=>{report.failure=String(e);fs.writeFileSync(out+'/review.json',JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
