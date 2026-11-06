/* Author: Andrew Fisher. Independent event-boundary fixtures exercising the actual patched modules. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const base=fs.readFileSync(process.env.BASE,'utf8'),candidate=fs.readFileSync(process.env.PAGE,'utf8');
const clone=x=>JSON.parse(JSON.stringify(x));
const actualData=JSON.parse(base.match(/const DATA\s*=\s*(\{[^\n]+\});/)[1]);
let passed=0;const tests=[];
function check(name,fn){try{fn();passed++;tests.push({name,pass:true});}catch(e){tests.push({name,pass:false,error:e.message});throw Error(name+': '+e.message);}}
function slice(text,start,end){const at=text.indexOf(start);assert(at>=0,start);const to=text.indexOf(end,at);assert(to>at,end);return text.slice(at,to);}
// Workforce source has an early return when document is absent; retain its real closing delimiter.
function context(text,patched){const box={DATA:clone(actualData),module:{exports:{}},money:n=>String(n),fmtDate:d=>d,heldMemo:(_k,fn)=>fn(),ourCosts:()=>[],ONHIRE_ROWS:[],contractCharge:()=>null};vm.createContext(box);
 if(patched)vm.runInContext(fs.readFileSync(__dirname+'/event_config1013.js','utf8')+'\nthis.Config=EventConfig1013;',box);
 vm.runInContext(slice(text,'/* Author: Andrew Fisher. One generator hire calculation','function generatorModel1004()'),box);
 vm.runInContext(slice(text,'const Source949 = (() => {','function onhireLine(r){')+'\nthis.Supplier=Source949;',box);
 const crew=slice(text,'/* Author: Andrew Fisher. Six editable workers','const priorOurCosts=ourCosts');vm.runInContext(crew+'})(globalThis);',box);
 return box;
}
const old=context(base,false),now=context(candidate,true),E=now.Config,G=now.GeneratorFinance1004;
const env={lineRate:()=>null,weeklyRate:()=>null,rehire:()=>false};
function input(options={}){const row={rental_contract:'TEST-CONTRACT',line:1,quantity:1,rate_1:null,what:'Generator 315 kVA'};return {id:'fixture-generator',ref:'TEST',item:'Generator 315 kVA',qty:1,branch:'TEST',plannedDate:'2026-10-20',deliveredDate:'2026-10-20',actualIsConfirmed:true,contractRows:[row],...options};}
for(const record of [input(),input({actualIsConfirmed:false}),input({deliveredDate:'2026-10-24'}),input({deliveredDate:'2026-10-27'}),input({qty:2}),input({cancelled:true}),input({item:'Generator 500 kVA'}),input({contractRows:[{rental_contract:'TEST',line:1,quantity:1,rate_1:1500,rate_type:'EVENT'}]})]){
 check('Current generator financial parity '+passed,()=>assert.deepStrictEqual(clone(G.project([record],env)),clone(old.GeneratorFinance1004.project([record],env))));
}
check('Current card rates remain byte-identical data',()=>assert.deepStrictEqual(clone(G.cardRates),clone(old.GeneratorFinance1004.cardRates)));
check('Shared day proxy supports arrays, iteration, JSON and enumerable keys',()=>{assert(Array.isArray(E.days));assert.deepStrictEqual([...E.days],actualData.charge_basis.event_days);assert.deepStrictEqual(Object.keys(E.days),['0','1','2']);assert.deepStrictEqual(clone(E.days),actualData.charge_basis.event_days);});
check('Current event fields match existing source',()=>assert.deepStrictEqual(clone(E.current().eventDays),actualData.charge_basis.event_days));
check('Current demobilisation source window retained',()=>assert.deepStrictEqual([E.current().demobStart,E.current().demobEnd],['2026-10-26','2026-11-13']));
check('Inputs are not changed by validation',()=>assert.deepStrictEqual(now.DATA,actualData));
const sourceRow={rental_contract:'TEST',line:1,quantity:2,branch_code:'TEST',start_date:'2026-10-01',term_date:'2026-10-04',supplier_sub_rental:'SUP'},evidence={contract:'TEST',lines:[1],supplierCode:'SUP',supplierName:'Example Supplier',salesAnalysisCode:'TEST-9999',costRate:100,sheet:'Fixture',rateCell:'A1'},charge={how:'whole event',days:3};
function actual(from,to){return {id:'ACTUAL',side:'ours',amount:200,supplier:'SUP',contract:'TEST',line_no:1,period_from:from,period_to:to};}
for(const [ch,actuals]of [[charge,[]],[charge,[actual('2026-10-23','2026-10-26')]],[charge,[actual('2026-10-24','2026-10-26')]],[{how:'per day',days:3},[actual('2026-10-01','2026-10-03')]]])check('Current supplier coverage and financial parity '+passed,()=>assert.deepStrictEqual(clone(now.Supplier.calculate(sourceRow,evidence,ch,actuals)),clone(old.Supplier.calculate(sourceRow,evidence,ch,actuals))));
check('Current whole-event invoice month unchanged',()=>assert.strictEqual(now.Supplier.month(now.Supplier.calculate(sourceRow,evidence,charge,[]),'2026-10'),200));
const sourceCrew=[{kind:'person',id:'W-P-fencing-crew-6',person:'Fencing crew ×6'},...actualData.charge_basis.event_days.map(date=>({kind:'labour',id:'SOURCE-'+date,person:'Fencing crew ×6',crew_count:6,date,start:'06:00',finish:'18:00'}))];
check('Current workforce projection retains all output and source evidence',()=>assert.deepStrictEqual(clone(now.Workforce1010.expand(sourceCrew)),clone(old.Workforce1010.expand(sourceCrew))));
check('Workforce source quotation retained',()=>assert.deepStrictEqual(clone(now.Workforce1010.QUOTE),clone(old.Workforce1010.QUOTE)));
const shift=['2028-02-18','2028-02-19','2028-02-20'];now.DATA.charge_basis.event_days.splice(0,3,...shift);now.DATA.weeks=[{phase:'Demob',start:'2028-02-21',end:'2028-02-25'}];
check('In-place event array change updates metadata without reload',()=>assert.deepStrictEqual([G.eventFrom,G.offhire,G.invoiceMonth],['2028-02-18','2028-02-20','2028-02']));
check('Shifted 3-day event uses its arrival and standdown window',()=>assert.deepStrictEqual(clone(G.windowOf('2028-02-16')),{standdownDays:2,eventDays:3,equivalentDays:4,offhire:'2028-02-20'}));
check('Shifted card charge preserves published rate precision',()=>assert.strictEqual(G.project([input({plannedDate:'2028-02-16',deliveredDate:'2028-02-16'})],env).forecast,Math.round((2*235.8906+3*471.7812)*100)/100));
check('Shifted prose and allocation month follow current event',()=>{const r=G.project([input({deliveredDate:'2028-02-16'})],env).rows[0];assert(r.basis.includes('20 Feb')&&r.basis.includes('February invoice allocation'));assert(!r.basis.includes('25 Oct'));assert(r.rateSource.includes('18 Feb'));});
check('Supplier actual covers shifted event, not the previous event',()=>{assert.strictEqual(now.Supplier.calculate(sourceRow,evidence,charge,[actual('2028-02-18','2028-02-21')]).estimate,0);const oldPeriod=now.Supplier.calculate(sourceRow,evidence,charge,[actual('2026-10-23','2026-10-26')]);assert(oldPeriod.held);});
check('Supplier unbilled whole event belongs to shifted month',()=>{const r=now.Supplier.calculate(sourceRow,evidence,charge,[]);assert.strictEqual(now.Supplier.month(r,'2028-02'),200);assert.strictEqual(now.Supplier.month(r,'2026-10'),0);});
check('Workforce dates getter follows in-place replacement',()=>assert.deepStrictEqual(clone(now.Workforce1010.DATES),shift));
check('Shifted crew produces six people and eighteen individual shifts',()=>{const rows=sourceCrew.map(r=>r.date?{...r,date:shift[actualData.charge_basis.event_days.indexOf(r.date)]}:r);const result=now.Workforce1010.expand(rows);assert.strictEqual(result.filter(r=>r.kind==='person').length,6);assert.strictEqual(result.filter(r=>r.kind==='labour').length,18);assert(result.filter(r=>r.kind==='labour').every(r=>now.Workforce1010.isShift(r)));});
check('Old crew source dates remain unchanged, not moved into a new event',()=>assert.deepStrictEqual(clone(now.Workforce1010.expand(sourceCrew)),sourceCrew));
now.DATA.charge_basis.event_days=['2028-12-31','2029-01-01','2029-01-02'];
check('Cross-month event requires an explicit invoice month',()=>{assert(E.current().eventValid);assert(!E.current().invoiceValid);assert.strictEqual(G.invoiceMonth,null);assert(E.issue().includes('spans calendar months'));});
check('Cross-month charge is visibly unpriced rather than zero',()=>{const result=G.project([input({deliveredDate:'2028-12-30'})],env);assert.strictEqual(result.rows[0].forecast,null);assert.strictEqual(result.unpriced.length,1);assert(result.rows[0].issues.some(x=>x.includes('invoice month')));});
check('Cross-month supplier estimate is held and month allocation unknown',()=>{const r=now.Supplier.calculate(sourceRow,evidence,charge,[]);assert.strictEqual(r.estimate,null);assert(r.held);assert.strictEqual(now.Supplier.month(r,'2028-12'),null);assert(now.Supplier.words(r).includes('pending'));});
now.DATA.charge_basis.invoice_month='2029-01';
check('Explicit cross-month invoice allocation restores pricing',()=>{assert.strictEqual(G.invoiceMonth,'2029-01');assert(Number.isFinite(G.project([input({deliveredDate:'2028-12-30'})],env).rows[0].forecast));assert.strictEqual(now.Supplier.month(now.Supplier.calculate(sourceRow,evidence,charge,[]),'2029-01'),200);});
now.DATA.charge_basis.event_days=['2029-01-01','2029-01-02','2029-01-03','2029-01-04'];
check('Whole-event contract price spreads over configured day count once',()=>{const x=input({deliveredDate:'2029-01-01',contractRows:[{rental_contract:'TEST',line:1,quantity:1,rate_1:1200,rate_type:'EVENT'}]});const r=G.project([x],env).rows[0];assert.strictEqual(r.dailyRate,300);assert.strictEqual(r.forecast,1200);});
check('Typed event override uses the same configured divisor',()=>{const r=G.project([input({deliveredDate:'2029-01-01'})],{...env,lineRate:()=>1200}).rows[0];assert.strictEqual(r.dailyRate,300);assert.strictEqual(r.forecast,1200);});
for(const invalid of [[],null,['2028-02-30'],['2028-02-18','2028-02-18'],['2028-02-18','2028-02-20'],['not-a-date']]){
 now.DATA.charge_basis.event_days=invalid;
 check('Invalid/missing dates hold all derived generator and supplier amounts '+passed,()=>{assert(!E.current().eventValid);assert.strictEqual(G.windowOf('2028-02-01').equivalentDays,null);const r=G.project([input()],env);assert.strictEqual(r.rows[0].forecast,null);assert.strictEqual(r.unpriced.length,1);assert.strictEqual(now.Supplier.calculate(sourceRow,evidence,charge,[]).estimate,null);assert(!JSON.stringify(r).includes('NaN'));assert.strictEqual(now.Workforce1010.DATES.length,0);});
}
check('Missing configuration never invents default GC500 dates',()=>{const c=E.read({});assert.strictEqual(c.eventFrom,null);assert.strictEqual(c.offhire,null);assert.strictEqual(c.demobStart,null);});
check('Invalid invoice month is not silently derived',()=>{const c=E.read({charge_basis:{event_days:shift,invoice_month:'2028-13'}});assert(!c.invoiceValid);assert.strictEqual(c.invoiceMonth,null);});
check('Invalid demob range remains unresolved',()=>assert(!E.read({weeks:[{phase:'Demob',start:'2029-02-01',end:'2029-01-01'}]}).demobValid));
check('Overlong demob window is held instead of truncated',()=>assert(!E.read({weeks:[{phase:'Demob',start:'2028-01-01',end:'2030-01-01'}]}).demobValid));
check('In-place date/holiday edits invalidate cached reads once',()=>{const data=clone(actualData);let invalidated=0;const read=E.makeCurrent(()=>data,()=>invalidated++);read();read();assert.strictEqual(invalidated,0);data.charge_basis.event_days=shift;read();assert.strictEqual(invalidated,1);read();assert.strictEqual(invalidated,1);data.weeks[0].sheet='Different source caption';read();assert.strictEqual(invalidated,1);data.holidays={present:true,holidays:[{date:'2028-02-21'}]};read();assert.strictEqual(invalidated,2);});
// Use the actual patched Demob date function with only its source helpers, not a copied implementation.
const demob=vm.createContext({DATA:clone(actualData),module:{exports:{}}});vm.runInContext(fs.readFileSync(__dirname+'/event_config1013.js','utf8'),demob);
const dm=slice(candidate,'const DM816 = {','/* the event portables:');const days=slice(candidate,'function days816(){','function week816(');
vm.runInContext(dm+'\nfunction holidayOn(d){return DATA.holidays?.present&&DATA.holidays.holidays.find(x=>x.date===d);}\n'+days+'\nthis.days=days816;',demob);
check('Current Demob day list retains fifteen working days',()=>assert.strictEqual(demob.days().length,15));
check('In-place Demob date change replaces cached dates',()=>{demob.DATA.weeks=[{phase:'Demob',start:'2028-02-21',end:'2028-02-25'}];assert.deepStrictEqual(clone(demob.days()),['2028-02-21','2028-02-22','2028-02-23','2028-02-24','2028-02-25']);});
check('Holiday change refreshes the same Demob cache without reload',()=>{demob.DATA.holidays={present:true,holidays:[{date:'2028-02-23'}]};assert.strictEqual(demob.days().length,4);assert(!demob.days().includes('2028-02-23'));});
check('Missing Demob configuration returns no invented proposed dates',()=>{demob.DATA.weeks=[];assert.deepStrictEqual(clone(demob.days()),[]);});
check('Source data block stays byte-identical',()=>assert.strictEqual(candidate.match(/const DATA\s*=\s*(\{[^\n]+\});/)[1],base.match(/const DATA\s*=\s*(\{[^\n]+\});/)[1]));
const report={author:'Andrew Fisher',passed,failed:0,checks:tests};if(process.env.OUT)fs.writeFileSync(process.env.OUT,JSON.stringify(report,null,2));console.log(JSON.stringify({passed,failed:0}));
