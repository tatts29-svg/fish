/* Author: Andrew Fisher. Synthetic pickup/location evidence; no operational data. */
'use strict';
const assert=require('node:assert/strict'),P=require('./pickup_locations1297_src.js');
const copy=x=>JSON.parse(JSON.stringify(x));
const freeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(freeze);Object.freeze(x);}return x;};
let checks=0;
const test=(name,fn)=>{fn();checks++;};
const key='SYN-A',arrivalAt='2030-01-01T00:00:00Z',capturedAt='2030-01-05T03:00:00Z',departedAt='2030-01-04T10:15:00+10:00';
const unit=(id,number,item='Building')=>({id,ref:key,assetNo:number,owner:'coates',item,physical:true,source:'native',nativeId:'native:'+id,slot:false});
const a=unit('unit:A','00123'),b=unit('unit:B','00456'),tank=unit('unit:T','00999','Waste tank'),rows=[a,b,tank];
const reference={kind:'asset',lat:-28,lon:153.4,label:key,tag:key,how:'position: master plan',what:'Synthetic equipment'};
const fix=(u,lat)=>({ref:key,unit:u.assetNo,lat,lon:153.41,at:'2030-01-03T00:00:00Z',by:'Synthetic operator',acc:3});
const fixes={a:fix(a,-28.01),b:fix(b,-28.02),tank:fix(tank,-28.03)};
const identity=u=>({id:u.id,number:u.assetNo,owner:u.owner,item:u.item});
const line=u=>({type:u.item,n:1,unitIds:[u.id],numbers:[u.assetNo],physicalUnits:[identity(u)]});
const context=()=>({capturedAt,arrivalAt,location:copy(reference),units:copy(rows),fixes:copy(fixes)});
const captured=P.capture(key,context());
const collection=(u,options={})=>({version:1,kind:'collection',id:'event:'+u.id,arrivalAt,date:'2030-01-04',departedAt1211:departedAt,at:capturedAt,items:[line(u)],pickupLocations1297:P.select(captured,[line(u)]),...options});
const reading=(events,options={})=>({arrival:{at:arrivalAt},issues:[],events,remaining:[{type:'Building',n:1},{type:'Waste tank',n:1}],complete:false,...options});
const card=(u=a,options={})=>({key,u,gone:{at:departedAt,day:'2030-01-04'},st:{s:'gone',at:departedAt},...options});
const resolve=(c=card(),r=reading([collection(a)]),current={...reference,lat:-28.5},us=rows)=>P.resolve(c,current,{reading:r,rows:us});

test('a later moved pin cannot change the immutable pickup snapshot',()=>{
 const c=context(),saved=P.capture(key,c);c.fixes.a.lat=-29;c.location.lat=-29;c.units[0].assetNo='changed';
 assert.equal(saved.units[a.id].location.lat,-28.01);assert.equal(saved.reference.lat,-28);assert.equal(saved.units[a.id].identity.number,'00123');
 const result=resolve();assert.equal(result.location.lat,-28.01);assert.equal(result.historical,true);assert.equal(result.capturedAt,'2030-01-05T03:00:00.000Z');
 assert.notEqual(result.capturedAt,new Date(departedAt).toISOString());assert.match(result.note,/departure time.*separately/);
 assert.equal(result.departureAt,new Date(departedAt).toISOString());assert.equal(result.departureDate,'2030-01-04');
});
test('capture accepts frozen inputs and mutates none',()=>{
 const C=freeze(context()),before=JSON.stringify(C);P.capture(key,C);assert.equal(JSON.stringify(C),before);
});
test('all returned capture/result metadata is recursively immutable',()=>{
 assert.throws(()=>{captured.reference.lat=1;},TypeError);assert.throws(()=>{captured.units[a.id].identity.number='other';},TypeError);
 const result=resolve();assert.throws(()=>{result.locations.push({});},TypeError);assert.throws(()=>{result.location.lat=1;},TypeError);
});
test('JSON round trip keeps every saved coordinate and identity',()=>{
 const selected=P.select(copy(captured),[line(a)]);assert.deepEqual(copy(selected),copy(P.select(captured,[line(a)])));
 assert.equal(copy(selected).units[a.id].identity.number,'00123');assert.equal(copy(selected).reference.confidence,'plan');
});
test('capture excludes arbitrary private fields and executable/non-JSON objects',()=>{
 const C=context();C.location.secret='discard';C.location.fn=()=>1;C.fixes.a.debug={private:'discard'};
 const raw=JSON.stringify(P.capture(key,C));assert.doesNotMatch(raw,/secret|discard|debug|function/);
});
test('selection stores only the selected physical unit plus reference fallback',()=>{
 const selected=P.select(captured,[line(a)]);assert.deepEqual(Object.keys(selected.units),[a.id]);assert.equal(selected.reference.scope,'reference');
});
test('selection cannot attach a conflicting identity to matching opaque ID',()=>{
 const selected=line(a);selected.physicalUnits[0].owner='supplier';assert.deepEqual(Object.keys(P.select(captured,[selected]).units),[]);
});
test('selection cannot copy a unit of another item type',()=>{
 const selected=line(a);selected.type='Generator';assert.deepEqual(Object.keys(P.select(captured,[selected]).units),[]);
});
test('duplicate selected IDs never copy an individual snapshot',()=>{
 assert.deepEqual(Object.keys(P.select(captured,[line(a),line(a)]).units),[]);
});
test('quantity-only selection retains qualified reference, never a numbered point',()=>{
 const selected=P.select(captured,[{type:'Water barriers',n:12,unitIds:[],physicalUnits:[]}]);assert.deepEqual(Object.keys(selected.units),[]);assert.equal(selected.reference.lat,-28);
});
test('no valid selected quantities means no metadata is attached',()=>{
 assert.equal(P.select(captured,[]),null);assert.equal(P.select(captured,[{type:'Building',n:0}]),null);assert.equal(P.select(null,[line(a)]),null);
});
test('the reference newest unit pin never becomes another unit pin',()=>{
 const C=context();delete C.fixes.a;const result=P.capture(key,C);assert.equal(result.units[a.id],undefined);assert.equal(result.units[b.id].location.lat,-28.02);
});
test('duplicate numbers or IDs prevent unit-level pin assignment',()=>{
 const C=context();C.units.push({...a,id:'duplicate'});assert.equal(P.capture(key,C).units[a.id],undefined);
 C.units=copy(rows).concat(copy(a));assert.equal(P.capture(key,C).units[a.id],undefined);
});
test('a current unit from another reference has no pin assignment',()=>{
 const C=context();C.units[0].ref='SYN-B';assert.equal(P.capture(key,C).units[a.id],undefined);
});
test('a pin without recorder/time or from the future is not captured as unit evidence',()=>{
 for(const patch of [{by:''},{at:''},{at:'2031-01-01T00:00:00Z'}]){
  const C=context();Object.assign(C.fixes.a,patch);assert.equal(P.capture(key,C).units[a.id],undefined);
 }
});
test('conflicting duplicate fixes do not choose an arbitrary point',()=>{
 const C=context();C.fixes.duplicate={...C.fixes.a,lat:-28.7};assert.equal(P.capture(key,C).units[a.id],undefined);
});
test('a VMS board position requires its exact physical identity',()=>{
 const v=unit('vms:synthetic','V-0001','VMS'),C={...context(),units:[v],fixes:{},unitLocations:{[v.id]:{identity:identity(v),scope:'board',location:{kind:'vms',lat:-28.04,lon:153.44,how:'Board position recorded on site'}}}};
 assert.equal(P.capture(key,C).units[v.id].location.scope,'board');C.unitLocations[v.id].identity.number='V-0002';assert.equal(P.capture(key,C).units[v.id],undefined);
});
test('board scope never upgrades plan geometry to a measured position',()=>{
 assert.equal(P.location({...reference,kind:'vms',how:'VMS position from the plan'},'board').confidence,'plan');
});
test('current per-unit fixes are used without changing the canonical reference fallback',()=>{
 const C=context();assert.equal(P.current(key,a,C).lat,-28.01);assert.equal(P.current(key,b,C).lat,-28.02);
 delete C.fixes.a;assert.equal(P.current(key,a,C).lat,-28);assert.equal(P.current(key,a,C).scope,'reference');
});
test('active resolve honours its own unit fix and retains current-only wording',()=>{
 const r=P.resolve(card(a,{gone:null,st:{s:'ready'}}),reference,{rows,fixes,capturedAt});assert.equal(r.location.lat,-28.01);assert.equal(r.note,'');assert.equal(r.historical,false);
});
test('a missing map point never invents coordinates',()=>{
 const saved=P.capture(key,{...context(),location:null,fixes:{}});assert.equal(saved.reference,null);assert.equal(P.select(saved,[line(a)]),null);
 const r=resolve(card(),reading([{...collection(a),pickupLocations1297:null}]),null);assert.equal(r.location,null);assert.equal(r.historical,false);
});
test('pit-lane reporting fallback is excluded from an equipment location',()=>{
 for(const patch of [{kind:'report'},{tag:key+' - report here (pit lane)'},{warn:'No drop-off is set for this reference yet; the driver reports here.'}]){
  const C={...context(),fixes:{},location:{...reference,...patch}};const saved=P.capture(key,C);assert.equal(saved.reference,null);assert.equal(P.select(saved,[line(a)]),null);
 }
});
test('a genuine equipment position whose description mentions pit lane remains valid',()=>{
 const p=P.location({...reference,how:'Master-plan building beside pit lane'});assert.equal(p.lat,-28);
});
test('approximate map positions remain explicitly approximate in stored history',()=>{
 const C={...context(),fixes:{},location:{...reference,kind:'area',warn:'This position is approximate - check on site.'}};
 const saved=P.select(P.capture(key,C),[line(a)]),r=resolve(card(),reading([{...collection(a),pickupLocations1297:saved}]));
 assert.equal(r.location.confidence,'approximate');assert.equal(r.location.approximate,true);assert.equal(r.location.scope,'reference');assert.match(r.note,/individual unit position was not recorded/);
});
test('bad numeric coordinates are rejected without coercion',()=>{
 for(const patch of [{lat:NaN},{lon:Infinity},{lat:91},{lon:181},{lat:'-28'}])assert.equal(P.location({...reference,...patch}),null);
});
test('capture requires a real capture timestamp and arrival cycle',()=>{
 assert.equal(P.capture(key,{...context(),capturedAt:''}),null);assert.equal(P.capture(key,{...context(),arrivalAt:'invalid'}),null);assert.equal(P.capture('',context()),null);
 for(const capturedAt of ['0','2030-02-30T00:00:00Z','2030-01-05T24:00:00Z','2029-12-31T00:00:00Z'])assert.equal(P.capture(key,{...context(),capturedAt}),null);
});
test('capture signature changes with coordinates but not save clock',()=>{
 const C=context();C.capturedAt='2030-01-06T03:00:00Z';assert.equal(P.signature(P.capture(key,C)),P.signature(captured));
 C.fixes.a.lat=-28.9;assert.notEqual(P.signature(P.capture(key,C)),P.signature(captured));
});
test('a mismatched current asset number never takes the old unit point',()=>{
 const changed={...a,assetNo:'different'},r=resolve(card(changed),reading([collection(a)]),reference,[changed,b,tank]);assert.equal(r.historical,false);assert.equal(r.location.lat,reference.lat);
});
test('mismatched current owner or item cannot borrow historic coordinates',()=>{
 for(const patch of [{owner:'supplier'},{item:'Generator'}]){
  const changed={...a,...patch},r=resolve(card(changed),reading([collection(a)]),reference,[changed,b,tank]);assert.equal(r.historical,false);
 }
});
test('a unique native identity survives canonical ID changes',()=>{
 const changed={...a,id:'new-canonical-id'},r=resolve(card(changed),reading([collection(a)]),reference,[changed,b,tank]);assert.equal(r.historical,true);assert.equal(r.location.lat,-28.01);assert.equal(r.locations[0].unitId,changed.id);
});
test('anonymous/non-native rows cannot recover historic IDs from an asset number',()=>{
 for(const patch of [{source:'asset'},{nativeId:''},{slot:true}]){
  const changed={...a,id:'new-canonical-id',...patch},r=resolve(card(changed),reading([collection(a)]),reference,[changed,b,tank]);assert.equal(r.historical,false);
 }
});
test('duplicated current identity blocks historical association',()=>{
 assert.equal(resolve(card(),reading([collection(a)]),reference,[a,{...a,id:'another'},b,tank]).historical,false);
});
test('a stale card cannot combine current ID and number from different rows',()=>{
 const us=[{...a,assetNo:b.assetNo},{...b,assetNo:a.assetNo},tank];assert.equal(resolve(card(a),reading([collection(a)]),reference,us).historical,false);
 assert.equal(P.current(key,a,{...context(),units:us}).scope,'reference');
});
test('ID recovery uses the current native row flags, not stale card flags',()=>{
 const stale={...a,id:'new-canonical-id'},us=[{...stale,source:'asset',nativeId:''},b,tank];assert.equal(resolve(card(stale),reading([collection(a)]),reference,us).historical,false);
});
test('duplicate or contradictory departure evidence blocks historical association',()=>{
 assert.equal(resolve(card(),reading([collection(a),collection(a)])).historical,false);
 const conflicting=collection(a);conflicting.items[0].physicalUnits[0].owner='supplier';assert.equal(resolve(card(),reading([collection(a),conflicting])).historical,false);
});
test('native evidence review blocks map history claims',()=>{
 assert.equal(resolve(card(),reading([collection(a)],{issues:['Scope changed']})).historical,false);
});
test('older arrival-cycle events cannot be shown as the current pickup',()=>{
 assert.equal(resolve(card(),reading([collection(a)],{arrival:{at:'2030-01-02T00:00:00Z'}})).historical,false);
});
test('saved snapshots must match both reference and arrival cycle',()=>{
 for(const patch of [{key:'SYN-B'},{arrivalAt:'2030-01-02T00:00:00Z'},{version:99}]){
  const event=collection(a);event.pickupLocations1297={...event.pickupLocations1297,...patch};assert.equal(resolve(card(),reading([event])).historical,false);
 }
});
test('a different visible departure stamp cannot silently select an event',()=>{
 assert.equal(resolve(card(a,{gone:{at:'2030-01-05T00:00:00Z'},st:{s:'gone'}})).historical,false);
});
test('old pickup lacking metadata stays labelled as current recorded/plan location',()=>{
 const event=collection(a);delete event.pickupLocations1297;const r=resolve(card(),reading([event]));assert.equal(r.historical,false);assert.equal(r.location.lat,-28.5);assert.match(r.note,/No map position was saved/);assert.doesNotMatch(r.label,/picked up from/i);
});
test('missing own saved point uses only the qualified event reference',()=>{
 const event=collection(a),saved=copy(event.pickupLocations1297);delete saved.units[a.id];event.pickupLocations1297=saved;
 const r=resolve(card(),reading([event]));assert.equal(r.historical,true);assert.equal(r.location.lat,-28);assert.equal(r.location.scope,'reference');assert.match(r.note,/individual unit position/);
});
test('missing own point with no reference never borrows another saved unit point',()=>{
 const event=collection(a),saved=copy(captured);delete saved.units[a.id];saved.reference=null;event.pickupLocations1297=saved;
 const r=resolve(card(),reading([event]));assert.equal(r.historical,false);assert.equal(r.location.lat,-28.5);
});
test('a block and tank retain their separate pickup points and dates',()=>{
 const second=collection(tank,{date:'2030-01-05',departedAt1211:'2030-01-05T10:30:00+10:00'}),c=card(a,{tank,gone:{at:second.departedAt1211},st:{s:'gone'}});
 const r=resolve(c,reading([collection(a),second]));assert.equal(r.locations.length,2);assert.deepEqual(r.locations.map(x=>x.location.lat),[-28.01,-28.03]);assert.ok(r.locations.every(x=>x.historical));
});
test('a combined picked-up card must carry the latest matched member departure',()=>{
 const second=collection(tank,{date:'2030-01-05',departedAt1211:'2030-01-05T10:30:00+10:00'}),c=card(a,{tank});
 const r=resolve(c,reading([collection(a),second]));assert.equal(r.hasHistory,false);
});
test('a partial block/tank pickup leads with the remaining unit and preserves the other history',()=>{
 const c=card(a,{tank,gone:null,half:'block',st:{s:'not'}}),r=resolve(c,reading([collection(a)]));
 assert.equal(r.locations[0].unitId,tank.id);assert.equal(r.historical,false);assert.equal(r.hasHistory,true);assert.equal(r.locations[1].location.lat,-28.01);
 assert.equal(r.locations[0].note,'');
});
test('a paired remaining member uses its own current point rather than the other member',()=>{
 const c=card(a,{tank,gone:null,half:'block',st:{s:'not'}}),r=P.resolve(c,reference,{reading:reading([collection(a)]),rows,fixes,capturedAt});
 assert.equal(r.locations[0].location.lat,-28.03);assert.equal(r.locations[1].location.lat,-28.01);
 const noFallback=P.resolve(c,{...reference,scope:'unit',unitId:a.id},{reading:reading([collection(a)]),rows});assert.equal(noFallback.locations[0].location,null);
});
test('group partial pickups retain event reference locations beside current remaining stock',()=>{
 const q={type:'Water barriers',n:5,unitIds:[],physicalUnits:[]},event={...collection(a),items:[q],pickupLocations1297:P.select(captured,[q])};
 const c={key,group:true,item:q.type,part:{collected:5,remaining:5},st:{s:'not'}},r=resolve(c,reading([event]));
 assert.equal(r.historical,false);assert.equal(r.hasHistory,true);assert.equal(r.locations.length,2);assert.equal(r.locations[1].location.scope,'reference');
});
test('on-site cards do not acquire historical pickup wording',()=>{
 const r=resolve(card(a,{gone:null,st:{s:'ready'}}));assert.equal(r.historical,false);assert.equal(r.note,'');
});
test('metadata under prototype-looking opaque IDs stays ordinary serialized data',()=>{
 const u=unit('__proto__','007'),C={...context(),units:[u],fixes:{one:fix(u,-28.7)}};
 const saved=P.select(P.capture(key,C),[line(u)]);assert.equal(Object.prototype.polluted,undefined);assert.equal(copy(saved).units.__proto__.location.lat,-28.7);
});
test('malformed optional metadata and empty event rows fail safely',()=>{
 assert.equal(resolve(card(),reading([null,{items:[null]}])).historical,false);assert.equal(P.resolve(null,null).location,null);
});
console.log(checks+' pickup location checks PASS');
