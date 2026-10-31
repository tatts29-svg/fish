// Author: Andrew Fisher. Synthetic boundaries; no site data or service writes.
const assert = require('node:assert/strict');
const {apply} = require('../directions1217_src');
const ref = (id, extra = {}) => ({ref: id, pin: null, where: '', drop: '', lines: [{id: id+'-line', qty: 2}], ...extra});
const source = {plans:{final:['pump','clean','lockup']},areas:[{n:0,refs:[ref('A'),ref('B',{where:'Existing'}),ref('C',{drop:'Drop instructions'}),ref('D',{pin:[1,2]}),ref('E'),ref('F'),ref('G')]}]};
const before = JSON.stringify(source), locations = Object.assign(Object.create({G:'Inherited'}),{A:' Asset 101 at North; asset 102 at South ',B:'Other',C:'Other',D:'Other',E:' ',F:{v:'Not runtime text'}});
const next = apply(source,locations), rows = next.areas[0].refs;
assert.equal(rows[0].where,'Asset 101 at North; asset 102 at South');
assert.equal(rows[0].pin,null); assert.equal(next.areas[0].n,0);
assert.equal(rows[1].where,'Existing'); assert.equal(rows[2].drop,'Drop instructions');
assert.deepEqual(rows[3].pin,[1,2]); assert.equal(rows[3].where,'');
assert(rows.slice(4).every(r=>r.where===''));
assert.equal(JSON.stringify(source),before);
rows[0].where=''; assert.equal(JSON.stringify(next),before);
assert.deepEqual(apply(source,null),source);
console.log('PASS 11 directions boundaries: recorded text only; existing locations, identities and input preserved');
