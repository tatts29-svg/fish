/* Author: Andrew Fisher. Show explicitly recorded accessories without changing ordered stock or progress. */
(function(root){
'use strict';
const text=value=>String(value==null?'':value).trim();
const normal=value=>text(value).toLowerCase().replace(/\s+/g,' ');
const number=value=>text(value).toUpperCase();
const esc=value=>text(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sameItem=(a,b)=>!!normal(a)&&!!normal(b)&&(normal(a)===normal(b)||normal(a).startsWith(normal(b)+' ')||normal(b).startsWith(normal(a)+' '));
const sizeFamily=value=>normal(value).replace(/\d+(?:\.\d+)?\s*(kva|kw|tonnes?|tons?|t|metres?|meters?|m|litres?|liters?|l|pan)(?=\b|$)/g,'#$1');
const active=a=>a&&text(a.key)&&!a._cancelled&&!a.relocation&&!a._movedTo&&!a._locationMoved;
function nativeMatch(unit,raw){
 if(!raw)return false;
 const a=number(unit.assetNo),b=number(raw.asset_no||raw.assetNo);
 if(a||b)return !!a&&a===b;
 const id=text(raw.nativeId||raw.unit_id||raw.id);
 return !!id&&id===text(unit.nativeId);
}
function project(records,options){
 const opts=options||{},spares=opts.spares||[],matches=opts.sameItem||sameItem,claims=new Map(),ids=new Map(),rows=[];
 const source=(records||[]).filter(r=>active(r.asset)&&!r.movedAway&&!r.alias);
 // Count claims before choosing additional rows. A repeated identity remains unresolved,
 // including an identity also present on an ordinary requested equipment line.
 for(const record of source)for(const unit of record.physicalUnits||[]){
  if(!unit||unit.physical!==true)continue;
  const id=text(unit.id),no=number(unit.assetNo);
  if(id)ids.set(id,(ids.get(id)||0)+1);
  if(no){const list=claims.get(no)||[];list.push(unit);claims.set(no,list);}
 }
 for(const record of source){
  const a=record.asset,ref=text(a.key),covered=(record.requestedItems||[]).concat(record.suppliedItems||[]).filter(Boolean);
  const coveredNumbers=new Set((record.countedNumbers||[]).map(number));
  for(const unit of record.physicalUnits||[]){
   if(!unit||unit.physical!==true||unit.source!=='native'||unit.slot||!text(unit.id)||text(unit.ref)!==ref||ids.get(text(unit.id))!==1)continue;
   const item=text(unit.item),no=number(unit.assetNo),owner=text(unit.owner)||'unknown';
   if(!item||covered.some(value=>matches(item,value)||(sizeFamily(item).includes('#')&&sizeFamily(item)===sizeFamily(value)))||coveredNumbers.has(no))continue;
   // A native identity must still be explicitly present, rather than a generated
   // requested slot, a number-only projection, or an alternative supplied size.
   const recorded=(record.nativeUnits||[]).filter(raw=>nativeMatch(unit,raw));
   if(recorded.length!==1)continue;
   const raw=recorded[0];
   if(raw.active===false||raw.removed===true||raw.deleted===true||raw.movedTo||raw._movedTo)continue;
   if(no&&(claims.get(no)||[]).filter(other=>text(other.owner)===owner||!text(other.owner)||other.owner==='unknown'||owner==='unknown').length!==1)continue;
   // A unit allocated as a spare must not also appear as additional equipment.
   // Unknown ownership is deliberately conservative where the same number exists.
   if(spares.some(spare=>no&&number(spare.no||spare.assetNo)===no))continue;
   rows.push({id:text(unit.id),ref,item,assetNo:text(unit.assetNo),label:text(unit.label),owner,company:opts.company?text(opts.company(owner)):owner,discipline:text(a.discipline)||'Other',referenceText:[text(a.name),...(a.locations||[]).map(text)].join(' ')});
  }
 }
 return {rows:rows.sort((a,b)=>a.item.localeCompare(b.item)||a.ref.localeCompare(b.ref,undefined,{numeric:true})||a.assetNo.localeCompare(b.assetNo,undefined,{numeric:true}))};
}
function view(model,options){
 const opts=options||{},terms=normal(opts.query).split(' ').filter(Boolean),refs=Array.isArray(opts.references)?new Set(opts.references.map(text)):null;
 return {rows:(model.rows||[]).filter(row=>(!opts.discipline||opts.discipline==='*'||row.discipline===opts.discipline)&&(!refs||refs.has(row.ref))&&terms.every(term=>normal([row.ref,row.item,row.assetNo,row.label,row.company,row.discipline,row.referenceText].join(' ')).includes(term)))};
}
function html(model){
 const rows=model&&model.rows||[];
 if(!rows.length)return '';
 return '<section class="card additional1103" id="additional-equipment1103" aria-labelledby="additional-equipment1103-title"><h3 id="additional-equipment1103-title">Additional recorded equipment</h3><p class="sub">Open a reference for its delivery and installation status.</p><div class="invwrap"><table class="invtab"><thead><tr><th scope="col">Equipment</th><th scope="col">Asset / fleet number</th><th scope="col">Company</th><th scope="col">Reference</th></tr></thead><tbody>'+rows.map(row=>'<tr data-additional-equipment1103-unit="'+esc(row.id)+'" data-additional-equipment1103-ref="'+esc(row.ref)+'"><td>'+esc(row.item)+'</td><td class="mono">'+esc(row.assetNo||'Not recorded')+'</td><td>'+esc(row.company||'Owner to confirm')+'</td><td><button type="button" class="btn ghost sm" data-additional-equipment1103-open="'+esc(row.ref)+'" aria-label="Open reference '+esc(row.ref)+'">'+esc(row.ref)+'</button></td></tr>').join('')+'</tbody></table></div></section>';
}
function model(){
 const counted=physicalCountAssets963(allAssets()),records=counted.assets.map(a=>({
  asset:a,movedAway:movedAway(a.key),requestedItems:chargeLines(a).map(line=>line.item),
  suppliedItems:itemRows(a).map(row=>row.supplied),countedNumbers:invCountNums(a),
  nativeUnits:unitsOf(a.key),physicalUnits:gcUnits925(a,{loading:false})
 }));
 return project(records,{spares:spareList(),sameItem:lineItemMatch,company:Units925.company});
}
function insert(base,extra){
 // Equipment takes the first element of invHtml. Keep the new section inside that
 // existing root; Change deliveries consumes the same markup and binding.
 if(!extra)return base;
 const end=/<\/div>\s*$/.exec(base);
 return end?base.slice(0,end.index)+extra+base.slice(end.index):base;
}
const API={project,view,html,insert,model};root.AdditionalEquipment1103=API;
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(typeof document==='undefined')return;
const beforeHtml=invHtml;
invHtml=function(){
 const base=beforeHtml.apply(this,arguments),s=typeof state==='undefined'?{}:state;
 const references=s.tab==='plant'&&s.plantGroup?(plantGroups().find(([name])=>name===s.plantGroup)||[null,[]])[1].map(a=>a.key):null;
 return insert(base,html(view(model(),{discipline:typeof INV==='undefined'?'*':INV.disc,query:s.q,references})));
};
const beforeBind=invBind;
invBind=function(pane){
 const result=beforeBind.apply(this,arguments);
 pane.querySelectorAll('[data-additional-equipment1103-open]').forEach(button=>{button.onclick=()=>openAsset(button.dataset.additionalEquipment1103Open);});
 return result;
};
})(typeof window!=='undefined'?window:globalThis);
