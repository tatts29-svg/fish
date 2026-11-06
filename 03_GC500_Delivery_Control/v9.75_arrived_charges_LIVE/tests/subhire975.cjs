// Author: Andrew Fisher. Detached shared-record projection; no operational writes.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const record={WC09:{quantity:4,arrived:4,done:4},WC61:{quantity:8,arrived:8,done:8},WC69:{quantity:12,arrived:6,done:6},WC57:{quantity:2,arrived:0,done:0}};
const assets=Object.keys(record).map(key=>({key}));
const c={document:{addEventListener:()=>{}},programmeDays:()=>[{iso:'2026-10-09',deliveries:assets.slice(0,2).map(a=>({a}))},{iso:'2026-10-13',deliveries:assets.slice(2).map(a=>({a}))}],movedAway:()=>false,chargeLines:()=>[{item:'FWF'}],epLine909:()=>true,deliveryAsOf:()=>({}),todayIso:()=> '2026-10-09',toiletItem962:a=>record[a.key]};
vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../subhire975.js','utf8')+';this.model=Subhire975',c);
let rows=c.model.remainingRows();assert.equal(rows.length,2);assert(rows.every(r=>r.date==='2026-10-13'));assert.equal(rows.reduce((n,r)=>n+r.remaining,0),8);
record.WC69.arrived=12;record.WC69.done=12;rows=c.model.remainingRows();assert.equal(rows.length,1);assert.equal(rows[0].ref,'WC57');assert.equal(rows[0].remaining,2);
record.WC57.arrived=2;assert.equal(c.model.remainingRows().length,0);
record.WC57.arrived=0;assets[3]._cancelled=true;assert.equal(c.model.remainingRows().length,0);
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:8,scope:'Friday completion omitted; Tuesday outstanding quantities; detached shared-receipt changes refresh; cancelled omitted'}));
