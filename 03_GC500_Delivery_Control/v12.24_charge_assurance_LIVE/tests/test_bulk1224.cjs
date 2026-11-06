// Author: Andrew Fisher. Shared service prices, categories and unchanged source records.
'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
assert(process.env.PAGE,'PAGE must identify the patched candidate');
const html=fs.readFileSync(process.env.PAGE,'utf8');
let checks=0;const check=(name,fn)=>{fn();checks++;console.log('PASS '+name);};
const section=(from,to)=>{const a=html.indexOf(from),b=html.indexOf(to,a);assert(a>=0&&b>a,from);return html.slice(a,b);};
const data=text=>{const a=text.indexOf('const DATA = ')+13,b=text.indexOf('\n',a);return JSON.parse(text.slice(a,b).trim().replace(/;$/,''));};
let typed=null,treatment=null;
const ctx=vm.createContext({console,CONTRACT_DAILY_KINDS:new Set(),STREAM_OF_KIND:{building:'buildings'},
 contractTreatment747:()=>treatment,contractCardCorrection1224:r=>r,lr748Typed:()=>typed,
 money:n=>'$'+n.toFixed(2),contractBillingQuantity1010:r=>r.quantity,generatorBranch1004:r=>r.branch_code,
 finance928ContractOwner:()=>({rehire:false})});
vm.runInContext(section('/* contract-service1224:','function contractCharge_747('),ctx);
vm.runInContext(section('function contractCharge_747(','/* WHAT THE CONTRACTS HOLD, PER BRANCH.'),ctx);
ctx.contractCharge=ctx.contractCharge_747;
vm.runInContext(section('function contractFigures(','function contractRowsByBranch('),ctx);
vm.runInContext(section('function pl752Rows(','/* the sub-hired locations recorded'),ctx);
const charge=(line,category,price,quantity=1,branch='BR-A')=>({rental_contract:'FIXTURE',line,branch_code:branch,
 item:category==='installation'?'LABOUR':'TRANSPORT',kind:category,family:category,charge_line:true,
 sales_analysis_code:branch+(category==='installation'?'-INS':'-FRI'),price,quantity,subhired:false,
 description:'Synthetic combined service',sourceAddition1224:{scope:'fixture-scope',combined:true}});
const installation=charge(1,'installation',41.23),transport=charge(2,'transport',19.875,2),
 otherTransport=charge(3,'transport',12.50,2,'BR-B'),plant={rental_contract:'FIXTURE',line:4,branch_code:'BR-A',item:'BUILDING',kind:'building',family:'building',quantity:1,rate_1:80,charge_line:false};
ctx.ONHIRE_ROWS=[installation,transport,otherTransport,plant];
check('one existing price reader multiplies quantity and rounds once',()=>{
 const before=JSON.stringify(ctx.ONHIRE_ROWS);assert.equal(ctx.contractCharge(installation).amount,41.23);
 assert.equal(ctx.contractCharge(transport).amount,39.75);assert.equal(ctx.contractCharge(otherTransport).amount,25);
 assert.equal(JSON.stringify(ctx.ONHIRE_ROWS),before);assert.equal(ctx.contractCharge(transport).category1224,'transport');
});
check('legacy charge calculations and returned shape are preserved',()=>{
 const r={...transport};delete r.sourceAddition1224;typed=999;
 const c=ctx.contractCharge(r);assert.equal(c.amount,39.75);assert.equal(c.category1224,undefined);assert.equal(c.filled,undefined);
 assert.equal(c.basis,'a transport or delivery charge line — the price on it × 2 is the charge');typed=null;
});
check('recorded source-line override including zero remains authoritative',()=>{
 for(const n of [0,7.125,26]){typed=n;const c=ctx.contractCharge(transport);assert.equal(c.amount,Math.round(n*2*100)/100);assert.equal(c.filled,'typed');}
 typed=null;
});
check('existing treatment precedes the source price and native override',()=>{
 typed=18;treatment={kind:'included',label:'Included',basis:'Existing decision'};
 const c=ctx.contractCharge(transport);assert.equal(c.amount,0);assert.equal(c.treatment,'included');assert.equal(c.category1224,undefined);
 typed=null;treatment=null;
});
check('source status is not treated as physical completion or source exclusion',()=>{
 for(const status of ['Pending','Delivered']){const r={...installation,status_as_written:status,delivered:false};assert.equal(ctx.contractCharge(r).amount,41.23);assert.equal(r.delivered,false);}
});
check('unknown source price stays unknown rather than free',()=>{
 const c=ctx.contractCharge({...transport,price:null});assert.equal(c.amount,null);assert.match(c.basis,/no price/);
});
check('contract rollup counts installation once outside transport and plant',()=>{
 const m=ctx.contractFigures(ctx.ONHIRE_ROWS);assert.equal(m.charge,185.98);assert.equal(m.installation.charge,41.23);
 assert.equal(m.transport.charge,64.75);assert.equal(m.plant.charge,80);assert.equal(m.installation.lines,1);assert.equal(m.transport.lines,2);
});
check('branch totals preserve original branches and correct charge categories',()=>{
 const m=ctx.pl752Rows(),a=m.find(r=>r.code==='BR-A'),b=m.find(r=>r.code==='BR-B');
 assert.equal(a.total,160.98);assert.equal(a.transport,39.75);assert.equal(a.installation1224,41.23);assert.equal(a.contract,121.23);
 assert.equal(b.total,25);assert.equal(b.transport,25);assert.equal(m.reduce((n,r)=>n+r.total,0),185.98);
});
check('stream classifier uses the same source category and preserves ordinary hire',()=>{
 assert.equal(ctx.contractChargeStream1224(installation),'crew');assert.equal(ctx.contractChargeStream1224(transport),'transport');
 assert.equal(ctx.contractChargeStream1224(plant),'buildings');
 assert.equal(ctx.contractChargeCategory1224({...installation,subhired:true}),null);
});
check('miscellaneous source service is known revenue with its ledger still unallocated',()=>{
 const service={...charge(5,'service',7.55,1,'BR-C'),item:'MISC',sales_analysis_code:'BR-C-MIS'},before=ctx.ONHIRE_ROWS;
 ctx.ONHIRE_ROWS=before.concat([service]);
 assert.equal(ctx.contractChargeCategory1224(service),'service');assert.equal(ctx.contractChargeStream1224(service),'other');
 const c=ctx.contractFigures(ctx.ONHIRE_ROWS),b=ctx.pl752Rows().find(r=>r.code==='BR-C');
 assert.equal(c.charge,193.53);assert.equal(c.services.charge,7.55);assert.equal(c.transport.charge,64.75);assert.equal(c.installation.charge,41.23);
 assert.equal(b.total,7.55);assert.equal(b.contract,7.55);assert.equal(b.transport,0);assert.equal(b.services1224,7.55);
 const s=section(' if(n(c.contractServices1224))rev.push('," if (raceUnallocated) rev.push({key: 'event_support',");
 const context=vm.createContext({c:{contractServices1224:7.55},n:x=>Number(x)||0,r2:x=>Math.round(x*100)/100,rev:[]});vm.runInContext(s,context);
 assert.equal(context.rev.length,1);assert.equal(context.rev[0].now,7.55);assert.equal(context.rev[0].job,7.55);assert.equal(context.rev[0].code,'—');assert.match(context.rev[0].line,/ledger allocation pending/);
 ctx.ONHIRE_ROWS=before;
});
check('branch source details disclose installation and miscellaneous service separately',()=>{
 Object.assign(ctx,{contractCoverage747:()=>false,contractCoverageHtml747:()=>'',esc:String,contractItemWords:r=>r.contract+' line '+r.line+' '+r.charge});
 vm.runInContext(section('function contractPlateNote(c){','function dsnBranches('),ctx);
 const service={...charge(5,'service',7.55),item:'MISC',sales_analysis_code:'BR-A-MIS'};
 const text=ctx.contractPlateNote(ctx.contractFigures([installation,transport,service]));
 assert.match(text,/Contract installation:/);assert.match(text,/Contract services — ledger allocation pending:/);assert.match(text,/Transport &amp; delivery:/);
 assert(text.includes('FIXTURE line 1 41.23'));assert(text.includes('FIXTURE line 5 7.55'));assert(text.includes('FIXTURE line 2 39.75'));
});
check('legacy contract summary labels every priced source category without changing its figure',()=>{
 const at=html.indexOf("${line('Charges priced on contracts',");assert(at>=0);
 const expression=html.slice(at+2,html.indexOf('\n',at)).trim().slice(0,-1);
 const c={contracts_lines:6,subhire:27.15,delivery:64.75,transportArrived1006:20,contractInstallation1224:41.23,contractServices1224:7.55};
 const env=vm.createContext({c,cardLines:1,onContracts:220.68,CONTRACT:'source-tag',esc:String,money0:n=>'$'+n.toFixed(2),m0:n=>'$'+n.toFixed(2),pl:(n,w)=>n+' '+w+(n===1?'':'s'),line:(label,sub,amount,tag)=>({label,sub,amount,tag})});
 const before=JSON.stringify(c),result=vm.runInContext(expression,env);
 assert.equal(result.label,'Charges priced on contracts');assert.equal(result.amount,'$220.68');assert.equal(result.tag,'source-tag');
 for(const words of ['5 lines','Rehire Revenue $27.15','Transport Revenue $44.75','Installation $41.23','Contract services $7.55 (ledger allocation pending)'])assert(result.sub.includes(words),words);
 assert(!result.sub.includes('Transport Revenue $64.75'));
 assert.equal(JSON.stringify(c),before);
 c.contractInstallation1224=0;c.contractServices1224=0;const noServices=vm.runInContext(expression,env);
 assert(!noServices.sub.includes('Installation'));assert(!noServices.sub.includes('ledger allocation pending'));assert.equal(noServices.amount,'$220.68');
 c.delivery=c.transportArrived1006;const noContractTransport=vm.runInContext(expression,env);
 assert(!noContractTransport.sub.includes('Transport Revenue'));assert.equal(noContractTransport.amount,'$220.68');
});
check('remaining rehire caption keeps the amount and covers non-fencing forecasts',()=>{
 const at=html.indexOf("${fin745Card('Rehire Revenue — to job end',");assert(at>=0);
 const expression=html.slice(at+2,html.indexOf('\n',at)).trim().slice(0,-1);
 const env=vm.createContext({T:{revJob:823.50,revToCome:123.50,share:0.4},R:{revenueJob:2058.75},esc:String,money0:n=>'$'+n.toFixed(2),pc:n=>(n*100)+'%',fin745Card:(title,value,caption)=>({title,value,caption})});
 const result=vm.runInContext(expression,env);
 assert.equal(result.value,'$823.50');assert(result.caption.includes('$123.50 still to come (remaining rehire forecast)'));assert(!result.caption.includes('fencing programme'));assert(result.caption.includes('40% of the $2058.75'));
});
check('bulk coverage exposes source proof without allocating money to a reference',()=>{
 const m=ctx.contractBulkCoverage1224('fixture-scope','installation');assert.equal(m.covered,true);assert.equal(m.items.length,1);
 assert.equal(m.items[0].amount,41.23);assert.equal(m.items[0].contract,'FIXTURE');assert.equal(m.items[0].line,1);
 assert.equal(m.items[0].ref,undefined);assert.equal(m.amount,undefined);assert.match(m.basis,/no per-reference/);
 assert.equal(ctx.contractBulkCoverage1224('missing','transport').covered,false);
});
check('unknown bulk charge is a review and an existing treatment remains visible',()=>{
 const before=ctx.ONHIRE_ROWS;ctx.ONHIRE_ROWS=[{...transport,price:null}];assert.equal(ctx.contractBulkCoverage1224('fixture-scope','transport').covered,false);
 ctx.ONHIRE_ROWS=before;treatment={kind:'included',label:'Included',basis:'Existing decision'};
 const m=ctx.contractBulkCoverage1224('fixture-scope','installation');assert.equal(m.covered,true);assert.equal(m.items[0].treatment,'included');assert.equal(m.items[0].amount,0);treatment=null;
});
check('ledger routing moves installation out of hire without another total',()=>{
 assert(html.includes('- n(c.contractInstallation1224) - n(c.contractServices1224) - rehireLines + fire)'));
 assert(html.includes('install = r2(labour - fire - cleaning + (racePeople || 0) + n(c.contractInstallation1224));'));
 const c={contracts:193.53,delivery:64.75,contractInstallation1224:41.23,contractServices1224:7.55};
 const hire=Math.round((c.contracts-c.delivery-c.contractInstallation1224-c.contractServices1224)*100)/100;
 assert.equal(hire,80);assert.equal(Math.round((hire+c.delivery+c.contractInstallation1224+c.contractServices1224)*100)/100,193.53);
});
check('existing full reconciliation includes source installation in its labour tie',()=>{
 const amount=41.23,m={charge:{total:amount,contractInstallation1224:amount,labour:0,delivery:0,race:{people_amount:0}},cost:{known:0,transport:{amount:0}},categories:[]};
 const x={revenue:{record:amount,job:amount,transportToCome:0},rows:[{stream:'Transport',toDate:0,toCome:0}],known:0,job:0,wages:{job:0}};
 const p={revNow:amount,revJob:amount,costNow:0,costJob:0,cost:[{key:'transport',now:0,job:0}],rev:[{key:'install',job:amount},{key:'transport',now:0,job:0}]};
 Object.assign(ctx,{moneySummary:()=>m,cj764Model:()=>x,pl770Model:()=>p,
  fh866Model:()=>({invTotal:{onRecord:amount,job:amount},costTotal:{job:0},costs:[{kind:'transport',toDate:0,toCome:0,by:{}}],inv:[],demob:[],transportForecast978:0}),
  transport888Core:()=>({rows:[],schedT:{refs:0},demob:{total:0}}),
  transport888View:()=>({tot:{actual:0,toCome:0,job:0,provisional:0},revenueTotal:0,plan:[]}),
  buildingTransportModel831:()=>({byBranch:[]}),pl752Rows:()=>[],labourRevenue858:()=>({job:0}),pl760Ticks:()=>({total:0}),
  allAssets:()=>[],rowOff:()=>false,programmeDays:()=>[],DATA:{transport:{carrier:{loads:[]}}}});
 vm.runInContext(section('function recon888Model(){','function moneySummary_('),ctx);
 const result=ctx.recon888Model(),tie=result.ties.find(t=>/Labour we charge/.test(t.what));
 assert(tie);assert.equal(tie.ok,true);assert.deepEqual(Array.from(tie.parts,x=>x.v),[amount,amount]);assert.equal(result.bad,0);
});
check('combined scope keeps work month unresolved instead of fabricating a date split',()=>{
 const source=section(" if (r.charge_line) {\n if(r.sourceAddition1224){",' const pickup = /pick[ -]?up|collect|return|demob/i.test(what);');
 assert(source.includes('return unallocated('));assert(source.includes('combined contract scope has no confirmed split by work month'));
 assert(source.includes("kind==='installation'?'Labour Install':kind==='service'?"));assert(source.includes('ledger allocation pending'));assert(!source.includes('start_date'));assert(!source.includes('amount/2'));
});
check('canonical source additions have distinct line keys and no operational status inferred',()=>{
 const o=data(html).rental_on_hire,added=o.rows.filter(r=>r.sourceAddition1224),keys=o.rows.map(r=>r.rental_contract+'|'+r.line);
 assert.equal(added.length,5);assert.equal(new Set(keys).size,keys.length);
 for(const r of added){assert.equal(r.delivered,false);assert.equal(r.start_date,null);assert.equal(r.demob_date,null);assert.equal(r.asset_no_is_plant_number,false);assert.equal(r.match.key,null);assert.equal(r.match.to,null);assert.equal(r.charge_line,true);assert(r.sourceAddition1224.source.startsWith('review_'));}
 assert.deepEqual(added.map(r=>r.sourceAddition1224.row).sort((a,b)=>a-b),o.source_additions1224.rows.slice().sort((a,b)=>a-b));
});
if(process.env.BASE_PAGE)check('all existing contract source rows and unrelated source data are unchanged',()=>{
 const previous=data(fs.readFileSync(process.env.BASE_PAGE,'utf8')),next=data(html),a=previous.rental_on_hire,b=next.rental_on_hire;
 assert.deepEqual(b.rows.slice(0,a.rows.length),a.rows);assert.equal(b.rows.length,a.rows.length+5);
 for(const k of Object.keys(previous))if(k!=='rental_on_hire')assert.deepEqual(next[k],previous[k],k);
 for(const k of Object.keys(a))if(!['rows','contracts','contracts_count1026','summary'].includes(k))assert.deepEqual(b[k],a[k],k);
 for(const c of a.contracts){const n=b.contracts.find(x=>x.rental_contract===c.rental_contract),add=b.rows.slice(a.rows.length).filter(r=>r.rental_contract===c.rental_contract);if(!add.length)assert.deepEqual(n,c);else{assert.equal(n.lines,c.lines+add.length);for(const k of Object.keys(c))if(!['lines','start_dates'].includes(k))assert.deepEqual(n[k],c[k],k);}}
});
console.log(JSON.stringify({passed:checks,failed:0,record_writes:0,network:false}));
