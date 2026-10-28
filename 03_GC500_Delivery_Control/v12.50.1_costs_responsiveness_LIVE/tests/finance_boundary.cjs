/* Author: Andrew Fisher. Source-extracted Finance/public-branch differential controls. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');
const plain=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
function make(file){
 const text=fs.readFileSync(file,'utf8'),apiStart=text.indexOf('/* Author: Andrew Fisher. Allocation view only; preserves every combined ledger amount. */'),end=text.indexOf('</script>',apiStart);
 assert(apiStart>0&&end>apiStart);const code=text.slice(apiStart,end),cfg={delta:0,error:null},trace=[],held=[];
 const B=()=>[{code:'STPS',total:11+cfg.delta}];
 const M=()=>Object.defineProperty({},'charge',{get(){trace.push('c');return{};}});
 const s={cfg,trace,held,console,Map,Math,Number,Object,Array,JSON,pl760BranchTable(){},renderCosts(){},
  fh866Model(){trace.push('H');const H=freeze({costs:[{kind:'fencing',stream:'Fence',toDate:5+cfg.delta,toCome:2,job:7+cfg.delta,by:{STPS:7+cfg.delta},pos:['fixture']}],inv:[{branch:'STPS',billed:3}],invTotal:{onRecord:999,job:999},qualifications:['fixture unresolved']});held.push(H);return H;},
  pl770Model(){trace.push('P');if(cfg.error==='P')throw Error('P stopped');return{revNow:11+cfg.delta,revJob:21+cfg.delta,costNow:5+cfg.delta,costJob:7+cfg.delta,wages:{toDate:2,job:3}};},
  cj764Model(){trace.push('X');if(cfg.error==='X')throw Error('X stopped');return{rows:[],buildingTransport:{rows:[]},fencing:{revenue:0},revenue:{transportToCome:3}};},
  transport888Core(){trace.push('T');return{weights:{toDate:{}}};},labourPlan(){trace.push('LP');return{slots:[]};},
  pl760FencingBranch:()=> 'STPS',pl760ToiletBranch:()=> 'KINP',pl760FencingByBranch:()=>({}),
  fh866Split:(n,w)=>Object.fromEntries(Object.keys(w).map(k=>[k,n])),peeHireForecast979:()=>({remainingAmount:0}),
  FinanceRequest996:{model:()=>({rows:[]})},generatorForecastRows1004:()=>[],pricingForecast1010:()=>({rows:[]}),additionalHire1013:()=>({remainingAmount:0}),
  pl760Ticks:()=>({byBranch:{}}),scopeBranchAllocation978:()=>[],manualChargeBranches1016:()=>[],
  pl752Rows(){trace.push('B');return B();},moneySummary(){trace.push('M');return M();}
 };
 s.window=s;vm.createContext(s);vm.runInContext(code,s);s.args=()=>[B(),M()];return s;
}
const checks=[];function check(name,fn){fn();checks.push(name);}
const A=make(process.env.BASE),B=make(process.env.CANDIDATE);
check('public branches preserve complete output and native read order',()=>{
 for(const s of[A,B])s.trace.length=0;
 assert.deepEqual(plain(B.branchFinancial978(...B.args())),plain(A.branchFinancial978(...A.args())));
 assert.deepEqual(B.trace,A.trace);assert.deepEqual(B.trace.slice(0,6),['P','X','c','H','T','LP']);
});
check('public extra arguments remain ignored and every call is fresh',()=>{
 for(const s of[A,B]){s.trace.length=0;const first=s.branchFinancial978.apply({fixtureReceiver:true},[...s.args(),{costs:[]}]);const second=s.branchFinancial978(...s.args());assert.deepEqual(plain(first),plain(second));assert.notEqual(first,second);assert.equal(s.trace.filter(x=>x==='H').length,2);}
});
check('outer Finance keeps full output and genuine false invoice checks',()=>{
 for(const s of[A,B])s.trace.length=0;
 const a=A.fh866Model(),b=B.fh866Model();assert.deepEqual(plain(b),plain(a));assert.equal(a.invCheck.record,false);assert.equal(a.invCheck.job,false);assert.deepEqual(B.trace,A.trace.filter((x,i)=>!(x==='H'&&i>0)));
 assert.equal(A.trace.filter(x=>x==='H').length,2);assert.equal(B.trace.filter(x=>x==='H').length,1);
});
check('branch helper does not mutate frozen Finance inputs',()=>{
 for(const s of[A,B]){const before=s.held.map(plain);s.fh866Model();for(let n=0;n<before.length;n++)assert.deepEqual(plain(s.held[n]),before[n]);assert(s.held.every(h=>Object.isFrozen(h)&&Object.isFrozen(h.costs)&&Object.isFrozen(h.costs[0].by)));}
});
check('no supplied Finance result survives to the next public call',()=>{
 for(const s of[A,B])s.cfg.delta=7;
 assert.deepEqual(plain(B.fh866Model()),plain(A.fh866Model()));assert.deepEqual(plain(B.branchFinancial978(...B.args())),plain(A.branchFinancial978(...A.args())));
 const b=B.branchFinancial978(...B.args());b.rows[0].cost=-5;assert.deepEqual(plain(B.branchFinancial978(...B.args())),plain(A.branchFinancial978(...A.args())));
});
check('throwing earlier readers retains native call order and avoids Finance read',()=>{
 for(const fail of['P','X']){for(const s of[A,B]){s.cfg.error=fail;s.trace.length=0;assert.throws(()=>s.branchFinancial978(...s.args()),new RegExp(fail+' stopped'));assert(!s.trace.includes('H'));}assert.deepEqual(B.trace,A.trace);}
});
for(const s of[A,B])s.cfg.error=null;
const result={author:'Andrew Fisher',passed:checks.length,checks};
if(process.env.OUT){fs.mkdirSync(process.env.OUT,{recursive:true});fs.writeFileSync(path.join(process.env.OUT,'finance-boundary.json'),JSON.stringify(result,null,2)+'\n');}
console.log(JSON.stringify(result));
