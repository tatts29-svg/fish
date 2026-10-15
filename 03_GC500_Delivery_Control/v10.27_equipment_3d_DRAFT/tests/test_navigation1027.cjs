/* Author: Andrew Fisher. Exercise actual built 2D/3D re-entry functions without network or record writes. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
assert(process.argv[2],'Pass built explorer/explorer-merge.js');
const source=fs.readFileSync(process.argv[2],'utf8');
function section(start,end){const a=source.indexOf(start),b=source.indexOf(end,a);assert(a>=0&&b>a,'Expected source function boundaries');return source.slice(a,b);}
const functions=section('  function sync3d(fly)', '  /* ---------------- the 3D mode */')+
 section('  function enter3d()', '  function addButton()');
function fixture(){
 const calls=[],classes=new Set();
 const c={in3d:false,ready3d:true,lastCode:'WC49',last3dCode1027:'WC49',curCat:null,mode:'sat',calls,
  ensureFrame(){calls.push(['frame']);},modeButtons:()=>[],
  document:{body:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x)}}},
  localStorage:{setItem(){}},location:{pathname:'/explorer',search:''},history:{replaceState(){}},setTimeout:f=>f()};
 c.api3d=()=>({state:{ready:true},showGroups:v=>calls.push(['groups',v]),find:v=>calls.push(['find',v]),ring:v=>calls.push(['ring',v]),stopMotion813:()=>calls.push(['stop'])});
 vm.createContext(c);vm.runInContext(functions,c);return {c,calls,classes};
}
let passed=0;
function check(name,fn){fn();passed++;console.log('PASS '+name);}
check('Returning to the same selected reference restores its ring without flying',()=>{const {c,calls,classes}=fixture();c.enter3d();assert.equal(c.in3d,true);assert(classes.has('in3d'));assert.deepEqual(calls.filter(x=>x[0]==='ring'),[['ring','WC49']]);assert.equal(calls.some(x=>x[0]==='find'),false);});
check('Changing the 2D reference flies once to the newly selected reference',()=>{const {c,calls}=fixture();c.lastCode='P60';c.enter3d();assert.deepEqual(calls.filter(x=>x[0]==='find'),[['find','P60']]);assert.equal(calls.some(x=>x[0]==='ring'),false);});
check('Exit remembers the latest selection and stops motion; re-entry preserves view',()=>{const {c,calls,classes}=fixture();c.enter3d();c.lastCode='P63';c.exit3d();assert.equal(c.last3dCode1027,'P63');assert.equal(c.in3d,false);assert(!classes.has('in3d'));assert.equal(calls.filter(x=>x[0]==='stop').length,1);calls.length=0;c.enter3d();assert.deepEqual(calls.filter(x=>x[0]==='ring'),[['ring','P63']]);assert.equal(calls.some(x=>x[0]==='find'),false);});
check('Repeated entry and exit are idempotent',()=>{const {c,calls}=fixture();c.enter3d();const entered=calls.length;c.enter3d();assert.equal(calls.length,entered);c.exit3d();const exited=calls.length;c.exit3d();assert.equal(calls.length,exited);});
check('An unready scene or cleared selection cannot trigger a camera flight',()=>{let f=fixture();f.c.ready3d=false;f.c.lastCode='P60';f.c.enter3d();assert.equal(f.calls.some(x=>x[0]==='find'||x[0]==='ring'),false);f=fixture();f.c.lastCode=null;f.c.enter3d();assert.equal(f.calls.some(x=>x[0]==='find'||x[0]==='ring'),false);});
console.log(`${passed}/${passed} PASS`);
