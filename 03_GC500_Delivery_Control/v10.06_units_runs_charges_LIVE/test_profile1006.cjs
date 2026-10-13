// Author: Andrew Fisher. Pure identity lookup and generator period invariants.
const assert=require('assert/strict'),P=require('./profile1006');let n=0;function test(name,fn){fn();n++;console.log('PASS '+name);}
const unit=(id,no,owner='event-portables')=>({id,assetNo:no,owner,item:'FWF',physical:true,source:'metadata'});
test('current identities preserve leading zeros',()=>assert.equal(P.current([unit('a','0699')])[0].assetNo,'0699'));
test('source aliases appear only once',()=>assert.equal(P.current([unit('a','0699'),unit('b','0 699')]).length,1));
test('different company identities are not silently merged',()=>assert.equal(P.current([unit('a','0699'),unit('b','0699','coates')]).length,2));
test('removed and inactive rows are not searchable',()=>assert.equal(P.current([{...unit('a','1'),source:'history'},{...unit('b','2'),active:false},{...unit('c','3'),physical:false}]).length,0));
test('unconfirmed generator numbers stay hidden',()=>assert.deepEqual(P.current([unit('a','1234567'),unit('b','7654321')],['1234567']).map(u=>u.assetNo),['1234567']));
const record={asset:{key:'WC72',name:'Toilets',discipline:'Toilets & amenities'},units:[unit('a','0699')]},base=[{kind:'asset',key:'WC72',name:'Toilets',type:'FWF',nums:['old'],links:[],hay:'old'},{kind:'unit',key:'WC72',no:'0699',hay:'0699'},{kind:'doc',title:'Site map'}],index=P.index(base,[record]);
test('search merges native and unit925 into one result per physical number',()=>assert.equal(index.filter(r=>r.kind==='unit').length,1));
test('reference index contains current number and removes obsolete number',()=>{const a=index.find(r=>r.kind==='asset');assert(a.hay.includes('0699'));assert(!a.hay.includes('old'));});
test('document and map searches remain independent',()=>assert(index.some(r=>r.kind==='doc')));
test('exact fleet searches select unit before duplicate reference suggestion',()=>{const r=P.exact(index,'0 699');assert.equal(r[0].unitId1006,'a');assert(!r.some(x=>x.kind==='asset'));});
test('reference searches retain reference and all individual numbers',()=>assert.equal(P.exact(index,'wc72').length,index.length));
const g={actualIsConfirmed:true,deliveredDate:'2026-10-08',plannedDate:'2026-10-07',standdownDays:15,eventDays:3,standdownRate:182.2791,dailyRate:364.5582,qty:2,standdownCharge:5468.37,raceCharge:2187.35,offhire:'2026-10-25'};
test('standdown uses confirmed start and ends before race Friday',()=>{const p=P.periods(g,'2026-10-23')[0];assert.equal(p.start,'2026-10-08');assert.equal(p.end,'2026-10-22');assert.equal(p.days,15);});
test('display preserves rate precision and shared amounts without recalculating',()=>{const p=P.periods(g,'2026-10-23');assert.equal(p[0].rate,182.2791);assert.equal(p[0].total,5468.37);assert.equal(p[1].total,2187.35);});
test('race hire is Friday through Sunday only',()=>{const p=P.periods(g,'2026-10-23')[1];assert.equal(p.start,'2026-10-23');assert.equal(p.end,'2026-10-25');});
test('forecast period is never marked actual included',()=>assert(P.periods({...g,actualIsConfirmed:false},'2026-10-23').every(p=>!p.included)));
test('zero standdown never invents a reversed date range',()=>assert.equal(P.periods({...g,standdownDays:0},'2026-10-23')[0].start,null));
test('generator summary uses shared Sunday off-hire, preserving separate contract demob',()=>{const x=P.exit([{offhire:'2026-10-25'}],{iso:'2026-10-26',src:'contract'});assert.equal(x.offhire,'2026-10-25');assert.deepEqual(x.pickup,{date:'2026-10-26',label:'Contract demob'});});
test('proposed demob dates never become recorded pickup dates',()=>assert.equal(P.exit([{offhire:'2026-10-25'}],{iso:'2026-10-26',src:'proposed'}).pickup,null));
test('conflicting commercial dates are not silently combined',()=>assert.equal(P.exit([{offhire:'2026-10-25'},{offhire:'2026-10-26'}],null).offhire,null));
console.log(n+' profile checks passed');
