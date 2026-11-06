/* Author: Andrew Fisher. Synthetic display-safety regression; never opens the live service.
   Usage: node evidence/recorder_display_tests.js <unpatched v7.71 page.html> */
'use strict';
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const vm = require('node:vm'), assert = require('node:assert/strict');
const {spawnSync} = require('node:child_process');
const here = path.resolve(__dirname, '..'), base = fs.readFileSync(process.argv[2], 'utf8');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gc500-v772-display-'));
const checks = [];
function check(name, action){ action(); checks.push({name, pass: true}); }
function apply(script, file){ return spawnSync('python3', [script, file], {encoding: 'utf8'}); }
function escSource(text){
 const start = text.indexOf('const esc = s =>');
 const end = text.indexOf('\n/* v5.94', start);
 assert(start >= 0 && end > start);
 return text.slice(start, end);
}
try {
 const pagePath = path.join(tmp, 'page.html'); fs.writeFileSync(pagePath, base);
 const v770 = apply(path.join(here, '..', 'v7.70_pl_in_the_business_lines_LIVE', 'patch_v770.py'), pagePath);
 assert.equal(v770.status, 0, v770.stderr);
 const before = fs.readFileSync(pagePath, 'utf8');
 const result = apply(path.join(here, 'patch_v772.py'), pagePath);
 check('all eleven recorder replacements apply exactly once', () => assert.equal(result.status, 0, result.stderr));
 const after = fs.readFileSync(pagePath, 'utf8');
 const helper = after.match(/function recorderDisplay772\(value\)\{\n[^\n]+\n\}/)[0];
 const context = vm.createContext({}); vm.runInContext(escSource(after) + '\n' + helper, context);
 const evaluate = (name, value) => vm.runInContext(`${name}(${JSON.stringify(value)})`, context);
 check('shared HTML escaper remains byte-for-byte unchanged', () => assert.equal(escSource(after), escSource(before)));
 check('only explicit recorder call sites use the new helper', () => assert.equal((after.match(/recorderDisplay772\(/g) || []).length, 12));
 for (const [name, fragment] of [
  ['reference note', "${esc(a._note||'')}"],
  ['issue description', "${esc(seed.what || '')}"],
  ['variance reason', "${esc(seed.reason||'')}"],
  ['generic editable field', "${esc(Array.isArray(value) ? value.join('\\n') : value == null ? '' : String(value))}"]
 ]) check(`${name} input retains its original renderer`, () => { assert(before.includes(fragment)); assert(after.includes(fragment)); });
 for (const text of ['Checked via Claude during inspection', 'Discussed via Codex and confirmed', 'Delivered via Claudette', 'Note ends via Claude', 'Note ends via Codex (reviewed)']) {
  check(`editable note text preserved: ${text}`, () => assert.equal(evaluate('esc', text), text));
 }
 for (const suffix of [' via Codex', ' via Claude', ' via Codex (reviewed)', ' via Claude (reviewed)']) {
  check(`recorder-only suffix hidden: ${suffix}`, () => assert.equal(evaluate('recorderDisplay772', 'Alex Example' + suffix), 'Alex Example'));
 }
 for (const value of ['Alex via Claudette', 'Alex via Claude during inspection', 'Alex via Codex and Sam']) {
  check(`non-suffix recorder text preserved: ${value}`, () => assert.equal(evaluate('recorderDisplay772', value), value));
 }
 check('HTML escaping remains safe for notes and recorder names', () => {
  assert.equal(evaluate('esc', '<tag> via Claude & "x"'), '&lt;tag&gt; via Claude &amp; &quot;x&quot;');
  assert.equal(evaluate('recorderDisplay772', '<tag> & "x" via Claude'), '&lt;tag&gt; &amp; &quot;x&quot;');
 });
 check('display helper never mutates its source record', () => {
  vm.runInContext('var record = {by:"Alex Example via Codex",note:"Checked via Claude during inspection"}; var snapshot=JSON.stringify(record); recorderDisplay772(record.by); esc(record.note);', context);
  assert.equal(vm.runInContext('JSON.stringify(record) === snapshot', context), true);
 });
 check('embedded source data remains unchanged', () => assert(after.includes(before.match(/const DATA\s*=\s*[^\n]+/)[0])));
 check('duplicate patch refused without file changes', () => {
  assert.notEqual(apply(path.join(here, 'patch_v772.py'), pagePath).status, 0);
  assert.equal(fs.readFileSync(pagePath, 'utf8'), after);
 });
 const summary = {author: 'Andrew Fisher', fixture: 'synthetic only', passed: checks.length, failed: 0, checks};
 fs.writeFileSync(path.join(__dirname, 'recorder_display_results.json'), JSON.stringify(summary, null, 2) + '\n');
 process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
} finally { fs.rmSync(tmp, {recursive: true, force: true}); }
