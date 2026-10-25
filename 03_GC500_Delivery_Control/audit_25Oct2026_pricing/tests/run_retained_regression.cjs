// Author: Andrew Fisher. Re-run the released audit on pinned pages; keep financial output private.
'use strict';
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const {spawn} = require('node:child_process');
const assert = require('node:assert/strict');
const release = path.resolve(__dirname,'../../v12.16_fence_once_gn20_LIVE');
const repo = path.resolve(__dirname,'../../..');
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.equal(sha(process.env.BASE),'786142f3208a03ac732286e5421e981f8c3b8b9dd77fbd8558f3ec88d760c427','expected archived v12.15 baseline');
assert.equal(sha(process.env.BUILD),'1c1a981c3f674c481a0c99e13cb4b93d311396132af54bef5bd66d401addd5f5','expected audited v12.17 page');
assert(process.env.PRIVATE_LOG,'PRIVATE_LOG must name a file outside every checkout');
const log = path.resolve(process.env.PRIVATE_LOG);
assert(log!==repo&&!log.startsWith(repo+path.sep),'private log must be outside the repository');
let source = fs.readFileSync(path.join(release,'tests/test_v1216.cjs'),'utf8');
const oldImport = "require(path.join(__dirname, '..', '..', 'toolchain', 'harness', 'open_page'))";
const oldFooter = '/ · v12\\.16$/';
assert(source.split(oldImport).length===2&&source.split(oldFooter).length===2,'audited runner anchors changed');
source = source.replace(oldImport,'require('+JSON.stringify(path.resolve(__dirname,'../../toolchain/harness/open_page'))+')').replace(oldFooter,'/ · v12\\.17$/');
const child=spawn(process.execPath,['-'],{env:process.env,stdio:['pipe','pipe','pipe']});
const chunks=[];child.stdout.on('data',b=>chunks.push(b));child.stderr.on('data',b=>chunks.push(b));
child.on('close',code=>{
  const out=Buffer.concat(chunks);
  const secret=process.env.GC500_EDIT_TOKEN;
  assert(!secret||!out.includes(Buffer.from(secret)),'credential found in child output; log withheld');
  fs.writeFileSync(log,out,{mode:0o600});
  if(code!==0||/FAIL|could not read/.test(out.toString())||!/14\/14 (desktop|phone)/.test(out.toString())) {
    console.error('FAIL retained-release regression; details kept in PRIVATE_LOG');process.exitCode=1;return;
  }
  console.log('PASS 14 retained-release checks on audited v12.17; financial output kept private');
});
child.stdin.end(source);
