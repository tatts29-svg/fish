/* Author: Andrew Fisher. Only three complete reviewed explorer builds may receive the shape layer. */
'use strict';
const fs = require('fs'), vm = require('vm'), assert = require('node:assert/strict');
assert(process.argv[2], 'Pass the built GC500 HTML path');
const page = fs.readFileSync(process.argv[2], 'utf8');
const names = ['EXPLORER_BUILD', 'EXPLORER_BUILD_1064', 'EXPLORER_BUILD_1065'];
const constants = names.map(name => {
  const matches = [...page.matchAll(new RegExp('^\\s*const ' + name + ' = [^\\n]+', 'gm'))];
  assert.equal(matches.length, 1, 'Exactly one ' + name + ' declaration');
  return matches[0][0];
}).join('\n');
const at = page.indexOf(' function mount(frame){', page.indexOf('const EXPLORER_BUILD ='));
const end = page.indexOf('\n W.gc500ShapeLayer1060', at);
assert(at >= 0 && end > at, 'Find the actual shape-layer mount guard');
const origin = 'https://gc500-production.up.railway.app';
const api = vm.runInNewContext(constants + '\n' + page.slice(at, end) +
  ';({mount,builds:[' + names.join(',') + ']})', {
    URL, location: {href: origin + '/v/Coates-GC500-2026', origin}, FRAME_JS: '/* test injection */'
  });

// Independent expected sets: accepting arbitrary combinations of these pins is unsafe.
const original = [
  'explorer.js?v=8586cb7d5008',
  'explorer-merge.js?v=97a4087210f3',
  'fencing-map-core.js?v=0c26c3b7777f',
  'fencing-map-explorer.js?v=e3a4bef6c17d',
  'explorer-fix864.js?v=d7041320fc3f',
  'explorer-fix887.js?v=6996471a6a0f'
];
const reviewed1064 = [...original];
reviewed1064[0] = 'explorer.js?v=c096837cb410';
const reviewed1065 = [...reviewed1064];
reviewed1065[0] = 'explorer.js?v=e175ec073b2d';
reviewed1065[1] = 'explorer-merge.js?v=7c276bb18154';
const reviewed = [original, reviewed1064, reviewed1065].map(parts => parts.join('|'));
assert.deepEqual(Array.from(api.builds), reviewed, 'Only the three reviewed complete builds are declared');

function frame(scripts, url = origin + '/w/Coates-GC500-2026/explorer/index.html', installed = true) {
  const win = {drawMarks() {}};
  if (installed) win.GC500Shape1060 = {};
  const result = {contentWindow: win, injected: []};
  result.contentDocument = {
    head: {appendChild(script) {result.injected.push(script); win.GC500Shape1060 = {};}},
    readyState: 'complete', URL: url,
    querySelectorAll: () => scripts.split('|').map(src => ({getAttribute: () => src})),
    getElementById: () => ({}), createElement: () => ({})
  };
  return result;
}
let checks = 0;
function check(scripts, accepted, label, url) {
  for (const installed of [false, true]) {
    const candidate = frame(scripts, url, installed);
    assert.equal(api.mount(candidate), accepted, label + (installed ? ' (already mounted)' : ' (fresh)'));
    assert.equal(candidate.injected.length, accepted && !installed ? 1 : 0, label + ': injection guard');
    checks++;
  }
}
for (const [version, source] of reviewed.entries()) {
  check(source, true, 'Reviewed build ' + version);
  for (let i = 0; i < original.length; i++) {
    const parts = source.split('|');
    const corrupt = [...parts]; corrupt[i] = corrupt[i].replace(/\?v=.*/, '?v=000000000000');
    check(corrupt.join('|'), false, 'Wrong pin ' + version + '/' + i);
    const bare = [...parts]; bare[i] = bare[i].split('?')[0];
    check(bare.join('|'), false, 'Missing pin ' + version + '/' + i);
    check(parts.filter((_, j) => j !== i).join('|'), false, 'Missing script ' + version + '/' + i);
    check([...parts, parts[i]].join('|'), false, 'Duplicate script ' + version + '/' + i);
  }
  check(source + '|extra.js', false, 'Unreviewed extra script ' + version);
  check(source.split('|').reverse().join('|'), false, 'Reordered scripts ' + version);
}
for (const explorer of [original[0], reviewed1064[0], reviewed1065[0]]) {
  for (const merge of [original[1], reviewed1065[1]]) {
    const source = [explorer, merge, ...original.slice(2)].join('|');
    check(source, reviewed.includes(source), 'Explorer/merge combination ' + explorer + '/' + merge);
  }
}
for (const url of [
  'https://example.com/explorer/index.html',
  'http://gc500-production.up.railway.app/w/Coates-GC500-2026/explorer/index.html',
  origin + '/not-explorer.html', origin + '/explorer/index.html/extra'
]) check(reviewed[2], false, 'Unexpected origin/path ' + url, url);
console.log(`PASS ${checks} exact build/origin/path guard cases (fresh and already-mounted frames)`);
