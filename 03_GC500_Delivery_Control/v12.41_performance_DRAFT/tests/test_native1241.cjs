/* Author: Andrew Fisher. Current data, navigation and cache invalidation; all senders held. */
'use strict';
const {openCandidate}=require('./browser_harness.cjs');
const fs=require('fs');
(async()=>{
 process.env.HASH='#today';const s=await openCandidate();let result;
 try{
  result=await s.page.evaluate(()=>{
   const checks=[],check=(ok,name)=>checks.push({ok:!!ok,name}),need=(ok,name)=>{check(ok,name);if(!ok)throw new Error(name);};
   const clone=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
   const saved=clone(S),before=JSON.stringify(S),savedQueue=clone(SYNC.queue),savedLast=clone(SYNC.last),sender=syncSend,write=mayWrite,cap=capability,readonly=SYNC.readonly,level=SYNC.level;
   const who=document.querySelector('#who'),priorWho=who&&who.value;
   const reset=()=>{Object.keys(S).forEach(k=>delete S[k]);Object.assign(S,clone(saved));SYNC.queue=clone(savedQueue);SYNC.last=clone(savedLast);sharedCache975();};
   try{
    need(typeof Performance1241==='object','performance helper is present');
    need(state.tab==='today'&&document.querySelector('#pane-today.on'),'Today is the selected initial view');
    check(document.querySelectorAll('#pane-demob [data-row816]').length===0,'hidden Demob is not built during Today startup');
    const originalFinancial=holdAssets(()=>({scope:clone(scopeFigures()),finance:clone(fin745Rows()),money:clone(moneySummary())}));
    go('demob');
    need(Performance1241.paneActive(document.querySelector('#pane-demob'),state.tab),'Demob becomes active through native navigation');
    const row=document.querySelector('#pane-demob [data-row816]');need(row,'Demob contains native pickup rows');
    check(!!document.querySelector('#pane-demob .sec1231')&&!!document.querySelector('#pane-demob .mp1236'),'Demob groups and map decorations are retained');
    const strip=document.querySelector('#pane-demob .daystrip'),selected=strip.querySelector('.day.on'),selectedDay=selected.dataset.dday816;
    const visible=()=>{const a=strip.getBoundingClientRect(),b=strip.querySelector('.day.on').getBoundingClientRect();return b.left>=a.left-3&&b.right<=a.right+3;};
    check(selectedDay===demobSel816(demob816())&&visible(),'native selected day remains visible after complete Demob decoration');
    const manualScroll=Math.min(37,Math.max(0,strip.scrollWidth-strip.clientWidth));strip.scrollLeft=manualScroll;const beforeMount=strip.scrollLeft;
    DemobCards996.mount();check(Math.abs(strip.scrollLeft-beforeMount)<2,'standalone card mount preserves the user scroll position');
    WeatherStrip1002.reveal(document.getElementById('pane-demob'));
    check(strip.querySelector('.day.on').dataset.dday816===selectedDay&&visible(),'final strip centering preserves the selected day');

    const oldBuild=buildAllAssets;let builds=0;
    try{buildAllAssets=function(){builds++;return oldBuild.apply(this,arguments);};renderDemob816();}finally{buildAllAssets=oldBuild;}
    check(builds===1,'one direct Demob redraw builds one native asset snapshot');
    check(ASSETS_HELD===null,'Demob redraw releases its asset snapshot before returning');
    const key=row.getAttribute('data-row816');need(assetOf(key),'visible Demob row resolves to its native asset');
    syncSend=function(){clearTimeout(SYNC.timer);SYNC.timer=null;};mayWrite=()=>true;capability=()=> 'edit';SYNC.readonly=false;SYNC.level='edit';S.operator='Synthetic performance reviewer';if(who)who.value=S.operator;
    holdAssets(()=>{
     const epoch=REC_EPOCH1066;
     setDesc(key,'Synthetic local description fixture');
     check(REC_EPOCH1066>epoch&&assetOf(key).name==='Synthetic local description fixture','native local save invalidates an active asset hold immediately');
     renderDemob816();
     check(document.getElementById('pane-demob').innerText.includes('Synthetic local description fixture'),'direct Demob redraw shows the local description immediately');
    });
    SYNC.readonly=true;SYNC.queue={};
    holdAssets(()=>{
     const docs=clone(toDocs('descs'));docs[docIdOf(key)]={_k:key,v:'Synthetic remote description fixture'};
     const epoch=REC_EPOCH1066,changed=syncFold('descs',docs);
     check(changed&&REC_EPOCH1066>epoch&&assetOf(key).name==='Synthetic remote description fixture','native remote fold invalidates an active asset hold immediately');
     renderDemob816();
     check(document.getElementById('pane-demob').innerText.includes('Synthetic remote description fixture'),'Demob redraw shows the hydrated description immediately');
     const current=REC_EPOCH1066;check(!syncFold('descs',docs)&&REC_EPOCH1066===current,'unchanged remote polling does not invalidate the record');
    });
    reset();SYNC.readonly=false;SYNC.level='edit';S.operator='Synthetic performance reviewer';if(who)who.value=S.operator;
    const name=Workforce1010.NAMES[0],getRow=()=>fin745Rows().find(r=>r.person===name&&Workforce1010.DATES.includes(r.date));
    const person=ourCosts().find(r=>r.kind==='person'&&r.person===name),baseRow=clone(getRow());need(person&&baseRow,'native event person and Finance shift exist');
    const rate=Number(person.pay_rate)+1.25;
    need(setOurPerson(name,{pay_rate:rate}),'native person-rate setter accepts a disposable fixture');
    const nextRow=clone(getRow());
    check(ourCosts().find(r=>r.kind==='person'&&r.person===name).pay_rate===rate,'next native cost projection sees the changed rate');
    check(!same(nextRow,baseRow),'next Finance invocation sees the local source change');
    check(same(scopeFigures(),originalFinancial.scope),'supplier-side fixture changes never alter agreed customer scope');
    reset();SYNC.readonly=false;SYNC.level='edit';S.operator='Synthetic performance reviewer';if(who)who.value=S.operator;
    const homesBefore=clone(fh868People()),peopleBefore=ourCosts();
    const worker=homesBefore.rows.find(r=>peopleBefore.some(p=>p.kind==='person'&&p.person===r.person&&ourRawOf('W-P-'+ourSlug(r.person))));
    need(worker,'a native employee home-branch record exists');
    const newHome=BRANCHES.branches.map(b=>b.code).find(code=>normBranch(code)!==worker.home);
    need(newHome&&setOurPerson(worker.person,{branch:newHome}),'native employee branch setter accepts disposable fixture');
    const homesAfter=fh868People(),changedHome=homesAfter.rows.find(r=>r.person===worker.person);
    check(changedHome&&changedHome.home===normBranch(newHome),'next people-summary invocation immediately sees the changed home branch');
    check(homesAfter.total===homesBefore.total&&homesAfter.toDate===homesBefore.toDate&&homesAfter.toCome===homesBefore.toCome,'home-branch lookup reuse never changes employee costs');
    reset();SYNC.readonly=false;SYNC.level='edit';S.operator='Synthetic performance reviewer';if(who)who.value=S.operator;
    holdAssets(()=>{
     const first=clone(allCosts()),returned=allCosts();returned.pop();if(returned[0]){returned[0].description='MUTATED-COST-ROW';if(Array.isArray(returned[0].problems))returned[0].problems.push('MUTATED-PROBLEM');}
     check(same(allCosts(),first),'reused cost output isolates array, row and problems mutations');
     const id='SYNTHETIC-COST-1241';S.costs=(S.costs||[]).concat([{id,date:todayIso(),category:'Synthetic fixture',description:'Disposable cache test',amount:17.25}]);save();
     check(allCosts().some(r=>r.id===id),'local save refreshes no-argument costs inside the same asset hold');
     SYNC.readonly=true;SYNC.queue={};const docs=clone(toDocs('costs'));delete docs[docIdOf(id)];const epoch=REC_EPOCH1066;
     check(syncFold('costs',docs)&&REC_EPOCH1066>epoch&&!allCosts().some(r=>r.id===id),'shared cost fold removes a stale cached row inside the same hold');
     check(same(allCosts(),first),'unrelated cost rows remain exactly unchanged after the disposable record is removed');
    });
    reset();
    const final=holdAssets(()=>({scope:clone(scopeFigures()),finance:clone(fin745Rows()),money:clone(moneySummary())}));
    check(same(final,originalFinancial),'all financial models restore exactly after disposable local and remote fixtures');
    go('today');go('demob');
    check(document.querySelectorAll('#pane-demob [data-row816]').length>0&&!!document.querySelector('#pane-demob .mp1236'),'return navigation retains updated Demob rows and map decorations');
    const current=document.querySelector('#pane-demob .day.on').dataset.dday816,other=[...document.querySelectorAll('#pane-demob [data-dday816]')].find(b=>b.dataset.dday816!==current);
    need(other,'another native Demob day is available');const requested=other.dataset.dday816;other.click();
    check(document.querySelector('#pane-demob .day.on')?.dataset.dday816===requested&&demobSel816(demob816())===requested,'manual day selection survives the complete decorated redraw');
    renderDemob816();check(document.querySelector('#pane-demob .day.on')?.dataset.dday816===requested,'subsequent direct redraw does not reset the selected day');
    DM816.sel=current;renderDemob816();

   }finally{
    reset();syncSend=sender;mayWrite=write;capability=cap;SYNC.readonly=readonly;SYNC.level=level;if(who)who.value=priorWho;
   }
   check(JSON.stringify(S)===before,'entire native browser record restored');return checks;
  });
  if(process.env.SCREENSHOTS){fs.mkdirSync(process.env.SCREENSHOTS,{recursive:true});await s.page.evaluate(()=>{const main=document.querySelector('main');if(main)main.scrollTop=0;});await s.page.waitForTimeout(600);await s.page.screenshot({path:process.env.SCREENSHOTS+'/phone-demob-day.png'});const map=s.page.locator('#pane-demob .mp1236').first();if(await map.count()){await map.scrollIntoViewIfNeeded();await s.page.waitForTimeout(1200);await s.page.screenshot({path:process.env.SCREENSHOTS+'/phone-demob-map.png'});}}
  result.push({ok:s.errors.length===0,name:'zero page runtime errors'},{ok:s.counts.blocked===0,name:'zero HTTP write attempts'});
 }finally{await s.browser.close();}
 // A fresh context checks the deep link, not only a warm navigation.
 process.env.HASH='#demob';const direct=await openCandidate();
 try{const x=await direct.page.evaluate(()=>({active:Performance1241.paneActive(document.getElementById('pane-demob'),state.tab),rows:document.querySelectorAll('#pane-demob [data-row816]').length,maps:document.querySelectorAll('#pane-demob .mp1236').length,lease:ASSETS_HELD}));result.push({ok:x.active&&x.rows>0&&x.maps>0&&x.lease===null,name:'fresh direct Demob link renders active rows and maps without a leaked lease'},{ok:direct.errors.length===0&&direct.counts.blocked===0,name:'direct link has zero runtime errors or write attempts'});}finally{await direct.browser.close();}
 const pass=result.filter(x=>x.ok).length;for(const c of result)console.log((c.ok?'PASS ':'FAIL ')+c.name);console.log(pass+'/'+result.length+' native checks');if(process.env.REPORT)fs.writeFileSync(process.env.REPORT,JSON.stringify({author:'Andrew Fisher',checks:result},null,2));process.exitCode=pass===result.length?0:1;
})().catch(e=>{console.error('FAIL '+e.stack);process.exitCode=1;});
