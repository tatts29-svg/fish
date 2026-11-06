// Author: Andrew Fisher. Synthetic checks of dimensional safety and unknown/range handling.
const fs=require('fs'),vm=require('vm'),assert=require('assert');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../progress881_model.js','utf8'),c);
let n=0;const check=(name,fn)=>{fn();console.log('PASS '+name);n++;};
const ids=['buildings','toilets','generators','lighting','vms','equipment'];
const make=(pct,total=1)=>({health:{ready:true},byId:Object.fromEntries(ids.map(id=>[id,{pct,pctKind:'confirmed',total,done:total*pct/100,left:total*(1-pct/100)}]))});
const f=pct=>({state:'ready',pct:{min:pct,max:pct},provisional:false,total:100000,credited:100000*pct/100});
check('seven equally weighted groups',()=>assert.equal(c.progress881Model('2026-10-07',make(50),f(50)).pct.min,50));
check('quantity scale cannot alter index',()=>assert.equal(c.progress881Model('',make(50,900000),f(50)).pct.min,50));
check('fencing contributes one seventh',()=>assert.equal(c.progress881Model('',make(0),f(70)).pct.min,10));
check('missing group is not dropped',()=>{const s=make(50);delete s.byId.toilets;assert.equal(c.progress881Model('',s,f(50)).ready,false)});
check('unavailable fence is not guessed',()=>assert.equal(c.progress881Model('',make(50),{state:'unconfirmed'}).pct,null));
check('range is propagated',()=>{const fence=f(40);fence.pct.max=75;fence.provisional=true;const m=c.progress881Model('',make(50),fence);assert.equal(m.pct.max-m.pct.min,5);assert.equal(m.allGreen,false)});
check('lower bound cannot masquerade as exact',()=>{const s=make(50);s.byId.toilets.pctKind='lower-bound';const m=c.progress881Model('',s,f(50));assert(m.pct.max>m.pct.min)});
check('all green requires known full index',()=>assert.equal(c.progress881Model('',make(100),f(100)).allGreen,true));
check('incomplete red milestones stop below five',()=>{const m=c.progress881Model('',make(99),f(99));assert.equal(m.reached,4);assert.equal(m.allGreen,false)});
check('stale records prevent all-go',()=>{const s=make(100);s.health.stale=true;assert.equal(c.progress881Model('',s,f(100)).allGreen,false)});
check('invalid numeric values cannot populate index',()=>{const s=make(50);s.byId.vms.pct=NaN;assert.equal(c.progress881Model('',s,f(50)).ready,false)});
check('loading record remains unavailable',()=>{const s=make(100);s.health.ready=false;assert.equal(c.progress881Model('',s,f(100)).pct,null)});
console.log(n+'/12 passed');
