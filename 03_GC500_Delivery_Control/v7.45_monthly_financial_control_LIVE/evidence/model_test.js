/* Author: Andrew Fisher. Pure in-memory model tests; no network or live-record writes. */
'use strict';
const fs = require('fs'), vm = require('vm'), assert = require('assert');
const source = fs.readFileSync(require('path').join(__dirname, '..', 'finance745_model.js'), 'utf8');
const ctx = vm.createContext({console});
vm.runInContext(`
var S = {finance745: {}, runRules: {}, untouched: {value: 7}};
var lines = [
 {id:'P1',kind:'person',person:'Alex',type:'Salary',pay_rate:40,usable:true},
 {id:'P2',kind:'person',person:'Blair',type:'Internal CNA',pay_rate:'',usable:true},
 {id:'A1',kind:'labour',person:'Alex',date:'2026-09-29',hours:8,usable:true},
 {id:'A2',kind:'labour',person:'Alex',date:'2026-10-01',hours:6,usable:true},
 {id:'B1',kind:'labour',person:'Blair',date:'2026-09-29',hours:4,usable:true}
];
var writeAllowed=true, saveWorks=true, saveCount=0;
function ourCosts(){return lines;}
function runType(t){return /salary/i.test(t)?'salary':/cna/i.test(t)?'cna':/hire|external/i.test(t)?'hire':'';}
function runHours(c){return c.paid==null?c.hours:c.paid;}
function runWorked(c){return c.worked==null?c.hours:c.worked;}
function splitHoursFor(h){return {ordinary:Math.min(h,8),at_1_5:Math.max(h-8,0),at_2:0};}
function runRateOf(p){return p.pay_rate===''||p.pay_rate==null?null:Number(p.pay_rate);}
function runPay(s,r){return r==null?null:Math.round((s.ordinary+s.at_1_5*1.5+s.at_2*2)*r*100)/100;}
function todayIso(){return '2026-09-30';}
function mayWrite(){return writeAllowed;}
function whoAmI(){return 'Andrew Fisher';}
function stampIt(f,k,w){S.stamps=S.stamps||{};S.by=S.by||{};S.stamps[f+'/'+k]='now';S.by[f+'/'+k]=w;}
function save(){S.saved='new';S.changes=(S.changes||0)+1;saveCount++;return saveWorks;}
`, ctx);
vm.runInContext(source, ctx);
let count = 0;
function test(name, expression) { assert.strictEqual(vm.runInContext(expression, ctx), true, name); count++; }
test('three usable shifts', 'fin745Rows().length === 3');
test('past is not assumed actual', "fin745Rows().find(r=>r.id==='A1').status === 'unconfirmed'");
test('future is forecast', "fin745Rows().find(r=>r.id==='A2').status === 'forecast'");
test('unknown rate is not zero', "fin745Rows().find(r=>r.id==='B1').calculatedCost === null");
test('known subtotal and unknown hours', 'fin745Summary().expectedCost===560 && fin745Summary().unpricedHours===4 && !fin745Summary().complete');
vm.runInContext(`function review(id, values){var row=fin745Rows().find(r=>r.id===id),old=fin745Latest('review',id);return fin745Save('review',id,Object.assign({confirmed:true,fingerprint:row.fingerprint,actualCost:null,allocation:'needed',evidence:''},values),old?old.id:null);}`, ctx);
test('future confirmation refused', "review('A2').ok === false");
test('explicit cost needs evidence', "review('A1',{actualCost:0}).ok === false");
test('allocation marker needs evidence', "review('A1',{allocation:'allocated'}).ok === false");
test('confirm hours without inventing cost', "review('A1').ok === true && fin745Rows().find(r=>r.id==='A1').actualCost === null");
test('confirmed hours subtotal', 'fin745Summary().confirmedHours===8 && fin745Summary().actualCostCount===0');
test('explicit zero remains actual zero', "review('A1',{actualCost:0,evidence:'Payroll correction 123'}).ok && fin745Summary().actualCostCount===1 && fin745Summary().actualCost===0 && fin745Summary().expectedCost===240");
test('history append only', "fin745History('review','A1').length===2");
test('stale edit refused', "!fin745Save('review','A1',fin745Latest('review','A1').payload,null).ok");
test('missing expected revision refused', "!fin745Save('billing','2026-09',{expectedMonth:'2026-10',reason:'Approved billing delay'}).ok");
test('later billing needs reason', "!fin745Save('billing','2026-09',{expectedMonth:'2026-10',reason:''},null).ok");
test('billing month recorded without amounts', "fin745Save('billing','2026-09',{expectedMonth:'2026-10',reason:'Client billing deferred'},null).ok");
test('changed hours invalidate actual', "lines.find(c=>c.id==='A1').hours=7; fin745Rows().find(r=>r.id==='A1').status==='changed' && fin745Rows().find(r=>r.id==='A1').actualCost===null");
test('changed review preserved', "fin745History('review','A1').length===2 && fin745Latest('review','A1').payload.snapshot.paid===8");
test('stale fingerprint refused', "!fin745Save('review','A1',fin745Latest('review','A1').payload,fin745Latest('review','A1').id).ok");
test('reconfirm revised hours', "review('A1',{actualCost:280,evidence:'Payroll September #123'}).ok");
test('rate basis required', "!fin745Save('rate','Blair',{rate:35,basis:''},null).ok");
test('valid rate adds forecast cost', "fin745Save('rate','Blair',{rate:35,basis:'Finance approved hourly cost, September 2026'},null).ok && fin745Rows().find(r=>r.id==='B1').calculatedCost===140");
test('rate does not mutate source', "lines.find(c=>c.id==='P2').pay_rate===''");
vm.runInContext(`function journal(key,patch){var old=fin745Latest('journal',key);return fin745Save('journal',key,Object.assign({type:'allocation',workMonth:'2026-09',postingMonth:'2026-10',reversalMonth:'',amount:280,sourceIds:['A1'],evidence:'Payroll September #123',debit:'Installation labour',credit:'Salary clearing',status:'draft',approvedBy:'',externalRef:'',linkedJournal:'',note:''},patch),old?old.id:null);}`,ctx);
test('allocation proposal saves', "journal('J1').ok");
test('journal not in cost totals', 'fin745Summary().expectedCost===660');
test('duplicate allocation blocked', "!journal('J2').ok");
test('unconfirmed source allocation blocked', "!journal('J2',{sourceIds:['B1'],amount:140}).ok");
test('unknown source blocked', "!journal('J2',{sourceIds:['missing']}).ok");
test('work month mismatch blocked', "!journal('J2',{workMonth:'2026-10'}).ok");
test('approval reviewer required', "!journal('J1',{status:'approved'}).ok");
test('approval accounts required', "!journal('J1',{status:'approved',approvedBy:'Finance reviewer',debit:''}).ok");
test('posted ledger reference required', "!journal('J1',{status:'posted',approvedBy:'Finance reviewer'}).ok");
test('approved journal', "journal('J1',{status:'approved',approvedBy:'Finance reviewer'}).ok");
test('reversal cannot be posted before original', "!journal('EarlyR',{type:'reversal',linkedJournal:'J1',debit:'Salary clearing',credit:'Installation labour',status:'posted',approvedBy:'Finance reviewer',externalRef:'ERP-EARLY'}).ok");
test('posted journal', "journal('J1',{status:'posted',approvedBy:'Finance reviewer',externalRef:'ERP-JRN-123'}).ok");
test('posted amount immutable', "!journal('J1',{amount:300,status:'posted',approvedBy:'Finance reviewer',externalRef:'ERP-JRN-123'}).ok");
test('posted cannot void', "!journal('J1',{status:'void',approvedBy:'Finance reviewer',externalRef:'ERP-JRN-123'}).ok");
test('reversal must match amount', "!journal('R1',{type:'reversal',linkedJournal:'J1',amount:1,debit:'Salary clearing',credit:'Installation labour'}).ok");
test('reversal must reverse accounts', "!journal('R1',{type:'reversal',linkedJournal:'J1'}).ok");
test('reversal cannot precede original', "!journal('R1',{type:'reversal',linkedJournal:'J1',postingMonth:'2026-09',debit:'Salary clearing',credit:'Installation labour'}).ok");
test('valid reversal', "journal('R1',{type:'reversal',linkedJournal:'J1',debit:'Salary clearing',credit:'Installation labour'}).ok");
test('duplicate reversal blocked', "!journal('R2',{type:'reversal',linkedJournal:'J1',debit:'Salary clearing',credit:'Installation labour'}).ok");
test('draft reversal does not release allocation', "!journal('J2').ok&&!fin745JournalReversed(fin745Latest('journal','J1'))");
test('approved reversal does not release allocation', "journal('R1',{type:'reversal',linkedJournal:'J1',debit:'Salary clearing',credit:'Installation labour',status:'approved',approvedBy:'Finance reviewer'}).ok&&!journal('J2').ok");
test('posted reversal releases original allocation', "journal('R1',{type:'reversal',linkedJournal:'J1',debit:'Salary clearing',credit:'Installation labour',status:'posted',approvedBy:'Finance reviewer',externalRef:'ERP-REV-123'}).ok&&fin745JournalReversed(fin745Latest('journal','J1'))&&journal('J2').ok");
test('actual-cost revision flags existing journal', "review('A1',{actualCost:300,evidence:'Corrected payroll September #124'}).ok&&fin745JournalIssues(fin745Latest('journal','J1')).some(x=>x.includes('actual-cost'))");
test('stale draft cannot silently promote by refreshing snapshots', "!journal('J2',{status:'approved',approvedBy:'Finance reviewer'}).ok");
test('stale draft cannot silently enter review', "!journal('J2',{status:'review'}).ok");
test('fresh draft acknowledges current evidence', "journal('J2',{amount:300}).ok&&fin745Latest('journal','J2').payload.sourceSnapshots[0].actualCost===300");
test('fresh draft may then be approved', "journal('J2',{amount:300,status:'approved',approvedBy:'Finance reviewer'}).ok");
test('changed journal source flagged', "lines.find(c=>c.id==='A1').hours=6;fin745JournalIssues(fin745Latest('journal','J1')).some(x=>x.includes('changed'))");
test('removed confirmed source retained', "lines=lines.filter(c=>c.id!=='A1');fin745Orphans().some(x=>x.id==='A1'&&x.snapshot.paid===7)");
test('orphan prevents complete total', "fin745Summary('2026-09').orphanCount===1&&!fin745Summary('2026-09').complete");
test('removed journal source flagged', "fin745JournalIssues(fin745Latest('journal','J1')).some(x=>x.includes('removed'))");
test('unknown kind refused', "!fin745Save('bad','x',{},null).ok");
test('negative amounts refused', "!fin745Save('rate','Blair',{rate:-1,basis:'card'},fin745Latest('rate','Blair').id).ok");
test('view mode refuses without mutation', "var before=JSON.stringify(S);writeAllowed=false;var result=fin745Save('billing','2026-10',{expectedMonth:'2026-10',reason:''},null);writeAllowed=true;!result.ok&&JSON.stringify(S)===before");
test('save failure rolls back only own fields', "var before=JSON.stringify(S);saveWorks=false;var result=fin745Save('billing','2026-10',{expectedMonth:'2026-10',reason:''},null);saveWorks=true;!result.ok&&JSON.stringify(S)===before&&S.untouched.value===7");
test('concurrent branches retained and flagged', "var original=fin745Latest('rate','Blair'),fork=fin745Clone(original);fork.id='F745-fork';fork.payload.rate=36;S.finance745[fork.id]=fork;fin745Conflicts('rate','Blair').length===1&&fin745History('rate','Blair').length===2");
test('conflicting rate not silently selected', "fin745Rows().find(r=>r.id==='B1').rate===null");
test('conflicting branch save blocked', "!fin745Save('rate','Blair',{rate:37,basis:'card'},fin745Latest('rate','Blair').id).ok");
test('invalid import refused', "fin745ValidateRecordEvent({id:'__proto__',kind:'rate',key:'Blair',prev:null,at:new Date().toISOString(),by:'Andrew',payload:{rate:35,basis:'card'}}).length>0");
test('history remains structurally valid despite source removal', "fin745ValidateRecordEvent(fin745Latest('review','A1')).length===0");
test('worked and paid forecast hours stay separate', "lines.push({id:'A3',kind:'labour',person:'Alex',date:'2026-11-01',hours:10,worked:10,paid:9.5,usable:true});fin745Summary('2026-11').forecastHours===10&&fin745Summary('2026-11').forecastPaidHours===9.5");
test('worked and paid pending hours stay separate', "lines.push({id:'A4',kind:'labour',person:'Alex',date:'2026-08-01',hours:10,worked:10,paid:9.5,usable:true});fin745Summary('2026-08').pendingHours===10&&fin745Summary('2026-08').pendingPaidHours===9.5");
test('worked and paid confirmed hours stay separate', "review('A4').ok&&fin745Summary('2026-08').confirmedHours===10&&fin745Summary('2026-08').confirmedPaidHours===9.5");
test('billing cannot carry prebill amount', "!fin745Save('billing','2026-11',{expectedMonth:'2026-11',reason:'',amount:100},null).ok");
test('snapshot import rejects unbounded data', "var e=fin745Clone(fin745Latest('review','A4'));e.payload.snapshot.person='x'.repeat(241);fin745ValidateRecordEvent(e).length>0");
test('AEST early morning review accepts local work day', "var e=fin745Clone(fin745Latest('review','A4'));e.at='2026-07-31T15:00:00.000Z';fin745ValidateRecordEvent(e).length===0");
test('damaged cyclic history stays visible and blocked', "var e=fin745Clone(fin745Latest('billing','2026-09'));e.id='F745-cycle1';e.key='2026-12';e.prev='F745-cycle2';var f=fin745Clone(e);f.id='F745-cycle2';f.prev=e.id;S.finance745[e.id]=e;S.finance745[f.id]=f;fin745List('billing').some(x=>x.key==='2026-12')&&fin745Conflicts('billing','2026-12').some(x=>x.includes('cycle'))");
console.log(JSON.stringify({author:'Andrew Fisher',passed:count,failed:0,networkRequests:0,liveRecordWrites:0}));
