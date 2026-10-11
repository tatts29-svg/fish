// Author: Andrew Fisher. Model checks for full same-day delivery runs; no network or records.
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const html=fs.readFileSync(process.env.PAGE,'utf8'),start=html.indexOf('/* Author: Andrew Fisher. Current supplier quantities, identities and movements share one read-only projection. */'),end=html.indexOf('</script>',start);
assert(start>=0&&end>start);const ctx={module:{exports:{}}};ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(html.slice(start,end),ctx);
const {pack}=ctx.module.exports,plain=x=>JSON.parse(JSON.stringify(x)),checks=[];
const row=(ref,n,side='outside',extra={})=>({ref,count:n,item:'FWF',side,zone:side,date:'2026-10-13',numbers:Array.from({length:n},(_,i)=>ref+'-'+i),...extra});
function check(name,fn){fn();checks.push(name);}
check('20 outside plus 7 island becomes 24 plus 3',()=>{const r=pack([row('A',20),row('B',7,'inside')],'inbound');assert.deepEqual(plain(r.map(x=>x.units)),[24,3]);assert.equal(r[0].side,'mixed');assert.deepEqual(plain(r[0].stops.map(s=>[s.ref,s.count])),[['A',20],['B',4]]);});
check('Numbers split exactly once with the quantities',()=>{const rows=[row('A',20),row('B',7,'inside')],r=pack(rows,'inbound');assert.deepEqual(plain(r.flatMap(l=>l.stops.flatMap(s=>s.numbers))),rows.flatMap(r=>r.numbers));});
check('Recorded delivery dates never mix',()=>{const r=pack([row('A',20),row('B',7,'inside',{date:'2026-10-15'})],'inbound');assert.deepEqual(plain(r.map(x=>x.units)),[20,7]);assert(r.every(l=>new Set(l.stops.map(s=>s.date)).size===1));});
check('49 portaloos becomes 24 plus 24 plus 1',()=>assert.deepEqual(plain(pack([row('A',49)],'inbound').map(l=>l.units)),[24,24,1]));
check('Six panels and eighteen portaloos share one truck',()=>{const r=pack([row('A',6,'outside',{item:'Pee Panel',quantityOnly:true,numbers:[]}),row('B',18,'inside')],'inbound');assert.equal(r.length,1);assert.equal(r[0].units,24);assert.equal(r[0].panels,6);});
check('Six-panel limit is retained',()=>{const r=pack([row('A',12,'outside',{item:'Pee Panel',quantityOnly:true,numbers:[]})],'inbound');assert.deepEqual(plain(r.map(l=>l.panels)),[6,6]);});
check('Each 16-pan block retains its own full truck',()=>{const r=pack([row('A',2,'outside',{item:'16Pan Block'}),row('B',24)],'inbound');assert.deepEqual(plain(r.map(l=>[l.type,l.units])),[['block',1],['block',1],['portable',24]]);});
check('Demob retains external-first grouping and pickup-date limits',()=>{const r=pack([row('A',20),row('B',7,'inside'),row('C',5,'outside',{outDate:'2026-10-27'})],'demob');assert.deepEqual(plain(r.map(l=>[l.side,l.units])),[['outside',20],['outside',5],['inside',7]]);});
check('No invented quantities and no mutation of input rows',()=>{const rows=[row('A',20),row('B',7,'inside')],before=JSON.stringify(rows),r=pack(rows,'inbound');assert.equal(JSON.stringify(rows),before);assert.equal(r.reduce((n,l)=>n+l.units,0),27);assert(r.every(l=>l.units<=24));});
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks:checks.length,names:checks,networkCalls:0}));
