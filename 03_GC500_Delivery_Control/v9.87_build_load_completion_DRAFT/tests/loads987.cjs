/* Author: Andrew Fisher. Independent regression checks: received equipment is distinct from installed work and physical trucks. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const file = process.env.SOURCE || path.join(__dirname, '..', 'loads987.js');
const source = fs.readFileSync(file, 'utf8'), context = {};
vm.runInNewContext(source, context);
const API = context.BuildLoads987;
assert.ok(API && typeof API.create === 'function', 'BuildLoads987 factory is available');
const plain = value => JSON.parse(JSON.stringify(value));
let passed = 0;
function check(name, fn) { fn(); passed++; console.log('PASS ' + name); }
const ISO = '2026-10-09', TODAY = '2026-10-10';
function row(key, item='Building', quantity=1, extra={}) {
 return {a:{key,charge_lines:[{item,quantity}],...extra},events:[{date:ISO,movement:'place',item,quantity_raw:quantity}]};
}
function group(id, rows, basis='booking', extra={}) {
 return {id,kind:'deliveries',basis,truck_id:basis==='booking'?id:null,rows,...extra};
}
function fixture(options={}) {
 const groups=options.groups || [group('truck1',[row('P1')]),group('truck2',[row('P2')])];
 const answers={P1:true,P2:true,...options.answers}, calls=[];
 const env={loads:()=>groups,idOf:(_,g)=>g.id,ready:()=>true,
  receipt:(r,iso)=>{calls.push({r,iso});return {complete:Object.hasOwn(answers,r.a.key)?answers[r.a.key]:null,source:'Dated source'};},...options.env};
 const run=(iso=ISO,today=TODAY,day)=>API.create(env).day(iso,today,day||{iso,deliveries:groups.filter(g=>g.kind==='deliveries').flatMap(g=>g.rows),removals:groups.filter(g=>g.kind==='removals').flatMap(g=>g.rows),loads:[]});
 return {groups,env,answers,calls,run};
}
check('two confirmed trucks keep a 2/2 load total',()=>{
 const x=fixture().run();assert.equal(x.metric,'loads');assert.equal(x.completed,2);assert.equal(x.total,2);assert.equal(x.percent,100);assert.equal(x.groupingVerified,true);
});
check('multiple references on one documented truck count as one load',()=>{
 const x=fixture({groups:[group('truck1',[row('P1'),row('P2')])]}).run();assert.equal(x.total,1);assert.equal(x.completed,1);
});
check('a failed receipt leaves its shared truck incomplete',()=>{
 const x=fixture({groups:[group('truck1',[row('P1'),row('P2')])],answers:{P2:false}}).run();assert.equal(x.completed,0);assert.equal(x.total,1);assert.equal(x.percent,0);
});
check('missing receipt in one group does not erase another confirmed arrival',()=>{
 const x=fixture({answers:{P2:null}}).run();assert.equal(x.completed,1);assert.equal(x.total,2);assert.notEqual(x.percent,100);
});
check('Friday mixed grouping counts delivery references without inventing a truck',()=>{
 const x=fixture({groups:[group('wc31',[row('WC31','Accessible Toilet')],'load'),group('wc09',[row('WC09','FWF',4)],'ref')],answers:{WC31:true,WC09:true}}).run();
 assert.equal(x.metric,'references');assert.equal(x.completed,2);assert.equal(x.total,2);assert.equal(x.percent,100);assert.equal(x.groupingVerified,false);assert.match(x.title,/DELIVER/);assert.doesNotMatch(x.title,/LOAD/);
});
check('unassigned booking uses reference denominator',()=>{
 const x=fixture({groups:[group('unassigned',[row('P1')],'booking-unassigned',{truck_id:null})]}).run();assert.equal(x.metric,'references');assert.equal(x.total,1);assert.equal(x.completed,1);
});
check('fallback merges every item for one reference before deciding completion',()=>{
 const f=fixture({groups:[group('one',[row('WC09','FWF',4)],'ref'),group('two',[row('WC09','Pee Panel',6)],'ref')],env:{receipt:r=>({complete:r.events.some(e=>e.item==='FWF')&&!r.events.some(e=>e.item==='Pee Panel')})}});
 const x=f.run();assert.equal(x.metric,'references');assert.equal(x.total,1);assert.equal(x.completed,0);
});
check('different items sharing a truck reference are all checked',()=>{
 const seen=[];const x=fixture({groups:[group('one',[row('WC09','FWF',4),row('WC09','Pee Panel',6)])],env:{receipt:r=>{seen.push(...r.events.map(e=>e.item));return {complete:r.events.every(e=>e.item!=='Pee Panel')};}}}).run();
 assert.ok(seen.includes('FWF')&&seen.includes('Pee Panel'));assert.equal(x.completed,0);assert.equal(x.total,1);
});
check('same reference on distinct documented trucks remains two loads',()=>{
 const x=fixture({groups:[group('one',[row('WC20','Toilet Block 6m')]),group('two',[row('WC20','Toilet Block 6m')])],answers:{WC20:true}}).run();assert.equal(x.metric,'loads');assert.equal(x.completed,2);assert.equal(x.total,2);
});
check('partial full-reference quantity cannot complete every split truck',()=>{
 const x=fixture({groups:[group('one',[row('WC20','Toilet Block 6m',2)]),group('two',[row('WC20','Toilet Block 6m',2)])],env:{receipt:()=>({complete:false,reason:'Only 2 of 4 received'})}}).run();assert.equal(x.completed,0);assert.equal(x.total,2);
});
check('duplicate physical load identity is not counted twice as certain',()=>{
 const x=fixture({groups:[group('same',[row('P1')]),group('same',[row('P2')])]}).run();assert.equal(x.metric,'references');assert.equal(x.groupingVerified,false);assert.equal(x.total,2);
});
check('cancelled equipment is excluded from the active denominator',()=>{
 const x=fixture({groups:[group('one',[row('P1')]),group('cancelled',[row('P2','Building',1,{_cancelled:true})])]}).run();assert.equal(x.total,1);assert.equal(x.completed,1);
});
check('cancelled row does not make its shared truck incomplete',()=>{
 const x=fixture({groups:[group('one',[row('P1'),row('P2','Building',1,{_cancelled:true})])],answers:{P2:false}}).run();assert.equal(x.total,1);assert.equal(x.completed,1);
});
check('rescheduled day uses the current day model rather than prior booking metadata',()=>{
 const x=fixture({groups:[group('moved',[row('P1')],'ref',{bookingMoved801:true})]}).run();assert.equal(x.metric,'references');assert.equal(x.completed,1);
});
check('future confirmed truck counts do not assert arrival',()=>{
 const f=fixture(),x=f.run(ISO,'2026-10-08');assert.equal(x.metric,'loads');assert.equal(x.total,2);assert.equal(x.completed,null);assert.equal(x.percent,null);assert.equal(x.status,'scheduled');assert.equal(f.calls.length,0);
});
check('future reference count is labelled deliveries rather than trucks',()=>{
 const x=fixture({groups:[group('r1',[row('P1')],'ref'),group('r2',[row('P2')],'ref')]}).run(ISO,'2026-10-08');assert.equal(x.metric,'references');assert.equal(x.total,2);assert.equal(x.completed,null);assert.match(x.title,/DELIVER/);
});
check('today reads arrival confirmations without historical-only restrictions',()=>{
 const x=fixture().run(ISO,ISO);assert.equal(x.completed,2);assert.equal(x.total,2);
});
check('empty programme day is zero scheduled and never 100%',()=>{
 const x=fixture({groups:[]}).run();assert.equal(x.total,0);assert.equal(x.percent,null);assert.equal(x.completed,0);
});
check('carrier plan without references is retained as planned rather than zero completed',()=>{
 const x=fixture({groups:[]}).run(ISO,TODAY,{iso:ISO,deliveries:[],removals:[],loads:[{n:1},{n:2}]});assert.equal(x.total,2);assert.equal(x.completed,null);assert.notEqual(x.percent,100);
});
check('pickup-only day is never completed from arrival records',()=>{
 const f=fixture({groups:[group('out',[row('P1')],'load',{kind:'removals'})]});const x=f.run();assert.equal(x.completed,null);assert.equal(x.percent,null);assert.match(x.title,/PICKUP/);assert.equal(f.calls.length,0);
});
check('shared record hydration must not return a false zero',()=>{
 const f=fixture({env:{ready:()=>false}}),x=f.run();assert.equal(x.completed,null);assert.equal(x.total,null);assert.equal(x.percent,null);assert.equal(f.calls.length,0);
 f.env.ready=()=>true;assert.equal(f.run().completed,2);
});
check('mismatched day never returns another day counts',()=>{
 const x=fixture().run(ISO,TODAY,{iso:'2026-10-08'});assert.equal(x.completed,null);assert.equal(x.total,null);
});
check('updated receipts change every subsequent reading',()=>{
 const f=fixture({answers:{P2:false}});assert.equal(f.run().completed,1);f.answers.P2=true;assert.equal(f.run().completed,2);
});
check('read model preserves group rows, quantities and native inputs',()=>{
 const f=fixture({groups:[group('one',[row('P1')],'ref'),group('two',[row('P1','Furniture',3)],'ref')]});const before=JSON.stringify({groups:f.groups,answers:f.answers});f.run();f.run();assert.equal(JSON.stringify({groups:f.groups,answers:f.answers}),before);
});
check('pickups do not suppress incoming receipts or inflate their denominator',()=>{
 const f=fixture({groups:[group('one',[row('P1')]),group('two',[row('P2')]),group('out',[row('P3')],'load',{kind:'removals'})]});
 const x=f.run();assert.equal(x.total,2);assert.equal(x.completed,2);assert.equal(x.pickups,1);assert.ok(f.calls.every(c=>c.r.a.key!=='P3'));
});
function native(options={}) {
 const full=options.full||{key:'WC20',product:'Toilet',charge_lines:[{item:'Toilet Block 6m',quantity:4}],events:[{item:'Toilet Block 6m',quantity_raw:4,date:ISO,movement:'place'}]};
 const record=options.record||{recorded:true,state:'on site',set_at:'2026-10-09T00:00:00Z',done:false};
 const calls=[];
 const globals={assetOf:key=>key===full.key?full:null,deliveryAsOf:()=>record,todayIso:()=>TODAY,
  toiletDeliveryEntry962:(r,iso)=>{calls.push({r,iso});return null;},chargeLines:a=>a.charge_lines,
  esc:s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])),...options.globals};
 vm.runInNewContext(source,globals);
 return {api:globals.BuildLoads987,full,record,calls,globals};
}
check('native adapter receives a canonical asset rather than the split truck quantity',()=>{
 let received=2;const full={key:'WC20',product:'Toilet',charge_lines:[{item:'Toilet Block 6m',quantity:4}],events:[{item:'Toilet Block 6m',quantity_raw:4,date:ISO}]};
 const n=native({full,globals:{toiletDeliveryEntry962:r=>{assert.equal(r.a,full);return received>=r.a.charge_lines[0].quantity;}}});
 const piece=row('WC20','Toilet Block 6m',2,{product:'Toilet',_bookingNumbers801:['0001','0002']});
 assert.equal(n.api.receipt(piece,ISO).complete,false);received=4;assert.equal(n.api.receipt(piece,ISO).complete,true);
});
check('native adapter keeps the selected day item scope on the canonical reference',()=>{
 const full={key:'WC09',product:'Toilet',charge_lines:[{item:'FWF',quantity:4},{item:'Pee Panel',quantity:6},{item:'Toilet Block 6m',quantity:2}]};
 const n=native({full,globals:{toiletDeliveryEntry962:r=>{assert.equal(r.a,full);assert.deepEqual(plain(r.events.map(e=>e.item)),['FWF','Pee Panel']);return true;}}});
 const scope=row('WC09','FWF',4);scope.events.push({item:'Pee Panel',quantity_raw:6,date:ISO});assert.equal(n.api.receipt(scope,ISO).complete,true);
});
check('recorded arrival does not wait for installation',()=>{
 const n=native({record:{recorded:true,state:'on site',set_at:'2026-10-09T00:00:00Z',done:false}});assert.equal(n.api.receipt(row('P1'),ISO).complete,true);
});
check('early dated arrival fulfils the scheduled delivery even with a later installation',()=>{
 const n=native({record:{recorded:true,state:'on site',set_at:'2026-10-08T00:00:00Z',done:true,done_at:'2026-10-10T00:00:00Z'}});assert.equal(n.api.receipt(row('P1'),ISO).complete,true);
});
check('later receipt is not pulled into an earlier Brisbane day',()=>{
 const n=native({record:{recorded:true,state:'on site',set_at:'2026-10-09T14:00:00Z',done:false}});assert.notEqual(n.api.receipt(row('P1'),ISO).complete,true);
});
check('Brisbane cutoff includes the final millisecond before midnight',()=>{
 const n=native({record:{recorded:true,state:'on site',set_at:'2026-10-09T13:59:59.999Z',done:false}});assert.equal(n.api.receipt(row('P1'),ISO).complete,true);
});
check('historical undated on-site state is not invented as dated evidence',()=>{
 const n=native({record:{recorded:true,state:'on site',done:false}});assert.equal(n.api.receipt(row('P1'),ISO).complete,null);
});
check('today can use the current explicitly recorded on-site state',()=>{
 const n=native({record:{recorded:true,state:'on site',done:false}});assert.equal(n.api.receipt(row('P1'),TODAY).complete,true);
});
check('dated installation can confirm arrival where there is no contradictory state',()=>{
 const n=native({record:{recorded:false,state:'not on site',done:true,done_at:'2026-10-08T23:00:00Z'}});assert.equal(n.api.receipt(row('P1'),ISO).complete,true);
});
check('an explicit not-on-site correction beats an old generic completion tick',()=>{
 const n=native({record:{recorded:true,state:'not on site',set_at:'2026-10-09T00:00:00Z',done:true,done_at:'2026-09-25T00:00:00Z'}});assert.equal(n.api.receipt(row('P1'),ISO).complete,false);
});
check('an explicit toilet non-arrival correction does not borrow a stale parent completion',()=>{
 const n=native({record:{recorded:true,state:'not on site',set_at:'2026-10-09T00:00:00Z',done:true,done_at:'2026-09-25T00:00:00Z'},globals:{toiletDeliveryEntry962:()=>true}});assert.equal(n.api.receipt(row('WC20'),ISO).complete,false);
});
function correctedToilet(options={}) {
 const state={supplied:{WC20:{items:[{asked:'Toilet Block 6m',qty_supplied:options.qty===undefined?4:options.qty}]}},stamps:{'supplied/WC20/Toilet Block 6m':options.at||'2026-10-09T02:00:00Z'}};
 const record={recorded:true,state:'not on site',set_at:'2026-10-09T00:00:00Z',done:true,done_at:'2026-09-25T00:00:00Z',...options.record};
 return native({record,globals:{S:state,toiletDeliveryEntry962:()=>options.helper===undefined?true:options.helper}});
}
check('an older item receipt cannot reverse a newer explicit non-arrival correction',()=>{
 const n=correctedToilet({at:'2026-10-08T23:59:59Z'});assert.equal(n.api.receipt(row('WC20','Toilet Block 6m',4),ISO).complete,false);
});
check('a later fully received item can supersede the earlier non-arrival correction',()=>{
 const n=correctedToilet();assert.equal(n.api.receipt(row('WC20','Toilet Block 6m',4),ISO).complete,true);
});
check('later receipt still needs native item quantity confirmation',()=>{
 const n=correctedToilet({qty:2,helper:false});assert.equal(n.api.receipt(row('WC20','Toilet Block 6m',4),ISO).complete,false);
});
check('post-midnight item receipt cannot rewrite the previous day correction',()=>{
 const n=correctedToilet({at:'2026-10-09T14:00:00Z'});assert.equal(n.api.receipt(row('WC20','Toilet Block 6m',4),ISO).complete,false);
});
check('blank, fractional and negative receipt values cannot borrow stale completion',()=>{
 for(const qty of [null,'',-1,1.5,'not a quantity']){const n=correctedToilet({qty});assert.equal(n.api.receipt(row('WC20','Toilet Block 6m',4),ISO).complete,false,'Invalid quantity '+String(qty));}
});
check('every scheduled item requires a newer valid receipt to override red',()=>{
 const full={key:'WC09',product:'Toilet',charge_lines:[{item:'FWF',quantity:4},{item:'Pee Panel',quantity:6}]};
 const n=native({full,record:{recorded:true,state:'not on site',set_at:'2026-10-09T00:00:00Z',done:true,done_at:'2026-09-25T00:00:00Z'},globals:{S:{supplied:{WC09:{items:[{asked:'FWF',qty_supplied:4}]}},stamps:{'supplied/WC09/FWF':'2026-10-09T02:00:00Z'}},toiletDeliveryEntry962:()=>true}});
 const r=row('WC09','FWF',4);r.events.push({item:'Pee Panel',quantity_raw:6,date:ISO});assert.equal(n.api.receipt(r,ISO).complete,false);
});
check('native quantity shortfall is not overridden by a green reference',()=>{
 const n=native({globals:{toiletDeliveryEntry962:()=>false}});assert.equal(n.api.receipt(row('WC20'),ISO).complete,false);
});
check('native read preserves the booking piece and canonical record',()=>{
 const n=native(),r=row('WC20','Toilet Block 6m',2),before=JSON.stringify({r,full:n.full,record:n.record});n.api.receipt(r,ISO);assert.equal(JSON.stringify({r,full:n.full,record:n.record}),before);
});
check('reference fallback title is consistent in compact and detailed views',()=>{
 const n=native(),x=fixture({groups:[group('ref',[row('P1')],'ref')]}).run();const v=n.api.view(x);assert.match(v.title,/DELIVER/);assert.match(v.basis,/REFERENCES/);assert.doesNotMatch(n.api.details(x),/Load 1:/);
});
console.log(passed+' load receipt regression checks passed.');
