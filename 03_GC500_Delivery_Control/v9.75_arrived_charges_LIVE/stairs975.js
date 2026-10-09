/* Author: Andrew Fisher. Per-item stairs charge exclusions in the existing shared loads collection. */
(function(W){
'use strict';
const prefix='stairs975/',kind='stairs975',trim=x=>String(x==null?'':x).trim();
function key(ref,disc,item,unit){return prefix+JSON.stringify([trim(ref),trim(disc),trim(item),trim(unit)]);}
function record(ref,disc,item,unit){const k=key(ref,disc,item,unit),r=(S.loads||{})[k];return r&&r.kind===kind&&r.ref===ref&&r.disc===disc&&r.item===item&&trim(r.unit)===trim(unit)?r:null;}
function pieceQty(a,l,unit){const qty=qtyOf(l);if(qty==null||qty<0)return 0;const us=labourUnits(a,l.item);if(unit){if(!us.includes(unit))return 0;return unit===LAB_REST?labourRestN(a,l.item,us):1;}return us.length?0:qty;}
function scopedQty(a,l,unit){const r=record(a.key,l.discipline,l.item,unit);return r&&r.excluded===true?Math.max(0,Math.min(pieceQty(a,l,unit),Number.isSafeInteger(r.qty)?r.qty:0)):0;}
function quantity(a,l,unit){if(!a||!l)return 0;if(unit)return scopedQty(a,l,unit);const us=labourUnits(a,l.item);return us.length?Math.min(qtyOf(l)||0,us.reduce((n,u)=>n+scopedQty(a,l,u),0)):scopedQty(a,l,null);}
function excluded(ref,disc,item,unit){const a=assetOf(ref),l=a&&chargeLines(a).find(x=>x.discipline===disc&&x.item===item);return !!l&&pieceQty(a,l,unit)>0&&scopedQty(a,l,unit)===pieceQty(a,l,unit);}
function saveExclusion(ref,disc,item,unit,qty){
 if(!mayWrite('the stairs charge'))return false;
 const a=assetOf(ref),l=a&&chargeLines(a).find(x=>x.discipline===disc&&x.item===item);
 if(!a||a._cancelled||a.rest_of||movedAway(ref)||!l)return false;
 const max=pieceQty(a,l,unit),info=labourLinesFor(ref,disc,item,ref,unit,a);
 if(!Number.isSafeInteger(qty)||qty<0||qty>max||!info.lines.some(x=>x.key==='steps')){flash('Select a stairs quantity for this item.');return false;}
 const who=whoAmI();if(!who)return false;
 const k=key(ref,disc,item,unit),old=record(ref,disc,item,unit);
 if(typeof docIdOf==='function'&&Object.keys(S.loads||{}).some(x=>x!==k&&docIdOf(x)===docIdOf(k))){flash('This stairs record needs a unique document identity.');return false;}
 if(Object.hasOwn(S.loads||{},k)&&!old){flash('This stairs record needs review.');return false;}
 if((old&&old.excluded?old.qty:0)===qty)return false;
 const at=new Date(Math.max(Date.now(),Date.parse(old&&old.at||'')+1||0)).toISOString();
 const history=(old&&Array.isArray(old.history)?old.history:[]).concat([{qty,excluded:qty>0,by:who,at}]).slice(-400);
 S.loads=S.loads||{};S.loads[k]={kind,ref,disc,item,unit:trim(unit),qty,excluded:qty>0,by:who,at,history};
 stampIt('loads',k,who);save();bump();
 flash(ref+' · '+item+(unit?' · '+unit:'')+': '+(qty?qty+' stairs charge'+(qty===1?'':'s')+' removed':'stairs charges restored')+'.');return true;
}
function controls(a,l,unit){const max=pieceQty(a,l,unit);if(max<1)return '';const q=scopedQty(a,l,unit),r=record(a.key,l.discipline,l.item,unit),data=' data-stairs975-ref="'+esc(a.key)+'" data-stairs975-disc="'+esc(l.discipline)+'" data-stairs975-item="'+esc(l.item)+'" data-stairs975-unit="'+esc(unit||'')+'"';
 return '<span class="stairs975"'+data+' style="display:flex;flex-wrap:wrap;gap:6px;align-items:center"><span class="w">'+(q?'Stairs excluded × '+q:'Stairs included × '+max)+'</span>'+ (canEdit()?'<button type="button" class="btn ghost sm" data-stairs975-action="'+(q?'add':'remove')+'">'+(q?'Add stairs':'Remove stairs')+'</button>'+(max>1?'<label class="w">Without stairs <input type="number" class="rate" min="0" max="'+max+'" step="1" value="'+q+'" data-stairs975-qty aria-label="'+esc(a.key+' '+l.item+' '+(unit||'')+' quantity without stairs')+'" style="width:5em"></label>':''):'')+(q&&r&&r.by?'<span class="edby">'+esc(r.by)+(r.at?' · '+esc(fmtStamp(r.at)):'')+'</span>':'')+'</span>';
}
W.Stairs975={key,record,pieceQty,quantity,excluded,save:saveExclusion,controls,kind,prefix};
const original=labourTicksHtml;
labourTicksHtml=function(a){const html=original.apply(this,arguments),scopes=new Map();for(const l of chargeLines(a)){const us=labourUnits(a,l.item);for(const u of us.length?us:[null])scopes.set(esc(labourKey(a.key,l.discipline,l.item,'steps',u)),{l,u});}
 return html.replace(/<label\b[^>]*>[\s\S]*?<\/label>/g,block=>{const m=block.match(/data-lab="([^"]+)"/),s=m&&scopes.get(m[1]);if(!s)return block;const q=scopedQty(a,s.l,s.u),max=pieceQty(a,s.l,s.u);if(q===max&&q>0)block=block.replace(/(<input\b[^>]*)(>)/,'$1 disabled$2');return block+controls(a,s.l,s.u);});};
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-stairs975-action]');if(!b)return;e.preventDefault();e.stopPropagation();const c=b.closest('.stairs975'),d=c.dataset,a=assetOf(d.stairs975Ref),l=a&&chargeLines(a).find(x=>x.discipline===d.stairs975Disc&&x.item===d.stairs975Item);if(!l)return;saveExclusion(a.key,l.discipline,l.item,d.stairs975Unit,b.dataset.stairs975Action==='add'?0:pieceQty(a,l,d.stairs975Unit));});
document.addEventListener('change',e=>{const b=e.target.closest?.('[data-stairs975-qty]');if(!b)return;const c=b.closest('.stairs975'),d=c.dataset;saveExclusion(d.stairs975Ref,d.stairs975Disc,d.stairs975Item,d.stairs975Unit,Number(b.value));});
})(window);
