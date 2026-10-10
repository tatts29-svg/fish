// Author: Andrew Fisher. Read-only public/candidate browser checks and isolated availability edits.
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
let servedHash;
if(process.env.PUBLIC==='1'){
 const fetcher=require('../../toolchain/harness/curlfetch'),original=fetcher.curlFetch;
 fetcher.curlFetch=async function(url,...args){const result=await original(url,...args);if(/^https:\/\/gc500-production\.up\.railway\.app\/v\/Coates-GC500-2026\/?(?:[?#].*)?$/.test(url))servedHash=crypto.createHash('sha256').update(result.body).digest('hex');return result;};
}
const {open}=require('../../toolchain/harness/open_page');
(async()=>{
 const mobile=process.env.MOB==='1',publicMode=process.env.PUBLIC==='1',out=process.env.OUTDIR;
 if(!publicMode)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(process.env.PAGE)).digest('hex'),process.env.EXPECTED_SHA);
 const h=await open({pageFile:publicMode?undefined:process.env.PAGE,hash:'#day/2026-10-14',mobile,W:mobile?390:1440,H:900}),p=h.page;
 let checks=0;const check=(ok,name)=>{assert(ok,name);checks++;};
 try{
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length&&DOCS.state==='ready',null,{timeout:150000});
  await p.waitForFunction(()=>typeof DailyStaff988?.day==='function',null,{timeout:30000});
  if(publicMode){check(h.counts.page===0,'Public check uses the actually served page');check(servedHash===process.env.EXPECTED_SHA,'Public served bytes match released candidate');}
  const before=await p.evaluate(()=>({native:JSON.stringify(S),money:JSON.stringify(pl770Model())}));
  const surfaces=[];
  for(const entry of [{tab:'timeline',day:'2026-10-14'},{tab:'timeline',day:'2026-10-09'},{tab:'today'},{tab:'demob'}]){
   const row=await p.evaluate(entry=>{
    if(entry.day)state.day=entry.day;go(entry.tab);render();
    const pane=document.querySelector('#pane-'+entry.tab),sections=[...pane.querySelectorAll('[data-staff988-day]')],section=sections[0];
    const day=section?.dataset.staff988Day,model=day?DailyStaff988.day(day):null;
    const contrast=node=>{
     if(!node)return null;const rgba=c=>{const values=c.match(/[\d.]+/g)?.map(Number)||[0,0,0];return [...values.slice(0,3),values[3]??1];},blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
     let background=[255,255,255];const ancestors=[];for(let n=node;n;n=n.parentElement)ancestors.unshift(n);for(const n of ancestors)background=blend(rgba(getComputedStyle(n).backgroundColor),background);
     const ink=blend(rgba(getComputedStyle(node).color),background),luminance=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0),a=luminance(ink),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
    };
    return {tab:entry.tab,expectedDay:entry.day||(entry.tab==='today'?todayIso():demobSel816(demob816())),day,sections:sections.length,
     namesMatch:model?model.names.every(n=>section.textContent.includes(n)):false,count:model?.count,unnamed:model?.unnamed,
     label:section?.textContent||'',dateContrast:contrast(section?.querySelector('.staff988-heading span')),unknownContrast:contrast(section?.querySelector('.staff988-empty,.staff988-unnamed')),oldControls:pane.querySelectorAll('.crew883,[data-crew883-save],[data-crew883-slot],[data-workers983-selection]').length,
     overflow:document.documentElement.scrollWidth>innerWidth+1};
   },entry);
   check(row.sections===1,'One daily availability section on '+entry.tab+' '+(entry.day||''));
   check(row.day===row.expectedDay,'Availability follows selected date on '+entry.tab);
   check(row.namesMatch,'Names agree with shared daily model on '+entry.tab);
   check(row.dateContrast>=4.5&&(row.unknownContrast===null||row.unknownContrast>=4.5),'Availability date/unknown text has readable contrast on '+entry.tab+': '+row.dateContrast);
   check(row.oldControls===0,'No per-job allocation controls on '+entry.tab);
   check(!row.overflow,'No horizontal document overflow on '+entry.tab);
   surfaces.push(row);
   if(out){fs.mkdirSync(out,{recursive:true});await p.locator('#pane-'+entry.tab+' [data-staff988-day]').scrollIntoViewIfNeeded();await p.screenshot({path:out+'/staff-'+entry.tab+(entry.day?'-'+entry.day:'')+'.png'});}
  }
  const cards=await p.evaluate(()=>{
   state.day='2026-10-14';go('timeline');renderTimeline();
   return [...document.querySelectorAll('.bc984-day')].map(el=>{const model=DailyStaff988.day(el.dataset.day),names=[...el.querySelectorAll('.bc984-names>span:not(.bc984-missing)')].map(n=>n.textContent),crew=el.querySelector('.bc984-crew');return {day:el.dataset.day,count:model.count,names:model.names,shown:names,label:crew?.textContent||'',countText:el.querySelector('.bc984-crew-count')?.textContent||null};});
  });
  check(cards.length>20,'Build programme retains its dated cards');
  check(cards.every(x=>JSON.stringify(x.shown)===JSON.stringify(x.names)),'Every Build card shares daily availability names');
  check(cards.every(x=>x.label.includes('AVAILABLE STAFF')),'Cards clearly label available staff');
  const drawer=await p.evaluate(()=>{openAsset('WC09');const el=document.querySelector('#drawer');const controls=el.querySelectorAll('.crew883,[data-crew883-save],[data-crew883-slot]').length;document.querySelector("#dclose")?.click();return {controls};});
  check(drawer.controls===0,'Asset drawer no longer offers per-job staffing');
  const unchanged=await p.evaluate(before=>({native:JSON.stringify(S)===before.native,money:JSON.stringify(pl770Model())===before.money}),before);
  check(unchanged.native&&unchanged.money,'Read-only presentation never changes shared records or P&L');
  const fixture=await p.evaluate(()=>{
   const native=JSON.stringify(S),originalLoads=S.loads,cap=capability,write=mayWrite,who=whoAmI,saveBefore=save,readonly=SYNC.readonly,flashBefore=flash;
   const day='2026-10-14',key=DailyStaff988.key(day),legacy=crew883Key(day),task=crew883Key(day,'WC09'),other=DailyStaff988.key('2026-10-15');
   let saves=0;
   capability=()=> 'edit';mayWrite=()=>true;whoAmI=()=> 'Andrew Fisher';SYNC.readonly=false;save=()=>{saves++;return true;};flash=()=>{};
   S.loads=JSON.parse(JSON.stringify(originalLoads));
   try{
    S.loads[legacy]={kind:'crew883',day,ref:'',count:2,names:['Old Person One','Old Person Two']};
    S.loads[task]={kind:'crew883',day,ref:'WC09',people:[{slot:1,roles:['forklift','spotter']},{slot:3,roles:[]}],start:'06:00',finish:'07:00',location:'WC09',order:1};
    S.loads[other]={kind:'staff988',day:'2026-10-15',count:1,names:['Tomorrow Person']};delete S.loads[key];
    const retained=JSON.stringify([S.loads[legacy],S.loads[task],S.loads[other]]),money=JSON.stringify(pl770Model());
    const taskUI=crew883Editor(assetOf('WC09'),day),sheet=crew883Sheet(assetOf('WC09'),day),checkInput={report:['Retain original report'],warnings:[{key:'WC09',text:'Retain actual transport issue'}]};
    const checked=crew883Checks(checkInput,day,[assetOf('WC09')]);
    state.day=day;go('timeline');renderTimeline();
    const section=document.querySelector('#pane-timeline [data-staff988-day="'+day+'"]');
    const editVisible=!!section?.querySelector('[data-staff988-edit]');
    const token=DailyStaff988.day(day).token;
    section.querySelector('[data-staff988-edit]').open=true;
    section.querySelectorAll('[data-staff988-choice]').forEach(input=>input.checked=false);
    section.querySelector('[data-staff988-extra]').value='0';
    section.querySelector('[data-staff988-other]').value='Availability One\nAvailability Two';
    section.querySelector('[data-staff988-save]').click();
    const result={kept:DailyStaff988.day(day).names.join(',')==='Availability One,Availability Two'};
    const afterSave=DailyStaff988.day(day),card=()=>document.querySelector('.bc984-day[data-day="'+day+'"] .bc984-crew')?.textContent||'';
    const cardAfterSave=card();
    const selectedSection=()=>document.querySelector('#pane-timeline [data-staff988-day="'+day+'"]');
    const sectionAfterSave=selectedSection()?.textContent||'';
    const staleToken=afterSave.token,staleBox=selectedSection();staleBox.querySelector('[data-staff988-edit]').open=true;staleBox.querySelector('[data-staff988-other]').value='Keep my draft';
    S.loads[key]={...S.loads[key],names:['Remote One','Remote Two'],at:'2026-10-10T12:01:00.000Z'};render();
    const preservedDraft=selectedSection()?.querySelector('[data-staff988-other]')?.value==='Keep my draft',savesBeforeStale=saves;
    selectedSection().querySelector('[data-staff988-save]').click();
    const rejectionText=selectedSection()?.querySelector('[data-staff988-result]')?.textContent||'',rejected={kept:saves!==savesBeforeStale,reason:rejectionText},reloadAvailable=!!selectedSection()?.querySelector('[data-staff988-reload]');
    const afterRemote=DailyStaff988.day(day),cardAfterRemote=card(),sectionAfterRemote=selectedSection()?.textContent||'';
    selectedSection()?.querySelector('[data-staff988-reload]')?.click();const afterReload=selectedSection()?.textContent||'';
    const currentKey=DailyStaff988.key(todayIso());S.loads[currentKey]={kind:'staff988',day:todayIso(),count:1,names:['Today Available']};go('today');render();
    const todayShown=document.querySelector('#pane-today [data-staff988-day]')?.textContent||'';
    const demobDay=demobSel816(demob816()),demobKey=DailyStaff988.key(demobDay);S.loads[demobKey]={kind:'staff988',day:demobDay,count:1,names:['Demob Available']};go('demob');render();
    const demobShown=document.querySelector('#pane-demob [data-staff988-day]')?.textContent||'';
    state.day='2026-10-09';go('timeline');render();
    const past=document.querySelector('#pane-timeline [data-staff988-day="2026-10-09"]'),pastEditable=!!past?.querySelector('[data-staff988-edit],[data-staff988-save]');
    RENDER_MEMO.clear();const moneyAfter=JSON.stringify(pl770Model());
    const successfulSaves=saves;save=()=>false;const failedSave=DailyStaff988.save(day,{count:1,names:['Failed local save']},DailyStaff988.day(day).token);
    return {taskUI,sheet,checksUnchanged:JSON.stringify(checked)===JSON.stringify({report:['Retain original report'],warnings:[{key:'WC09',text:'Retain actual transport issue'}]}),editVisible,saves:successfulSaves,failedSave,result,afterSave:{count:afterSave.count,names:afterSave.names},cardAfterSave,sectionAfterSave,rejected,preservedDraft,reloadAvailable,afterReload,afterRemote:{count:afterRemote.count,names:afterRemote.names},cardAfterRemote,sectionAfterRemote,todayShown,demobShown,pastEditable,oldRecordsSame:JSON.stringify([S.loads[legacy],S.loads[task],S.loads[other]])===retained,moneySame:money===moneyAfter};
   }finally{S.loads=originalLoads;capability=cap;mayWrite=write;whoAmI=who;save=saveBefore;SYNC.readonly=readonly;flash=flashBefore;RENDER_MEMO.clear();render();if(JSON.stringify(S)!==native)throw Error('Fixture did not restore exact shared state');}
  });
  check(fixture.taskUI==='','Archived task plans do not recreate allocation editor');
  check(!/Old Person|Person 3|assigned|Crew|People shortage|Clash check/.test(fixture.sheet),'Printed asset handling omits task allocations');
  check(fixture.checksUnchanged,'Driver/ Demob check wrapper keeps real warnings without allocation warnings');
  check(fixture.editVisible&&!fixture.pastEditable,'Today/future availability is editable and past days stay locked');
  check(fixture.result.kept&&fixture.saves===1,'Availability form saves selected names once');
  check(!fixture.failedSave.kept,'Native persistence failure cannot be reported as saved');
  check(fixture.afterSave.names.join(',')==='Availability One,Availability Two','Saved names are available for the whole selected day');
  check(fixture.cardAfterSave.includes('Availability One')&&fixture.sectionAfterSave.includes('Availability Two'),'Save updates both selected Build card and daily section');
  check(!fixture.rejected.kept&&fixture.afterRemote.names.join(',')==='Remote One,Remote Two','Concurrent shared change rejects stale form overwrite');
  check(fixture.preservedDraft&&fixture.reloadAvailable&&/changed/i.test(fixture.rejected.reason),'Remote redraw preserves open draft and shows a reload action for stale save');
  check(fixture.cardAfterRemote.includes('Remote One')&&fixture.afterReload.includes('Remote Two'),'Shared change refreshes card and reloaded daily section');
  check(fixture.todayShown.includes('Today Available')&&fixture.demobShown.includes('Demob Available'),'Today and Demob read the shared daily availability model');
  check(fixture.oldRecordsSame&&fixture.moneySame,'Daily availability preserves archived assignments, other dates and financial labour');
  const after=await p.evaluate(before=>({native:JSON.stringify(S)===before.native,money:JSON.stringify(pl770Model())===before.money}),before);
  check(after.native&&after.money,'All browser fixtures restore exact shared records and P&L');
  check(h.errors.length===0,'No browser errors: '+h.errors.join('; '));check(h.counts.blocked===0,'No attempted operational writes');
  const report={author:'Andrew Fisher',pass:true,checks,mobile,actualPublic:publicMode,sha256:process.env.EXPECTED_SHA,surfaces:surfaces.map(r=>({tab:r.tab,day:r.day,count:r.count,unnamed:r.unnamed,dateContrast:Number(r.dateContrast.toFixed(2)),unknownContrast:r.unknownContrast===null?null:Number(r.unknownContrast.toFixed(2)),oneDailySection:true,noJobControls:true})),savedAvailabilityOnly:true,staleSaveRejected:true,legacyRecordsPreserved:true,moneyPreserved:true,errors:0,writes:0};
  if(out)fs.writeFileSync(out+'/staff-browser.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await h.browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
