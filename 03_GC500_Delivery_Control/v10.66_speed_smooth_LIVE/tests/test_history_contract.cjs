/* Author: Andrew Fisher. Historical reads retain last-write, untick and copy semantics. */
'use strict';
const assert=require('node:assert/strict'),path=require('node:path'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const source=path.join(__dirname,'..','history1066.py');
const history=execFileSync('python3',['-c','import ast,sys; m=ast.parse(open(sys.argv[1]).read()); print(next(ast.literal_eval(n.value) for n in m.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=="HISTORY" for t in n.targets)))',source],{encoding:'utf8'});
const ctx=vm.createContext({assert});
vm.runInContext(`
let ASSETS_HELD=null,HELD_STALE775=false,builds=0;
const HELD_MEMO=new Map();let records={};
function heldFresh775(){if(HELD_STALE775){HELD_MEMO.clear();HELD_STALE775=false;}}
function histOf_(key,field){builds++;return (records[key]?.[field]||[]).slice().sort((a,b)=>a.at.localeCompare(b.at));}
${history}
let checks=0;function check(v,msg){assert.ok(v,msg);checks++;}
const key='fixture';records[key]={};
for(const field of ['history','done_history','levelled_history','steps_history']){
 const rows=records[key][field]=[];
 for(let i=0;i<20;i++)rows.push({at:'2026-10-'+String(1+Math.floor(i/2)).padStart(2,'0')+'T10:00:00Z',done:!!(i%2),state:i%2?'on site':'not on site',id:i});
 for(const held of [false,true]){
  ASSETS_HELD=held?[]:null;HELD_MEMO.clear();
  for(let day=0;day<13;day++){
   const cut='2026-10-'+String(day).padStart(2,'0')+'T23:59:59Z';
   const expected=histOf_(key,field).filter(x=>x.at<=cut).at(-1)||null;
   check(historyLast1066(key,field,cut)===expected,field+' latest event retains exact event including false ticks');
  }
 }
}
ASSETS_HELD=[];HELD_MEMO.clear();const before=builds;const a=histOf(key,'history'),b=histOf(key,'history');check(builds===before+1,'history built once per active hold');check(a!==b&&a.length===b.length,'public callers receive independent arrays');a.pop();check(histOf(key,'history').length===20,'caller mutation cannot change cached array');
records[key].history.push({at:'2026-10-12T10:00:00Z',state:'not on site',id:20});HELD_STALE775=true;check(historyLast1066(key,'history','2026-10-12T23:59:59Z').id===20,'save or hydration invalidation reveals later untick immediately');
ASSETS_HELD=null;records[key].history=[];check(historyLast1066(key,'history','2026-10-12T23:59:59Z')===null,'unheld calls read current record');
this.result={checks,passed:true};
`,ctx);
console.log(JSON.stringify({author:'Andrew Fisher',...ctx.result}));
