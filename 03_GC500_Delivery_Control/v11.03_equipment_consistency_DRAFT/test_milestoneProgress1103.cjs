/* Author: Andrew Fisher. Synthetic milestone scope and percentage regressions; no record writes. */
'use strict';
const assert=require('node:assert/strict');
const api=require('./milestoneProgress1103_src.js');
const percent={display(value,lower){if(typeof value!=='number'||!Number.isFinite(value))return null;const n=lower?Math.floor((value+1e-9)*100)/100:Math.round(value*100)/100;return value>=0&&value<100?Math.min(99.99,n):n;},text(value,lower){const n=this.display(value,lower);return n===null?'—':n.toLocaleString('en-AU',{maximumFractionDigits:2});}};
let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++;};
const area={id:'synthetic',total:1000,done:999,pct:99.9,remaining:1,missing:false,shortConflictRefs:0};
const summary=(change={},health={})=>({health:{ready:true,stale:false,...health},byId:{synthetic:{total:1000,done:999,pct:99.9,pctKind:'confirmed',...change}}});
let r=api.project(area,summary(),percent);eq(r.pct,99.9);eq(r.label,'99.9%');eq(r.confirmedComplete,false);eq(r.left,1);
r=api.project(area,summary({done:99999,total:100000,pct:99.999}),percent);eq(r.pct,99.99);eq(r.label,'99.99%');eq(r.confirmedComplete,false);
r=api.project(area,summary({pct:100}),percent);eq(r.pct,99.99);eq(r.confirmedComplete,false);
r=api.project(area,summary({done:1000,pct:100}),percent);eq(r.pct,100);eq(r.confirmedComplete,true);eq(r.left,0);
r=api.project(area,summary({done:1000,pct:100},{stale:true}),percent);eq(r.pct,100);eq(r.confirmedComplete,false);eq(r.stale,true);
for(const value of [null,undefined,NaN,Infinity,-1]){r=api.project(area,summary({pct:value}),percent);eq(r.pct,null);eq(r.label,'Percentage unconfirmed');eq(r.confirmedComplete,false);}
r=api.project(area,summary({done:0,total:0,pct:null}),percent);eq(r.pct,null);eq(r.confirmedComplete,false);eq(r.left,0);
r=api.project(area,summary({done:0,pct:0}),percent);eq(r.pct,0);eq(r.label,'0%');eq(r.confirmedComplete,false);
r=api.project(area,summary({done:1000,pct:100},{ready:false}),percent);eq(r.pct,null);eq(r.done,null);eq(r.total,null);eq(r.confirmedComplete,false);
r=api.project(area,summary({pct:99.999,pctKind:'lower-bound'}),percent);eq(r.pct,99.99);eq(r.label,'≥99.99%');eq(r.confirmedComplete,false);
for(const pctKind of ['provisional-scope','recorded-scope']){r=api.project(area,summary({done:1000,pct:100,pctKind}),percent);eq(r.label,'100% · provisional scope');eq(r.confirmedComplete,false);}
r=api.project(area,summary({done:1000,pct:100,reviewQuantity:1}),percent);eq(r.confirmedComplete,false);
r=api.project(area,summary({done:1000,pct:100,unquantifiedRefs:1}),percent);eq(r.confirmedComplete,false);
r=api.project({...area,shortConflictRefs:1},summary({done:1000,pct:100}),percent);eq(r.confirmedComplete,false);
r=api.project({...area,missing:true},summary({done:1000,pct:100}),percent);eq(r.confirmedComplete,false);
// The qualified plan scope controls the reading, independently of raw register scope.
r=api.project({...area,total:7,done:7,pct:100},summary({total:6,done:5,pct:83.33333333333333,scopeNote960:'Qualified plan scope'}),percent);
eq(r.total,6);eq(r.done,5);eq(r.pct,83.33);eq(r.basis,'Qualified plan scope');eq(r.confirmedComplete,false);
const input=summary();const before=JSON.stringify([area,input]);api.project(area,input,percent);eq(JSON.stringify([area,input]),before);
const known=api.project(area,summary(),percent),unknown=api.project(area,summary({pct:null}),percent);
const f={progress1103:known,unit:'units',total:3,complete:2,reached:false};
eq(api.summaryText(f),'999 of 1000 units complete');eq(api.unitsText(f),'999 of 1000 units done · 1 left');
eq(api.remainingText(f),'1 reference to go');
eq(api.remainingText({...f,complete:3}),'1 units to go');
eq(api.remainingText({...f,reached:true}),'complete');
for(const progress1103 of [undefined,unknown]){
 const u={...f,progress1103,complete:3};eq(api.summaryText(u),'Completion quantity unconfirmed');eq(api.unitsText(u),'Completion quantity unconfirmed');eq(api.remainingText(u),'completion unconfirmed');
}
const allUnits={...f,complete:3,progress1103:api.project(area,summary({done:1000,pct:100,pctKind:'provisional-scope'}),percent)};
eq(api.remainingText(allUnits),'completion not verified');
eq(api.unitsText({...f,unit:'<synthetic>'}),'999 of 1000 <synthetic> done · 1 left');
console.log(JSON.stringify({checks,passed:checks,syntheticOnly:true,recordWrites:0}));
