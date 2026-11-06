/* Author: Andrew Fisher. Synthetic date/refresh regression; no network or operational data. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'dayRefresh1103_src.js'),'utf8');
let checks=0;function ok(value,message){assert.ok(value,message);checks++;}function eq(a,b,message){assert.deepEqual(a,b,message);checks++;}
const isolated={};vm.runInNewContext(source,isolated);ok(isolated.DayRefresh1103.create,'pure factory available without DOM');
let day='2030-03-01',paused=false,ready=true,follows=true,draws=0;
const c=isolated.DayRefresh1103.create({today:()=>day,paused:()=>paused,ready:()=>ready,followsToday:()=>follows,redraw:()=>draws++});
eq(c.check(),false,'same day does no work');eq(draws,0,'initial check does not redraw');
day='2030-03-02';eq(c.check(),true,'new day redraws');eq(draws,1,'exactly one redraw');eq(c.check(),false,'same day deduplicated');
day='2030-03-03';paused=true;eq(c.check(),false,'hidden or print defers');eq(c.report().day,'2030-03-02','deferred day retained');paused=false;eq(c.check(),true,'visibility return catches up once');
day='2030-03-04';ready=false;eq(c.check(),false,'prehydration defers');ready=true;eq(c.check(),true,'first complete hydration catches up');
day='2030-03-05';follows=false;eq(c.check(),false,'explicit snapshot does not refresh');eq(c.report().day,day,'snapshot consumes date transition');follows=true;eq(c.check(),false,'navigation owns subsequent view draw');
day='2030-03-06';eq(c.check(),true,'next current-date boundary works');day='bad';eq(c.check(),false,'invalid date ignored');eq(c.report().day,'2030-03-06','invalid date cannot poison baseline');
function fixture(){
 const handlers={},documentHandlers={};let cache=0,redraw=0,clock=0;const state={tab:'today',asOf:null},doc={hidden:false,readyState:'complete',addEventListener:(n,f)=>{(documentHandlers[n]??=[]).push(f);}};
 const ctx={document:doc,state,DATA:{edition:'hosted'},SYNC:{on:true,first:new Set(['a','b'])},SYNC_COLLS:{a:{},b:{}},TPOD:{frozen:false},SHOW:{open:false},todayIso:()=>day,sharedCache975:()=>cache++,syncRedraw:()=>redraw++,tpodTick:()=>{clock++;return 'clock';},addEventListener:(n,f)=>{(handlers[n]??=[]).push(f);}};
 ctx.window=ctx;day='2031-01-01';vm.runInNewContext(source,ctx);
 return {ctx,state,doc,counts:()=>({cache,redraw,clock}),fire:n=>[...(handlers[n]||[]),...(documentHandlers[n]||[])].forEach(f=>f())};
}
let f=fixture();day='2031-01-02';eq(f.ctx.tpodTick(),'clock','native clock return preserved');eq(f.counts(),{cache:1,redraw:1,clock:1},'native invalidation + redraw exactly once');f.fire('focus');f.fire('pageshow');f.fire('visibilitychange');eq(f.counts().redraw,1,'duplicate wake signals coalesce');
for(const tab of ['plant','map','vms','fencing']){f=fixture();f.state.tab=tab;f.state.asOf='2029-02-03';day='2031-01-02';f.ctx.tpodTick();eq(f.counts().redraw,1,tab+' current-day model refreshes without changing unrelated asOf');eq(f.state.asOf,'2029-02-03',tab+' preserves date selection');}
for(const tab of ['timeline','demob','servicing','nights','documents']){f=fixture();f.state.tab=tab;day='2031-01-02';f.ctx.tpodTick();eq(f.counts().redraw,0,tab+' retains its native clock/date behavior');}
for(const tab of ['today','progress']){f=fixture();f.state.tab=tab;f.state.asOf='2029-02-03';day='2031-01-02';f.ctx.tpodTick();eq(f.counts().redraw,0,tab+' selected historic date stays pinned');eq(f.state.asOf,'2029-02-03',tab+' never changes asOf');}
f=fixture();f.ctx.SHOW.open=true;f.state.tab='timeline';day='2031-01-02';f.ctx.tpodTick();eq(f.counts().cache,1,'unpinned paused Showcase uses existing cache refresh hook');
f=fixture();f.ctx.SHOW.open=true;f.state.asOf='2029-02-03';day='2031-01-02';f.ctx.tpodTick();eq(f.counts().redraw,0,'historic Showcase stays pinned');
f=fixture();f.ctx.SYNC.first.delete('b');day='2031-01-02';f.ctx.tpodTick();eq(f.counts().redraw,0,'partial native hydration cannot redraw');f.ctx.SYNC.first.add('b');f.ctx.tpodTick();eq(f.counts().redraw,1,'complete native hydration enables pending day refresh');
f=fixture();f.doc.hidden=true;day='2031-01-02';f.ctx.tpodTick();eq(f.counts().redraw,0,'hidden current-day page waits');f.doc.hidden=false;f.fire('visibilitychange');eq(f.counts().redraw,1,'visible current-day page catches up');
f=fixture();f.fire('beforeprint');day='2031-01-02';f.ctx.tpodTick();eq(f.counts().redraw,0,'printing stays frozen');f.fire('afterprint');eq(f.counts().redraw,1,'afterprint refreshes once');f.fire('afterprint');eq(f.counts().redraw,1,'repeat afterprint is no-op');
f=fixture();f.ctx.TPOD.frozen=true;day='2031-01-02';f.ctx.tpodTick();eq(f.counts().redraw,0,'native frozen clock is respected');f.ctx.TPOD.frozen=false;f.ctx.tpodTick();eq(f.counts().redraw,1,'native unfreeze catches up');
eq(Object.keys(f.ctx).filter(k=>/save|fetch|syncSend|bump/.test(k)),[],'no write/network dependency');
console.log(JSON.stringify({checks,passed:checks,source:'dayRefresh1103_src.js'}));
