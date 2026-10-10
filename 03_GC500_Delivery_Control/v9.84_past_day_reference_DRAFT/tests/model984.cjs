// Author: Andrew Fisher. Dated reference completion arithmetic; calendar passage is not work evidence.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../past984.js','utf8'),c);const model=c.PastDay984.model;
const row=key=>({a:{key}}),day={iso:'2026-10-09',deliveries:[row('P1'),row('P2')],removals:[],unref:[]};let checks=0;function check(x){assert(x);checks++;}
let m=model(day,'2026-10-10',a=>a.key==='P1');check(m.past);check(m.percent===50);check(!m.complete);check(m.done===1&&m.total===2);
m=model(day,'2026-10-09',()=>true);check(!m.past&&m.percent===null);m=model(day,'2026-10-08',()=>true);check(!m.past&&m.percent===null);
m=model(day,'2026-10-10',()=>true);check(m.complete&&m.percent===100);m=model(day,'2026-10-10',()=>false);check(m.percent===0&&!m.complete);
m=model({...day,deliveries:[],unref:[]},'2026-10-10',()=>true);check(m.percent===null&&!m.complete);
m=model({...day,unref:[{}]},'2026-10-10',()=>true);check(m.percent===66&&!m.complete&&m.total===3);
m=model({...day,deliveries:[row('P1'),row('P1'),{a:{key:'cancelled',_cancelled:true}}]},'2026-10-10',()=>true);check(m.total===1&&m.percent===100);
m=model({...day,removals:[row('P1')]},'2026-10-10',(a,d,kind)=>kind==='out');check(m.total===3&&m.done===1&&m.percent===33);
const before=JSON.stringify(day);model(day,'2026-10-10',()=>true);check(JSON.stringify(day)===before);console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks}));
