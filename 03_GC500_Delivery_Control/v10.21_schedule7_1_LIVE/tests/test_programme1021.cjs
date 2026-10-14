/* Author: Andrew Fisher. Exercises programme1021.js without a browser: with a stub 9 Oct renderer and the review
   block, GN13 / P69 / P45 gain the 15 Oct fold and every other reference renders exactly as before.
     node tests/test_programme1021.cjs */
const fs = require('fs');
const path = require('path');
const here = __dirname;
const js = fs.readFileSync(path.join(here, '..', 'programme1021.js'), 'utf8');
const review = JSON.parse(fs.readFileSync(path.join(here, '..', 'programme1021.json'), 'utf8'));
let checks = 0;
function ck(name, ok) { if (!ok) { console.error('FAIL ' + name); process.exit(1); } checks++; }

globalThis.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
globalThis.DATA = {infrastructure_review1021: review.infrastructure_review1021};
globalThis.infrastructure951Html = key => key === 'P45' ? '<details class="inst" data-infrastructure951><summary>9 Oct · P45</summary></details>' : '';
const before = globalThis.infrastructure951Html;
new Function(js)();
ck('renderer replaced', globalThis.infrastructure951Html !== before);
const gn13 = globalThis.infrastructure951Html('GN13');
ck('GN13 gains the 15 Oct fold', gn13.includes('15 Oct 2026 issue') && gn13.includes('CON WK 2') && gn13.includes('cell I101') && gn13.includes('Not stated → Complete'));
ck('GN13 fold says the base sheet is unchanged and site records stay authoritative', gn13.includes('Base information sheet and the other copies are unchanged') && gn13.includes('current site records remain authoritative'));
ck('GN13 fold carries the drawer attribute the 9 Oct hook clears on reopen', gn13.includes('data-infrastructure951'));
const p45 = globalThis.infrastructure951Html('P45');
ck('P45 keeps the 9 Oct fold first and adds the 15 Oct fold after it', p45.startsWith('<details class="inst" data-infrastructure951><summary>9 Oct · P45</summary></details>') && p45.indexOf('15 Oct 2026 issue') > 0 && p45.includes('cell I103'));
ck('P69 gains the fold', globalThis.infrastructure951Html('P69').includes('cell I102'));
ck('an untouched reference renders exactly as before', globalThis.infrastructure951Html('WC86') === '' && globalThis.infrastructure951Html('GN18') === '');
ck('no completion date is claimed', !/Source completion date:<\/strong> (?!Not stated)/.test(gn13));
ck('text is escaped', globalThis.infrastructure951Html('GN13').includes("St John") === false && globalThis.infrastructure951Html('P45').includes('St John&#39;s'));
// without the block the page renders as the 9 Oct release did
globalThis.DATA = {};
ck('no block: nothing added', globalThis.infrastructure951Html('GN13') === '' && globalThis.infrastructure951Html('P45') === before('P45'));
console.log(JSON.stringify({author: 'Andrew Fisher', pass: true, checks}));
