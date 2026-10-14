/* Author: Andrew Fisher. Synthetic P/O values: cents, missing values, edits and escaped output. */
'use strict';
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const orders = new Map(), context = vm.createContext({
 poOf: no => orders.get(no) || null,
 esc: s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;'),
 money: n => new Intl.NumberFormat('en-AU', {style:'currency',currency:'AUD',maximumFractionDigits:2}).format(n),
});
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../po_values1014.js'), 'utf8'), context);
let checks = 0;
function check(raw, expected) { orders.set('1234567', {number:'1234567', amount:raw}); const before = JSON.stringify([...orders]); assert.equal(context.poLabel1014('1234567'), expected); assert.equal(JSON.stringify([...orders]), before); checks++; }
check(1234.56, '1234567 · $1,234.56');
check(1234.5, '1234567 · $1,234.50');
check(0, '1234567 · $0.00');
check('0.00', '1234567 · $0.00');
check('12.34', '1234567 · $12.34');
for (const missing of [null, undefined, '', ' ', 'unpriced', NaN, Infinity, -1, true, {}]) check(missing, '1234567');
orders.set('1234567', {number:'1234567',amount:987.65}); assert.equal(context.poLabel1014('1234567'), '1234567 · $987.65'); checks++;
assert.equal(context.poLabel1014('7654321'), '7654321'); checks++;
assert.equal(context.poLabel1014('<img src=x onerror=1>'), '&lt;img src=x onerror=1&gt;'); checks++;
console.log(JSON.stringify({author:'Andrew Fisher',pass:true,checks}));
