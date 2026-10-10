// Author: Andrew Fisher. Whole-job historical progress; calendar days never supply completion.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../past984.js','utf8'),c);const model=c.PastDay984.model;
let checks=0;const check=x=>{assert(x);checks++;},day={iso:'2026-10-09',deliveries:[]};let requested;
const read=d=>{requested=d;return {ready:true,pct:{min:42.125,max:42.125},allGreen:false};};
let m=model(day,'2026-10-10',read);check(m.past);check(requested===day.iso);check(m.percent===42.125);check(!m.complete);check(m.text==='42.13');
check(!model(day,day.iso,()=>{throw Error('Today read');}).past);check(!model(day,'2026-10-08',()=>{throw Error('Future read');}).past);
m=model(day,'2026-10-10',()=>({ready:true,pct:{min:42.129,max:100}}));check(m.bound&&m.percent===42.12&&!m.complete);
m=model(day,'2026-10-10',()=>({ready:false}));check(m.percent===null&&!m.complete);
m=model(day,'2026-10-10',()=>({ready:true,pct:{min:100,max:100},allGreen:true,provisional:true}));check(!m.complete);
m=model(day,'2026-10-10',()=>({ready:true,pct:{min:100,max:100},allGreen:true}));check(m.complete&&m.percent===100);
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks}));
