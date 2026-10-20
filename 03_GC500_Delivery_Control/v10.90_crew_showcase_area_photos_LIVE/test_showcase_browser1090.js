/* Author: Andrew Fisher. GET-only UI proof. Operational evidence stays outside Git. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {open}=require('../toolchain/harness/open_page');
(async()=>{
 const mobile=process.env.MOB==='1',live=process.env.PUBLIC_LIVE==='1',out=process.env.EVIDENCE;
 if(!out||(!process.env.PAGE&&!live)||(live&&process.env.PAGE))throw Error('Private EVIDENCE and PAGE, or explicit PUBLIC_LIVE=1 without PAGE, required');
 fs.mkdirSync(out,{recursive:true,mode:0o700});
 const s=await open({pageFile:process.env.PAGE,mobile,W:mobile?390:1440,H:mobile?844:1000,init:'localStorage.setItem("gc500_motion","off");localStorage.setItem("gc500.showcarfocus","off")'});
 try{
  await s.page.waitForFunction(()=>SYNC.status==='live'&&SYNC.first.size===Object.keys(SYNC_COLLS).length,null,{timeout:180000});
  await s.page.evaluate(()=>docsRefresh(true));
  await s.page.waitForFunction(()=>DOCS.state==='ready'&&!DOCS.busy&&photoIndex().state==='ready'&&typeof CrewShowcase1090!=='undefined',null,{timeout:60000});
  await s.page.evaluate(()=>sharedCache975());
  const baseline=await s.page.evaluate(()=>({record:JSON.stringify(S),team:JSON.stringify(TEAM),audio:JSON.stringify(DATA.broadcast),mapping:JSON.stringify(BC_SCENE)}));
  const graph=await s.page.evaluate(()=>{
   const p=CrewShowcase1090.broadcast;
   return {order:SHOW_ORDER.slice(),keys:CrewShowcase1090.keys.slice(),turns:p.turns.map(t=>({slot:t.slot,hasAudio:!!t.audio,scene:p.map[t.slot]})),
    first:p.first,last:p.bodyLast,next:p.next,map:p.map,original:DATA.broadcast.turns.map(t=>({slot:t.slot,audio:t.audio})),preserved:p.turns.filter(t=>t.slot<1000).map(t=>({slot:t.slot,audio:t.audio}))};
  });
  assert.equal(graph.order.length,25);assert.equal(new Set(graph.order).size,25);
  assert(graph.turns.every(t=>graph.order.includes(t.scene)));
  assert(graph.turns.filter(t=>graph.keys.includes(t.scene)).every(t=>!t.hasAudio));
  let slot=graph.first;const visited=new Set(),seen=new Set();
  while(!seen.has(slot)){seen.add(slot);assert(graph.map[slot],'broadcast slot must exist');visited.add(graph.map[slot]);slot=graph.next[slot];}
  assert(graph.order.every(k=>visited.has(k)),'first run and loop must reach every scene');
  assert.deepEqual(graph.preserved,graph.original,'every original audio take and its order are preserved');
  await s.page.evaluate(()=>{showOpen();showClear();SHOW.playing=false;SHOW.launch=-1;SHOW.reduced=true;showLaunchStep();});
  const facts=[];
  for(let i=0;i<graph.order.length;i++){
   await s.page.evaluate(i=>{SHOW.i=i;showRender();},i);
   await s.page.waitForTimeout(60);
   const r=await s.page.evaluate(()=>{
    const body=document.querySelector('#showBody'),wrap=body.querySelector('.shwrap'),b=body.getBoundingClientRect(),w=wrap.getBoundingClientRect();
    const key=SHOW_ORDER[SHOW.i],row=wrap.querySelector('.shrow'),count=wrap.querySelector('[data-crew1090-count]');
    return {key,width:b.width,contentWidth:w.width,scrollWidth:wrap.scrollWidth,clientWidth:wrap.clientWidth,font:row?parseFloat(getComputedStyle(row).fontSize):null,text:wrap.textContent,count:count?.childNodes[0]?.textContent,
     model:CrewShowcase1090.keys.includes(key)?CrewShowcase1090.read(todayIso(),key):null};
   });
   assert(r.contentWidth<=r.width+3,'scene width '+r.key);
   assert(r.scrollWidth<=r.clientWidth+3,'horizontal content overflow '+r.key);
   assert(!/NaN|undefined/.test(r.text),'invalid display '+r.key);
   if(graph.keys.includes(r.key)){
    if(mobile&&r.font!=null)assert(r.font>=12,'readable phone rows '+r.key);
    facts.push(r);
    await s.page.screenshot({path:path.join(out,(mobile?'phone-':'desktop-')+r.key+'.png')});
    if(mobile){
     const note=await s.page.evaluate(()=>{
      const body=document.querySelector('#showBody');body.scrollTop=body.scrollHeight;
      const b=body.getBoundingClientRect(),fine=body.querySelector('.shf').getBoundingClientRect();
      const credit=[...document.querySelectorAll('#showPlate .gc3d-ui')].find(e=>e.textContent.trim())?.getBoundingClientRect();
      return {visible:fine.top>=b.top-1&&fine.bottom<=b.bottom+1,separated:!credit||b.bottom+4<=credit.top};
     });
     assert(note.visible,'full explanatory note reachable '+r.key);assert(note.separated,'attribution separated '+r.key);
    }
   }
  }
  // Simulate one incoming native delivery update in memory, then restore it.
  const sync=await s.page.evaluate(()=>{
   SHOW.i=SHOW_ORDER.indexOf('install_buildings1090');showRender();showClear();
   const body=document.querySelector('#showBody');body.scrollTop=Math.min(12,body.scrollHeight-body.clientHeight);
   const row=todayWorkMetrics840(todayIso()).find(a=>a.id==='buildings').rows.find(r=>r.complete&&r.done>0);
   if(!row)throw Error('No existing completed building reference available for captured change');
   window.__restoreCrew1090={key:row.key,had:Object.prototype.hasOwnProperty.call(S.delivery,row.key),record:S.delivery[row.key]===undefined?null:JSON.parse(JSON.stringify(S.delivery[row.key]))};
   const before=CrewShowcase1090.read(todayIso(),'install_buildings1090').areas.find(a=>a.id==='buildings').done;
   const index=SHOW.i,scroll=body.scrollTop,audio=BC.el,slot=BC.i;
   S.delivery[row.key]={...(S.delivery[row.key]||{}),done:false,done_at:null,done_off_at:new Date(Date.now()+60000).toISOString(),done_off_by:'Synthetic verification'};
   sharedCache975();
   return {before,index,scroll,slot,audioPresent:!!audio};
  });
  try{
   await s.page.waitForFunction(before=>{
    const board=todayWorkMetrics840(todayIso()).find(a=>a.id==='buildings').done;
    const text=document.querySelector('#showBody [data-crew1090-count]')?.childNodes[0]?.textContent;
    return board!==before&&text===new Intl.NumberFormat('en-AU',{maximumFractionDigits:3}).format(board);
   },sync.before);
   const changed=await s.page.evaluate(()=>({index:SHOW.i,scroll:document.querySelector('#showBody').scrollTop,slot:BC.i,audioPresent:!!BC.el}));
   assert.equal(changed.index,sync.index);assert.equal(changed.scroll,sync.scroll);assert.equal(changed.slot,sync.slot);assert.equal(changed.audioPresent,sync.audioPresent);
   await s.page.evaluate(()=>{SHOW.i=SHOW_ORDER.indexOf('equipment');showRender();const b=document.querySelector('#showBody');b.scrollTop=Math.min(12,b.scrollHeight-b.clientHeight);window.__retainedCrew1090={html:b.querySelector('.shwrap').innerHTML,index:SHOW.i,scroll:b.scrollTop};});
  }finally{
   await s.page.evaluate(()=>{const r=window.__restoreCrew1090;if(r.had)S.delivery[r.key]=r.record;else delete S.delivery[r.key];delete window.__restoreCrew1090;sharedCache975();});
  }
  await s.page.waitForFunction(()=>{const prior=window.__retainedCrew1090,b=document.querySelector('#showBody'),html=b.querySelector('.shwrap').innerHTML;return prior&&html!==prior.html&&html===showScene('equipment',state.asOf||todayIso())&&SHOW.i===prior.index&&b.scrollTop===prior.scroll;});
  await s.page.evaluate(()=>{delete window.__retainedCrew1090;});
  // A manual jump must cancel a narration belonging to a different retained scene.
  const manual=await s.page.evaluate(()=>{
   BC.on=true;BC.i=BC_FIRST;SHOW.i=SHOW_ORDER.indexOf('fence_ccb1090');showRender();
   return {stopped:!BC.on,noHold:!BC.hold,scene:SHOW_ORDER[SHOW.i]};
  });
  assert(manual.stopped&&manual.noHold);assert.equal(manual.scene,'fence_ccb1090');
  // Exercise the installed v7.94 player, its silent holds and rejected-media fallback.
  await s.page.clock.install();
  await s.page.clock.pauseAt(new Date());
  const voiceTest=await s.page.evaluate(()=>{
   bcStop();showClear();showStopClock();SHOW.reduced=false;SHOW.launch=-1;SHOW.playing=true;SHOW.loop=true;
   const p=CrewShowcase1090.broadcast,t=p.turns.find(t=>!t.audio);
   BC.on=true;bcPlay(t.slot);
   return {slot:t.slot,next:p.next[t.slot],hold:!!BC.hold};
  });
  assert(voiceTest.hold,'silent scene arms the installed voice timer');
  await s.page.evaluate(()=>showPause());
  await s.page.clock.fastForward(20000);
  assert.deepEqual(await s.page.evaluate(()=>({slot:BC.i,playing:SHOW.playing,hold:!!BC.hold})),{slot:voiceTest.slot,playing:false,hold:false},'pause holds silent narration');
  await s.page.evaluate(()=>showPause());
  await s.page.clock.fastForward(14001);
  assert.equal(await s.page.evaluate(()=>BC.i),voiceTest.next,'resume continues the silent sequence');
  const failed=await s.page.evaluate(()=>{
   bcStop();showClear();showStopClock();window.__playerBefore1090=BC.player918;
   BC.player918={pause(){},play(){return Promise.reject(new Error('Synthetic unavailable media'));},src:'',preload:'',onended:null,onerror:null};
   const p=CrewShowcase1090.broadcast,t=p.turns.find(t=>t.audio);SHOW.playing=true;BC.on=true;bcPlay(t.slot);
   return {slot:t.slot,next:p.next[t.slot],ms:Math.max(1200,t.secs*1000)};
  });
  await s.page.waitForFunction(()=>!!BC.hold);
  await s.page.clock.fastForward(failed.ms+1);
  assert.equal(await s.page.evaluate(()=>BC.i),failed.next,'failed media advances through the installed timed fallback');
  await s.page.evaluate(()=>{bcStop();showClear();showStopClock();BC.player918=window.__playerBefore1090;delete window.__playerBefore1090;SHOW.reduced=true;});
  await s.page.keyboard.press('Escape');
  await s.page.clock.fastForward(60000);
  const after=await s.page.evaluate(()=>({record:JSON.stringify(S),team:JSON.stringify(TEAM),audio:JSON.stringify(DATA.broadcast),mapping:JSON.stringify(BC_SCENE),closed:document.querySelector('#showcase').hidden,timer:!!SHOW.timer,voiceHold:!!BC.hold,voiceOn:!!BC.on}));
  if(after.record!==baseline.record)fs.writeFileSync(path.join(out,'native-difference-private.json'),JSON.stringify({before:JSON.parse(baseline.record),after:JSON.parse(after.record)}),{mode:0o600});
  assert(after.record===baseline.record,'native record changed; private diagnostic saved');
  assert(after.team===baseline.team,'TEAM unchanged');assert(after.audio===baseline.audio,'original audio unchanged');assert(after.mapping===baseline.mapping,'original narration mapping unchanged');
  assert(after.closed&&!after.timer&&!after.voiceHold&&!after.voiceOn);assert.equal(s.counts.blocked,0);assert.deepEqual(s.errors,[]);
  fs.writeFileSync(path.join(out,(mobile?'phone':'desktop')+'-models-private.json'),JSON.stringify(facts,null,2),{mode:0o600});
  console.log(JSON.stringify({result:'PASS',source:live?'public-live':'local-candidate',mode:mobile?'phone':'desktop',scenes:25,newPages:15,liveRefresh:true,scrollAndAudioPreserved:true,originalMediaAndTeamUnchanged:true,broadcastGraphComplete:true,allOriginalTakesPreserved:true,silentPauseResumeAndMediaFallback:true,retainedSceneLiveRefresh:true,phoneNotesSeparate:mobile||undefined,counts:s.counts,errors:s.errors}));
 }finally{await s.browser.close();}
})().catch(e=>{console.error(e.message);process.exitCode=1;});
