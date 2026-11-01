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
fixture.transportEstimate.legs = [
 {group:'nov_on_site',ref:'EQ1001',what:'Synthetic item one',date:'2026-11',kind:'pick-up',branch:'KINP',loads:1,rate:1.23,amount:1.23,rate_source:'synthetic rate'},
 {group:'nov_on_site',ref:'EQ1002',what:'Synthetic item two',date:'2026-11-12',kind:'pick-up',branch:'KINP',loads:1,rate:2.34,amount:2.34,rate_source:'synthetic rate'},
 {group:'oct_ran',ref:'EQ1003',what:'Synthetic item three',date:'2026-10-08',kind:'pick-up',branch:'KINP',loads:1,rate:3.45,amount:3.45,rate_source:'synthetic rate'}
];
Object.assign(fixture.transportEstimate,{ranBy31Oct:3.45,stillOnSite:3.57,byBranch:{ranBy31Oct:{KINP:3.45},stillOnSite:{KINP:3.57}}});
const before=JSON.stringify(fixture);
const doc={nodes:{'plx-sum':{innerHTML:''},'plx-out':{innerHTML:''}},getElementById(id){return this.nodes[id]||null;}};
let src=fs.readFileSync(moduleFile,'utf8').replace('__PLF1272_DATA__',()=>JSON.stringify(fixture)).replace('/*__PLF1279_FIND__*/',()=>fs.readFileSync(finderFile,'utf8'));
src=src.replace('return {data: DATA, sha: SHA, html: html, wrap: wrap, bind: bind, f2: f2};','return {data:DATA,format:function(x){return estimateDay(x.date,x.group);},run:function(q,opts){Object.assign(XS,{q:q,br:"",cat:"",mo:""},opts||{});xRender();return {last:XLAST,html:D.nodes["plx-sum"].innerHTML+D.nodes["plx-out"].innerHTML,csvRows:xRows()};}};');
const ctx={window:{},document:doc,console};vm.createContext(ctx);vm.runInContext(src,ctx);const api=ctx.PLF1272;
const checks=[],failures=[];
function check(name,fn){try{fn();checks.push({name,pass:true});}catch(e){checks.push({name,pass:false});failures.push({name,error:e.message});}}
const may=api.run('24 Nov',{}),scheduled=api.run('12 Nov',{}),actual=api.run('8 Oct',{}),month=api.run('pick-ups',{mo:'Nov'}),ref=api.run('EQ1001',{mo:'Nov'});
check('placeholder day has no estimate leg',()=>assert.equal(may.last.rows.filter(x=>x.group==='Transport estimate legs').length,0));
check('scheduled date retains exactly its own leg',()=>assert.deepEqual(scheduled.last.rows.filter(x=>x.group==='Transport estimate legs').map(x=>x.item.split(' · ')[0]),['EQ1002']));
check('scheduled date qualified in answer detail',()=>assert(scheduled.last.rows.some(x=>x.detail.includes('12 Nov scheduled'))));
check('recorded October date retained',()=>assert(actual.last.rows.some(x=>x.item.startsWith('EQ1003')&&x.detail.includes('8 Oct')&&!x.detail.includes('scheduled'))));
check('month query retains both forecast legs',()=>assert.equal(month.last.rows.filter(x=>x.group==='Still on site').length,2));
check('forecast month amount retained',()=>assert.equal(month.last.kpis.find(x=>x.label==='Transport estimate').v,'3.57'));
check('reference query month retains row',()=>assert(ref.last.rows.some(x=>x.item.startsWith('EQ1001'))));
check('reference date shows month precision',()=>assert.match(ref.last.ans,/Nov forecast/));
check('export month text',()=>assert(month.csvRows.some(x=>x.some(y=>String(y).includes('Nov forecast')))));
check('export scheduled qualifier',()=>assert(scheduled.csvRows.some(x=>x.some(y=>String(y).includes('12 Nov scheduled')))));
check('no export assigns placeholder pickup day',()=>assert(!month.csvRows.flat().some(x=>String(x).includes('24 Nov'))));
check('app month formatter',()=>assert.equal(api.format(fixture.transportEstimate.legs[0]),'Nov forecast'));
check('app scheduled formatter',()=>assert.equal(api.format(fixture.transportEstimate.legs[1]),'12 Nov 2026 scheduled'));
check('app actual formatter',()=>assert.equal(api.format(fixture.transportEstimate.legs[2]),'8 Oct 2026'));
check('data unchanged',()=>assert.equal(JSON.stringify(api.data),before));
console.log(JSON.stringify({tests:checks.length,passed:checks.length-failures.length,failures},null,2));process.exitCode=failures.length?1:0;
