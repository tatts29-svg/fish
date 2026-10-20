/* Author: Andrew Fisher. Projection test; no contact numbers or operational fixtures. */
'use strict';
const assert=require('node:assert/strict'), P=require('./about_contacts1089');
const input=[{name:'Corey Machado',group:'one'},{name:'Ross Saxelby',group:'two'}, {name:'Abraham Tibble',group:'two'}, {name:'Krystal Stephens',group:'transport'}, {name:'Daniel Gough',group:'install'}, {name:'Another person',group:'install'}, {name:'Corey Machado Junior',group:'other'}];
const before=JSON.stringify(input), out=P.current(input);
assert.deepEqual(out.map(p=>p.name),['Daniel Gough','Another person','Corey Machado Junior']);
assert.equal(JSON.stringify(input),before);
assert.strictEqual(out[0],input[4]);
assert.equal(P.current([{name:'  COREY   MACHADO  '}]).length,0);
assert.deepEqual(P.current(null),[]);
const additions=[{name:'Synthetic Installer One',group:'install',event_role:'Installer'},{name:'Synthetic Installer Two',group:'install',event_role:'Installer'}];
const addBefore=JSON.stringify(additions), merged=P.current(input,additions);
assert.equal(merged.length,out.length+2);assert.deepEqual(merged.slice(-2),additions);assert.equal(JSON.stringify(additions),addBefore);assert.equal(JSON.stringify(input),before);
assert.equal(P.current(input,[{name:'Daniel Gough',group:'install',event_role:'Installer'}]).filter(p=>p.name==='Daniel Gough').length,1);
console.log('PASS: exact four current contacts excluded; retained identities and original history data untouched');
