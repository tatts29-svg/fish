/* Author: Andrew Fisher. Synthetic broadcast routing and runtime wrapper checks.
 * No real audio, crew identities, records, contact details or browser access. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const api=require('./crew_showcase1090');
const source=fs.readFileSync(path.join(__dirname,'crew_showcase1090.js'),'utf8');

const originalMap={};
for(let slot=1;slot<=35;slot++){
 originalMap[slot]=slot===1||slot>=34?'countdown':slot<=7?'lead':slot===8?'crew':
  slot===9?'equipment':slot<=13?'complete':slot===14?'fencing':slot===15?'fence':
  slot<=18?'fenceprog':slot<=26?'effort':'site';
}
const turns=Array.from({length:35},(_,i)=>({
 slot:i+1,section:i<3?1:i<7?2:i<13?3:i<18?4:i<22?5:i<26?6:i<33?7:8,
 audio:'synthetic-audio-'+(i+1),secs:8+(i%5),sha256:'synthetic-hash-'+(i+1),
 metadata:{identity:'take-'+(i+1)}
}));
const originalBefore=JSON.stringify({turns,originalMap});
const orderBefore=JSON.stringify(api.order);
const plan=api.programme(turns,originalMap,api.order,34);
const retained=new Set(['countdown','lead','crew','equipment','complete','fencing','fence','fenceprog','effort','site']);
const bySlot=new Map(plan.turns.map(t=>[t.slot,t]));
assert.equal(api.order.length,25);
assert.equal(new Set(api.order).size,25);
assert.deepEqual(api.order.filter(key=>retained.has(key)),[...retained],
 'all ten original scenes remain in their original order');
assert.equal(bySlot.size,plan.turns.length,'every programme slot is unique');
assert.equal(plan.first,1,'the original BC_FIRST entry must remain valid');
assert.equal(plan.map[4],'lead','the original BC_AFTER_LOOP entry must remain valid');
assert.equal(plan.loopFirst,34);
assert.equal(plan.map[plan.bodyLast],api.order.at(-1));

const keptOriginalSlots=turns.map(t=>t.slot);
assert.deepEqual(plan.turns.filter(t=>t.slot<1000).map(t=>t.slot),keptOriginalSlots);
for(const slot of keptOriginalSlots){
 const actual=bySlot.get(slot),original=turns.find(t=>t.slot===slot);
 assert.deepEqual(actual,original,'retained takes keep their original content and metadata');
 assert.notStrictEqual(actual,original,'programme may not mutate original take objects');
 assert.equal(plan.map[slot],originalMap[slot],'retained narration stays on its original scene');
}
for(const key of api.keys){
 const matches=plan.turns.filter(t=>plan.map[t.slot]===key);
 assert.equal(matches.length,1,'each new scene has one timed broadcast turn');
 assert.equal(matches[0].audio,null,'new scenes must not play unrelated old narration');
 assert(matches[0].secs>=1.2,'silent fallback has a finite reading hold');
}
for(const t of plan.turns){
 assert(api.order.includes(plan.map[t.slot]),'every broadcast turn targets a current scene');
 if(t.audio)assert(retained.has(plan.map[t.slot]),'audio belongs only to retained scenes');
 assert(bySlot.has(plan.next[t.slot]),'looping next slot always exists');
}

function trace(start,stopAfter){
 const seen=[],slots=new Set();let slot=start;
 for(let n=0;n<plan.turns.length+1;n++){
  assert(bySlot.has(slot),'route entered a missing turn');
  assert(!slots.has(slot),'route cycled before reaching its intended boundary');
  slots.add(slot);seen.push(slot);
  if(slot===stopAfter)return seen;
  slot=plan.next[slot];
 }
 assert.fail('route failed to reach its boundary');
}
const bodyRun=trace(plan.first,plan.bodyLast);
assert.deepEqual([...new Set(bodyRun.map(slot=>plan.map[slot]))],api.order,
 'first body traversal must reach all 25 scenes in display order');
const firstRun=trace(plan.first,35);
assert.deepEqual(firstRun.filter(slot=>slot<1000),turns.map(t=>t.slot),
 'full planned first cycle preserves all 35 original takes exactly once and in spoken order');
assert.deepEqual(firstRun.filter(slot=>slot<1000).map(slot=>bySlot.get(slot).audio),turns.map(t=>t.audio),
 'the complete original audio playlist is retained without omission or reassignment');
assert.equal(new Set(firstRun).size,plan.turns.length,
 'all original and silent turns occur once in the complete first cycle');
const loopRun=trace(4,35);
assert.deepEqual([...new Set(loopRun.map(slot=>plan.map[slot]))],api.order.slice(1).concat('countdown'),
 'subsequent loops must reach all 25 scenes, ending with the original countdown bridge');
assert.deepEqual(loopRun.filter(slot=>slot<1000),turns.filter(t=>t.slot>=4).map(t=>t.slot),
 'subsequent loops preserve the full original 4–35 spoken sequence');
assert.deepEqual(loopRun.slice(-2),[34,35],'repeat retains both original loop-opener takes');
assert.equal(plan.next[35],4,'repeat resumes at the original post-welcome slot');
assert(!loopRun.includes(1)&&!loopRun.includes(2)&&!loopRun.includes(3),
 'welcome-only takes must not replay on subsequent loops');
assert.equal(plan.next[plan.bodyLast],34);
assert.equal(JSON.stringify({turns,originalMap}),originalBefore);
assert.equal(JSON.stringify(api.order),orderBefore);

// Execute the real installation wrappers against synthetic host functions.
// Existing v7.94 bcPlay itself remains untouched by this source.
const attrs=new Set();
const pendingMicrotasks=[],wrap={innerHTML:'unchanged'};
const body={toggleAttribute(name,on){if(on)attrs.add(name);else attrs.delete(name);},querySelector:()=>wrap,
 scrollTop:12,scrollHeight:200,clientHeight:100};
const retainedProgress=['equipment','complete','fence','fenceprog','effort','site'];
let stopped=0,rendered=0,fitted=0,snapshotRevision=0;
const syntheticActuals={
 keys:retainedProgress,
 read(day){return {day,ready:true,stale:false,areas:[{id:'buildings',name:'Synthetic buildings',unit:'units',
  done:3+snapshotRevision,total:8,left:5-snapshotRevision,complete:false,rows:[]}],
  components:[],fences:[],checks:{done:0,total:0,levelled:0,steps:0},completeAreas:0};}
};
const originalScene=(key,day)=>retainedProgress.includes(key)?
 'original:'+key+':'+syntheticActuals.read(day).areas[0].done:'original:'+key;
const host={
 document:{getElementById:id=>id==='showBody'?body:null},
 SHOW_ORDER:['countdown','lead','crew','equipment','complete','fencing','fence','fenceprog','effort','site'],
 SHOW_TITLE:{countdown:'Original countdown',lead:'Original lead',crew:'Original crew',fencing:'Original fencing'},
 SHOW_HOLD:{},SHOW:{open:true,i:0,loop:true},BC:{on:false,i:0},BC_LOOP:34,
 bcTurns:()=>turns,bcScenes:()=>originalMap,
 bcNextSlot:()=>-1,
 bcStop(){stopped++;host.BC.on=false;},
 ShowcaseActuals1089:syntheticActuals,
 showScene:originalScene,
 showRender(){rendered++;return 'rendered';},
 showFit(){fitted++;body.scrollTop=0;},
 sharedCache975:()=> 'cache',render:()=> 'render',
 queueMicrotask:fn=>pendingMicrotasks.push(fn),
 holdAssets:fn=>fn(),
 state:{asOf:'2026-10-20'},todayIso:()=> '2026-10-20'
};
const originalPlayer=function syntheticOriginalPlayer(){return 'original-player';};
const originalStop=host.bcStop;
const originalClose=function(){host.SHOW.open=false;host.bcStop();return 'closed';};
host.bcPlay=originalPlayer;
host.showClose=originalClose;
host.window=host;
vm.runInNewContext(source,host,{filename:'crew_showcase1090.js'});
assert.strictEqual(host.bcPlay,originalPlayer,'the established transport/player implementation stays untouched');
assert.strictEqual(host.bcStop,originalStop,'the established stop and audio cleanup implementation stays untouched');
assert.strictEqual(host.showClose,originalClose,'the established close and timer cleanup implementation stays untouched');
assert.deepEqual([...host.SHOW_ORDER],api.order);
assert.equal(JSON.stringify({turns,originalMap}),originalBefore);
assert.equal(host.bcNextSlot(host.CrewShowcase1090.broadcast.bodyLast),34);
host.SHOW.loop=false;
const terminal=host.bcNextSlot(host.CrewShowcase1090.broadcast.bodyLast);
assert.equal(terminal,-1090,'non-looping run reaches the expected terminal sentinel');
assert(!host.bcTurns().some(t=>t.slot===terminal),
 'existing v7.94 missing-take branch will stop broadcast and resume normal scheduling');
assert.equal(host.bcNextSlot(987654),-1090);

host.BC.on=true;host.BC.i=4;host.SHOW.i=host.SHOW_ORDER.indexOf('lead');
assert.equal(host.showRender(),'rendered');
assert.equal(stopped,0,'player-owned retained-scene render must preserve narration');
assert(!attrs.has('data-crew1090'));

host.SHOW.i=host.SHOW_ORDER.indexOf(api.keys[0]);
host.showRender();
assert.equal(stopped,1,'manual navigation away from the active narration stops broadcast');
assert.equal(host.BC.on,false);
assert(attrs.has('data-crew1090'));

const newTurn=host.bcTurns().find(t=>host.bcScenes()[t.slot]===api.keys[0]);
host.BC.on=true;host.BC.i=newTurn.slot;
host.showRender();
assert.equal(stopped,1,'player-owned silent new-scene render must continue its timed turn');
host.SHOW.i=host.SHOW_ORDER.indexOf('crew');
host.showRender();
assert.equal(stopped,2,'manual navigation away from a silent turn also stops its pending timer');
assert.equal(rendered,4);
assert.equal(host.showScene('lead','2026-10-20'),'original:lead',
 'retained scene rendering delegates to the previous implementation');
for(const key of retained)assert.equal(host.showScene(key,'2026-10-20'),originalScene(key,'2026-10-20'),
 'every original scene delegates to its unchanged renderer');

// Native-data refresh must update both expanded pages and retained progress pages
// without moving the scene, interrupting narration or throwing away scroll position.
host.BC.on=true;host.BC.i=newTurn.slot;host.SHOW.i=host.SHOW_ORDER.indexOf(api.keys[0]);
const transportBefore={index:host.SHOW.i,slot:host.BC.i,on:host.BC.on,stopped,rendered};
assert.equal(host.CrewShowcase1090.refreshOpen(),true);
assert(wrap.innerHTML.includes('>3<small>'),'new scene uses the synthetic native count');
assert.equal(body.scrollTop,12,'refresh restores scroll after the native fitter runs');
snapshotRevision=1;
host.sharedCache975();host.sharedCache975();
assert.equal(pendingMicrotasks.length,1,'multiple cache updates coalesce into one refresh');
assert.equal(pendingMicrotasks.shift()(),true);
assert(wrap.innerHTML.includes('>4<small>'),'new scene refresh reads the changed native count');
assert.equal(host.CrewShowcase1090.refreshOpen(),false,'unchanged output does not refit or repaint');
assert.deepEqual({index:host.SHOW.i,slot:host.BC.i,on:host.BC.on,stopped,rendered},transportBefore,
 'data-only refresh preserves current transport and narration');
host.SHOW.i=host.SHOW_ORDER.indexOf('equipment');
assert.equal(host.CrewShowcase1090.refreshOpen(),true);
assert.equal(wrap.innerHTML,'original:equipment:4');
snapshotRevision=2;
host.render();
assert.equal(pendingMicrotasks.length,1,'retained progress scene queues refresh through the same path');
assert.equal(pendingMicrotasks.shift()(),true);
assert.equal(wrap.innerHTML,'original:equipment:5','retained scene is rebuilt by its existing native renderer');
assert.equal(body.scrollTop,12);
assert.equal(fitted,4,'only changed content requires fitting');

host.BC.on=true;host.SHOW.i=host.SHOW_ORDER.indexOf(api.keys[0]);
host.sharedCache975();
assert.equal(pendingMicrotasks.length,1,'an open new scene may queue one read-only refresh');
const closedContent=wrap.innerHTML;
assert.equal(host.showClose(),'closed');
assert.equal(host.BC.on,false,'closing still stops broadcast through the existing cleanup');
assert.equal(stopped,3);
assert.equal(pendingMicrotasks.shift()(),false,'a queued refresh does nothing after the Showcase closes');
assert.equal(wrap.innerHTML,closedContent);
assert.equal(JSON.stringify({turns,originalMap}),originalBefore);

console.log('PASS: all 25 scenes reachable on first run and loops; all 35 original takes and their order preserved; new scenes silent; retained/new data refresh, non-loop terminal, manual navigation, stop and close guards verified; player untouched');
