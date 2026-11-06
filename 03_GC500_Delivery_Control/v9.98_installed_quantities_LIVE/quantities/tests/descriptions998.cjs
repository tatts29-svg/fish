/* Author: Andrew Fisher. Shared drawer rendering without a browser or record writes. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const label = require('../description998.js').label;
assert.equal(label('FWF', 8), '8 × FWF');
assert.equal(label('FWF', 0), '0 × FWF');
for (const value of [null, undefined, '', '8', NaN, Infinity, -1]) assert.equal(label('FWF', value), 'FWF');
assert.equal(label('Fence', 7.5), '7.5 × Fence');
const html = fs.readFileSync(process.env.PAGE || process.argv[2], 'utf8');
function extract(name) {
 const begin = html.indexOf('function '+name+'(');
 assert(begin >= 0, name+' exists');
 return html.slice(begin, html.indexOf('\n}',begin)+2);
}
const escape = v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const groups=[{item:'FWF',quantity:8,units:[],pending:0},{item:'Pee Panel',quantity:6,units:[],pending:0},{item:'Unconfirmed',quantity:null,units:[],pending:null}];
const model={groups,rows:[]}, a={key:'TEST'};
const context={Description998:{label},esc925:escape,selected:new Map(),gcModel925:()=>model,dropPhotosOf:()=>[],photos925:()=>[],ItemPhotos965:{group:()=>null,assigned:()=>[],catalogue:()=>false,scope:()=>''},Source949:{note:()=>''},Items933:{cardPhotos:()=>'',locationPhotos:()=>''},SYNC:{readonly:true},work925:()=>({lines:[]}),branch925:()=>({code:'KINP',basis:''}),company925:o=>o};
vm.createContext(context);
vm.runInContext(extract('rowHtml925')+'\n'+extract('panel925')+'\nthis.renderPanel=panel925;this.renderUnit=rowHtml925;',context);
let panel=context.renderPanel(a);
assert(panel.includes('<option value="FWF" selected>8 × FWF</option>'));
assert(panel.includes('<option value="Pee Panel">6 × Pee Panel</option>'));
assert(panel.includes('<option value="Unconfirmed">Unconfirmed</option>'));
assert(!panel.includes('14 ×'), 'Unlike descriptions are never added together');
assert(!panel.includes('8 planned'), 'Planned count is no longer repeated below the selector');
context.selected.set(a.key,'Pee Panel');
assert(context.renderPanel(a).includes('<option value="Pee Panel" selected>6 × Pee Panel</option>'));
groups[1].quantity=7;
assert(context.renderPanel(a).includes('<option value="Pee Panel" selected>7 × Pee Panel</option>'), 'Native edits are reflected on redraw');
groups.push({item:'Table & chair "set"',quantity:1,units:[],pending:0});
assert(context.renderPanel(a).includes('<option value="Table &amp; chair &quot;set&quot;">1 × Table &amp; chair &quot;set&quot;</option>'));
for(const owner of ['coates','event-portables','prem-air-hire']){
 const unit=context.renderUnit(a,{item:'FWF',physical:true,owner,assetNo:'0085'},model);
 assert(unit.includes('<h4>1 × FWF</h4>'));
 assert(unit.includes('0085'));
}
assert(context.renderUnit(a,{item:'FWF',physical:false,owner:'coates',assetNo:''},model).includes('<h4>FWF</h4>'));
const quantityStart=html.indexOf('function card(a,g){const pp=photos(g,dropPhotosOf(a.key))');
assert(quantityStart>=0);
const quantityEnd=html.indexOf('\n function selection(',quantityStart);
const quantityContext={Description998:{label},esc:escape,photos:()=>[],dropPhotosOf:()=>[],firstFree:()=>0,pending:()=>[],DROP_MAX:4,ownerHtml:()=>'',status:()=>'',SYNC:{readonly:true},noteHtml:()=>''};
vm.createContext(quantityContext);
vm.runInContext(html.slice(quantityStart,quantityEnd)+'\nthis.render=card;',quantityContext);
const quantity=quantityContext.render(a,{id:'q',ref:'TEST',item:'Pee Panel',quantity:6});
assert(quantity.includes('<h4>6 × Pee Panel</h4>'));
assert(!quantity.includes('Quantity 6'), 'Quantity-only count is shown once in the heading');
console.log(JSON.stringify({author:'Andrew Fisher',passed:true,scope:'Native drawer options, unit cards and quantity-only cards; refresh, escaping and unknown values',browser:false,recordWrites:0}));
