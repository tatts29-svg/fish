/* Author: Andrew Fisher. Declared type fixtures, independent of record identifiers. */
'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const positives=[
 ['Generator 60 kVA','generator'],['60kva','generator'],['200kva & cables','generator'],
 ['VMS','vms'],['VMS board','vms'],['Light Tower','tower'],['LIGHT-TOWERS','tower'],
 ['Knuckle Boom 61ft','boom'],['Straight Boom 60ft','straight-boom'],['Scissor Lift 43ft','scissor'],
 ['Forklift 5T','forklift'],['3.5T Forklift Std','forklift'],['SUPPLY - Forklift 3.5t Diesel','forklift'],
 ['FWF','portable-toilet'],['Portable Toilet','portable-toilet'],['Accessible Toilet','accessible-toilet'],
 ['Pee Panel','urinal'],['Urinal','urinal'],['Toilet Block 6m','toilet-block'],['16Pan Block','toilet-block'],
 ['Waste Tank','waste-tank'],[{item:'Toilet Block 6m',tankNo:'EXAMPLE-TANK'},'block-tank'],
 ['Building 6m','building'],['Ticket Box 4.8m','ticket-box'],['Event Container','container'],['3.0m Cont','container'],
 ['Fridge Lge','fridge'],['Freezer','freezer'],['Trakmat','mats'],['Ground Mats','mats'],
 ['TL2','water-barrier'],['Water-filled Barrier','water-barrier'],['Temporary Fence Panel','fence'],['Crowd Control Barrier','crowd-barrier'],
 ['Pad Chair','chair'],['Stool','stool'],['Laserplane','laser'],
 ['FWF Trailer','toilet-trailer'],['Distribution Board','distribution-board'],
 ['Forklift Tyne Rotator','tyne-rotator'],['Fork Extensions 2.4m','fork-extensions'],['6.0m Refrigerator Cont','refrigerated-container']
];
const negatives=[null,undefined,'','Equipment','Other',{icon:'gen'},{icon:'tower',what:'Light Tower'},
 {item:'Equipment',icon:'tower',what:'Light Tower'},'Light Tower cable','Forklift charger','Generator filter',
 {item:'Unknown',label:'Light Tower',what:'Generator'},
 '<img src=x onerror=alert(1)>','Ambulant Toilet'];
const paired=[
 [{types:['Toilet Block 6m','Waste Tank']},'block-tank'],
 [{types:['Building 6m','Building 4.8m']},'building'],
 [{types:['FWF','Accessible Toilet']},''],
 [{types:['Generator 60kVA','Accessible Toilet']},''],
 [{types:['FWF','Unknown equipment']},'']
];
function run(api){
 assert.equal(typeof api.resolve,'function');assert.equal(typeof api.resolveAll,'function');assert.equal(typeof api.html,'function');
 let checks=0;
 for(const [input,want] of [...positives,...paired]){
  const data=typeof input==='string'?{item:input}:input;
  const before=JSON.stringify(data);assert.equal(api.resolve(data),want,JSON.stringify(data));
  if(typeof input==='string')assert.equal(api.resolve(input),want,'string context '+input);
  assert.equal(JSON.stringify(data),before,'resolver must not mutate input');
  const html=api.html(data);const all=api.resolveAll(data);assert.equal(Boolean(html),all.length>0);
  if(!want&&all.length){assert(html.includes('artwork1268-group'));assert.equal((html.match(/data-artwork1268=/g)||[]).length,all.length);}
  if(want){assert(html.includes('data-artwork1268="'+want+'"'));assert(html.includes('aria-hidden="true"'));assert(!/<(?:button|a|input)\b/i.test(html));}
  checks++;
 }
 for(const input of negatives){const data=typeof input==='string'?{item:input}:input;assert.equal(api.resolve(data),'',JSON.stringify(data));assert.equal(api.html(data),'');checks++;}
 const frozen=Object.freeze({types:Object.freeze(['Toilet Block 6m','Waste Tank'])});assert.equal(api.resolve(frozen),'block-tank');checks++;
 const itemOnly={item:'Light Tower',get what(){throw Error('broad reference prose was accessed');},get label(){throw Error('label was used as equipment type');}};
 assert.equal(api.resolve(itemOnly),'tower');checks++;
 for(const name of ['generator','vms','tower','boom','straight-boom','scissor','forklift','portable-toilet','accessible-toilet','urinal','toilet-block','waste-tank','block-tank','building','ticket-box','container','fridge','freezer','mats','water-barrier','fence','crowd-barrier','chair','stool','laser','toilet-trailer','distribution-board','tyne-rotator','fork-extensions','refrigerated-container'])assert(positives.some(([,kind])=>kind===name),'missing declared fixture '+name);
 return {author:'Andrew Fisher',status:'PASS',checks,declaredKinds:30};
}
if(require.main===module){const api=require(path.resolve(__dirname,'../artwork1268_src.js'));console.log(JSON.stringify(run(api)));}
module.exports={positives,negatives,paired,run};
