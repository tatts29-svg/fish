/* Author: Andrew Fisher. Test-only adapter around the shared read-only browser harness. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const inheritedOverrides=['PAGE','GC500_MEDIA_BASE','MEDIA','MEDIA893','MEDIA889','ATLAS896'].filter(key=>process.env[key]);
if(inheritedOverrides.length)throw new Error('Clear inherited browser/media overrides before validation: '+inheritedOverrides.join(', '));
const TOOLCHAIN = path.resolve(__dirname, '../../../toolchain');
const HOST = 'https://gc500-production.up.railway.app';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
function privatePath(value, label) {
  if (!value) throw new Error(`${label} is required`);
  const out = path.resolve(value), repo = path.resolve(__dirname, '../../../..');
  if (out === repo || out.startsWith(repo + path.sep)) throw new Error(`${label} must be outside the repository (private data)`);
  return out;
}
const FIXTURE = privatePath(process.env.GC500_FIXTURE, 'GC500_FIXTURE');
fs.mkdirSync(FIXTURE, {recursive: true, mode: 0o700});
const fixture = {capture: process.env.GC500_CAPTURE === '1', offline: false, delayMs: 0, delayRemaining: 0, hits: 0, recorded: 0, missing: new Set()};
const net = require(path.join(TOOLCHAIN, 'harness/curlfetch.js')), nativeFetch = net.curlFetch;
function frozenUrl(u) {
  const url = new URL(u);
  for (const key of ['_', 't', 'ts', 'cb', 'nocache']) if (/^\d+$/.test(url.searchParams.get(key) || '')) url.searchParams.set(key, 'FIXED');
  return url.href;
}
function freezeable(u) { return /\/api\//.test(u) || /api\.open-meteo\.com|api\.weatherapi\.com/.test(u); }
net.curlFetch = async function(url, headers, method, body) {
  if (method !== 'GET') return nativeFetch(url, headers, method, body); // canonical harness blocks all operational writes first
  if (!freezeable(url)) return nativeFetch(url, headers, method, body);
  if (fixture.offline && url.startsWith(HOST + '/api/')) return {status: 503, headers: {'content-type': 'application/json'}, body: Buffer.from('{"error":"test connection unavailable"}')};
  if (/\/api\/state(?:\?|$)/.test(url) && fixture.delayRemaining > 0) { fixture.delayRemaining--; await new Promise(r => setTimeout(r, fixture.delayMs)); }
  const key = sha(frozenUrl(url)), file = path.join(FIXTURE, key);
  if (fs.existsSync(file + '.json')) { fixture.hits++; const meta = JSON.parse(fs.readFileSync(file + '.json')); return {...meta, body: fs.readFileSync(file + '.body')}; }
  if (!fixture.capture) { fixture.missing.add(key); throw new Error('Uncaptured frozen endpoint ' + key); }
  const result = await nativeFetch(url, headers, method, body);
  // Include refusals: a view-only /api/reports refusal is part of the frozen capability, not absent evidence.
  fs.writeFileSync(file + '.body', result.body, {mode: 0o600});
  fs.writeFileSync(file + '.json', JSON.stringify({status: result.status, headers: result.headers}), {mode: 0o600});
  fixture.recorded++; return result;
};
// Observe console messages from before navigation without forking the canonical route/write guard.
const consoleByPage=new WeakMap(),{chromium}=require('playwright'),nativeLaunch=chromium.launch.bind(chromium);
chromium.launch=async options=>{const browser=await nativeLaunch(options),nativeContext=browser.newContext.bind(browser);browser.newContext=async options=>{const ctx=await nativeContext(options);ctx.on('page',page=>{const errors=[];consoleByPage.set(page,errors);page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text().slice(0,300));});});return ctx;};return browser;};
const {open} = require(path.join(TOOLCHAIN, 'harness/open_page.js'));
const CLOCK_ISO = '2026-10-18T09:30:00+10:00';
const CLOCK = `(() => { const NativeDate=Date; let now=NativeDate.parse(${JSON.stringify(CLOCK_ISO)}); function FixedDate(...a){ if(!new.target)return new NativeDate(now).toString(); return Reflect.construct(NativeDate,a.length?a:[now],new.target); } Object.setPrototypeOf(FixedDate,NativeDate); FixedDate.prototype=NativeDate.prototype; FixedDate.now=()=>now; window.Date=FixedDate; window.__validationClock={set:x=>{now=Number(x)},get:()=>now}; })();`;
const PROBE = `(() => { const P=window.__validation={lt:[],ls:[],states:[],tabs:[],marks:{},lastTab:null,usable:null};
 try{new PerformanceObserver(l=>l.getEntries().forEach(e=>P.lt.push([e.startTime,e.duration]))).observe({type:'longtask',buffered:true});}catch(e){}
 try{new PerformanceObserver(l=>l.getEntries().forEach(e=>P.ls.push([e.startTime,e.value,e.hadRecentInput]))).observe({type:'layout-shift',buffered:true});}catch(e){}
 function check(){const html=document.documentElement;if(!html)return; const value=html.getAttribute('data-refresh904'); if(value&&(!P.states.length||P.states.at(-1)[1]!==value))P.states.push([performance.now(),value]);
  try{const tab=state.tab;if(tab!==P.lastTab){P.lastTab=tab;P.tabs.push([performance.now(),tab]);} const pane=document.getElementById('pane-'+tab);
   if(P.usable==null&&value&&value!=='loading'&&SYNC.status==='live'&&pane&&!pane.hidden&&pane.innerText.trim()){requestAnimationFrame(()=>setTimeout(()=>{if(P.usable==null)P.usable=performance.now();},0));}}
  catch(e){} }
 new MutationObserver(check).observe(document,{subtree:true,childList:true,attributes:true,attributeFilter:['data-refresh904','hidden','aria-selected']});
 document.addEventListener('DOMContentLoaded',()=>{P.marks.dcl=performance.now();check()}); addEventListener('load',()=>{P.marks.load=performance.now();check()});
 })();`;
async function launch({pageFile, mobile=false, cpu=0, hash='#today', freezeClock=true, init=''}={}) {
  const s = await open({pageFile, hash, init:(freezeClock?CLOCK:'')+PROBE+init, cpu, ...(mobile?{W:390,H:844,dpr:2,mobile:true}:{W:1440,H:900})});
  s.consoleErrors = consoleByPage.get(s.page)||[];
  return s;
}
async function ready(s, timeout=240000) {
  await s.page.waitForFunction(() => typeof SYNC!=='undefined' && SYNC.status==='live' && typeof DOCS!=='undefined' && DOCS.state==='ready' && document.documentElement.getAttribute('data-refresh904')!=='loading', null, {timeout, polling:250});
}
async function mergeReport(p){return p.evaluate(()=>{const names=Object.keys(SYNC_COLLS),missing=names.filter(name=>!SYNC.first.has(name)),pending=Object.keys(SYNC.pending),scopesConsistent=typeof ScopeSync1017!=='undefined'&&ScopeSync1017.same(SYNC_COLLS.qtys.get(),S);return {expected:names.length,missing,pending,scopesConsistent,complete:!missing.length&&!pending.length&&scopesConsistent};});}
async function settled(p, quiet=1200, max=60000) {
  const started=Date.now();
  while(Date.now()-started<max){
    const ok=await p.evaluate(quiet=>{const lt=window.__validation.lt.filter(x=>x[1]>250),last=lt.length?lt.at(-1)[0]+lt.at(-1)[1]:0;return performance.now()-last>quiet;},quiet);
    if(ok&&Date.now()-started>=quiet)return; await p.waitForTimeout(250);
  }
  throw new Error('Page failed to reach a quiet interval');
}
// Baseline Build progress is deliberately demand-driven. Visit each pending card through its real viewport,
// then restore scroll, so exact text parity compares completed facts rather than timing-dependent Loading… labels.
async function materializeBuild(p) {
  const saved=await p.evaluateHandle(()=>{const strip=document.querySelector('#pane-timeline .daystrip');if(!strip)throw new Error('Build strip missing');const ancestors=[];for(let el=strip;el;el=el.parentElement)ancestors.push({el,left:el.scrollLeft,top:el.scrollTop});return {left:strip.scrollLeft,ancestors};});
  const started=Date.now();let visited=0;
  try {
    while(true){
      const day=await p.evaluate(()=>document.querySelector('#pane-timeline .bc984-day[data-build-progress="pending"]')?.dataset.day||null);
      if(!day)break;if(Date.now()-started>120000)throw new Error('Build progress did not finish within the demand-sweep limit');
      await p.evaluate(async day=>{const card=[...document.querySelectorAll('#pane-timeline .bc984-day')].find(x=>x.dataset.day===day);if(!card)throw new Error('Build card disappeared');card.scrollIntoView({block:'nearest',inline:'center',behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));window.BuildProgress986?.sync();},day);
      await p.waitForFunction(day=>{const card=[...document.querySelectorAll('#pane-timeline .bc984-day')].find(x=>x.dataset.day===day);return !!card&&card.dataset.buildProgress!=='pending';},day,{timeout:30000,polling:100});visited++;
    }
  } finally {
    await p.evaluate(saved=>{for(const x of saved.ancestors)if(x.el.isConnected){x.el.scrollLeft=x.left;x.el.scrollTop=x.top;}const strip=document.querySelector('#pane-timeline .daystrip');if(strip)strip.scrollLeft=saved.left;},saved);
    await saved.dispose();await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  }
  return visited;
}
function writePrivate(file, value) { file=privatePath(file,'output'); fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700}); fs.writeFileSync(file,JSON.stringify(value,null,2),{mode:0o600}); }
function normaliseText(value) { return String(value??'').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim(); }
async function capturePane(p,tab) {
  if(tab==='today'||tab==='progress')await p.waitForFunction(()=>[...document.querySelectorAll('[data-w885-pct]')].every(el=>el.textContent===el.dataset.text),null,{timeout:15000,polling:100});
  const capture=()=>p.evaluate(tab=>{const el=document.querySelector('#pane-'+tab);if(!el)throw new Error('Missing pane '+tab);const c=el.cloneNode(true);c.querySelectorAll('style,script').forEach(x=>x.remove());return {visible:el.innerText,full:c.textContent};},tab);
  const out=await capture();
  if(tab==='today'||tab==='progress'){
    // Expose the deferred, screen-hidden report only for full-content comparison, then preserve the
    // normal render() order: native operational finance filtering follows rendering. The independent
    // Print suite must never apply this filter, because native printing has its own report lifecycle.
    await p.evaluate(()=>{if(typeof TodayReport1066!=='undefined')TodayReport1066.flush();financeOperational857();});
    out.full=(await capture()).full;
  }
  return out;
}
function canonicalRecord(value){if(Array.isArray(value))return value.map(canonicalRecord);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalRecord(value[key])]));return value;}
function recordDelta(before,after){
  const changes=[];
  function visit(a,b,path){if(JSON.stringify(canonicalRecord(a))===JSON.stringify(canonicalRecord(b)))return;
    if(a&&b&&typeof a==='object'&&typeof b==='object'&&Array.isArray(a)===Array.isArray(b)){
      for(const key of new Set([...Object.keys(a),...Object.keys(b)]))visit(a[key],b[key],path.concat(key));
    }else changes.push({path,beforeSha256:sha(JSON.stringify(a)??'undefined'),afterSha256:sha(JSON.stringify(b)??'undefined')});
  }
  visit(before,after,[]);return changes;
}
function normaliseFooter(value) {return normaliseText(value).replace(/ · v10\.(?:65|66)$/, ' · RELEASE');}
function frozenVersions(){
  const read=suffix=>{const file=path.join(FIXTURE,sha(HOST+suffix)+'.body');return fs.existsSync(file)?JSON.parse(fs.readFileSync(file)).version:null;};
  const version=read('/api/version'),state=read('/api/state');return {version,state,consistent:typeof version==='number'&&version===state};
}
function errorsOf(s) {return {pageErrors:s.errors, consoleErrors:s.consoleErrors, blocked:s.counts.blocked, missingFixture:[...fixture.missing],fixtureVersions:frozenVersions()};}
function assertClean(s) {const e=errorsOf(s); if(e.pageErrors.length||e.consoleErrors.length||e.blocked||e.missingFixture.length||!e.fixtureVersions.consistent)throw new Error('Read-only browser checks failed: '+JSON.stringify(e));}
module.exports={fs,path,sha,fixture,launch,ready,mergeReport,settled,materializeBuild,capturePane,writePrivate,normaliseText,normaliseFooter,canonicalRecord,recordDelta,errorsOf,assertClean,CLOCK_ISO,HOST};
