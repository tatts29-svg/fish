// Author: Andrew Fisher. Reuse the owned upstream money invariant, with atomic
// record/version/date capture and one clock across both sessions. No saved record
// or model values: snapshots stay in process memory and logs contain only checks.
// BASE=<v892.before.html> PAGE=<final candidate> [MOB=1] node test_money892_pinned.cjs
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module');
const upstream=path.resolve(__dirname,'../../v8.92_a_plus_pass_DRAFT/tests/test_money892.cjs');
function adapt(source) {
 const once=(old,replacement)=>{
  const count=source.split(old).length-1;
  if(count!==1)throw new Error('Money fixture source anchor changed ('+count+' matches); review wrapper against upstream');
  source=source.replace(old,replacement);
 };
 once("const figures = async (pageFile, MOB) =>", "const PINNED_NOW = Date.now();\nconst figures = async (pageFile, MOB) =>");
 once("try { const p = s.page;", `try { const p = s.page;
  // Timers/performance continue normally; calendar and timestamp readers share a single instant.
  await p.evaluate(epoch => {
    const NativeDate=Date;
    function FixedDate(...args) { if(new.target)return new NativeDate(...(args.length?args:[epoch])); return new NativeDate(epoch).toString(); }
    Object.setPrototypeOf(FixedDate,NativeDate);FixedDate.prototype=NativeDate.prototype;FixedDate.now=()=>epoch;window.Date=FixedDate;
  }, PINNED_NOW);`);
 once('const J = await p.evaluate(() => holdAssets(() => {', `const snap = await p.evaluate(() => holdAssets(() => {
    const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
    const snapshot=JSON.stringify(canonical({state:S,committed:COMMITTED}));`);
 once('return JSON.stringify({M:', 'const J = JSON.stringify({M:');
 once('LP: {all: LP.all}}); }));', `LP: {all: LP.all}});
    // No asynchronous gap between the values, the native record and its version/date.
    return {J,snapshot,stable:snapshot===JSON.stringify(canonical({state:S,committed:COMMITTED})),ver:SYNC.backend.readVersion821(),day:todayIso(),now:Date.now()}; }));`);
 once("const ver = await p.evaluate(() => { try { return SYNC.backend.readVersion821(); } catch (e) { return null; } }), day = await p.evaluate(() => todayIso());", "const {J,ver,day,snapshot,stable,now}=snap;");
 once('return {J, version, has892, ver, day, errors:', 'return {J, version, has892, ver, day, snapshot, stable, now, errors:');
 // Retain upstream's bounded retry/inconclusive policy, and require identical native
 // input content as well as the same version. Values never reach comparison on drift.
 source=source.replaceAll('a.ver !== b.ver || a.day !== b.day','a.ver !== b.ver || a.day !== b.day || a.snapshot !== b.snapshot || a.now !== b.now');
 once("ok('both pages read the same shared record (version '", "ok('both pages read identical native record content at one instant (version '");
 once("a.ver != null && a.ver === b.ver && a.day === b.day, {base:", "a.ver != null && a.ver === b.ver && a.day === b.day && a.snapshot === b.snapshot && a.now === b.now && a.now === PINNED_NOW, {base:");
 once("ok('no writes attempted', a.blocked === 0 && b.blocked === 0, {});", "ok('no writes attempted and models do not mutate the record', a.blocked === 0 && b.blocked === 0 && a.stable && b.stable, {});");
 const excerpt=source.split('\n').find(line=>line.trimStart().startsWith('if (!same) { const A = words(a.J)'));
 if(!excerpt)throw new Error('Missing upstream private-value excerpt guard');
 once(excerpt, "  // Full model excerpts are deliberately omitted; mismatch indexes above are sufficient.");
 once("{base: a.errors.slice(0, 3), cand: b.errors.slice(0, 3)}", "{baseErrors:a.errors.length,candidateErrors:b.errors.length}");
 once("console.error('TEST FAIL', e);", "console.error('TEST FAIL money invariant could not complete: '+String(e && e.name || 'Error'));" );
 return source;
}
function run() {
 const code=adapt(fs.readFileSync(upstream,'utf8'));
 const child=new Module(upstream,module);child.filename=upstream;child.paths=Module._nodeModulePaths(path.dirname(upstream));
 child._compile(code,upstream);
}
module.exports={adapt};
if(require.main===module)run();
