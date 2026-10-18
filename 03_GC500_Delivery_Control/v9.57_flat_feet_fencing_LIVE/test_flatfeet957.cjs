// Author: Andrew Fisher. Native costing regression and source mapping checks.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert/strict');
const path = require('path');
const basePath = process.env.BASE_PAGE;
const pagePath = process.env.PAGE;
if (!basePath || !pagePath) throw new Error('Set BASE_PAGE and PAGE');
const base = fs.readFileSync(basePath, 'utf8');
const candidate = fs.readFileSync(pagePath, 'utf8');
const checks = [];
function check(name, fn) { fn(); checks.push(name); }
function section(s, from, until) {
 const a = s.indexOf(from); assert(a >= 0, from);
 const b = s.indexOf(until, a + from.length); assert(b > a, until);
 return s.slice(a, b);
}
function native(html) {
 const dataStart = html.indexOf('const DATA = ') + 'const DATA = '.length;
 // DATA is a single JSON line in the native page; parse only its declaration.
 const dataLine = html.slice(dataStart).split('\n')[0].trim().replace(/;$/, '');
 const data = JSON.parse(dataLine);
 const context = vm.createContext({DATA:data, S:{fenceRates:{}, fenceCosts:{},stamps:{}}, MAX_RATE:1e8,
  safeNum:(x,max)=>x == null || x === '' ? null : Number.isFinite(+x) && +x >= 0 && +x <= max ? +x : null,
  stampBy:()=>null, serviceWorkProblems898:()=>[]});
 const setup = section(html, 'const FENCE = DATA.fence', 'const FCOM = ');
 const inclusions = section(html, 'const FENCE_INCLUSIONS747 = ', 'function fenceInclusionHtml747(');
 const rate = section(html, 'function fenceRateFor(key)', '/* v5.80');
 const cost = section(html, 'function fenceCostFor(key)', '/* One reading');
 const quantity = section(html, 'function docketQuantity(v)', '/* GATES ARE CHARGED');
 const docket = section(html, 'function costDocket(d)', 'function docketProblems(d)');
 vm.runInContext(setup + '\n' + inclusions + '\n' + rate + '\n' + cost + '\n' + quantity + '\n' + docket +
  '\nglobalThis.api={costDocket,fenceRateFor,fenceCostFor,columns:FCOL,fence:FENCE};', context);
 return context;
}
const before = native(base), after = native(candidate);
const json = x => JSON.parse(JSON.stringify(x));
const flat = after.api.columns.find(c=>c.key==='flat_feet');
check('exact original metre rate and programme unit',()=>{
 assert.equal(flat.unit,'m'); assert.equal(flat.rate,9.6511);
 assert.equal(flat.programme_type,'Crowd Control Barriers (m) — Flat Feet');
 assert.equal(flat.source957.unit_cell,"'Street Rate Card 2026'!C53");
 assert.equal(flat.source957.rate_cells,"'Street Rate Card 2026'!A63:C63");
});
const work = {quantities:{flat_feet:42},components:{flat_feet:19}};
const price = json(after.api.costDocket(work));
check('42 source metres charge405.35, physical19 is not a billing quantity',()=>{
 assert.equal(price.cost_total,405.35); assert.equal(price.lines[0].qty,42);
 assert.equal(price.lines[0].unit,'m'); assert.equal(price.lines[0].name,'CCB flat feet');
 assert.equal(after.api.costDocket({...work,components:{flat_feet:190}}).cost_total,405.35);
 assert.equal(after.api.costDocket({quantities:{},components:{flat_feet:19}}).cost_total,0);
});
check('supplier unknown remains unknown and margin is withheld',()=>{
 assert.equal(after.api.fenceCostFor('flat_feet').value,null);
 assert.equal(price.lines[0].paid,null); assert.deepEqual(price.paid_unpriced,['flat_feet']);
 assert.equal(price.paid_state,'partly priced'); assert.equal(price.margin,null);
});
check('source inclusions cannot suppress the flat-feet customer hire line',()=>{
 assert.equal(flat.labour_included,true); assert.equal(flat.transport_included,true);
 assert.equal(after.api.fenceRateFor('flat_feet').source,'card');
 assert.equal(price.lines.length,1);
});
check('all existing columns and unrelated gap entries preserved',()=>{
 assert.deepEqual(json(after.api.columns.filter(c=>c.key!=='flat_feet')),json(before.api.columns));
 const removed=before.api.fence.rate_gaps.filter(g=>!after.api.fence.rate_gaps.some(h=>h.problem===g.problem));
 assert.equal(removed.length,1); assert(removed[0].problem.includes('Flat Feet'));
 assert.deepEqual(json(after.api.fence.rate_gaps),json(before.api.fence.rate_gaps.filter(g=>g!==removed[0])));
});
check('mapping installation is idempotent',()=>{
 const initial=JSON.stringify(after.api.columns);
 vm.runInContext('installFlatFeet957(FCOL,FENCE)',after);
 assert.equal(JSON.stringify(after.api.columns),initial);
});
check('native override convention remains available without inventing an override',()=>{
 after.S.fenceRates.flat_feet=10; assert.equal(after.api.costDocket(work).cost_total,420);
 after.S.fenceCosts.flat_feet=7; assert.equal(after.api.costDocket(work).paid_total,294);
 assert.equal(after.api.costDocket(work).margin,126);
 delete after.S.fenceRates.flat_feet; delete after.S.fenceCosts.flat_feet;
});
check('native CCB summaries and rehire classification include flat feet',()=>{
 assert(candidate.includes("sum('ccb_event')+sum('ccb_demarc')+sum('flat_feet')"));
 assert(candidate.includes("sum('ccb_event') + sum('ccb_demarc') + sum('flat_feet')"));
 assert(candidate.includes("'ccb_event', 'ccb_demarc', 'flat_feet'];"));
});
let nativeRows=0;
if (process.env.NATIVE_SNAPSHOT) {
 const snapshot=JSON.parse(fs.readFileSync(process.env.NATIVE_SNAPSHOT,'utf8'));
 before.S=json(snapshot.record); after.S=json(snapshot.record);
 for(const d of snapshot.dockets){
  assert.deepEqual(json(after.api.costDocket(d)),json(before.api.costDocket(d)), 'Existing docket changed: '+d.id);
  nativeRows++;
 }
 checks.push('existing '+nativeRows+' docket calculations unchanged on frozen native record');
}
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:checks.length,nativeRows,details:checks},null,2));
