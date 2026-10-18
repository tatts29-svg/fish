/* Author: Andrew Fisher. Direct execution of the shipped carry-cache helper. */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const patch = path.join(__dirname, '..', 'patch_v1066.py');
const carry = execFileSync('python3', ['-c',
  'import ast,sys; m=ast.parse(open(sys.argv[1]).read()); print(next(ast.literal_eval(n.value) for n in m.body if isinstance(n,ast.Assign) and any(isinstance(t,ast.Name) and t.id=="CARRY" for t in n.targets)))', patch], {encoding:'utf8'});
const ctx = vm.createContext({assert});
vm.runInContext(`
let day='2026-10-18', version=1, builds=0, clock=Date.parse('2026-10-17T23:30:00Z');
let state={tab:'timeline',sel:null};
let S={delivery:{}};
const DOCS={at:1,state:'ready',files:{}};
let health={ready:true,status:'live'};
let source={event_days:['2026-10-23','2026-10-24','2026-10-25']};
let HELD_STALE775=false;
function signature(data){return JSON.stringify(data);}
function read(data){return JSON.parse(JSON.stringify(data));}
function makeCurrent(provider,changed=()=>{}){let key,value;return function(){const data=provider(),next=signature(data);if(next!==key){const prior=key;value=read(data);key=next;if(prior!==undefined)changed();}return value;};}
const window={EventConfig1013:{current:makeCurrent(()=>source,()=>{REC_EPOCH1066++;HELD_MEMO.clear();if(ASSETS_HELD)HELD_STALE775=true;})}};
function todayIso(){return day;}
function todayWorkHealth840(){return health;}
function buildAllAssets(){builds++;return {version,builds};}
function heldFresh775(){if(ASSETS_HELD&&HELD_STALE775){HELD_STALE775=false;HELD_MEMO.clear();ASSETS_HELD=buildAllAssets();}}
function heldMemo(k,f){window.EventConfig1013.current();if(!ASSETS_HELD)return f();heldFresh775();if(HELD_MEMO.has(k))return HELD_MEMO.get(k);const v=f();HELD_MEMO.set(k,v);return v;}
function holdAssets(fn){window.EventConfig1013.current();if(ASSETS_HELD){heldFresh775();return fn();}ASSETS_HELD=buildAllAssets();HELD_MEMO.clear();HELD_STALE775=false;try{return fn();}finally{ASSETS_HELD=null;HELD_MEMO.clear();HELD_STALE775=false;}}
${carry}
let passes=0;function check(v,msg){assert.ok(v,msg);passes++;}
function value(c){return holdCarry1066(c,()=>heldMemo('value',()=>ASSETS_HELD.version));}
function mutate(mutator,name){const c={};version++;const a=value(c),n=builds;mutator();version++;check(value(c)===version,name+' reads new value');check(builds===n+1,name+' rebuilds exactly once');check(value(c)===version&&builds===n+1,name+' stable followup reuses');}
const c={};check(value(c)===1,'first read');const first=builds;check(value(c)===1&&builds===first,'unchanged context reuses assets and memo');
mutate(()=>REC_EPOCH1066++,'save invalidation');
mutate(()=>REC_EPOCH1066++,'received-record invalidation');
mutate(()=>{S={delivery:{fresh:true}};},'folder record replacement without epoch');
mutate(()=>{day='2026-10-19';},'AEST day rollover');
mutate(()=>{DOCS.at++;},'document revision');
mutate(()=>{DOCS.state='failed';},'document state');
mutate(()=>{DOCS.files={};},'document registry identity');
mutate(()=>{health={ready:false,status:'connecting'};},'sync health');
mutate(()=>{state.sel='test-reference';},'view selection');
mutate(()=>{source.event_days[0]='2026-10-22';},'same-task event date edit');
const nested={};holdAssets(()=>{const outer=ASSETS_HELD;check(value(nested)===version,'nested hold reads outer value');check(ASSETS_HELD===outer&&!nested.context,'nested hold never keeps outer snapshot');});
const inside={};value(inside);holdCarry1066(inside,()=>{version++;REC_EPOCH1066++;HELD_STALE775=true;check(heldMemo('value',()=>ASSETS_HELD.version)===version,'save inside hold reads fresh value');});check(!inside.context,'save inside hold rejects remembered context');
const during={};value(during);holdCarry1066(during,()=>{version++;source.event_days[1]='2026-10-23';check(heldMemo('value',()=>ASSETS_HELD.version)===version,'event change inside hold rebuilds');});check(!during.context,'event change inside hold not retained');
const midnight={};value(midnight);holdCarry1066(midnight,()=>{day='2026-10-20';});check(!midnight.context,'midnight during calculation not retained');
const errors={};value(errors);try{holdCarry1066(errors,()=>{throw Error('expected');});}catch(e){}check(!errors.context,'exception invalidates carry');check(!ASSETS_HELD&&HELD_MEMO.size===0&&!HELD_STALE775,'exception restores hold state');
this.result={checks:passes,builds};
`, ctx);
console.log(JSON.stringify({author:'Andrew Fisher',...ctx.result,passed:true}));
