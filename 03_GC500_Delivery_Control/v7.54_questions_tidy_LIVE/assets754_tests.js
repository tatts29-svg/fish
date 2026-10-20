// Author: Andrew Fisher. Numbering regressions; no service access or record writes.
const fs = require('fs'), vm = require('vm'), path = require('path');
const page = fs.readFileSync(process.env.PAGE, 'utf8');
const start = page.indexOf('function locNums(a){'), end = page.indexOf('\n}\n', start) + 2;
if (start < 0 || end < start) throw new Error('locNums missing');
const fn = page.slice(start, end), checks = [];
function check(name, actual, expected) { checks.push({name, pass: JSON.stringify(actual) === JSON.stringify(expected), actual, expected}); }
function counts(subs, nums = [], qty = 2, flags = {}) {
 const ctx = {subOf: () => subs, locQty: () => qty, lineUnitNums: () => [], Math, Set, String, JSON};
 vm.createContext(ctx); vm.runInContext(fn, ctx);
 return ctx.locNums(Object.assign({key: 'WC99', asset_numbers: nums}, flags));
}
check('A supplier name alone leaves the fleet number missing', counts([{co: 'Event Portables', no: ''}]).n, 0);
check('Whitespace fleet numbers do not close the question', counts([{co: 'Event Portables', no: '   '}]).n, 0);
check('A real supplier fleet number counts', counts([{co: 'Event Portables', no: 'EP-12'}]).n, 1);
check('One numbered and one unnumbered supplier unit leaves one gap', counts([{co: 'Event Portables', no: 'EP-12'}, {co: 'Event Portables', no: ''}]).n, 1);
check('Same supplier and number counted once', counts([{co: 'Event Portables', no: 'EP-12'}, {co: ' event portables ', no: 'ep-12 '}]).n, 1);
check('Different suppliers may use the same fleet number', counts([{co: 'Event Portables', no: '12'}, {co: 'Other supplier', no: '12'}]).n, 2);
check('Numeric supplier number is not counted again as Coates', counts([{co: 'Event Portables', no: '123456'}], ['123456']).n, 1);
check('Mixed Coates and supplier numbers remain counted', counts([{co: 'Event Portables', no: 'EP-12'}], ['123456']).n, 2);
check('All numbered units still capped at the order quantity', counts([{co: 'Event Portables', no: 'EP-12'}, {co: 'Event Portables', no: 'EP-13'}], ['123456'], 1).n, 1);
check('Asset count does not change the ordered quantity', counts([{co: 'Event Portables', no: ''}], [], 3).q, 3);
check('Rehire unit count remains visible even when unnumbered', counts([{co: 'Event Portables', no: ''}], [], 3).sub, 1);
check('Coates-only numbering is unchanged', counts([], ['123456', '123457']).n, 2);
check('Cancelled references remain excluded', counts([], [], 1, {_cancelled: true}), null);
check('Relocations remain excluded', counts([], [], 1, {relocation: true}), null);
check('Remainder deliveries remain excluded', counts([], [], 1, {rest_of: 'WC98'}), null);
check('Bulk water barriers remain unnumbered', counts([], [], 1, {discipline: 'Water-filled barriers'}), null);
const out = process.env.OUT || path.join(__dirname, 'evidence'); fs.mkdirSync(out, {recursive:true});
fs.writeFileSync(path.join(out, 'assets754_results.json'), JSON.stringify({checks}, null, 2));
console.log(JSON.stringify({checks: checks.length, failed:checks.filter(c=>!c.pass)}, null, 2));
if(checks.some(c=>!c.pass)) process.exitCode=1;
