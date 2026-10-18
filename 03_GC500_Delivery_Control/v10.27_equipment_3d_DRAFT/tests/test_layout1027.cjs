/* Author: Andrew Fisher. Pure geometry layout tests; no network or record writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const context={};vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname,'../equipment_layout1027.js'),'utf8'),context);
const api=context.GC500EquipmentLayout1027;
const base={lat:-27.98,lon:153.43},eastScale=Math.cos(base.lat*Math.PI/180)*111320;
let passed=0;
function test(name,fn){fn();passed++;console.log('PASS '+name);}
function near(a,b,tolerance=1e-5){assert(Math.abs(a-b)<=tolerance,`${a} != ${b}`);}
function comp(kind,id,east,north,length=1.2,width=1.2){
 const centre={lat:base.lat+north/110540,lon:base.lon+east/eastScale};
 return {id,kind,centre,polygon:[[-width/2,-length/2],[width/2,-length/2],[width/2,length/2],[-width/2,length/2]].map(([x,y])=>({lat:centre.lat+y/110540,lon:centre.lon+x/eastScale})),sizeM:[length,width]};
}
function row(items,components,overrides={}){return Object.assign({ref:'TEST',kind:'toilet',items,components,quantity:items.reduce((s,i)=>s+(i.quantity||1),0),extrudable:true,location:{...base,kind:'master',areaOnly:false}},overrides);}
function counts(spec){return spec.parts.reduce((r,p)=>(r[p.spec.kind]=(r[p.spec.kind]||0)+p.spec.quantity,r),{});}
function fixture51(){return row([{description:'Accessible Toilet',kind:'other',quantity:1},{description:'FWF',kind:'toilet',quantity:6}],Array.from({length:6},(_,i)=>comp('toilet','FWF'+i,i*2,0)).concat([comp('accessible_toilet','ACCESS',0,6,2.4,2.4)]));}
function fixture09(){return row([{description:'FWF',kind:'toilet',quantity:10},{description:'Pee Panel',kind:'other',quantity:6},{description:'Toilet Block 6m',kind:'toilet-block',quantity:2}],Array.from({length:4},(_,i)=>comp('toilet','FWF'+i,i*2,0)).concat(Array.from({length:6},(_,i)=>comp('pee_panel','PEE'+i,i*3,8,2.4,.6)),[comp('toilet_block','BLOCK1',0,20,6,3),comp('toilet_block','BLOCK2',8,20,6,3)]));}

test('API is explicit and immutable',()=>{assert.equal(api.version,'10.27');assert(Object.isFrozen(api));assert.equal(typeof api.specOf,'function');});
test('WC51 consumes six FWF and one accessible component exclusively',()=>{const s=api.specOf(fixture51());assert.equal(s.quantity,7);assert.deepEqual(counts(s),{accessible_toilet:1,toilet:6});assert.equal(s.partialNote,'');assert.equal(s.parts.every(p=>p.spec.quantity===1),true);});
test('WC09 shows all three families but never invents six extra FWF positions',()=>{const s=api.specOf(fixture09());assert.equal(s.quantity,12);assert.equal(s.requestedQuantity,18);assert.deepEqual(counts(s),{toilet:4,pee_panel:6,toilet_block:2});assert.match(s.partialNote,/6 FWF positions are not individually marked/);assert.match(s.partialNote,/12 of 18/);});
test('Every placed component is consumed once and remains at its established coordinate',()=>{const r=fixture09(),s=api.specOf(r);assert.equal(new Set(s.parts.map(p=>p.componentId)).size,12);for(const p of s.parts){const c=r.components.find(c=>c.id===p.componentId);near(s.centre.lat+p.offset[1]/110540,c.centre.lat,1e-10);near(s.centre.lon+p.offset[0]/(Math.cos(s.centre.lat*Math.PI/180)*111320),c.centre.lon,1e-10);}});
test('Duplicate component IDs and repeated centres cannot duplicate physical units',()=>{const r=fixture51();r.components.push({...r.components[0]});r.components.push({...r.components[0],id:'DIFFERENT_ID'});const s=api.specOf(r);assert.equal(s.quantity,7);assert.equal(new Set(s.parts.map(p=>p.componentId)).size,7);});
test('Two described FWF lines consume the shared component pool only once',()=>{const r=row([{description:'FWF',kind:'toilet',quantity:2},{description:'FWF',kind:'toilet',quantity:2}],Array.from({length:3},(_,i)=>comp('toilet','T'+i,i*2,0)));const s=api.specOf(r);assert.equal(s.quantity,3);assert.match(s.partialNote,/1 FWF position is/);});
test('A drawing cannot increase the recorded quantity',()=>{const r=fixture51();r.items[1].quantity=2;const s=api.specOf(r);assert.equal(s.quantity,3);assert.deepEqual(counts(s),{accessible_toilet:1,toilet:2});});
test('A mismatched master component is not silently reclassified',()=>{const r=row([{description:'FWF',kind:'toilet',quantity:1}],[comp('accessible_toilet','A',0,0)]);assert.equal(api.specOf(r),null);});
test('Master references without components have no fabricated model positions',()=>{assert.equal(api.specOf(row([{description:'FWF',quantity:3}],[])),null);});
test('Area-only and non-extrudable rows always skip models',()=>{const r=fixture51();assert.equal(api.specOf({...r,extrudable:false}),null);assert.equal(api.specOf({...r,location:{...r.location,areaOnly:true}}),null);assert.equal(api.specOf({...r,areaOnly:true}),null);});
test('Area-only component is excluded independently',()=>{const r=fixture51();r.components[0].areaOnly=true;const s=api.specOf(r);assert.equal(s.quantity,6);assert.match(s.partialNote,/1 FWF/);});
test('Positive per-item dimensions override generic geometry and drawing size',()=>{const r=fixture51();r.items[1].dimensions={lengthMm:1300,widthMm:1200,heightMm:2400};const s=api.specOf(r);const p=s.parts.find(p=>p.spec.kind==='toilet');assert.equal(p.spec.length,1.3);assert.equal(p.spec.width,1.2);assert.equal(p.spec.height,2.4);});
test('Invalid dimensions fall back without producing NaN',()=>{const r=fixture51();r.items[1].dimensions={lengthMm:NaN,widthMm:-1,heightMm:Infinity};const s=api.specOf(r);const p=s.parts.find(p=>p.spec.kind==='toilet');assert.equal(p.spec.length,1.2);assert.equal(p.spec.width,1.15);assert.equal(p.spec.height,2.3);});
test('Physical building footprint can size the visual while symbolic toilet size cannot',()=>{const r=row([{description:'Building 6m',kind:'building',quantity:1},{description:'FWF',kind:'toilet',quantity:1}],[comp('building','B',0,0,7,3.5),comp('toilet','T',10,0,9,9)]);const s=api.specOf(r);near(s.parts[0].spec.length,7,.001);near(s.parts[0].spec.width,3.5,.001);assert.equal(s.parts[1].spec.length,1.2);});
test('Waste tanks stay outside the current geometry families',()=>{const r=row([{description:'Waste tank',kind:'waste-tank',quantity:1},{description:'16Pan Block',kind:'toilet-block',quantity:1}],[comp('toilet_block','B',0,0,6,3)]);const s=api.specOf(r);assert.deepEqual(counts(s),{toilet_block:1});assert.equal(s.quantity,1);assert.match(s.partialNote,/1 other item remains/);});
test('Container description remains a container on a building reference',()=>{const r=row([{description:'6.0m Refrigerator Cont',kind:'container',quantity:1}],[comp('container','C',0,0,6,2.44)],{kind:'building'});assert.deepEqual(counts(api.specOf(r)),{container:1});});
test('TL2 becomes a barrier only on a barrier reference',()=>{const r=row([{description:'TL2',kind:'other',quantity:1}],[comp('water_barrier','W',0,0,2,.55)],{kind:'barrier'});assert.deepEqual(counts(api.specOf(r)),{barrier:1});assert.equal(api.specOf({...r,kind:'toilet'}),null);});
test('Native pin groups get distinct illustrative slots and a clear grouped-position note',()=>{const r=row([{description:'FWF',quantity:3},{description:'Pee Panel',quantity:1}],[],{location:{...base,kind:'pin'}});const s=api.specOf(r);assert.equal(s.quantity,4);assert.equal(s.groupedPosition,true);assert.match(s.partialNote,/Illustrative row at the recorded group location/);assert.equal(new Set(s.parts.map(p=>p.offset[0])).size,4);assert(s.parts.every(p=>p.componentId===null));near(s.centre.lat,base.lat);near(s.centre.lon,base.lon);});
test('Native group fallback cannot override existing mismatched components',()=>{const r=row([{description:'FWF',quantity:3}],[comp('building','B',0,0)],{location:{...base,kind:'pin'}});assert.equal(api.specOf(r),null);});
test('Groups over 48 actual positions skip rather than silently drop families',()=>{const items=[{description:'FWF',quantity:49}];assert.equal(api.specOf(row(items,[],{location:{...base,kind:'pin'}})),null);assert.equal(api.specOf(row(items,Array.from({length:49},(_,i)=>comp('toilet','T'+i,i*2,0)))),null);});
test('Camera bounds contain every rotated component footprint',()=>{const s=api.specOf(fixture09());for(const p of s.parts){assert(Math.abs(p.offset[0])+Math.abs(Math.cos(p.angle))*p.spec.width/2+Math.abs(Math.sin(p.angle))*p.spec.length/2<=s.width/2);assert(Math.abs(p.offset[1])+Math.abs(Math.sin(p.angle))*p.spec.width/2+Math.abs(Math.cos(p.angle))*p.spec.length/2<=s.length/2);}assert(s.height>=2.9);});
test('Door bearing chooses only a compatible half-turn, preserving footprint axes',()=>{const c=comp('building','B',0,0,6,3),r=row([{description:'Building',kind:'building',quantity:1}],[c]);const a=api.specOf(r).parts[0].angle;c.doorBearingDeg=0;const b=api.specOf(r).parts[0].angle;near(Math.abs(Math.cos(a-b)),1);c.doorBearingDeg=90;const d=api.specOf(r).parts[0].angle;near(Math.abs(Math.cos(a-d)),1);});
test('Input is unchanged and output deterministic',()=>{const r=fixture09(),before=JSON.stringify(r);const a=api.specOf(r),b=api.specOf(r);assert.equal(JSON.stringify(r),before);assert.equal(JSON.stringify(a),JSON.stringify(b));});
test('Confirmed door side points along its master bearing without a quarter-turn of the building',()=>{
 for(const bearing of [0,90,180,270]){
  const c=comp('building','B',0,0,6,3),r=row([{description:'Building 6m',kind:'building',quantity:1}],[c]);
  const initial=api.specOf(r).parts[0].angle;
  Object.assign(c,{source:'master',doorBearingDeg:bearing,doorEdge:1,doorBasis:'one door drawn'});
  const s=api.specOf(r),p=s.parts[0],v={front:[0,-1],back:[0,1],left:[-1,0],right:[1,0]}[p.spec.doorSide];
  assert.equal(p.spec.doorConfirmed,true);assert.equal(p.spec.doorOpen,true);assert.equal(s.doorCount,1);
  const e=v[0]*Math.cos(p.angle)-v[1]*Math.sin(p.angle),n=v[0]*Math.sin(p.angle)+v[1]*Math.cos(p.angle);
  near(e,Math.sin(bearing*Math.PI/180));near(n,Math.cos(bearing*Math.PI/180));near(Math.abs(Math.cos(p.angle-initial)),1);
 }
});
test('Unconfirmed, malformed and ordinary FWF door sides do not open',()=>{
 const r=fixture51(),s=api.specOf(r);assert.equal(s.doorCount,0);assert(s.parts.every(p=>p.spec.doorConfirmed===false&&p.spec.doorOpen===false));
 const c=comp('building','B',0,0,6,3);Object.assign(c,{doorBearingDeg:90,doorEdge:1,doorBasis:'one door drawn'});
 const rr=row([{description:'Building',kind:'building',quantity:1}],[c]);assert.equal(api.specOf(rr).doorCount,0);
 c.source='master';c.doorBasis='door not confirmed';assert.equal(api.specOf(rr).doorCount,0);
 c.doorBasis='one door drawn';c.doorEdge=8;assert.equal(api.specOf(rr).doorCount,0);
});
test('Every source doorway midpoint and width is retained on a two-door block',()=>{
 const c=comp('toilet_block','B',0,0,6,3);Object.assign(c,{source:'master',doorBearingDeg:90,doorEdge:1,doorBasis:'2 doors drawn, all on the same edge',doors:[
  {edgeIndex:1,bearingDeg:90,widthM:.8,mid:{lat:base.lat-1.4/110540,lon:base.lon+1.5/eastScale},source:'master'},
  {edgeIndex:1,bearingDeg:90,widthM:.9,mid:{lat:base.lat+1.2/110540,lon:base.lon+1.5/eastScale},source:'master'}]});
 const s=api.specOf(row([{description:'Toilet Block 6m',kind:'toilet-block',quantity:1}],[c])),spec=s.parts[0].spec;
 assert.equal(s.doorCount,1);assert.equal(spec.doorCount,2);assert.equal(spec.doors.length,2);
 assert.equal(spec.doors[0].side,'right');near(spec.doors[0].offset,-1.4);near(spec.doors[1].offset,1.2);assert.equal(spec.doors[0].width,.8);assert.equal(spec.doors[1].width,.9);
 assert.match(s.doorSourceNote,/Doorway positions and sides from the master plan/);assert.match(s.doorSourceNote,/not a live door-open status/);
 assert.equal(s.doorAdapted,false);assert.equal(spec.doorAdapted,false);assert(spec.doors.every(d=>d.adapted===false));
});
test('A sourced doorway shifted to fit a smaller body is explicitly adapted without losing its source position',()=>{
 const c=comp('accessible_toilet','A',0,0,2.6,2.4);Object.assign(c,{source:'master',doorBearingDeg:90,doorEdge:1,doorBasis:'one door drawn',doors:[
  {edgeIndex:1,bearingDeg:90,widthM:.83,mid:{lat:base.lat-.645/110540,lon:base.lon+1.2/eastScale},source:'master'}]});
 const s=api.specOf(row([{description:'Accessible Toilet',quantity:1}],[c])),p=s.parts[0],d=p.spec.doors[0];
 assert.equal(s.doorAdapted,true);assert.equal(p.spec.doorAdapted,true);assert.equal(d.adapted,true);
 assert.equal(d.side,'right');near(d.offset,-.645);near(d.renderedOffset,-.485);near(d.renderedWidth,.83);
 assert.match(p.doorSourceNote,/Door side from the master plan; doorway position adapted to the illustrative model/);
 assert.match(s.doorSourceNote,/adapted to the illustrative model/);assert.doesNotMatch(s.doorSourceNote,/Doorway positions and sides/);
});
test('A source door wider than the body carries the same adaptation disclosure',()=>{
 const c=comp('accessible_toilet','A',0,0,2.6,2.4);Object.assign(c,{source:'master',doorBasis:'one door drawn',doors:[
  {edgeIndex:0,bearingDeg:180,widthM:2,mid:{lat:base.lat-1.2/110540,lon:base.lon},source:'master'}]});
 const s=api.specOf(row([{description:'Accessible Toilet',quantity:1}],[c])),d=s.parts[0].spec.doors[0];
 assert.equal(d.side,'front');near(d.width,2);near(d.renderedWidth,1.44);near(d.renderedOffset,0);
 assert.equal(d.adapted,true);assert.equal(s.doorAdapted,true);assert.match(s.doorSourceNote,/adapted/);
});
console.log(`${passed}/${passed} PASS`);
