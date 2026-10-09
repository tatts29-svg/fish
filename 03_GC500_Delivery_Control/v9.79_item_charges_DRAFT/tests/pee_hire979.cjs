// Author: Andrew Fisher. Exact whole-event card source and no duplicate supplier/customer posting.
const assert=require('node:assert/strict'),P=require('../pee_hire979');
const rows=[{ref:'WC09',item:'Pee Panel',quantity:6,arrived:6}],before=JSON.stringify(rows);
const f=P.forecast(rows,[]);assert.equal(f.amount,4033.01);assert.equal(f.quantity,6);assert.equal(f.supplierCostAdditional,0);assert.equal(f.ledger,'1010');assert.equal(f.branch,'KINP');assert.equal(P.source.hire,672.1677000000001);assert.equal(JSON.stringify(rows),before);
assert.equal(P.forecast(rows,[{description:'Pee Panel',charge_line:false}]).amount,0);
assert.equal(P.forecast([{...rows[0],arrived:0}],[]).amount,0);
assert.equal(P.forecast([{...rows[0],quantity:7}],[]).amount,0);
const original={rate:null,labour_per_piece:{lines:[{name:'Cleaning',money:156.15}]}};
const card=P.card('Toilets & amenities','Pee Panel',original);assert.equal(card.rate,P.source.hire);assert.deepEqual(card.labour_per_piece,original.labour_per_piece);assert.equal(original.rate,null);assert.equal(P.card('Toilets & amenities','Pee Panel',{rate:7}).rate,7);assert.equal(P.card('Other','Pee Panel',original),original);
console.log('15 pee-panel source and no-duplicate checks passed');
