/* Author: Andrew Fisher. Synthetic-only regression fixture: no operational figures or people. */
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const path=require('path');
const moduleFile=process.argv[2];
const finderFile=process.argv[3];
if(!moduleFile || !finderFile) throw new Error('Usage: node check_finder_scope.cjs /path/plf1279_src.js /path/plf1279_find.js');
const row=(who,kind,home,branch,sep,oct,paidSep,paidOct)=>({who,kind,type:kind,home,branch,sep,oct,paidSep,paidOct,normal:sep+oct,x15:1,x2:2,labourHire:0,journal:home===branch?'stays':home+' → '+branch,contract:''});
const fixture={asAt:'2026-10-31',basis:'SYNTHETIC TEST ONLY',pack:'synthetic',record:'synthetic',revenue:{invoices:0,novForecast:0,total:0},costs:{sep:1,oct:2,nov:3,total:6},accrue:5.5,
 categories:[{name:'Labour hire'},{name:'Salary allowance'},{name:'Accommodation'}],suppliers:[],branches:[],purchaseOrders:[],contracts:[],invoices:[],removedInvoices:[],novForecastLines:[],notTied:[],noPO:[],open:[],branchLines:{},labourCharged:{lines:[]},labourHireBridge:[],schedule17:{changes:[],notes:[]},transportEstimate:{legs:[],moved:[],notIn:[]},
 labourJournal:[row('Worker A','Coates wages','HOME','KINP',11,18,12.5,20.75),row('Manager','Salary','KINP','KINP',4,8,4,8),row('Supplier C','Labour hire','KINP','STPS',5,7,5,7.5),row('Worker B','Coates wages','KINP','NVAC',0,3,0,3.25),row('Worker D','Coates wages','KINP','KINP',2,4,2,4)],
 lines:[{supplier:'Synthetic Supplier',what:'Synthetic cost',category:'Accommodation',account:'2126',branch:'KINP',sep:1,oct:2,nov:3,total:6,accrue:5.5,state:'Accrued at 31 Oct',po:'none',contract:'',invoice:'',status:'',basis:''}],facts:[[0,'KINP','Sep',100],[0,'KINP','Oct',200],[0,'KINP','Nov',300]],revFacts:[],
 journals:[{journal:'Accrual · Synthetic supplier',po:'none',contract:'',account:'2126',branch:'KINP',amount:5.5}],moves:[{journal:'Branch move · Synthetic move',po:'none',contract:'',account:'2126',branch:'KINP −1.00 · STPS +1.00',amount:1}],byAccount:[{code:'2126',name:'Rehire',total:6,holds:[]}]};
const before=JSON.stringify(fixture);
const doc={nodes:{'plx-sum':{innerHTML:''},'plx-out':{innerHTML:''}},getElementById(id){return this.nodes[id]||null;}};
let src=fs.readFileSync(moduleFile,'utf8').replace('__PLF1272_DATA__',()=>JSON.stringify(fixture)).replace('/*__PLF1279_FIND__*/',()=>fs.readFileSync(finderFile,'utf8'));
src=src.replace('return {data: DATA, sha: SHA, html: html, wrap: wrap, bind: bind, f2: f2};','return {data:DATA,run:function(q,opts){Object.assign(XS,{q:q,br:"",cat:"",mo:""},opts||{});xRender();return {last:XLAST,html:D.nodes["plx-sum"].innerHTML+D.nodes["plx-out"].innerHTML,csvRows:xRows()};}};');
const ctx={window:{},document:doc,console};vm.createContext(ctx);vm.runInContext(src,ctx);const api=ctx.PLF1272;
const failures=[];let tests=0;
function check(name,fn){tests++;try{fn();}catch(e){failures.push({name,message:e.message});}}
const sum=(rows)=>Math.round(rows.reduce((s,r)=>s+(r.h||0),0)*100)/100;
const hourRows=(r,pattern)=>r.last.rows.filter(x=>x.basis==='hours' && pattern.test(x.group));
// Fixed expected totals from the synthetic records, not production calculation helpers.
const expected={job:67,Sep:23.5,Oct:43.5,Nov:0};
const wages={job:42.5,Sep:14.5,Oct:28,Nov:0};
for(const mo of ['', 'Sep','Oct','Nov']){
 const r=api.run('overtime',{mo}),period=mo||'job';
 check('paid '+period,()=>assert.equal(sum(hourRows(r,/^Paid hours(?:: normal| ·)/)),expected[period]));
 check('kind subtotal '+period,()=>assert.equal(sum(hourRows(r,/^(?:By kind|Paid hours by kind)/)),expected[period]));
 check('CSV carries period '+period,()=>{if(mo==='Nov') assert.match(r.csvRows.find(x=>x[0]==='Answer')[1],/no hours are allocated separately to November/);else assert(r.csvRows.some(x=>/^Paid hours(?:: normal| ·)/.test(x[0]) && x[0].includes(mo==='Sep'?'September':mo==='Oct'?'October':'job end')));});
 const w=api.run('wages',{mo});
 check('wages '+period,()=>assert.equal(sum(hourRows(w,/^Coates wages:/)),wages[period]));
 check('wages branch subtotal '+period,()=>assert.equal(sum(hourRows(w,/^Paid hours by branch/)),wages[period]));
 const g=api.run('2126',{mo});
 check('GL preserves cents '+period,()=>assert.equal(g.last.kpis.find(x=>/^Costs on/.test(x.label)).v,(mo==='Sep'?'1.00':mo==='Oct'?'2.00':mo==='Nov'?'3.00':'6.00')));
 check('GL prepared register scope '+period,()=>assert(g.last.rows.filter(x=>/^Accrual journals/.test(x.group)).every(x=>/prepared through 31 Oct, all work months and categories/.test(x.group)&&x.c===550)));
}
check('Salary month uses own kind',()=>assert.equal(sum(hourRows(api.run('overtime',{mo:'Oct',cat:'Salary allowance'}),/^Paid hours(?:: normal| ·)/)),8));
check('Labour hire month uses own kind',()=>assert.equal(sum(hourRows(api.run('overtime',{mo:'Sep',cat:'Labour hire'}),/^Paid hours(?:: normal| ·)/)),5));
check('unrelated category has no labour hours',()=>assert.equal(sum(hourRows(api.run('overtime',{cat:'Accommodation'}),/^Paid hours(?:: normal| ·)/)),0));
check('wages not assigned to cost category',()=>{let r=api.run('wages',{cat:'Salary allowance'});assert.equal(sum(hourRows(r,/^Coates wages:/)),0);assert.match(r.last.ans,/not assigned to the selected cost category/);});
check('receiving branch restriction',()=>assert.equal(sum(hourRows(api.run('overtime',{mo:'Oct',br:'NVAC'}),/^Paid hours(?:: normal| ·)/)),3.25));
check('journaled September inbound own month',()=>assert.equal(sum(hourRows(api.run('journaled',{mo:'Sep',br:'KINP'}),/^Labour journaled into/)),12.5));
check('journaled October outbound own month',()=>assert.equal(sum(hourRows(api.run('journaled',{mo:'Oct',br:'KINP'}),/^Labour from/)),10.75));
check('journaled November no duplicated hours',()=>assert.equal(sum(hourRows(api.run('journaled',{mo:'Nov',br:'KINP'}),/^Labour/)),0));
check('journaled category only own kind',()=>assert.equal(sum(hourRows(api.run('journaled',{mo:'Oct',br:'KINP',cat:'Labour hire'}),/^Labour from/)),7.5));
check('journaled category leaves full registers explicit',()=>{let r=api.run('journaled',{mo:'Nov',cat:'Accommodation',br:'KINP'});assert.match(r.last.ans,/all work months and categories/);assert(r.last.rows.filter(x=>x.c!==null).every(x=>/all work months and categories/.test(x.group)));});
check('monthly bands not invented',()=>{let r=api.run('overtime',{mo:'Sep'});assert.match(r.last.ans,/does not split them by month/);assert(hourRows(r,/^Paid hours(?:: normal| ·)/).every(x=>/bands for the job, not split by month/.test(x.detail)));});
for(const [mo,pd,wk] of [['',33.25,29],['Sep',12.5,11],['Oct',20.75,18],['Nov',0,0]]) {
 check('person scope '+(mo||'job'),()=>{const r=api.run('Worker A',{mo});assert(r.last.ans.includes(wk.toFixed(2)+' worked h, '+pd.toFixed(2)+' paid h'));assert(r.last.ans.includes(mo==='Nov'?'November’s hours':mo==='Oct'?'October':mo==='Sep'?'September':'job end'));});
 check('home branch scope '+(mo||'job'),()=>{const r=api.run('HOME',{mo});assert.equal(sum(hourRows(r,/^Labour journals/)),pd);assert(r.last.ans.includes(mo==='Nov'?'no hours are allocated separately':'Paid hours for'));});
}
check('person category cannot borrow hours',()=>{const r=api.run('Worker A',{mo:'Oct',cat:'Salary allowance'});assert(!/20.75 paid h/.test(r.last.ans));});
check('person receiving branch cannot borrow hours',()=>{const r=api.run('Worker A',{mo:'Oct',br:'NVAC'});assert(!/20.75 paid h/.test(r.last.ans));});
check('home category cannot borrow hours',()=>assert.equal(sum(hourRows(api.run('HOME',{mo:'Oct',cat:'Accommodation'}),/^Labour journals/)),0));
check('home receiving branch cannot borrow hours',()=>assert.equal(sum(hourRows(api.run('HOME',{mo:'Oct',br:'NVAC'}),/^Labour journals/)),0));
check('DATA unchanged',()=>assert.equal(JSON.stringify(api.data),before));
console.log(JSON.stringify({tests,passed:tests-failures.length,failed:failures.length,failures},null,2));process.exitCode=failures.length?1:0;
