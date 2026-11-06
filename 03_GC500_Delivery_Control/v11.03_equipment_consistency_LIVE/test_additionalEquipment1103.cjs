/* Author: Andrew Fisher. Synthetic regression cases; no operational records. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'additionalEquipment1103_src.js'),'utf8');
const api=require('./additionalEquipment1103_src.js');
let checks=0;
function check(name,run){run();checks++;process.stdout.write('PASS '+name+'\n');}
function clone(value){return JSON.parse(JSON.stringify(value));}
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);Object.values(value).forEach(freeze);}return value;}
function record(ref='SYN-REF',no='SYN001',item='Distribution board'){
 return {asset:{key:ref,discipline:'Power'},requestedItems:['60kva'],suppliedItems:[],countedNumbers:['SYNGEN'],
  nativeUnits:[{label:item,asset_no:no}],physicalUnits:[{id:JSON.stringify([ref,'coates','asset',no]),ref,item,label:item,assetNo:no,owner:'coates',source:'native',physical:true,slot:false}]};
}
const count=(records,options)=>api.project(records,options).rows.length;
check('An explicitly recorded accessory appears once',()=>assert.equal(count([record()]),1));
check('No input records are mutated',()=>{const r=freeze(record()),before=JSON.stringify(r);api.project([r]);assert.equal(JSON.stringify(r),before);});
check('Requested equipment types stay in the existing inventory',()=>{const r=record();r.requestedItems.push('Distribution board');assert.equal(count([r]),0);});
check('Requested description prefixes are also covered',()=>{const r=record();r.requestedItems.push('Distribution board 32A');assert.equal(count([r]),0);});
check('Explicit supplied replacement descriptions stay covered',()=>{const r=record();r.suppliedItems.push('Distribution board');assert.equal(count([r]),0);});
check('A larger supplied generator is not another machine',()=>{const r=record('SYN-REF','SYN001','80kva');assert.equal(count([r]),0);});
check('A different building size is not another building',()=>{const r=record('SYN-REF','SYN001','Building 12m');r.requestedItems=['Building 6m'];assert.equal(count([r]),0);});
check('A fleet number already counted is not repeated',()=>{const r=record();r.countedNumbers.push('syn001');assert.equal(count([r]),0);});
check('Identified supplied-size metadata is not a native accessory',()=>{const r=record();r.physicalUnits[0].source='identified';assert.equal(count([r]),0);});
check('Generated number projections require a current native record',()=>{const r=record();r.nativeUnits=[];assert.equal(count([r]),0);});
check('A raw label alone cannot identify a physical unit',()=>{const r=record();r.physicalUnits[0].assetNo='';r.nativeUnits[0].asset_no='';assert.equal(count([r]),0);});
check('An explicit stable native ID can identify an unnumbered record',()=>{const r=record();r.physicalUnits[0].assetNo='';r.physicalUnits[0].nativeId='synthetic-unit';r.nativeUnits=[{id:'synthetic-unit',label:'Distribution board'}];assert.equal(count([r]),1);});
for(const field of ['_cancelled','relocation','_movedTo','_locationMoved'])check(field+' references stay out',()=>{const r=record();r.asset[field]=true;assert.equal(count([r]),0);});
for(const field of ['movedAway','alias'])check(field+' projections stay out',()=>{const r=record();r[field]=true;assert.equal(count([r]),0);});
for(const field of ['removed','deleted','movedTo','_movedTo'])check('Native '+field+' records stay out',()=>{const r=record();r.nativeUnits[0][field]=true;assert.equal(count([r]),0);});
check('Inactive native records stay out',()=>{const r=record();r.nativeUnits[0].active=false;assert.equal(count([r]),0);});
check('Removed or ambiguous physical models stay out',()=>{const r=record();r.physicalUnits[0].physical=false;assert.equal(count([r]),0);});
check('Planned loading slots are excluded',()=>{const r=record();r.physicalUnits[0].slot=true;assert.equal(count([r]),0);});
check('Archived physical identities are excluded',()=>{const r=record();r.physicalUnits[0].source='history';assert.equal(count([r]),0);});
check('A physical unit must belong to its displayed reference',()=>{const r=record();r.physicalUnits[0].ref='OTHER';assert.equal(count([r]),0);});
check('Missing physical identity is excluded',()=>{const r=record();r.physicalUnits[0].id='';assert.equal(count([r]),0);});
check('Duplicate raw records are not silently merged',()=>{const r=record();r.nativeUnits.push(clone(r.nativeUnits[0]));assert.equal(count([r]),0);});
check('Duplicate physical IDs are excluded',()=>{const r=record();r.physicalUnits.push(clone(r.physicalUnits[0]));assert.equal(count([r]),0);});
check('Cross-reference fleet duplication is excluded on both sides',()=>assert.equal(count([record(),record('SYN-OTHER')]),0));
check('Duplicate against a regular equipment line is still excluded',()=>{const other=record('SYN-OTHER');other.requestedItems.push('Distribution board');assert.equal(count([record(),other]),0);});
check('An unresolved owner cannot hide a cross-reference collision',()=>{const other=record('SYN-OTHER');other.physicalUnits[0].owner='unknown';assert.equal(count([record(),other]),0);});
check('Distinct companies can have the same fleet number',()=>{const other=record('SYN-OTHER');other.physicalUnits[0].owner='other:synthetic-hire';assert.equal(count([record(),other]),2);});
check('A numbered spare cannot also be an additional allocated unit',()=>assert.equal(count([record()],{spares:[{no:'syn001',co:'Coates'}]}),0));
check('Two differently numbered units with one label both appear',()=>assert.equal(count([record(),record('SYN-REF','SYN002')]),2));
check('Parent arrival and completion do not become unit status',()=>{const r=record();r.asset.delivery={state:'on site',done:true};const row=api.project([r]).rows[0];assert.equal('state' in row||'done' in row||'onsite' in row||'received' in row,false);});
check('Company text is read without creating company totals',()=>{const m=api.project([record()],{company:()=> 'Synthetic company'});assert.equal(m.rows[0].company,'Synthetic company');assert.equal('cos' in m||'list' in m,false);});
check('Markup escapes every native display and navigation value',()=>{const r=record('SYN-<ref>','SYN"001','Board <script>');const h=api.html(api.project([r]));assert.ok(h.includes('&lt;script&gt;'));assert.ok(h.includes('SYN&quot;001'));assert.ok(!h.includes('<script>'));assert.ok(!h.includes('data-additional-equipment1103-open="SYN-<'));});
check('Empty additional equipment has no empty card',()=>assert.equal(api.html({rows:[]}),''));
check('An unnumbered unit never displays its label as a fleet number',()=>{const r=record();r.physicalUnits[0].assetNo='';r.physicalUnits[0].nativeId='unit';r.nativeUnits=[{id:'unit',label:'Named unit'}];const h=api.html(api.project([r]));assert.ok(h.includes('<td class="mono">Not recorded</td>'));});
check('Trade selection excludes accessories from other disciplines',()=>{const m=api.project([record()]);assert.equal(api.view(m,{discipline:'Amenities'}).rows.length,0);assert.equal(api.view(m,{discipline:'Power'}).rows.length,1);assert.equal(m.rows.length,1);});
check('Equipment group references refine a shared discipline',()=>{const m=api.project([record()]);assert.equal(api.view(m,{references:['OTHER']}).rows.length,0);assert.equal(api.view(m,{references:['SYN-REF']}).rows.length,1);});
check('Case-insensitive search finds both unit and reference',()=>{const m=api.project([record()]);assert.equal(api.view(m,{query:'syn001 board'}).rows.length,1);assert.equal(api.view(m,{query:'SYN-REF'}).rows.length,1);assert.equal(api.view(m,{query:'nonexistent'}).rows.length,0);});
check('Reference name and location remain searchable',()=>{const r=record();r.asset.name='Synthetic office';r.asset.locations=['Synthetic precinct'];assert.equal(api.view(api.project([r]),{query:'precinct'}).rows.length,1);});
check('Empty explicit group does not leak other accessories',()=>assert.equal(api.view(api.project([record()]),{references:[]}).rows.length,0));
check('Additional equipment stays inside the existing inventory root',()=>{const base='<div id="invCard"><div>Existing stock</div></div>';const extra=api.html(api.project([record()]));assert.equal(api.insert(base,extra),'<div id="invCard"><div>Existing stock</div>'+extra+'</div>');});
check('Unexpected root markup is left intact',()=>assert.equal(api.insert('<section>Existing</section>','EXTRA'),'<section>Existing</section>'));
check('Native wrappers preserve inventory, totals, mutations and binding',()=>{
 const r=record(),alias=record('SYN-ALIAS','SYN002'),baseInventory=freeze({list:[{asked:1,on:1}],cos:{}}),calls=[];
 const inventory=()=>baseInventory,beforeHtml=()=>'<div id="invCard"><section id="original">Existing equipment</section></div>',beforeBind=()=> 'bound';
 const button={dataset:{additionalEquipment1103Open:r.asset.key}},pane={querySelectorAll:selector=>selector==='[data-additional-equipment1103-open]'?[button]:[]};
 const c={document:{},console,inventory,invHtml:beforeHtml,invBind:beforeBind,S:freeze({unchanged:true}),allAssets:()=>[r.asset,alias.asset],physicalCountAssets963:assets=>{calls.push('canonical');assert.equal(assets.length,2);return {assets:[r.asset]};},movedAway:()=>false,chargeLines:()=>r.requestedItems.map(item=>({item})),itemRows:()=>[],invCountNums:()=>r.countedNumbers,unitsOf:()=>r.nativeUnits,gcUnits925:(a,options)=>{assert.deepEqual(JSON.parse(JSON.stringify(options)),{loading:false});return r.physicalUnits;},spareList:()=>[],lineItemMatch:(a,b)=>a===b,Units925:{company:()=> 'Coates'},openAsset:ref=>calls.push(ref)};
 c.window=c;vm.createContext(c);vm.runInContext(source,c);
 assert.equal(c.inventory,inventory);assert.equal(c.inventory(),baseInventory);
 assert.equal(c.AdditionalEquipment1103.model().rows.length,1);
 const h=c.invHtml(true);assert.ok(h.startsWith(beforeHtml().slice(0,-6)));assert.ok(h.includes('additional-equipment1103'));assert.ok(h.endsWith('</section></div>'));assert.equal((h.match(/data-additional-equipment1103-unit=/g)||[]).length,1);
 assert.equal(c.invBind(pane),'bound');button.onclick();assert.ok(calls.includes(r.asset.key));assert.deepEqual(c.S,{unchanged:true});
});
process.stdout.write(JSON.stringify({passed:checks,failed:0,fixtures:'synthetic only'})+'\n');
