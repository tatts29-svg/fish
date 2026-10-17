/* Author: Andrew Fisher. Reviewed VMS moves change current location, never historical receipts or charges. */
(function(root){
'use strict';
const normal=n=>String(n??'').trim();
function evidenceDay(value){
 const s=normal(value),iso=/^(\d{4}-\d{2}-\d{2})(?:T|$)/.exec(s);
 if(iso){const at=Date.parse(s);if(!Number.isFinite(at))return '';return s.includes('T')?new Date(at+36000000).toISOString().slice(0,10):new Date(at).toISOString().slice(0,10)===s?s:'';}
 const m=/^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/.exec(s);
 return m?m[3]+'-'+String(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(m[2])+1).padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';
}
function reviewed(boards,readAssignment,readWord,readIdentity){
 const out=[];
 for(const board of boards){
  const assignment=readAssignment(board),word=readWord(board.key),identity=readIdentity(board);
  if(!['word','record'].includes(assignment.src)||assignment.bad)continue;
  const source=[...new Set([board.load,...(board.folded||[]).map(f=>f.load),word.from].filter(Boolean))];
  const numbers=[...new Set([board.asset,identity.fleet].map(normal).filter(Boolean))];
  if(!numbers.length)continue;
  // A board record's `at` changes for rego/fleet edits too; it is not a move
  // timestamp. Only replay the dated site instruction while it still agrees
  // with the current assignment. Other assignments affect current stock only.
  const day=assignment.src==='word'||word.on===assignment.on?evidenceDay(word.said):'';
  for(const from of source)if(from!==assignment.on)out.push({board:board.key,from,to:assignment.on||null,numbers,day});
 }
 return out;
}
function moves(){return heldMemo('vms-movements1016',()=>reviewed(vms913Boards(),vms913OnOf,vms913WordOf,vms913Of));}
function currentSnapshot(day){return !day||day>=todayIso();}
function forAsset(a,day){const tid=vms913TidOf(a);if(!tid)return [];return moves().filter(m=>m.from===tid&&(currentSnapshot(day)||m.day&&m.day<=day));}
function movedNumber(a,number){return forAsset(a).find(m=>m.numbers.includes(normal(number)))||null;}
function model(a,original){
 const departures=forAsset(a);if(!departures.length)return original;
 const rows=original.rows.map(row=>{
  if(row.owner!=='coates')return row;
  const move=departures.find(m=>m.numbers.includes(normal(row.assetNo)));if(!move)return row;
  return {...row,item:'VMS',sourceItem1016:row.item,physical:false,source:'history',movement1016:move,identityReview:move.to?'Moved to '+vms913ShownKey(move.to)+' ('+move.board+')':'Moved off this delivery ('+move.board+')'};
 });
 const replacements=new Map(original.rows.map((row,i)=>[row,rows[i]]));
 const groups=original.groups.map(group=>{
  if(group.item!=='VMS')return {...group,units:group.units.map(row=>replacements.get(row)||row).filter(row=>row.source!=='history')};
  const moved=new Set(rows.filter(r=>r.item===group.item&&r.movement1016).map(r=>r.movement1016.board)).size;
  const units=rows.filter(r=>r.item===group.item&&r.source!=='history');
  return {...group,units,moved1016:moved,pending:group.quantity==null?null:Math.max(0,group.quantity-units.filter(r=>r.physical).length-moved)};
 }).filter(group=>group.units.length||group.quantity!=null);
 return {...original,rows,groups};
}
function quantity(a,item,day,received){
 if(item!=='VMS'||!Number.isFinite(received))return received;
 const departures=forAsset(a,day);if(!departures.length)return received;
 const numbers=new Set([...(a.asset_numbers||[]),...unitsOf(a.key).map(u=>u.asset_no)].map(normal));
 const count=new Set(departures.filter(m=>m.numbers.some(n=>numbers.has(n))).map(m=>m.board)).size;
 const active=currentSnapshot(day)?gcModel925(a,{loading:false}).rows.filter(r=>r.physical&&r.item===item).length:0;
 // Later identified replacements can fill the vacated slots. Keep unnumbered
 // received units, but a new number alone cannot exceed the recorded receipt.
 // Current identities cannot reconstruct historical replacement events.
 return Math.max(0,received-count,Math.min(received,active));
}
const api={reviewed,evidenceDay,moves,forAsset,movedNumber,model,quantity};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(!root)return;
if(root.VmsAssignment1016)throw new Error('VMS assignment projection already installed');root.VmsAssignment1016=api;
const stockBefore=CurrentStock996.quantity;
CurrentStock996.quantity=function(a,item,day,received){return stockBefore.call(this,a,item,day,quantity(a,item,day,received));};
const countBefore=invCountNums;
invCountNums=function(a){return countBefore.apply(this,arguments).filter(n=>!movedNumber(a,n));};
})(typeof window!=='undefined'?window:null);
