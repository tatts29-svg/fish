/* Author: Andrew Fisher. Native Build category history readers retain their results and freshness. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const page=fs.readFileSync(process.argv[2],'utf8');
const script=page.split('<script id="daycats1057-script">')[1].split('</script>')[0];
const hist=script.slice(script.indexOf(' const hist ='),script.indexOf(' /* what was on site at a day'));
const lights=script.slice(script.indexOf(' /* the site light\'s own times'),script.indexOf(' /* where a number came from */'));
const history=page.slice(page.indexOf('function historyRead1066('),page.indexOf('function historyLast1066('));
const original=" const hist = (a, field) => memo('h|' + field + '|' + a.key, () => histOf(a.key, field));";
assert.ok(hist.includes('historyRead1066(a.key, field)'), 'candidate accessor installed');
function setup(candidate){
 const ctx=vm.createContext({assert});
 vm.runInContext(`
 let ASSETS_HELD=[],HELD_STALE775=false,configCalls=0; const HELD_MEMO=new Map();
 const records={fixture:{history:[],done_history:[]}};let current={recorded:true,where:'site',state:'on site',set_at:'2026-10-17T09:00:00Z',done:false,done_at:null};
 function heldFresh775(){if(HELD_STALE775){HELD_MEMO.clear();HELD_STALE775=false;}}
 function histOf_(key,field){return Object.freeze((records[key]?.[field]||[]).slice());}
 function memo(k,f){configCalls++;heldFresh775();if(!ASSETS_HELD)return f();if(!HELD_MEMO.has(k))HELD_MEMO.set(k,f());return HELD_MEMO.get(k);}
 function dayOf(at){return String(at||'').slice(0,10);}
 function deliveryOf(){return current;}
 function deliveryAsOf(){return current;}
 ${history}
 ${candidate?hist:hist.replace(/ const hist =[^\n]+/,original)}
 ${lights}
 const a={key:'fixture'};
 this.state=(rows,done,record,held=true)=>{records.fixture.history=rows.map(Object.freeze);records.fixture.done_history=done.map(Object.freeze);current=record;HELD_STALE775=true;ASSETS_HELD=held?[]:null;};
 this.read=iso=>JSON.stringify([hasSiteLight(a),stateAt(a,iso),lightOn(a,iso),lightOff(a,iso),lightBefore(a,iso),doneAt(a,iso)]);
 this.calls=()=>configCalls;
 `,ctx);return ctx;
}
const old=setup(false),next=setup(true);let checks=1;
const initial={recorded:true,where:'site',state:'on site',set_at:'2026-10-17T09:00:00Z',done:false,done_at:null};
const histories=[[],[{at:'2026-10-16T03:00:00Z',state:'on site'}],[{at:'2026-10-16T03:00:00Z',state:'on site'},{at:'2026-10-17T04:00:00Z',state:'not on site'}],[{at:'2026-10-17T01:00:00Z',state:'on site',date_only:true},{at:'2026-10-17T05:00:00Z',state:'on site'}]];
for(const rows of histories)for(const held of [true,false]){
 const done=[{at:'2026-10-16T05:00:00Z',done:true},{at:'2026-10-17T05:00:00Z',done:false}];
 old.state(rows,done,initial,held);next.state(rows,done,initial,held);
 for(const day of ['2026-10-15','2026-10-16','2026-10-17']){assert.equal(next.read(day),old.read(day),'held/unheld native reader parity after changed history');checks++;}
}
const rental={...initial,where:'rental',done:true,done_at:'2026-10-17T05:00:00Z'};
old.state(histories[2],[],rental);next.state(histories[2],[],rental);assert.equal(next.read('2026-10-17'),old.read('2026-10-17'),'site history still overrules rental fallback');checks++;
assert.ok(old.calls()>0);assert.equal(next.calls(),0,'raw history reads avoid unrelated event configuration validation');checks++;
console.log(JSON.stringify({author:'Andrew Fisher',checks,passed:true}));
