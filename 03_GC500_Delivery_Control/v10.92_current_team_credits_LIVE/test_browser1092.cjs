/* Author: Andrew Fisher. Focused read-only credits verification.
 * PAGE=... EVIDENCE=/private/path [MOB=1] node test_browser1092.cjs
 * PUBLIC_LIVE=1 requires BASE=... and no PAGE. Every native write is blocked by
 * the shared harness. Screenshots and operational diagnostics stay private.
 */
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {open}=require('../toolchain/harness/open_page');
const REMOVED=['Corey Machado','Ross Saxelby','Abraham Tibble','Krystal Stephens'];
const sha=text=>crypto.createHash('sha256').update(text).digest('hex');
const dataLiteral=html=>{
 const line=html.split('\n').find(line=>line.startsWith('const DATA = '));
 assert(line&&line.endsWith(';'),'embedded DATA source must exist');
 return line.slice('const DATA = '.length,-1);
};
(async()=>{
 const mobile=process.env.MOB==='1',live=process.env.PUBLIC_LIVE==='1',out=process.env.EVIDENCE;
 assert(out&&path.isAbsolute(out),'absolute private EVIDENCE is required');
 assert((!!process.env.PAGE)!==live,'supply PAGE or explicit PUBLIC_LIVE=1');
 const baseFile=process.env.BASE||(process.env.PAGE&&path.join(path.dirname(path.resolve(process.env.PAGE)),'base_live.html'));
 assert(baseFile&&fs.existsSync(baseFile),'verified predecessor BASE is required');
 const base=fs.readFileSync(baseFile,'utf8'),baselineData=dataLiteral(base);
 const candidate=process.env.PAGE?fs.readFileSync(process.env.PAGE,'utf8'):null;
 if(candidate)assert.equal(sha(dataLiteral(candidate)),sha(baselineData),'historical DATA source must remain exact');
 fs.mkdirSync(out,{recursive:true,mode:0o700});
 const s=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,
  init:'localStorage.setItem("gc500_motion","off");localStorage.setItem("gc500.showcarfocus","off")'});
 const checks=[];
 try{
  const p=s.page;
  await p.waitForFunction(()=>typeof SYNC!=='undefined'&&SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  await p.evaluate(()=>docsRefresh(true));
  await p.waitForFunction(()=>DOCS.state==='ready'&&!DOCS.busy&&typeof CrewShowcase1090!=='undefined'&&typeof AboutContacts1089!=='undefined',null,{timeout:60000});
  if(live)assert.equal(sha(dataLiteral(await p.content())),sha(baselineData),'public historical DATA source must remain exact');
  await p.evaluate(()=>{
   sharedCache975();
   window.__credits1092Baseline={record:JSON.stringify(S),team:JSON.stringify(TEAM),data:JSON.stringify(DATA),
    broadcast:JSON.stringify(DATA.broadcast),mapping:JSON.stringify(BC_SCENE),order:JSON.stringify(SHOW_ORDER)};
  });
  const expected=await p.evaluate(()=>{
   const current=AboutContacts1089.current(TEAM.people),install=current.filter(p=>p.group==='install');
   return {all:current.map(p=>p.name),install:install.map(p=>p.name),
    lead:current.filter(p=>p.lead||p.group==='install').map(p=>p.name),
    home:current.filter(p=>['site','transport','install'].includes(p.group)).map(p=>p.name),
    additions:(ABOUT_CONTACT_INPUT1089?.people||[]).map(p=>p.name),historical:TEAM.people.map(p=>p.name),
    fencing:(TEAM.people||[]).filter(p=>p.group==='fencing').map(p=>p.name)};
  });
  for(const name of REMOVED){assert(!expected.all.includes(name),'excluded current contact returned');assert(expected.historical.includes(name),'historical identity must remain');}
  assert(expected.all.includes('Andrew Fisher'));assert(expected.install.includes('Daniel Gough'),'Daniel remains');
  assert.equal(expected.install.length,7,'current installer roster');assert.equal(new Set(expected.install).size,7);
  assert.equal(expected.additions.length,3,'supplied installer additions');assert.equal(expected.fencing.length,9);
  for(const name of expected.additions)assert(expected.install.includes(name),'supplied installer belongs to current installation roster');
  const assertNames=(actual,wanted,label)=>{
   assert.equal(JSON.stringify(actual.slice().sort()),JSON.stringify(wanted.slice().sort()),label);
   assert.equal(new Set(actual).size,actual.length,label+' has duplicate cards');
   for(const name of REMOVED)assert(!actual.includes(name),label+' contains excluded current contact');
  };
  await p.evaluate(()=>go('about'));
  const about=await p.evaluate(()=>({
   names:[...document.querySelectorAll('#pane-about .teamcard .tm-person .tm-who > b')].map(e=>e.textContent.trim()),
   emptyGroups:[...document.querySelectorAll('#pane-about .teamcard .tm-group')].filter(e=>!e.querySelector('.tm-person')).length,
   additions:(ABOUT_CONTACT_INPUT1089?.people||[]).map(({name})=>{
    const row=[...document.querySelectorAll('#pane-about .tm-person')].find(e=>e.querySelector('.tm-who > b')?.textContent.trim()===name);
    return {present:!!row,links:row?.querySelectorAll('a[href]').length||0,role:row?.querySelector('.tm-role')?.textContent.trim()};
   })
  }));
  assertNames(about.names,expected.all,'About projection');assert.equal(about.emptyGroups,0);
  assert(about.additions.every(p=>p.present&&p.links===0&&p.role==='Installer'),'new About installers have names/roles only');
  await p.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-about.png')});
  checks.push('About uses current projection, retains Daniel and keeps new installer contact details absent');
  await p.evaluate(()=>go('today'));
  const home=await p.evaluate(()=>({
   names:[...document.querySelectorAll('.teamhub .tm-person .tm-who > b')].map(e=>e.textContent.trim()),
   count:document.querySelector('.teamhub .hubtitle .chip')?.textContent.trim()
  }));
  assertNames(home.names,expected.home,'Who-to-call projection');
  assert.equal(home.count,expected.all.length+' on the team','current team badge matches projection');
  await p.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-home.png')});
  checks.push('Who-to-call list and count use the same current projection');
  const graph=await p.evaluate(()=>{
   const loop=SHOW.loop;SHOW.loop=true;
   try{return {order:SHOW_ORDER.slice(),keys:CrewShowcase1090.keys.slice(),first:BC_FIRST,
    turns:bcTurns().map(t=>({slot:t.slot,audio:!!t.audio,scene:bcScenes()[t.slot]})),
    original:DATA.broadcast.turns.map(t=>({slot:t.slot,audio:t.audio,secs:t.secs})),
    retained:bcTurns().filter(t=>t.slot<1000).map(t=>({slot:t.slot,audio:t.audio,secs:t.secs})),
    next:Object.fromEntries(bcTurns().map(t=>[t.slot,bcNextSlot(t.slot)])),
    map:bcScenes()};}finally{SHOW.loop=loop;}
  });
  assert.equal(graph.order.length,25);assert.equal(new Set(graph.order).size,25);
  assert.equal(graph.original.length,35,'original assets retained');assert.equal(graph.retained.length,34);
  assert.equal(JSON.stringify(graph.retained),JSON.stringify(graph.original.filter(t=>t.slot!==21)),'only slot21 omitted from runtime programme');
  assert.equal(graph.turns.length,49);assert(!graph.turns.some(t=>t.slot===21));assert(!Object.values(graph.next).includes(21));
  assert.equal(graph.turns.filter(t=>!t.audio).length,15);
  for(const slot of [3,8,12,29])assert(graph.retained.some(t=>t.slot===slot),'valid installer narration retained');
  const seen=new Set(),visited=new Set();let slot=graph.first;
  while(!seen.has(slot)){seen.add(slot);assert(graph.map[slot],'runtime next points to a missing scene');assert(graph.turns.some(t=>t.slot===slot),'runtime next points to a missing take');visited.add(graph.map[slot]);slot=graph.next[slot];}
  assert(graph.order.every(key=>visited.has(key)),'all scenes reachable through rebuilt programme');
  checks.push('25 scenes, 34 original takes and 15 silent pages; only slot21 skipped with complete next mapping');
  await p.evaluate(()=>{showOpen();bcStop();showClear();SHOW.playing=false;SHOW.launch=-1;SHOW.reduced=true;showLaunchStep();});
  const sceneMeasures=[];
  for(const key of ['lead','crew','fencing']){
   await p.evaluate(key=>{SHOW.i=SHOW_ORDER.indexOf(key);showRender();},key);
   await p.waitForTimeout(80);
   const scene=await p.evaluate(()=>{
    const body=document.querySelector('#showBody'),wrap=body.querySelector('.shwrap'),b=body.getBoundingClientRect();
    const names=[...body.querySelectorAll('.shpn')].flatMap(e=>e.innerText.split('\n').map(s=>s.trim()).filter(Boolean));
    const cards=[...body.querySelectorAll('.shcard')];
    const additions=(ABOUT_CONTACT_INPUT1089?.people||[]).map(({name})=>{
     const card=cards.find(e=>e.querySelector('.shpn')?.textContent.trim()===name);
     return {present:!!card,contactFields:card?.querySelectorAll('.shpm,.shpp,.shpe').length||0};
    });
    const nameElements=[...body.querySelectorAll('.shpn')];
    const minimumNameFont=Math.min(...nameElements.map(e=>{const r=e.getBoundingClientRect(),scale=e.offsetHeight?r.height/e.offsetHeight:1;return parseFloat(getComputedStyle(e).fontSize)*Math.min(1,scale);}));
    const rectangles=cards.map(e=>e.getBoundingClientRect());
    const cardsOverlap=rectangles.some((a,i)=>rectangles.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
    const reachable=nameElements.every(e=>{
     const r=e.getBoundingClientRect(),top=r.top-b.top+body.scrollTop;
     return top>=-2&&top+r.height<=body.scrollHeight+2&&r.left>=b.left-2&&r.right<=b.right+2;
    });
    return {names,additions,reachable,minimumNameFont,cardsOverlap,horizontal:wrap.scrollWidth<=wrap.clientWidth+3,
     emptyNodes:[...body.querySelectorAll('.shnode')].filter(e=>!e.querySelector('.shpn')).length,
     text:body.textContent};
   });
   sceneMeasures.push({key,people:scene.names.length,minimumNameFont:scene.minimumNameFont,namesReachable:scene.reachable,cardsOverlap:scene.cardsOverlap,horizontalFit:scene.horizontal});
   fs.writeFileSync(path.join(out,(mobile?'phone':'desktop')+'-scene-measures.json'),JSON.stringify({author:'Andrew Fisher',candidateSha256:candidate?sha(candidate):null,sceneMeasures},null,2)+'\n',{mode:0o600});
   await p.screenshot({path:path.join(out,(mobile?'phone':'desktop')+'-'+key+'.png')});
   assertNames(scene.names,key==='lead'?expected.lead:key==='crew'?expected.install:expected.fencing,key+' credits');
   assert(scene.reachable&&scene.horizontal,key+' names must remain readable and reachable');assert.equal(scene.emptyNodes,0);
   if(mobile&&key==='crew'){assert(scene.minimumNameFont>=12,`phone installer names must be at least 12px after scaling (measured ${scene.minimumNameFont.toFixed(3)}px)`);assert(!scene.cardsOverlap,'phone installer cards overlap');}
   assert(!/NaN|undefined/.test(scene.text),key+' invalid display');
   if(key==='crew')assert(scene.additions.every(p=>p.present&&p.contactFields===0),'new Showcase installers are names/roles only');
   if(mobile){await p.evaluate(()=>{const b=document.querySelector('#showBody');b.scrollTop=b.scrollHeight;});await p.screenshot({path:path.join(out,'phone-'+key+'-bottom.png')});}
  }
  checks.push('Lead/crew credits use current roster; fencing unchanged; added installer contacts absent; names reachable');
  await p.clock.install();await p.clock.pauseAt(new Date());
  const silent=await p.evaluate(()=>{
   bcStop();showClear();showStopClock();SHOW.reduced=false;SHOW.launch=-1;SHOW.playing=true;SHOW.loop=true;
   const takes=bcTurns(),t=takes.find(t=>!t.audio&&takes.some(n=>n.slot===bcNextSlot(t.slot)&&!n.audio));
   if(!t)throw Error('No adjacent silent pages for native pause check');
   BC.on=true;bcPlay(t.slot);return {slot:t.slot,next:bcNextSlot(t.slot),hold:!!BC.hold};
  });
  assert(silent.hold,'native silent timer armed');
  await p.evaluate(()=>showPause());await p.clock.fastForward(20000);
  assert.equal(await p.evaluate(()=>BC.i),silent.slot);assert(await p.evaluate(()=>!SHOW.playing&&!BC.hold));
  await p.evaluate(()=>showPause());await p.clock.fastForward(14001);
  assert.equal(await p.evaluate(()=>BC.i),silent.next,'resume continues installed programme');
  await p.keyboard.press('Escape');await p.clock.fastForward(60000);
  const after=await p.evaluate(()=>{
   const old=window.__credits1092Baseline;
   const result={record:JSON.stringify(S)===old.record,team:JSON.stringify(TEAM)===old.team,data:JSON.stringify(DATA)===old.data,
    broadcast:JSON.stringify(DATA.broadcast)===old.broadcast,mapping:JSON.stringify(BC_SCENE)===old.mapping,
    order:JSON.stringify(SHOW_ORDER)===old.order,closed:document.querySelector('#showcase').hidden,
    timer:!!SHOW.timer,clock:!!SHOW.clock,voiceHold:!!BC.hold,voiceOn:!!BC.on};
   if(!result.record)window.__credits1092RecordDifference={before:JSON.parse(old.record),after:S};
   delete window.__credits1092Baseline;return result;
  });
  if(!after.record)fs.writeFileSync(path.join(out,'record-difference-private.json'),JSON.stringify(await p.evaluate(()=>window.__credits1092RecordDifference)),{mode:0o600});
  assert(after.record&&after.team&&after.data&&after.broadcast&&after.mapping&&after.order,'native record, TEAM, DATA, source broadcast/mapping and scene order preserved');
  assert(after.closed&&!after.timer&&!after.clock&&!after.voiceHold&&!after.voiceOn,'pause/close cleanup');
  assert.equal(s.counts.blocked,0,'no native write attempts');assert.deepEqual(s.errors,[]);
  checks.push('Installed player pause/resume/close clean; native records, TEAM, DATA and original assets unchanged');
  const result={author:'Andrew Fisher',result:'PASS',mode:mobile?'phone':'desktop',source:live?'public-live':'local-candidate',
   candidateSha256:candidate?sha(candidate):null,baseSha256:sha(base),testSha256:sha(fs.readFileSync(__filename)),
   checks,scenes:25,retainedOriginalTakes:34,omittedSlots:[21],silentPages:15,currentInstallers:expected.install.length,
   sceneMeasures,nativeWrites:0,counts:s.counts,errors:s.errors};
  fs.writeFileSync(path.join(out,(mobile?'phone':'desktop')+'-results.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify(result));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
