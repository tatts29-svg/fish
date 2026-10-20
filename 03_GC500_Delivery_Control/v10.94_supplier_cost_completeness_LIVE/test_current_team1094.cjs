/* Author: Andrew Fisher. GET-only current team cards and phone readability.
 * PAGE=... BASE=... EVIDENCE=/private/path [MOB=1] node test_current_team1094.cjs
 * Run under flock /tmp/gc500-browser.lock. No private names are copied here. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const {open}=require('../toolchain/harness/open_page');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const dataLine=s=>s.split('\n').find(x=>x.startsWith('const DATA = '));
const roleText=value=>String(value||'').trim().replace(/\s*\/\s*/g,'/');
(async()=>{
 const file=process.env.PAGE,out=process.env.EVIDENCE,base=process.env.BASE,mobile=process.env.MOB==='1';
 assert(file&&base&&out&&path.isAbsolute(out),'PAGE, BASE and private absolute EVIDENCE required');
 const source=fs.readFileSync(file,'utf8'),original=fs.readFileSync(base,'utf8');
 assert(source.includes('current-team-input1094'));assert.equal(dataLine(source),dataLine(original));
 fs.mkdirSync(out,{recursive:true,mode:0o700});
 const s=await open({pageFile:file,mobile,W:mobile?390:1440,H:mobile?844:1000,
  init:'localStorage.setItem("gc500_motion","off");localStorage.setItem("gc500.showcarfocus","off");'});
 try{
  const p=s.page;
  await p.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  const model=await p.evaluate(()=>{
   const current=AboutContacts1089.current(TEAM.people),crew=current.filter(p=>p.group==='install');
   window.__team1094Before=JSON.stringify({state:S,team:TEAM,data:DATA});
   return {all:current.map(p=>p.name),crew:crew.map(p=>({name:p.name,role:p.event_role})),
    home:current.filter(p=>['site','transport','install'].includes(p.group)).map(p=>p.name),
    lead:current.filter(p=>p.lead||p.group==='install').map(p=>p.name),
    firstHistoricalInstaller:TEAM.people.find(p=>p.group==='install').name,
    supports:ABOUT_CONTACT_INPUT1089.people.slice(-2).map(p=>({name:p.name,role:p.event_role})),
    originalAudio:DATA.broadcast.turns.map(t=>({slot:t.slot,audio:t.audio,secs:t.secs})),
    playedAudio:bcTurns().filter(t=>t.slot<1000).map(t=>({slot:t.slot,audio:t.audio,secs:t.secs})),
    scenes:SHOW_ORDER.length};
  });
  assert.equal(model.crew.length,9);assert.equal(model.crew.filter(p=>p.role==='Installer').length,7);
  assert.deepEqual(model.crew.slice(-2),model.supports);
  assert.deepEqual(model.supports.map(p=>p.role),['Mechanic/Fitter','Electrician']);
  assert.equal(model.crew[0].name,model.firstHistoricalInstaller);
  assert.equal(new Set(model.all).size,model.all.length);
  assert.deepEqual(model.playedAudio,model.originalAudio.filter(t=>t.slot!==21));
  assert.equal(model.scenes,25);assert.equal(model.playedAudio.length,34);
  const crewNames=model.crew.map(p=>p.name),mode=mobile?'phone':'desktop';
  await p.evaluate(()=>go('about'));
  const about=await p.evaluate(names=>{
   const rows=[...document.querySelectorAll('#pane-about .teamcard .tm-person')];
   return rows.map(r=>({name:r.querySelector('.tm-who > b')?.textContent.trim(),
    role:r.querySelector('.tm-role')?.textContent.trim(),links:r.querySelectorAll('a[href]').length,
    detail:[...r.querySelectorAll('.tm-title')].map(e=>e.textContent.trim()).filter(t=>t!=='no number available')}));
  });
  assert.deepEqual(about.filter(p=>crewNames.includes(p.name)).map(p=>p.name),crewNames);
  const aboutSupportRoles=[];
  for(const wanted of model.supports){const matches=about.filter(p=>p.name===wanted.name);assert.equal(matches.length,1);assert.equal(roleText(matches[0].role),roleText(wanted.role));assert.equal(matches[0].links,0);assert.deepEqual(matches[0].detail,[]);aboutSupportRoles.push(matches[0].role);}
  await p.screenshot({path:path.join(out,mode+'-team-about.png')});
  await p.evaluate(()=>go('today'));
  assert.deepEqual(await p.evaluate(()=>[...document.querySelectorAll('.teamhub .tm-person .tm-who > b')].map(e=>e.textContent.trim())),model.home);
  await p.evaluate(()=>{showOpen();bcStop();showClear();SHOW.playing=false;SHOW.launch=-1;SHOW.reduced=true;showLaunchStep();});
  const measurements=[];
  for(const scene of ['lead','crew']){
   await p.evaluate(key=>{SHOW.i=SHOW_ORDER.indexOf(key);showRender();},scene);await p.waitForTimeout(80);
   const info=await p.evaluate(()=>{
    const body=document.getElementById('showBody'),box=body.getBoundingClientRect();
    const nodes=[...body.querySelectorAll('.shpn')],cards=[...body.querySelectorAll('.shcard')];
    const names=nodes.flatMap(e=>e.innerText.split('\n').map(s=>s.trim()).filter(Boolean));
    const rects=cards.map(e=>e.getBoundingClientRect());
    return {names,cards:cards.map(e=>({name:e.querySelector('.shpn')?.textContent.trim(),role:e.querySelector('.shpr')?.textContent.trim(),
      extra:e.querySelectorAll('.shpt,.shpm,.shpp,.shpe').length})),
     minFont:Math.min(...nodes.map(e=>parseFloat(getComputedStyle(e).fontSize)*Math.min(1,e.offsetHeight?e.getBoundingClientRect().height/e.offsetHeight:1))),
     reachable:nodes.every(e=>{const r=e.getBoundingClientRect(),t=r.top-box.top+body.scrollTop;return t>=-2&&t+r.height<=body.scrollHeight+2&&r.left>=box.left-2&&r.right<=box.right+2;}),
     overlap:rects.some((a,i)=>rects.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1))};
   });
   assert.deepEqual(info.names,scene==='lead'?model.lead:crewNames);assert(info.reachable);assert(!info.overlap);
   if(mobile)assert(info.minFont>=12,'Current team names must remain at least12px');
   if(scene==='crew')for(const wanted of model.supports){const card=info.cards.find(p=>p.name===wanted.name);assert(card);assert.equal(card.role,wanted.role);assert.equal(card.extra,0);}
   measurements.push({scene,people:info.names.length,minimumNameFont:info.minFont,reachable:info.reachable,overlap:info.overlap});
   await p.screenshot({path:path.join(out,mode+'-team-'+scene+'.png')});
   if(mobile){await p.evaluate(()=>{const body=document.getElementById('showBody');body.scrollTop=body.scrollHeight;});await p.screenshot({path:path.join(out,mode+'-team-'+scene+'-bottom.png')});}
  }
  await p.keyboard.press('Escape');
  assert(await p.evaluate(()=>JSON.stringify({state:S,team:TEAM,data:DATA})===window.__team1094Before),'Native records and historical data unchanged');
  assert.equal(s.counts.blocked,0);assert.deepEqual(s.errors,[]);assert.equal(sha(fs.readFileSync(file)),sha(source),'Candidate changed during verification');
  const result={author:'Andrew Fisher',pass:true,mode,candidateSha256:sha(source),baseSha256:sha(original),
   testSha256:sha(fs.readFileSync(__filename)),currentCrew:9,installerRoles:7,supportRoles:model.supports.map(p=>p.role),
   allFourCurrentViewsAgree:true,firstInstallerUnchanged:true,historicalDataUnchanged:true,originalMediaUnchanged:true,aboutSupportRolesAsRendered:aboutSupportRoles,
   measurements,nativeWrites:0,errors:s.errors,counts:s.counts};
  fs.writeFileSync(path.join(out,mode+'-team-results.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});
  console.log(JSON.stringify(result));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
