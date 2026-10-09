// Author: Andrew Fisher. Caption counts use native source matching, never new prices.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict'),path=require('path');
const html=fs.readFileSync(process.env.BASE_PAGE,'utf8'),start=html.indexOf('const Source949 ='),end=html.indexOf('})();',start)+5;
assert(start>=0&&end>start);
const clone=x=>JSON.parse(JSON.stringify(x));
const initial=Array.from({length:15},(_,i)=>({rental_contract:String(9900000+i),line:i+1,subhired:true,supplier_sub_rental:i<8?'PRE808':i===8?'ROY002':'RPM006',quantity:1,branch_code:i===8?'KINP':'STPS',kind:i===8?'container':'vms',start_date:'2026-10-19',expected_term_date:'2026-10-26',charge:{how:'per day',days:7}}));
const evidence=initial.slice(0,9).map(r=>({contract:r.rental_contract,lines:[r.line],supplierCode:r.supplier_sub_rental,supplierName:r.supplier_sub_rental==='ROY002'?'Royal Wolf':'PremiAir',supplierAliases:[],costRate:50,salesAnalysisCode:r.branch_code+'-2126'}));
let costs=[];
const ctx=vm.createContext({DATA:{rental_on_hire:{supplier_cost_evidence949:clone(evidence)}},ONHIRE_ROWS:clone(initial),ourCosts:()=>costs,contractCharge:r=>r.charge,heldMemo:(_,fn)=>fn()});
vm.runInContext(html.slice(start,end)+'\n'+fs.readFileSync(path.join(__dirname,'scope961.js'),'utf8'),ctx);
const plain=x=>JSON.parse(JSON.stringify(x)),count=()=>plain(ctx.supplierScope961()),tests=[];
function reset(){ctx.ONHIRE_ROWS=clone(initial);ctx.DATA.rental_on_hire.supplier_cost_evidence949=clone(evidence);costs=[];}
function check(name,fn){reset();fn();tests.push(name);}
const actual=(row=ctx.ONHIRE_ROWS[0],extra={})=>({id:'A1',side:'ours',amount:100,supplier:row.supplier_sub_rental,rental_contract:row.rental_contract,contract_line:row.line,...extra});
check('fifteen actual gaps, nine forecasts, six missing rates derived from current rows',()=>assert.deepEqual(count(),{lines:15,missingActual:15,forecast:9,missingRate:6,held:0,unavailable:0}));
check('branch and stream subsets count their own source rows',()=>{assert.deepEqual(plain(ctx.supplierScope961(ctx.ONHIRE_ROWS.filter(r=>r.branch_code==='KINP'))),{lines:1,missingActual:1,forecast:1,missingRate:0,held:0,unavailable:0});assert.equal(ctx.supplierScope961(ctx.ONHIRE_ROWS.filter(r=>r.kind==='vms')).missingRate,6);});
check('new missing line changes counts without hardcoded numbers',()=>{ctx.ONHIRE_ROWS.push({...initial[14],rental_contract:'9912345',line:22});assert.equal(count().lines,16);assert.equal(count().missingActual,16);assert.equal(count().missingRate,7);});
check('full supplier actual removes positive allowance, not supplier rate',()=>{costs=[actual()];assert.deepEqual(count(),{lines:15,missingActual:14,forecast:8,missingRate:6,held:0,unavailable:0});});
check('partial daily actual remains a separate positive forecast dimension',()=>{costs=[actual(undefined,{period_from:'2026-10-19',period_to:'2026-10-21'})];assert.equal(count().missingActual,14);assert.equal(count().forecast,9);});
check('idless native matched cost still counts as a linked cost',()=>{costs=[actual(undefined,{id:null})];assert.equal(count().missingActual,14);assert.equal(count().forecast,8);});
check('invalid period is only a linked record, never described as complete coverage',()=>{costs=[actual(undefined,{period_from:'invalid',period_to:'2026-10-20'})];assert.equal(count().missingActual,14);assert.equal(count().forecast,9);assert(ctx.supplierScopeWords961().includes('does not confirm full-period coverage'));});
check('partial whole-event cost keeps held forecast explicit',()=>{ctx.ONHIRE_ROWS[0].charge={how:'whole event'};costs=[actual(undefined,{period_from:'2026-10-23',period_to:'2026-10-24'})];assert.equal(count().held,1);assert.equal(count().forecast,8);assert(ctx.supplierScopeWords961().includes('held for supplier-period reconciliation'));});
check('known zero supplier rate is not labelled missing',()=>{ctx.DATA.rental_on_hire.supplier_cost_evidence949[0].costRate=0;assert.equal(count().forecast,8);assert.equal(count().missingRate,6);});
check('unsupported charge period is distinct from missing supplier rate',()=>{ctx.ONHIRE_ROWS[0].charge={how:'other'};assert.equal(count().unavailable,1);assert.equal(count().missingRate,6);assert(ctx.supplierScopeWords961().includes('without a current forecast calculation'));});
check('duplicate forecast identity is not counted as trustworthy coverage',()=>{ctx.ONHIRE_ROWS.push(clone(ctx.ONHIRE_ROWS[0]));assert.equal(ctx.supplierScope961([ctx.ONHIRE_ROWS[0]]).unavailable,1);assert.equal(ctx.supplierScope961([ctx.ONHIRE_ROWS[0]]).forecast,0);});
check('native exact supplier and contract-line matches apply even without rate evidence',()=>{costs=[actual(ctx.ONHIRE_ROWS[14])];assert.equal(count().missingActual,14);assert.equal(count().missingRate,6);});
for(const field of ['supplier','rental_contract','contract_line'])check('unrelated '+field+' does not claim a recorded cost',()=>{costs=[actual(undefined,{[field]:'different'})];assert.equal(count().missingActual,15);});
check('unusable, customer-side and missing-value costs are not supplier actual links',()=>{costs=[actual(undefined,{usable:false}),actual(undefined,{side:'theirs'}),actual(undefined,{amount:null})];assert.equal(count().missingActual,15);});
check('zero-valued valid native cost is a recorded link, not proof of free whole-period work',()=>{costs=[actual(undefined,{amount:0,period_from:'invalid'})];assert.equal(count().missingActual,14);assert.equal(count().forecast,9);});
check('non-SUB and empty subsets add no supplier-cost caption',()=>{assert.equal(ctx.supplierScopeWords961([]),'');assert.equal(ctx.supplierScope961([{subhired:false}]).lines,0);});
check('helper does not mutate contract rows, evidence or costs',()=>{costs=[actual()];const before=JSON.stringify([ctx.ONHIRE_ROWS,ctx.DATA,costs]);ctx.supplierScopeWords961();assert.equal(JSON.stringify([ctx.ONHIRE_ROWS,ctx.DATA,costs]),before);});
check('PremiAir Revenue STPS and Direct cost KINP are explicit',()=>assert.equal(ctx.supplierBranchWords961({branch:'STPS',costEvidence949:{costBranch:'KINP'}}),'Revenue branch STPS · Direct cost branch KINP. Finance allocates this supplier cost to KINP.'));
check('Royal Wolf Revenue KINP and Direct cost STPS are explicit',()=>assert.equal(ctx.supplierBranchWords961({branch:'KINP',costEvidence949:{costBranch:'STPS'}}),'Revenue branch KINP · Direct cost branch STPS. Finance allocates this supplier cost to STPS.'));
check('same or unknown cost branch adds no inferred distinction',()=>{assert.equal(ctx.supplierBranchWords961({branch:'KINP',costEvidence949:{costBranch:'KINP'}}),'');assert.equal(ctx.supplierBranchWords961({branch:'KINP'}),'');});
if(process.env.NATIVE_SNAPSHOT){
 const snapshot=JSON.parse(fs.readFileSync(process.env.NATIVE_SNAPSHOT,'utf8'));
 assert(snapshot.recordUnchanged&&snapshot.cacheCleared&&snapshot.photoIndexReady);
 ctx.DATA=JSON.parse(html.slice(html.indexOf('const DATA = ')+13).split('\n')[0].trim().replace(/;$/,''));
 ctx.ONHIRE_ROWS=clone(snapshot.models.contracts);ctx.nativeForecasts=clone(snapshot.models.source949);costs=clone(snapshot.models.supplierCosts);
 vm.runInContext('Source949.model=()=>nativeForecasts;',ctx);
 assert.deepEqual(count(),{lines:15,missingActual:15,forecast:9,missingRate:6,held:0,unavailable:0});
 assert.deepEqual(plain(ctx.supplierScope961(ctx.ONHIRE_ROWS.filter(r=>r.kind==='vms'))),{lines:13,missingActual:13,forecast:8,missingRate:5,held:0,unavailable:0});
 assert.deepEqual(plain(ctx.supplierScope961(ctx.ONHIRE_ROWS.filter(r=>r.branch_code==='KINP'))),{lines:1,missingActual:1,forecast:1,missingRate:0,held:0,unavailable:0});
 const groups=snapshot.models.rehire.groups.filter(g=>g.costEvidence949);
 assert.equal(groups.filter(g=>ctx.supplierBranchWords961(g).includes('Revenue branch STPS · Direct cost branch KINP')).length,8);
 assert.equal(groups.filter(g=>ctx.supplierBranchWords961(g).includes('Revenue branch KINP · Direct cost branch STPS')).length,1);
 tests.push('fresh cleared-cache native5155 labels: global15/9/6, traffic13/8/5, KINP1/1/0');
}
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:tests.length,tests},null,2));
