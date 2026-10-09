// Author: Andrew Fisher. Source availability follows the actual verified file registry.
'use strict';
const assert=require('assert/strict'),D=require('../documents973.js');
const original={id:D.id,note:'Original catalogue history',title:'VMS source'},other={id:'other.pdf',note:'Unrelated source'};
const collection={items:[original,other],available:1,unhosted:1};
const files={[D.id]:{sha256:D.sha256,bytes:2994014,kind:'map'}};
assert.strictEqual(D.project(collection,null),collection);
assert.strictEqual(D.project(collection,{}),collection);
for(const changed of [{sha256:'different'},{bytes:1},{kind:'other'}]){
 assert.strictEqual(D.project(collection,{[D.id]:{...files[D.id],...changed}}),collection);
}
const actual=D.project(collection,files);
assert.equal(actual.items[0].pages,17);
assert.equal(actual.items[0].sha256,D.sha256);
assert.ok(actual.items[0].note.includes('existing D025 map positions are preserved'));
assert.strictEqual(actual.items[1],other);
assert.equal(original.note,'Original catalogue history');
assert.equal(actual.available,collection.available);
assert.equal(actual.unhosted,collection.unhosted);
console.log(JSON.stringify({pass:true,checks:12}));
