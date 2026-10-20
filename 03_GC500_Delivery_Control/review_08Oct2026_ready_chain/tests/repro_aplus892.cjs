// Author: Andrew Fisher.
// Portable, public-safe v8.92 review reproduction: no browser, network or record writes.
// Usage: node repro_aplus892.cjs <candidate.html> [aplus892-source.js] [--expect-fixed]
// Defaults to the neighbouring repository source. Executes the candidate's embedded
// code, and reports whether it matches that source. No embedded DATA is parsed.
// Default success means both reviewed defects reproduce; --expect-fixed expects
// correct behaviour instead. Finance rows/labour are synthetic version counters:
// that case tests wrapper invalidation, not financial calculations.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const vm = require('vm');
const assert = require('assert/strict');

function main() {
const args = process.argv.slice(2), expectFixed = args.includes('--expect-fixed');
const positional = args.filter(arg => arg !== '--expect-fixed');
if (!positional[0] || positional.length > 2) {
  throw new Error('Usage: node repro_aplus892.cjs <candidate.html> [aplus892-source.js] [--expect-fixed]');
}
const html = fs.readFileSync(positional[0], 'utf8');
const sourcePath = positional[1] || path.resolve(__dirname, '../../v8.92_a_plus_pass_DRAFT/aplus892.js');
const source = fs.readFileSync(sourcePath, 'utf8');
function section(text, start, end) {
  const begin = text.indexOf(start);
  assert(begin >= 0, 'Missing source anchor: ' + start);
  const finish = text.indexOf(end, begin + start.length);
  assert(finish > begin, 'Missing end anchor: ' + end);
  return text.slice(begin, finish);
}
const scriptStart = '<script id="aplus892-script">';
const aplus = section(html, scriptStart, '</script>').slice(scriptStart.length);
const results = [];
const record = result => results.push(result);
const today = section(html,'var TodayWork840 = (() => {','function todayWorkDay841()');
const motion = section(today,'  function motionOff() {','  function pauseNativeMotion() {');
const mount = section(today,'  function mount() {','  return {build, capture, restore, mount, stop, report:');
function testMotion(src) {
 const c = { console, innerHeight:900, innerWidth:1440 }; c.window = c;
 vm.createContext(c);
 vm.runInContext(`
 let areas=[{id:'buildings',name:'Buildings'}], selected=null, running=null, runningInstrument=null, motionMode='auto', printing=false, observed=[], observer=null;
 const mq={matches:false};
 const rect=()=>({top:100,bottom:200,left:0,right:100,width:100,height:100});
 function newCard() {
  const classes=new Set(), span={textContent:'Play'}, attrs={'aria-pressed':'false'};
  const button={disabled:false,title:'Display animation only',setAttribute(k,v){attrs[k]=v},querySelector(s){return s==='span'?span:{setAttribute(){}}}};
  const light={getBoundingClientRect:rect,closest(){return null}};
  return {dataset:{tw840Area:'buildings'},isConnected:true,attrs,span,classes,
   classList:{toggle(k,v){if(v)classes.add(k);else classes.delete(k)}},
   querySelector(s){if(s==='[data-tw848-group-fold]')return {open:true};if(s==='.tw846-lights')return light;if(s==='[data-tw840-motion]')return button;return null},querySelectorAll(){return []}};
 }
 let currentCard=newCard();
 const root={querySelectorAll(){return [currentCard]},querySelector(){return null}};
 const main={getBoundingClientRect:rect};
 const todayPane={hidden:false,closest(){return main}};
 function board(){return root}; function pane(){return todayPane};
 function getComputedStyle(){return {display:'block'}};
 const document={hidden:false,documentElement:{dataset:{}},getElementById(){return null}};
 function timeline841ModalOpen(){return false};
 function install(){};function updateDialog(){};function scheduleHealth(){};
 ` + src + '\n' + mount, c);
 vm.runInContext(`mount();before={running,classes:[...currentCard.classes],button:currentCard.span.textContent,pressed:currentCard.attrs['aria-pressed']};currentCard=newCard();mount();after={running,classes:[...currentCard.classes],button:currentCard.span.textContent,pressed:currentCard.attrs['aria-pressed']};`,c);
 return {before:c.before,after:c.after};
}
const fastLine = "    if (running && running === was892 && runningInstrument && runningInstrument.cardId === running) return; /* v8.92 - the same instrument still running: nothing on the cards changes, so nothing is rewritten */";
if (!expectFixed) assert(motion.includes(fastLine), 'Expected the reviewed v8.92 shortcut');
const currentMotion = testMotion(motion), baselineMotion = testMotion(motion.replace(fastLine,''));
assert(currentMotion.before.classes.includes('tw840-running'));
assert.equal(currentMotion.after.classes.includes('tw840-running'), expectFixed, 'Motion state after replacement DOM');
assert(baselineMotion.after.classes.includes('tw840-running'));
record({case:'Today redraw same visible card',candidate:currentMotion,withoutShortcut:baselineMotion});
const c={console};c.window=c;vm.createContext(c);
vm.runInContext(`
let GO_CHANGED=false, y=900, max=2000, now=0, rafId=0;
const state={tab:'source'};let activePane={isConnected:true};
const frames=new Map(), listeners=new Map();
const main={isConnected:true,clientHeight:500,get scrollHeight(){return max+500},get scrollTop(){return y},set scrollTop(v){y=Math.max(0,Math.min(max,v))}};
const document={querySelector(s){return s==='main' ? main : activePane}};
const performance={now(){return now}};
function requestAnimationFrame(f){frames.set(++rafId,f);return rafId};function cancelAnimationFrame(id){frames.delete(id)};
function addEventListener(n,f){if(!listeners.has(n))listeners.set(n,new Set());listeners.get(n).add(f)};function removeEventListener(n,f){listeners.get(n)?.delete(f)};
function render(){if(GO_CHANGED){max=2000;main.scrollTop=0}else{max=100;main.scrollTop=0}};
function flushFrame(){const pending=[...frames.values()];frames.clear();pending.forEach(f=>f())};
`+aplus,c);
vm.runInContext(`render();afterRefresh={scroll:main.scrollTop,pending:frames.size};state.tab='destination';activePane={isConnected:true};GO_CHANGED=true;render();GO_CHANGED=false;afterTabChange={scroll:main.scrollTop,pending:frames.size};flushFrame();afterOldFrame={scroll:main.scrollTop,pending:frames.size};`,c);
assert.equal(c.afterRefresh.pending,1);assert.equal(c.afterTabChange.scroll,0);assert.equal(c.afterOldFrame.scroll,expectFixed ? 0 : 900);
record({case:'Delayed render scroll restoration after programmatic/hash tab change',afterRefresh:c.afterRefresh,afterTabChange:c.afterTabChange,afterOldFrame:c.afterOldFrame});
const m={console};m.window=m;vm.createContext(m);
const holding=section(html,'let ASSETS_HELD = null;','function buildAllAssets(){');
const save=section(html,'function save(){','function save775Inner(){');
const drop=section(html,'function dropFileIndex(){','function dropPhotoMatch(');
const book=section(html,'function bookNumbers(){','const COLLECT_WORDS');
const no=section(html,'function docketNoInName(nm){','/* v5.66 — ASKING IS WHAT LOADS IT, HERE TOO.');
const papers=section(html,'function docketPapersByName(d){','function docketPaperBlock(');
const evs=section(html,'function fin745Events()','function fin745Leaves(');
vm.runInContext(`
let version=0;
const S={finance745:{}}, DOCS={files:{}}, RENDER_MEMO=new Map();
function buildAllAssets(){return [{key:'SAMPLE',asset_numbers:[String(7000000+version)]}]};
function save775Inner(){return true};
function allDockets(){return [{id:'d1',docket_no:String(4000+version)}]};
function serviceNoteRows(){return []};function collectionRows(){return []};
function docketPapersOf(){return []};function photoIndex(){return {state:'ready',files:DOCS.files}};
function fin745Plain(v){return v&&typeof v==='object'};
function fin745Rows(day){return [{day,version}]};
function todayIso(){return '2030-01-08'};
function labourPlan(){return {version}};
function replace(){DOCS.files={['file'+version]:{id:'file'+version,name:String(4000+version)+'.jpg',kind:'docket'}};S.finance745={['event'+version]:{id:'event'+version,kind:'rate',key:'person',at:'2030-01-08T00:00:00Z'}}};replace();
`+holding+save+drop+book+no+papers+evs+aplus,m);
vm.runInContext(`
cacheResult=holdAssets(()=>{
 const a={drop:dropFileIndex(),book:bookNumbers(),events:fin745Events(),history:fin745History('rate','person'),rows:fin745Rows(),labour:labourPlan()};
 const before={docket:docketNoInName('4000.jpg'),paper:docketPapersByName({id:'d1',docket_no:'4000'})[0].id};
 const same=a.drop===dropFileIndex()&&a.book===bookNumbers()&&a.events===fin745Events()&&a.history===fin745History('rate','person')&&a.rows===fin745Rows()&&a.labour===labourPlan();
 version=1;replace();save();
 const b={drop:dropFileIndex(),book:bookNumbers(),events:fin745Events(),history:fin745History('rate','person'),rows:fin745Rows(),labour:labourPlan()};
 return {sameWithinHold:same,rebuiltAfterSave:Object.keys(a).every(k=>a[k]!==b[k]),before,after:{docket:docketNoInName('4001.jpg'),oldDocket:docketNoInName('4000.jpg'),paper:docketPapersByName({id:'d1',docket_no:'4001'})[0].id,historyId:b.history[0].id,rowsVersion:b.rows[0].version,labourVersion:b.labour.version},asOfSeparated:fin745Rows('2030-01-01')!==fin745Rows('2030-01-08')};
});
cacheResult.memoClearedAfterHold=HELD_MEMO.size===0&&ASSETS_HELD===null;
cacheResult.outsideHoldFresh=dropFileIndex()!==dropFileIndex()&&bookNumbers()!==bookNumbers()&&fin745Events()!==fin745Events();
`,m);
assert(m.cacheResult.sameWithinHold&&m.cacheResult.rebuiltAfterSave&&m.cacheResult.memoClearedAfterHold&&m.cacheResult.outsideHoldFresh&&m.cacheResult.asOfSeparated);
assert.equal(m.cacheResult.after.docket,'4001');assert.equal(m.cacheResult.after.oldDocket,null);assert.equal(m.cacheResult.after.paper,'file1');assert.equal(m.cacheResult.after.historyId,'event1');
record({case:'Exact heldMemo/save lifecycle and memoized file/docket/finance wrappers',...m.cacheResult});
vm.runInContext(`function $(s){return main};`+section(html,'function navScrollTo(y){','function setHash('),c);
vm.runInContext(`
state.tab='source';activePane={isConnected:true};max=2000;main.scrollTop=900;render();
state.tab='destination';activePane={isConnected:true};GO_CHANGED=true;render();GO_CHANGED=false;max=200;main.scrollTop=0;
navScrollTo(0);flushFrame();
afterBackFrame={scroll:main.scrollTop,pending:frames.size};
max=2000;flushFrame();afterTargetBatch={scroll:main.scrollTop,pending:frames.size};
`,c);
assert.equal(c.afterBackFrame.scroll,0);assert.equal(c.afterBackFrame.pending,expectFixed ? 0 : 1);assert.equal(c.afterTargetBatch.scroll,expectFixed ? 0 : 900);
record({case:'Native Back scroll restoration completes before destination rows finish',afterBackFrame:c.afterBackFrame,afterTargetBatch:c.afterTargetBatch});

process.stdout.write(JSON.stringify({
  author: 'Andrew Fisher',
  candidateSha256: crypto.createHash('sha256').update(html).digest('hex'),
  sourceMatchesCandidate: source.trim() === aplus.trim(),
  expected: expectFixed ? 'corrected behaviour' : 'reviewed defects reproduced',
  pass: true,
  results
}, null, 2) + '\n');
}
try { main(); }
catch (error) {
  process.stderr.write('v8.92 review fixture: ' + error.message + '\n');
  process.exitCode = 1;
}
