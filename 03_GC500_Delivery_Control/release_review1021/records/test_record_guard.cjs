/* Author: Andrew Fisher. Offline safeguards: these tests have no browser, credentials or network. */
'use strict';
const assert=require('assert/strict'),fs=require('fs'),os=require('os'),path=require('path'),G=require('./record_guard.cjs');
let count=0;const test=(name,f)=>{f();count++;};
const clone=x=>JSON.parse(JSON.stringify(x));
const spec={checkedBy:'Andrew Fisher',actor:'Andrew Fisher via Codex',at:'2026-10-14T14:31:00.000Z'};
const before={purchaseOrders:{},stamps:{},by:{},deliveries:{WC09:{onSite:true,qty:6}},rates:{rent:{amount:182.28}}};
for(const no of G.NUMBERS){before.purchaseOrders[no]={number:no,amount:123.45,updated_by:'Andrew Fisher',updated_at:'2026-10-13T00:00:00.000Z'};before.stamps['po~2f~'+no]={v:'2026-10-13T00:00:00.000Z'};before.by['po~2f~'+no]={v:'Andrew Fisher'};}
const after=clone(before);
for(const no of G.NUMBERS){Object.assign(after.purchaseOrders[no],{checked:{by:spec.checkedBy,at:spec.at,basis:'{"amount":123.45}'},updated_by:spec.actor,updated_at:'2026-10-15T00:00:00.000Z'});after.stamps['po~2f~'+no]={v:'2026-10-15T00:00:00.000Z'};after.by['po~2f~'+no]={v:spec.actor};}
const plan=G.makePlan(before,after,spec);
test('unused empty collections do not imply a changed document',()=>assert.deepEqual(G.changed(before,{...clone(before),lineRates:{},accRates:{}}),[]));
test('a new document in an unused collection is still detected',()=>assert.deepEqual(G.changed(before,{...clone(before),lineRates:{unexpected:{v:1}}}),['lineRates/unexpected']));
test('initialization still detects changed values and deleted documents',()=>{const a=clone(before);a.rates.rent.amount=0;delete a.deliveries.WC09;assert.deepEqual(G.changed(before,a),['deliveries/WC09','rates/rent']);});
test('four PO checks can require twelve exact native docs',()=>assert.equal(plan.length,12));
test('unchanged authors require only eight exact native docs',()=>{const b=clone(before);b.by=clone(after.by);assert.equal(G.makePlan(b,after,spec).length,8);});
test('outside scope refused',()=>{const a=clone(after);a.deliveries.WC09.qty=10;assert.throws(()=>G.makePlan(before,a,spec),/outside/);});
test('business amount cannot change inside an allowed document',()=>{const a=clone(after);a.purchaseOrders['4647508'].amount=999;assert.throws(()=>G.makePlan(before,a,spec),/business value/);});
test('deletion refused',()=>{const a=clone(after);delete a.purchaseOrders['4647508'];assert.throws(()=>G.makePlan(before,a,spec),/Existing/);});
test('missing final-page basis refused',()=>{const a=clone(after);delete a.purchaseOrders['4647508'].checked.basis;assert.throws(()=>G.makePlan(before,a,spec),/basis/);});
test('wrong author refused',()=>{const a=clone(after);a.purchaseOrders['4647508'].updated_by='Another person';assert.throws(()=>G.makePlan(before,a,spec),/author/);});
test('missing native audit refused',()=>{const a=clone(after);delete a.stamps['po~2f~4647508'];assert.throws(()=>G.makePlan(before,a,spec),/audit/);});
test('complete whole-record readback passes',()=>assert.equal(G.verify(before,after,plan,true).ok,true));
test('partial failure shows unapplied docs without hiding them',()=>{const r=G.verify(before,before,plan,false);assert.equal(r.ok,true);assert.equal(r.plannedNotApplied.length,12);});
test('success requires every planned doc',()=>assert.equal(G.verify(before,before,plan,true).ok,false));
test('failure readback still detects unrelated edits',()=>{const a=clone(before);a.rates.rent.amount=200;assert.equal(G.verify(before,a,plan,false).ok,false);});
test('unexpected value in planned document is caught',()=>{const a=clone(before);a.purchaseOrders['4647508'].amount=100;assert.deepEqual(G.verify(before,a,plan,false).plannedUnexpected,['purchaseOrders/4647508']);});
const host='https://gc500-production.up.railway.app';
test('native exact URL accepted',()=>assert.equal(G.requestKey(host+'/api/doc/purchaseOrders/4647508','PUT',host),'purchaseOrders/4647508'));
test('unrelated PO refused',()=>assert.throws(()=>G.requestKey(host+'/api/doc/purchaseOrders/4647519','PUT',host)));
test('unrelated collection refused',()=>assert.throws(()=>G.requestKey(host+'/api/doc/deliveries/WC09','PUT',host)));
test('DELETE refused',()=>assert.throws(()=>G.requestKey(host+'/api/doc/purchaseOrders/4647508','DELETE',host)));
test('foreign origin refused',()=>assert.throws(()=>G.requestKey('https://example.com/api/doc/purchaseOrders/4647508','PUT',host)));
test('query-bearing write refused',()=>assert.throws(()=>G.requestKey(host+'/api/doc/purchaseOrders/4647508?extra=1','PUT',host)));
test('strict 200 and advancing numeric version accepted',()=>assert.equal(G.checkAck(200,'{"version":6079}',6078),6079));
for(const [name,status,body] of [['wrong HTTP',201,'{"version":6079}'],['missing version',200,'{}'],['text version',200,'{"version":"6079"}'],['old version',200,'{"version":6078}'],['invalid JSON',200,'ok']])test(name+' acknowledgement refused',()=>assert.throws(()=>G.checkAck(status,body,6078)));
test('private durable JSON preserves value and mode',()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'gc500-guard-unit-'));try{const file=path.join(dir,'report.json');G.durableJson(file,{value:'secret'},s=>s.replace('secret','redacted'));assert.deepEqual(JSON.parse(fs.readFileSync(file)),{value:'redacted'});assert.equal(fs.statSync(file).mode&0o777,0o600);assert.equal(fs.existsSync(file+'.pending'),false);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:count}));
