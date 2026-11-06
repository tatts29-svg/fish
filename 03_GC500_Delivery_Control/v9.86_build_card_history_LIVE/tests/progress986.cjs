// Author: Andrew Fisher. Queue behaviour is exercised without network or operational writes.
const assert=require('assert/strict');
require('../progress986.js');
const {create}=globalThis.BuildProgress986;
let checks=0;
function check(ok,label){assert(ok,label);checks++;}
function fixture(){
 let cards=[],current='revision-1',active=true,ready=true,today='2026-10-10',serial=0,afterRead=null;
 const tasks=new Map(),reads=[],paints=[];
 const engine=create({active:()=>active,ready:()=>ready,today:()=>today,signature:()=>current,cards:()=>cards,
  connected:c=>c.connected,pending:c=>c.pending,day:c=>c.day,selected:c=>c.selected,visible:c=>c.visible,
  schedule:fn=>{tasks.set(++serial,fn);return serial;},cancel:id=>tasks.delete(id),
  read:day=>{reads.push(day);afterRead?.();return {day,percent:37.34};},paint:(c,result)=>{paints.push({c,result});c.pending=false;}});
 const card=(day,options={})=>({day,connected:true,pending:true,selected:false,visible:false,...options});
 return {engine,tasks,reads,paints,card,setCards:v=>cards=v,setRevision:v=>current=v,setActive:v=>active=v,setReady:v=>ready=v,setToday:v=>today=v,setAfterRead:v=>afterRead=v,
  tick(){const [id,fn]=tasks.entries().next().value||[];if(fn){tasks.delete(id);fn();}}};
}
{
 const f=fixture(),offscreen=f.card('2026-09-07'),visible=f.card('2026-09-08',{visible:true}),selected=f.card('2026-09-09',{selected:true});
 f.setCards([offscreen,visible,selected]);f.engine.sync();f.engine.sync();check(f.tasks.size===1,'Repeated sync schedules one callback');
 f.tick();check(f.reads.join()==='2026-09-09','Selected past card is first even when offscreen');check(f.paints.length===1&&f.tasks.size===1,'Only one card computed per scheduled callback');
 f.tick();check(f.reads.join()==='2026-09-09,2026-09-08','Next callback processes visible card');check(f.tasks.size===0,'No continuous timer and offscreen history remains deferred');
 offscreen.visible=true;f.engine.sync();f.tick();check(f.reads.length===3,'Previously offscreen card is computed on visibility change');
 f.engine.sync();check(f.tasks.size===0,'Painted cards are not recomputed');
}
{
 const f=fixture();f.setCards([f.card('2026-10-10',{visible:true}),f.card('2026-10-11',{selected:true})]);f.engine.sync();check(f.tasks.size===0,'Today and future never receive historical percentages');
}
{
 const f=fixture(),c=f.card('2026-09-07',{visible:true});f.setCards([c]);f.setReady(false);f.engine.sync();check(f.tasks.size===0,'No calculations before native readiness');
 f.setReady(true);f.engine.sync();check(f.tasks.size===1,'Readiness permits a visible card calculation');f.setActive(false);f.engine.sync();check(f.tasks.size===0,'Leaving Build or hiding the document cancels queued work');
 f.setActive(true);f.engine.sync();f.engine.stop();check(f.tasks.size===0,'Pagehide stops pending work');f.engine.resume();f.tick();check(f.paints.length===1,'Pageshow resumes pending visible cards');
}
{
 const f=fixture(),old=f.card('2026-09-07',{visible:true});f.setCards([old]);f.engine.sync();f.setRevision('revision-2');f.tick();check(f.reads.length===0,'State changes cannot compute into a DOM card from an older record');
 old.connected=false;const fresh=f.card('2026-09-07',{visible:true});f.setCards([fresh]);f.engine.sync();f.tick();check(f.paints.length===1&&f.paints[0].c===fresh,'Replacement DOM receives current-state result');
}
{
 const f=fixture(),old=f.card('2026-09-07',{visible:true});f.setCards([old]);f.engine.sync();f.setAfterRead(()=>{old.connected=false;f.setRevision('revision-2');});f.tick();check(f.paints.length===0&&f.engine.report().discarded===1,'A result is discarded if its record or DOM changes during calculation');
}
{
 const f=fixture(),c=f.card('2026-09-07',{visible:true});f.setCards([c]);f.engine.sync();c.visible=false;f.tick();check(f.reads.length===0,'Scrolling a queued card offscreen cancels its calculation');
}
console.log(JSON.stringify({pass:true,checks}));
