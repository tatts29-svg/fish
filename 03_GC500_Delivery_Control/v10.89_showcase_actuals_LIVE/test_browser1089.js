/* Author: Andrew Fisher. GET-only browser checks; screenshots remain in private evidence. */
'use strict';
const fs=require('fs'), path=require('path'), assert=require('assert/strict');
const {open}=require(path.resolve(__dirname,'../toolchain/harness/open_page'));
(async()=>{
 const mobile=process.env.MOB==='1', out=process.env.EVIDENCE, publicLive=process.env.PUBLIC_LIVE==='1';
 if((!process.env.PAGE&&!publicLive)||!out||!process.env.GC500_ABOUT_CONTACTS_INPUT)throw Error('PAGE or explicit PUBLIC_LIVE=1, private EVIDENCE and GC500_ABOUT_CONTACTS_INPUT are required');
 if(publicLive&&process.env.PAGE)throw Error('PUBLIC_LIVE=1 must not use a local PAGE override');
 const privateInput=JSON.parse(fs.readFileSync(process.env.GC500_ABOUT_CONTACTS_INPUT,'utf8'));
 const addedNames=privateInput.people.map(p=>p.name);
 fs.mkdirSync(out,{recursive:true,mode:0o700});
 const s=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:900,init:'localStorage.setItem("gc500_motion","off");localStorage.setItem("gc500.showcarfocus","off")'});
 try{
  await s.page.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  await s.page.evaluate(()=>docsRefresh(true));
  await s.page.waitForFunction(()=>DOCS.state==='ready'&&!DOCS.busy&&photoIndex().state==='ready',null,{timeout:60000});
  await s.page.evaluate(()=>sharedCache975());
  await s.page.waitForFunction(()=>typeof ShowcaseActuals1089!=='undefined'&&todayWorkHealth840().ready);
  const prior=await s.page.evaluate(()=>({record:JSON.stringify(S),order:SHOW_ORDER.slice(),audio:JSON.stringify(BC_SCENE),team:JSON.stringify(TEAM)}));
  const facts=await s.page.evaluate(()=>holdAssets(()=>{
   const m=ShowcaseActuals1089.read(todayIso()), a=todayWorkMetrics840(todayIso());
   return {m,board:a.map(({id,total,done,remaining})=>({id,total,done,remaining})),html:ShowcaseActuals1089.keys.map(k=>[k,showScene(k,todayIso())])};
  }));
  // Change only derived supplier price lines in memory. Physical progress must
  // continue to read original docket quantities/components, never billed lines.
  const billingIsolated=await s.page.evaluate(()=>{
   const read=()=>holdAssets(()=>{const m=ShowcaseActuals1089.read(todayIso());return JSON.stringify({fences:m.fences,components:m.components});});
   const before=read(), price=costDocket;
   try{costDocket=function(d){return {...price.apply(this,arguments),supplier_lines:[{column:'clean',qty:999999,paid:1},{column:'bases',qty:888888,paid:1}],paid_total:2};};sharedCache975();return read()===before;}
   finally{costDocket=price;sharedCache975();}
  });
  assert(billingIsolated,'supplier billed quantities must not change physical Showcase progress');
  assert.equal(prior.order.length,10);
  for(const a of facts.m.areas){const b=facts.board.find(b=>b.id===a.id);assert.equal(a.done,b.done);assert.equal(a.total,b.total);}
  assert(!facts.html.some(([k,h])=>/of the fence in the ground|Dockets signed, every one/.test(h)));
  await s.page.evaluate(()=>{showOpen();showClear();SHOW.playing=false;SHOW.launch=-1;SHOW.reduced=true;showLaunchStep();});
  const shots=[];
  for(let i=0;i<prior.order.length;i++){
   await s.page.evaluate(i=>{SHOW.i=i;showRender();},i);
   await s.page.waitForTimeout(80);
   const result=await s.page.evaluate(()=>{
    const r=document.querySelector('#showBody').getBoundingClientRect(), wrap=document.querySelector('#showBody .shwrap').getBoundingClientRect();
    const rows=[...document.querySelectorAll('#showBody .shrow')],small=document.querySelector('#showBody .shbig small');
    return {key:SHOW_ORDER[SHOW.i],width:r.width,contentWidth:wrap.width,visible:!document.querySelector('#showcase').hidden,scroll:document.documentElement.scrollWidth,viewport:innerWidth,font:parseFloat(getComputedStyle(rows[0]||document.querySelector('#showBody')).fontSize),visibleRows:rows.filter(e=>{const b=e.getBoundingClientRect();return b.top>=r.top&&b.bottom<=r.bottom;}).length,heroLabelFits:!small||(small.getBoundingClientRect().right<=r.right&&small.scrollWidth<=small.clientWidth+1)};
   });
   assert(result.visible);assert(result.contentWidth<=result.width+3,'scene content width exceeds body: '+result.key);
   if(ShowcaseActuals1089Keys.includes(result.key)){if(mobile){assert(result.font>=12,'phone row font must remain readable: '+result.key);assert(result.heroLabelFits,'phone hero label must fit: '+result.key);if(result.key==='equipment')assert(result.visibleRows>=2,'phone equipment count and first two completion rows must be visible together');}await s.page.screenshot({path:path.join(out,(mobile?'phone-':'desktop-')+result.key+'.png')});shots.push(result.key);}
   if(mobile&&ShowcaseActuals1089Keys.includes(result.key)){
    const notes=await s.page.evaluate(()=>{
     const body=document.querySelector('#showBody');body.scrollTop=body.scrollHeight;
     const r=body.getBoundingClientRect(),fine=body.querySelector('.shf')?.getBoundingClientRect();
     const credit=[...document.querySelectorAll('#showPlate .gc3d-ui')].find(e=>e.textContent.trim());
     const c=credit?.getBoundingClientRect(),footer=document.querySelector('.shfoot').getBoundingClientRect();
     return {noteVisible:!!fine&&fine.top>=r.top-1&&fine.bottom<=r.bottom+1,creditSeparated:!c||r.bottom+4<=c.top,controlsSeparated:r.bottom<=footer.top};
    });
    assert(notes.noteVisible,'full explanatory note must be reachable: '+result.key);
    assert(notes.creditSeparated,'attribution must not overlap the scrolling text area: '+result.key);
    assert(notes.controlsSeparated,'text must not overlap controls: '+result.key);
    if(['equipment','effort','site'].includes(result.key))await s.page.screenshot({path:path.join(out,'phone-'+result.key+'-notes.png')});
   }
  }
  await s.page.keyboard.press('Escape');
  await s.page.evaluate(()=>go('about'));
  const contacts=await s.page.evaluate(()=>({
   names:[...document.querySelectorAll('#pane-about .teamcard .tm-person .tm-who > b')].map(e=>e.textContent.trim()),
   expected:AboutContacts1089.current(TEAM.people).map(p=>p.name),
   emptyGroups:[...document.querySelectorAll('#pane-about .teamcard .tm-group')].filter(e=>!e.querySelector('.tm-person')).length,
   originalNames:TEAM.people.map(p=>p.name)
  }));
  for(const name of ['Corey Machado','Ross Saxelby','Abraham Tibble','Krystal Stephens']){assert(!contacts.names.includes(name));assert(contacts.originalNames.includes(name),'historical team identity retained');}
  assert(contacts.names.includes('Daniel Gough'),'Daniel remains in the current contact list');
  const added=await s.page.evaluate(names=>names.map(name=>{
   const row=[...document.querySelectorAll('#pane-about .teamcard .tm-person')].find(el=>el.querySelector('.tm-who > b')?.textContent.trim()===name);
   return {present:!!row,links:row?[...row.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')):[],role:row?.querySelector('.tm-role')?.textContent.trim(),group:row?.closest('.tm-group')?.querySelector('.sect')?.textContent||''};
  }),addedNames);
  assert.equal(added.length,privateInput.people.length);
  for(const a of added){assert(a.present);assert.deepEqual(a.links,[],'new installer phone/email details must stay private');assert.equal(a.role,'Installer');assert.match(a.group,/INSTALLATION|Installation/);}
  for(const name of addedNames)assert(!contacts.originalNames.includes(name),'About additions do not rewrite the historical roster');
  assert.deepEqual(contacts.names.slice().sort(),contacts.expected.slice().sort());assert.equal(contacts.emptyGroups,0);
  await s.page.screenshot({path:path.join(out,(mobile?'phone-':'desktop-')+'about-contacts.png')});
  const after=await s.page.evaluate(()=>({record:JSON.stringify(S),order:SHOW_ORDER.slice(),audio:JSON.stringify(BC_SCENE),team:JSON.stringify(TEAM),closed:document.querySelector('#showcase').hidden}));
  if(after.record!==prior.record)fs.writeFileSync(path.join(out,(mobile?'phone':'desktop')+'-record-difference-private.json'),JSON.stringify({before:JSON.parse(prior.record),after:JSON.parse(after.record)},null,2),{mode:0o600});
  assert(after.record===prior.record,'native shared record changed during the check; private evidence saved');assert.deepEqual(after.order,prior.order);assert.equal(after.audio,prior.audio);assert(after.team===prior.team,'historical TEAM changed during the check');assert(after.closed);
  assert.equal(s.counts.blocked,0);assert.deepEqual(s.errors,[]);
  fs.writeFileSync(path.join(out,(mobile?'phone':'desktop')+'-model.json'),JSON.stringify(facts,null,2));
  console.log(JSON.stringify({result:'PASS',mode:mobile?'phone':'desktop',source:publicLive?'public-live':'local-candidate',scenes:10,changedSceneScreenshots:shots.length,phoneAttributionAndNotesSeparated:mobile?true:undefined,modelMatchesWorkBoard:true,supplierPricesIsolated:true,aboutContactsScoped:true,newInstallerContactsPrivate:true,recordUnchanged:true,audioAndOrderUnchanged:true,counts:s.counts,errors:s.errors}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
const ShowcaseActuals1089Keys=['equipment','complete','fence','fenceprog','effort','site'];
