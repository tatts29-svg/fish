// Author: Andrew Fisher. Independent native-input oracle for migrated By group detail.
// Generic logic only; callers keep native inputs and results in private evidence.
'use strict';
const ids=['buildings','toilets','fencing','generators','lighting','equipment'];
const aliases={'Access & plant':'Forklifts & access','Variable message signs':'VMS boards','Ground protection':'Track mat'};
const canonical=s=>aliases[s]||s||'Uncategorised';
const owner=s=>({'Portable buildings':'buildings','Toilets & amenities':'toilets',Generators:'generators','Lighting towers':'lighting',Fencing:'fencing'}[canonical(s)]||'equipment');
const round=n=>Math.round(n*100)/100;
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
async function readNativeGroupInputs841(page,day){return page.evaluate(asOf=>{
 const X=dsnState(asOf),fd=fenceDerived(),green=typeof greenBookTotals==='function'?greenBookTotals():null;
 return {asOf,words:PLANT_GROUP_WORDS,nextDays:PROG_NEXT_DAYS,definitions:DSN_GROUPS.map(g=>({name:g.name,disc:g.disc,nounit:!!g.nounit,unit:g.unit,types:g.types.source,flags:g.types.flags,what:g.what||null})),
  rows:X.rows.map(r=>({key:r.a.key,name:r.a.name,product:r.a.product,discipline:r.a.discipline,cancelled:!!r.a._cancelled,relocation:!!(r.reloc||r.a.relocation),restOf:!!r.a.rest_of,movedAway:!!movedAway(r.a.key),asked:r.asked,unitsOn:r.unitsOn,on:r.on,byRental:r.byRental,done:!!r.d.done,due:r.due,overdue:r.overdue,next:r.next,noRecord:r.norecord,askedBy:[...r.askedBy],onBy:[...r.onBy],lines:r.cls.map(l=>({item:l.item,quantity:qtyOf(l),noQuantity:l.quantity==null})),shorts:shortOf(r.a).map(s=>s.item),numbers:r.nums.filter(n=>!isMiscRow(n)).length,subhires:(r.subs||[]).length,accessories:r.accs.length,unpriced:r.t.total==null})),
  contracts:[...tradeCharges()].map(([disc,v])=>({disc,charge:v.charge,charge0:v.charge0,lines:v.lines,unrated:v.unrated})),comparisons:[...X.byDisc].map(([disc,v])=>({disc,hire:v.hire0,transport:v.transport0,refs:v.n})),
  programme:fenceTypes(X.P).map(t=>({id:t.key,name:t.name,fullName:t.type,unit:t.unit,total:t.total,planned:t.planned,recorded:Math.round(t.done*100)/100,remaining:Math.round(Math.max(0,t.total-t.done)*100)/100,behind:t.planned!=null&&t.done<t.planned?Math.round((t.planned-t.done)*100)/100:0})),
  fencing:{areasDone:X.P.areasDone,areas:X.P.areas,breakdowns:X.P.fenceBd||0,notRolled:X.P.notRolled||[],revenue:fd.charged,cost:fd.cost,green:green&&green.notes?{amount:green.rate!=null?green.amount:null,lines:green.notes,unrated:green.unpriced}:null},barriers:barrierQty()};
 },day);}

function groupOracle841(input,independentWorkAreas){
 const result=Object.fromEntries(ids.map(id=>[id,{groups:[],money:[],comparisons:[]}])) ,progress=new Map(independentWorkAreas.filter(a=>a.id!=='fencing').flatMap(a=>a.rows.map(r=>[r.key,r])));
 const mapped=new Map();for(const row of input.rows.filter(r=>!r.cancelled)){const name=canonical(input.words[row.product]||row.product||row.discipline);if(!mapped.has(name))mapped.set(name,[]);mapped.get(name).push(row);}
 for(const [name,rows] of mapped){
  const included=rows.filter(r=>!r.relocation&&!r.restOf&&!r.movedAway),excluded=rows.filter(r=>!included.includes(r)),def=input.definitions.find(g=>canonical(g.disc)===name||canonical(g.name)===name);
  const allItems=[...new Set(included.flatMap(r=>r.lines.map(l=>l.item)))];
  const unit=name==='Track mat'?'schedule quantity · unit unconfirmed':def&&def.nounit?'schedule quantity':def&&def.unit[0]&&allItems.length&&allItems.every(t=>new RegExp(def.types,def.flags).test(t))?def.unit[1]:'units';
  const sum=(key,predicate=()=>true)=>round(included.filter(predicate).reduce((n,r)=>n+r[key],0));
  const group={id:name,unit,keys:included.map(r=>r.key),excluded:excluded.map(r=>({key:r.key,reason:r.relocation?'Relocation':r.restOf?'Follow-up delivery; order remains on the parent':'Moved to another reference'})),summary:{total:sum('asked'),onSite:sum('unitsOn'),due:sum('asked',r=>r.due),overdue:sum('asked',r=>r.overdue),next:sum('asked',r=>r.next&&!r.on),noRecord:sum('asked',r=>r.noRecord),nextDays:input.nextDays},types:[],facts:[]};
  const typeNames=[...new Set(included.flatMap(r=>r.askedBy.map(([item])=>item).concat(r.lines.map(l=>l.item))))];
  for(const item of typeNames){
   const members=included.filter(r=>r.askedBy.some(([key])=>key===item)||r.lines.some(l=>l.item===item));let total=0,onSite=0,knownQuantity=0,knownComplete=0,quantityKnown=true,completionKnown=true,noQuantityLines=0;
   for(const r of members){
    const lines=r.lines.filter(l=>l.item===item),known=lines.length>0&&lines.every(l=>typeof l.quantity==='number'&&Number.isFinite(l.quantity)&&l.quantity>=0),quantity=lines.reduce((sum,l)=>sum+(typeof l.quantity==='number'&&Number.isFinite(l.quantity)&&l.quantity>=0?l.quantity:0),0),main=progress.get(r.key),conflict=r.done&&(r.shorts.includes(item)||main&&main.recordedComplete&&!main.complete);
    total+=new Map(r.askedBy).get(item)||0;onSite+=new Map(r.onBy).get(item)||0;knownQuantity+=quantity;
    quantityKnown=quantityKnown&&known;completionKnown=completionKnown&&!conflict&&(!r.done||known);if(r.done&&!conflict)knownComplete+=quantity;noQuantityLines+=lines.filter(l=>l.noQuantity).length;
   }
   knownQuantity=round(knownQuantity);knownComplete=round(knownComplete);
   group.types.push({name:item||'Item description unconfirmed',unit:name==='Track mat'?unit:'items',total:round(total),onSite:round(onSite),knownQuantity,knownComplete,quantityKnown,completionKnown,noQuantityLines,complete:completionKnown?knownComplete:null,remaining:quantityKnown&&completionKnown?round(Math.max(0,knownQuantity-knownComplete)):null,keys:members.map(r=>r.key)});
  }
  group.types.sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name));
  group.facts=[{label:'Asset numbers on hire',value:sum('numbers'),unit:'asset numbers'},{label:'Subhired, no Coates asset number',value:sum('subhires'),unit:'machines'},{label:'Set by a person on site',value:sum('unitsOn',r=>r.on&&!r.byRental),unit},{label:'Accessories on hire',value:sum('accessories'),unit:'lines'}];
  if(name==='Water-filled barriers')group.facts.push({label:'On the K220 master sheet',value:input.barriers.master,unit:'barriers'},{label:'On the K221–K231 detail sheets',value:input.barriers.detail,unit:'barriers'});
  result[owner(name)].groups.push(group);
 }
 for(const c of input.contracts)result[owner(c.disc)].money.push({id:'contract|'+c.disc,amount:c.charge0,rawAmount:c.charge,lines:c.lines,unrated:c.unrated});
 for(const c of input.comparisons)result[owner(c.disc)].comparisons.push({id:'schedule|'+c.disc,hire:c.hire,transport:c.transport,refs:c.refs});
 result.fencing.money.push({id:'fence-revenue',amount:input.fencing.revenue},{id:'fence-cost',amount:input.fencing.cost});
 if(input.fencing.green)result.fencing.money.push({id:'green-book',...input.fencing.green});
 result.fencing.programme=input.programme;
 result.fencing.facts=[{label:'Docket areas ticked done',value:input.fencing.areasDone,total:input.fencing.areas,unit:'named docket areas'},{label:'Open fencing breakdowns',value:input.fencing.breakdowns,unit:'breakdowns'}];
 return result;
}

function assertGroupModel841(check,label,input,actual,expected){
 const project=(value,shape)=>Object.fromEntries(Object.keys(shape).map(k=>[k,value?.[k]]));
 for(const id of ids){
  const want=expected[id],got=actual[id];
  check(label+' '+id+' owns its native groups once',same(want.groups.map(g=>g.id),got.groups.map(g=>g.id)),{expected:want.groups.map(g=>g.id),actual:got.groups.map(g=>g.id)});
  for(const group of want.groups){const g=got.groups.find(x=>x.id===group.id);if(!g)continue;
   check(label+' '+group.id+' reference scope and exclusions match native input',same(group.keys,g.keys)&&same(group.excluded,g.excluded.map(r=>project(r,{key:1,reason:1}))),{expected:{keys:group.keys,excluded:group.excluded},actual:{keys:g.keys,excluded:g.excluded}});
   check(label+' '+group.id+' schedule on-site and status counts preserve their distinct basis',group.unit===g.unit&&same(group.summary,g.summary),{expected:group.summary,actual:g.summary,unit:g.unit});
   check(label+' '+group.id+' item totals on-site and completion reconcile independently',same(group.types,g.types.map(t=>project(t,group.types.find(w=>w.name===t.name)||group.types[0]||{}))),{expected:group.types,actual:g.types});
   check(label+' '+group.id+' rental and source facts are preserved',same(group.facts,g.facts.map(f=>project(f,group.facts.find(w=>w.label===f.label)||{label:1,value:1,unit:1}))),{expected:group.facts,actual:g.facts});
   check(label+' '+group.id+' missing quantity and excluded-reference qualifications remain explicit',g.types.every(t=>!t.noQuantityLines||t.issues.some(n=>/one-position count|no quantity/.test(n)))&&(!group.excluded.length||g.notes.some(n=>/outside the order totals/.test(n))),{notes:g.notes,issues:g.types.map(t=>({name:t.name,noQuantityLines:t.noQuantityLines,issues:t.issues}))});
  }
  check(label+' '+id+' monetary facts keep exact native ownership and amounts',same(want.money,got.money.map(m=>project(m,want.money.find(w=>w.id===m.id)||{id:1})))&&same(want.comparisons,got.comparisons.map(m=>project(m,want.comparisons.find(w=>w.id===m.id)||{id:1}))),{expected:{money:want.money,comparisons:want.comparisons},actual:{money:got.money,comparisons:got.comparisons}});
 }
 const expectedKeys=input.rows.filter(r=>!r.cancelled).map(r=>r.key).sort(),actualKeys=ids.flatMap(id=>actual[id].groups.flatMap(g=>g.keys.concat(g.excluded.map(r=>r.key)))).sort();
 check(label+' every active native reference remains owned exactly once',same(expectedKeys,actualKeys)&&new Set(actualKeys).size===actualKeys.length,{expectedKeys,actualKeys});
 const expectedMoney=ids.flatMap(id=>expected[id].money.concat(expected[id].comparisons).map(m=>m.id)).sort(),actualMoney=ids.flatMap(id=>actual[id].money.concat(actual[id].comparisons).map(m=>m.id)).sort();
 check(label+' every original monetary bucket has one owner',same(expectedMoney,actualMoney)&&new Set(actualMoney).size===actualMoney.length,{expectedMoney,actualMoney});
 check(label+' whole-programme fencing rows remain separate from Build-only rows',same(expected.fencing.programme,actual.fencing.programmeRows.map(r=>project(r,expected.fencing.programme.find(w=>w.id===r.id)||{id:1}))),{expected:expected.fencing.programme,actual:actual.fencing.programmeRows});
 check(label+' fencing areas and breakdown counts are retained',same(expected.fencing.facts,actual.fencing.facts.map(f=>project(f,expected.fencing.facts.find(w=>w.label===f.label)||{label:1,value:1}))),{expected:expected.fencing.facts,actual:actual.fencing.facts});
 check(label+' unrolled fencing weeks remain disclosed',!input.fencing.notRolled.length||actual.fencing.issues.some(s=>s.includes(String(input.fencing.notRolled.length))&&/not rolled forward/.test(s)),actual.fencing.issues);
}
const fmt=n=>n==null||!Number.isFinite(n)?'—':Number(n).toLocaleString('en-AU',{maximumFractionDigits:2});
const currency=n=>typeof n==='number'&&Number.isFinite(n)?n.toLocaleString('en-AU',{style:'currency',currency:'AUD',maximumFractionDigits:2}):'Not yet priced';
async function readGroupUI841(page){return page.evaluate(()=>{
 const valueNodes=root=>Object.fromEntries([...root.querySelectorAll('[data-tw841-value]')].map(n=>[n.dataset.tw841Value,{label:n.querySelector('dt').textContent,value:[...n.querySelector('dd').childNodes].filter(c=>c.nodeType===Node.TEXT_NODE).map(c=>c.textContent).join('').trim(),unit:n.querySelector('dd small')?.textContent||''}])) ;
 const facts=root=>[...root.querySelectorAll(':scope > .tw841-group-facts [data-tw841-fact]')].map(n=>({label:n.dataset.tw841Fact,value:n.querySelector('dd').textContent}));
 const board=document.querySelector('#gc500-work-board840'),pane=document.querySelector('#pane-today');
 return {merged:board.dataset.tw841GroupsMerged,oldHeaders:[...pane.querySelectorAll('h3.sec')].filter(n=>/^By group\b/.test(n.textContent.trim())).length,oldPlates:pane.querySelectorAll('.dsn .groups:not(.branches) .grp').length,
  cards:[...board.querySelectorAll('[data-tw841-group-card]')].map(fold=>({id:fold.dataset.tw841GroupCard,owner:fold.closest('[data-tw840-area]')?.dataset.tw840Area,open:fold.open,summary:fold.querySelector('summary').textContent,
   groups:[...fold.querySelectorAll('[data-tw841-group-id]')].map(g=>({id:g.dataset.tw841GroupId,onsite:g.querySelector('.tw841-onsite')?.textContent||null,types:[...g.querySelectorAll('[data-tw841-type]')].map(t=>({name:t.dataset.tw841Type,unit:t.querySelector('.tw841-type-unit').textContent,percent:{known:t.querySelector('.tw841-type-percent')?.dataset.known,text:t.querySelector('.tw841-type-percent')?.textContent},values:valueNodes(t),notes:[...t.querySelectorAll('.tw841-group-notes li')].map(n=>n.textContent)})),schedule:valueNodes(g.querySelector('.tw841-schedule-values')),facts:facts(g),notes:[...g.querySelectorAll(':scope > .tw841-group-notes li')].map(n=>n.textContent),excluded:[...g.querySelectorAll('.tw841-exclusions [data-tw840-reference]')].map(n=>({key:n.dataset.tw840Reference,text:n.parentElement.textContent})),destination:g.querySelector(':scope > [data-tw840-destination]')?.dataset.tw840Destination,destinationGroup:g.querySelector(':scope > [data-tw840-destination]')?.dataset.tw840Group})),
   programme:[...fold.querySelectorAll('[data-tw841-programme-row]')].map(r=>({id:r.dataset.tw841ProgrammeRow,values:valueNodes(r),gap:r.querySelector('.tw841-programme-gap').textContent})),facts:facts(fold.querySelector('.tw841-group-content')),
   money:[...fold.querySelectorAll('[data-tw841-money]')].map(n=>({id:n.dataset.tw841Money,kind:n.dataset.tw841MoneyKind,amount:n.querySelector('.tw841-money-amount').textContent,text:n.textContent,destination:n.querySelector('[data-tw840-destination]')?.dataset.tw840Destination})),
   comparisons:[...fold.querySelectorAll('[data-tw841-comparison]')].map(n=>({id:n.dataset.tw841Comparison,amounts:[...n.querySelectorAll('dd')].map(x=>x.textContent),text:n.textContent,destination:n.querySelector('[data-tw840-destination]')?.dataset.tw840Destination})),text:fold.textContent}))};
 });}
function assertGroupUI841(check,label,model,ui){
 check(label+' legacy white By group plates and heading are removed after complete migration',ui.merged==='true'&&ui.oldHeaders===0&&ui.oldPlates===0,ui);
 check(label+' exactly six detail folds belong to their matching instruments',same(ui.cards.map(c=>c.id),ids)&&ui.cards.every(c=>c.id===c.owner),ui.cards.map(c=>({id:c.id,owner:c.owner,open:c.open})));
 const expectedFact=f=>({label:f.label,value:fmt(f.value)+(typeof f.total==='number'&&Number.isFinite(f.total)?' / '+fmt(f.total):'')+(f.unit?' '+f.unit:'')});
 for(const id of ids){const card=model[id],shown=ui.cards.find(c=>c.id===id);if(!shown)continue;
  check(label+' '+id+' every native subtype is rendered exactly once',same(card.groups.map(g=>g.id),shown.groups.map(g=>g.id)),{expected:card.groups.map(g=>g.id),actual:shown.groups.map(g=>g.id)});
  for(const g of card.groups){const rendered=shown.groups.find(x=>x.id===g.id);if(!rendered)continue;
   const types=g.types.map(t=>({name:t.name,unit:t.unit,values:Object.fromEntries(['total','onSite','complete','remaining'].map(k=>[k,fmt(t[k])]))})),actualTypes=rendered.types.map(t=>({name:t.name,unit:t.unit,values:Object.fromEntries(Object.entries(t.values).map(([k,v])=>[k,v.value]))}));
   const actualTypesClean=actualTypes.map(({notes,...rest})=>rest);
   check(label+' '+g.id+' rendered type values keep on-site distinct from completion',same(types,actualTypesClean)&&(card.groups.length===1 ? rendered.onsite===null&&(id==='fencing'||shown.summary.includes(fmt(g.summary.onSite)+' / '+fmt(g.summary.total)+' '+g.unit+' on site')) : rendered.onsite===fmt(g.summary.onSite)+' on site / '+fmt(g.summary.total)+' '+g.unit),{expected:types,actual:actualTypesClean,onsite:rendered.onsite});
   check(label+' '+g.id+' item completion percentages require known quantities and completion',g.types.every(t=>{const u=rendered.types.find(r=>r.name===t.name)?.percent,known=t.quantityKnown&&t.completionKnown&&typeof t.total==='number'&&t.total>0&&typeof t.complete==='number';return u&&u.known===String(!!known)&&u.text===(known?fmt(Math.min(100,t.complete/t.total*100))+'% complete':'Completion percentage unconfirmed');}),rendered.types.map(t=>({name:t.name,percent:t.percent})));
   check(label+' '+g.id+' schedule counts and qualifications stay accessible',same(Object.fromEntries(['due','overdue','next','noRecord'].map(k=>[k,fmt(g.summary[k])])),Object.fromEntries(Object.entries(rendered.schedule).map(([k,v])=>[k,v.value])))&&g.types.every(t=>!t.issues.length||t.issues.every(note=>rendered.types.find(r=>r.name===t.name)?.notes.includes(note)))&&g.notes.every(note=>rendered.notes.includes(note)),{schedule:rendered.schedule,notes:rendered.notes});
   check(label+' '+g.id+' rental evidence exclusions and Equipment destination are retained',same(g.facts.map(expectedFact),rendered.facts)&&same(g.excluded.map(r=>r.key),rendered.excluded.map(r=>r.key))&&g.excluded.every(r=>rendered.excluded.find(x=>x.key===r.key)?.text.includes(r.reason))&&rendered.destination==='plant'&&rendered.destinationGroup===g.id,{facts:rendered.facts,excluded:rendered.excluded,destination:rendered.destination,destinationGroup:rendered.destinationGroup});
  }
  check(label+' '+id+' every money bucket and comparison is rendered once with its basis',same(card.money.map(m=>m.id),shown.money.map(m=>m.id))&&same(card.comparisons.map(m=>m.id),shown.comparisons.map(m=>m.id))&&card.money.every(m=>{const u=shown.money.find(x=>x.id===m.id);return u&&u.amount===currency(m.amount)&&u.kind===m.kind&&u.text.includes(m.basis)&&u.destination===m.drilldown.tab;})&&card.comparisons.every(m=>{const u=shown.comparisons.find(x=>x.id===m.id);return u&&same(u.amounts,[currency(m.hire),currency(m.transport)])&&u.text.includes(m.basis)&&u.destination==='pricing';}),{money:shown.money,comparisons:shown.comparisons});
  check(label+' '+id+' category facts and basis remain visible inside its fold',same(card.facts.map(expectedFact),shown.facts)&&shown.text.includes(card.basis)&&card.notes.every(note=>shown.text.includes(note)),{facts:shown.facts,basis:card.basis});
  if(id==='fencing')check(label+' whole-programme quantities are rendered with their own units and planned-by-day basis',same(card.programmeRows.map(r=>r.id),shown.programme.map(r=>r.id))&&card.programmeRows.every(r=>{const u=shown.programme.find(x=>x.id===r.id);return u&&['total','planned','recorded','remaining'].every(k=>u.values[k].value===fmt(r[k])&&u.values[k].unit===r.unit)&&(r.planned==null?/unconfirmed/.test(u.gap):u.gap.includes(fmt(r.behind)+' '+r.unit));}),{programme:shown.programme});
 }
}

async function exerciseGroupFolds841(page,check,label,out){
 const fs=require('node:fs'),path=require('node:path');fs.mkdirSync(out,{recursive:true});
 const baseline=await page.evaluate(()=>[...document.querySelectorAll('[data-tw841-group-card]')].map(d=>({id:d.dataset.tw841GroupCard,open:d.open})));
 check(label+' migrated detail folds start collapsed',baseline.length===6&&baseline.every(d=>!d.open),baseline);
 for(const id of ids){
  const fold=page.locator('[data-tw841-group-card='+id+']'),summary=fold.locator('summary');await summary.focus();await page.keyboard.press('Enter');await page.waitForTimeout(120);
  const before=await page.evaluate(()=>({focus:document.activeElement?.dataset.tw840Focus,main:document.querySelector('main').scrollTop,open:TodayWork840.report().openGroups}));
  const layout=await fold.evaluate(d=>({open:d.open,client:d.clientWidth,scroll:d.scrollWidth,children:[...d.querySelectorAll('.tw841-native-group,.tw841-type,.tw841-money,.tw841-comparison')].map(n=>({class:n.className,client:n.clientWidth,scroll:n.scrollWidth,filter:getComputedStyle(n).filter,textShadow:getComputedStyle(n).textShadow}))}));
  check(label+' '+id+' details open by keyboard and fit at native width',layout.open&&layout.scroll<=layout.client+1&&layout.children.every(n=>n.scroll<=n.client+1&&n.filter==='none'&&n.textShadow==='none'),layout);
  await page.evaluate(()=>renderToday());await page.waitForTimeout(150);const after=await page.evaluate(()=>({focus:document.activeElement?.dataset.tw840Focus,main:document.querySelector('main').scrollTop,open:TodayWork840.report().openGroups}));
  check(label+' '+id+' open fold focus and scroll survive native redraw',after.open.includes(id)&&before.focus===after.focus&&Math.abs(before.main-after.main)<=1,{before,after});
  if(id==='equipment'||id==='fencing'){await summary.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'today841-'+label+'-'+id+'-by-type.png')});}
  await summary.focus();await page.keyboard.press('Enter');await page.waitForTimeout(100);
  check(label+' '+id+' details close by keyboard',!await fold.evaluate(d=>d.open));
 }
}

async function exerciseTodayPrint841(page,check,label,out){
 const path=require('node:path');
 const equipment=page.locator('[data-tw841-group-card=equipment]');if(!await equipment.evaluate(d=>d.open)){await equipment.locator('summary').focus();await page.keyboard.press('Enter');}
 await page.locator('#printProgress').scrollIntoViewIfNeeded();await page.locator('#printProgress').focus();await page.waitForTimeout(100);
 const before=await page.evaluate(()=>({main:document.querySelector('main').scrollTop,folds:[...document.querySelectorAll('[data-tw841-group-card]')].map(d=>({id:d.dataset.tw841GroupCard,open:d.open}))}));
 await page.evaluate(()=>{window.__qaOriginalPrint841=window.print;window.__qaPrintCalled841=0;window.print=()=>{window.__qaPrintCalled841++;window.dispatchEvent(new Event('beforeprint'));};});
 try{
  await page.locator('#printProgress').click();await page.waitForFunction(()=>window.__qaPrintCalled841===1,null,{timeout:5000});await page.emulateMedia({media:'print'});await page.waitForTimeout(200);
  const print=await page.evaluate(()=>{
   const b=document.querySelector('#gc500-work-board840'),visible=n=>{for(let p=n;p;p=p.parentElement)if(getComputedStyle(p).display==='none'||getComputedStyle(p).visibility==='hidden')return false;return n.getBoundingClientRect().height>0;};
   const labels=[...b.querySelectorAll('h3,.tw840-reading,[data-tw840-fence-row],[data-tw841-type] h5,[data-tw841-type] dd,[data-tw841-money] .tw841-money-amount')];
   return {called:__qaPrintCalled841,bodyClass:document.body.classList.contains('printing-progress'),boardVisible:visible(b),cards:[...b.querySelectorAll('[data-tw840-area]')].map(c=>({id:c.dataset.tw840Area,visible:visible(c)})),folds:[...b.querySelectorAll('[data-tw841-group-card]')].map(d=>({id:d.dataset.tw841GroupCard,open:d.open,visible:visible(d.querySelector('.tw841-group-content'))})),fenceRows:[...b.querySelectorAll('[data-tw840-fence-row]')].map(r=>({id:r.dataset.tw840FenceRow,visible:visible(r)})),types:[...b.querySelectorAll('[data-tw841-type],[data-tw841-programme-row]')].map(r=>({name:r.dataset.tw841Type||r.dataset.tw841ProgrammeRow,visible:visible(r)})),labels:labels.map(n=>({text:n.textContent,color:getComputedStyle(n).color,visible:visible(n)})),running:TodayWork840.report().running};
  });
  check(label+' native Today Print includes every instrument and opened detail fold',print.called===1&&print.bodyClass&&print.boardVisible&&print.cards.length===6&&print.cards.every(c=>c.visible)&&print.folds.length===6&&print.folds.every(f=>f.open&&f.visible)&&print.fenceRows.every(r=>r.visible)&&print.types.length>0&&print.types.every(r=>r.visible),print);
  check(label+' print text is dark and all instrument motion is stopped',print.labels.every(n=>n.visible&&n.color==='rgb(17, 17, 17)')&&!print.running,print.labels);
  await page.screenshot({path:path.join(out,'today841-'+label+'-native-print.png')});
 }finally{
  await page.emulateMedia({media:'screen'});await page.evaluate(()=>{window.dispatchEvent(new Event('afterprint'));window.print=__qaOriginalPrint841;delete window.__qaOriginalPrint841;});await page.waitForTimeout(300);
 }
 const after=await page.evaluate(()=>({main:document.querySelector('main').scrollTop,folds:[...document.querySelectorAll('[data-tw841-group-card]')].map(d=>({id:d.dataset.tw841GroupCard,open:d.open})),printing:document.body.classList.contains('printing-progress')}));
 check(label+' native Today Print restores fold state main scroll and screen mode',same(before.folds,after.folds)&&Math.abs(before.main-after.main)<=1&&!after.printing,{before,after});
 await equipment.locator('summary').focus();await page.keyboard.press('Enter');
}
module.exports={ids,readNativeGroupInputs841,groupOracle841,assertGroupModel841,readGroupUI841,assertGroupUI841,exerciseGroupFolds841,exerciseTodayPrint841};
