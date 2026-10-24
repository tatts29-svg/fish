// Author: Andrew Fisher. v11.90 rules: the build is the live page plus the banner-off block and the footer, nothing else.
//   PAGE=build/GC500_v11.90/GC500_Delivery_Control_hosted.html BASE=build/GC500_v11.90/base_live.html node tests/test_rules1190.cjs
const assert = require('node:assert/strict'), fs = require('node:fs'), vm = require('node:vm'), path = require('node:path');
const dir = path.resolve(__dirname, '..'), page = fs.readFileSync(process.env.PAGE, 'utf8'), base = fs.readFileSync(process.env.BASE, 'utf8');
let checks = 0; const check = (ok, msg) => { assert(ok, msg); checks++; };
const i = page.indexOf('<script id="clean1190-script">'), j = page.indexOf('<script id="steady1143-script">', i);
check(i > 0 && j > i, 'one v11.90 block, before the anchor');
const block = page.slice(i, j), src = fs.readFileSync(path.join(dir, 'clean1190_src.js'), 'utf8');
check(block === '<script id="clean1190-script">\n' + src + '\n</script>\n', 'the block is this folder\'s source exactly');
check(page.replace(block, '').replace("+' · v11.90'; /* v8.19 release922", "+' · v11.89'; /* v8.19 release922") === base, 'the build is the live page plus the block and the footer only');
check(page.indexOf('<script id="ms1026-script">') < i && page.indexOf('<script id="ms1025-script">') < i, 'the milestone scripts load before it, untouched');

// The wrapper on a stand-in: the original still runs (and its burst), then the banner is gone; applied once.
const removed = [], el = {remove() { removed.push(1); }};
let ran = 0, present = true;    // a banner already drawn before this script loads
const doc = {getElementById: id => (id === 'ms1026' && present ? (present = false, el) : null)};
const W = {ms1026After: o => { ran++; present = true; return 'played'; }};
vm.runInNewContext(src, {window: W, document: doc});
check(removed.length === 1, 'a banner already drawn when the script loads is removed');
check(W.ms1026After({fire: [1]}) === 'played' && ran === 1 && removed.length === 2, 'the original runs (its burst included), then its banner is removed');
const once = W.ms1026After; vm.runInNewContext(src, {window: W, document: doc});
check(W.ms1026After === once, 'applied once');
console.log(JSON.stringify({checks}));
