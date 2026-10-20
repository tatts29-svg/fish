/* Author: Andrew Fisher. Synthetic correction-note boundaries; no operational evidence. */
const assert=require('assert/strict'),notes=require('../notes947.js');
const marker='Original evidence retained exactly below:';let checks=0;
function test(name,f){f();checks++;console.log('PASS '+name);}
const input=(json,after='')=>'Human note before.\n'+marker+'\n'+json+after;
test('prefix, exact evidence and human suffix reconstruct the original note',()=>{const raw=input('{\n  "state": null, "complete": true\n}','\nHuman follow-up.');const p=notes.split(raw);assert.equal(p.prefix+p.marker+p.evidence+p.suffix,raw);assert.equal(p.suffix,'\nHuman follow-up.');});
test('nested arrays and objects retain exact formatting',()=>{const raw=input('{"x":[1,{"nested":[null,true]}]}');assert.equal(JSON.parse(notes.split(raw).evidence).x[1].nested[0],null);});
test('quoted braces do not end the block',()=>{const raw=input(JSON.stringify({value:'} ] { [ " \\ test'}),'\nAfter');assert.equal(notes.split(raw).suffix,'\nAfter');});
test('an evidence array is valid JSON',()=>assert.deepEqual(JSON.parse(notes.split(input('[{"ok":true}]')).evidence),[{ok:true}]));
for(const bad of ['{','{"x":}','{]','{"x":1,}','{"x":"unterminated}','null','123',''])test('malformed/non-block evidence remains plain: '+bad,()=>assert.equal(notes.split(input(bad)),null));
test('unrecognised notes remain plain',()=>assert.equal(notes.split('Ordinary human note\n{"x":null}'),null));
test('partial or inline marker remains plain',()=>{assert.equal(notes.split('Said '+marker+'\n{}'),null);assert.equal(notes.split('Original evidence retained:\n{}'),null);});
test('non-string values are not parsed',()=>{assert.equal(notes.split(null),null);assert.equal(notes.split({}),null);});
class Element{constructor(tag){this.tagName=tag;this.children=[];this.textContent='';}append(...items){this.children.push(...items);}appendChild(item){this.children.push(item);return item;}}
global.document={createElement:tag=>new Element(tag)};
test('read-only rendering starts folded and uses text nodes for hostile contents',()=>{const t=new Element('div'),raw=input(JSON.stringify({html:'<img src=x onerror=alert(1)>'}),'\n<Human>');notes.append(t,raw);const d=t.children.find(n=>n.tagName==='details');assert(d);assert(!d.open);assert.equal(d.children[0].textContent,'Original correction evidence');assert.equal(d.children[1].textContent,notes.split(raw).evidence);assert.equal(t.children.at(-1).textContent,'\n<Human>');assert(!('innerHTML' in d.children[1]));});
test('fallback rendering retains the entire original value',()=>{const t=new Element('div'),raw=input('{broken');notes.append(t,raw);assert.equal(t.children.length,1);assert.equal(t.children[0].textContent,raw);});
console.log(JSON.stringify({author:'Andrew Fisher',passed:true,checks}));
