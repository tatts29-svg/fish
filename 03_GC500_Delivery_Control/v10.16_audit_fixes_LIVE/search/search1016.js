/* Author: Andrew Fisher. Find numbered contents at their current recorded reference. */
(function(root){
 'use strict';
 const normal=value=>String(value??'').trim().replace(/\s+/g,'').toUpperCase();
 function extend(base,assets){
  const out=base.slice(),seen=new Set(base.filter(r=>r.kind==='unit'&&r.no).map(r=>JSON.stringify([r.key,normal(r.no)])));
  for(const a of assets||[]){
   if(!a||a._cancelled||a._movedTo)continue;
   for(const x of a.accessories||[]){
    const no=String(x.asset_no||'').trim(),id=String(x._accId||''),token=JSON.stringify([a.key,normal(no)]);
    if(!no||!id||x.active===false||seen.has(token))continue;
    seen.add(token);
    const label=String(x.type||'Contents'),qty=typeof x.qty==='number'&&Number.isFinite(x.qty)&&x.qty>=0?x.qty:null;
    out.push({kind:'unit',key:a.key,label,no,accessoryId1016:id,quantity1016:qty,
     hay:[a.key,a.name,label,no,...(a.locations||[])].filter(Boolean).join(' ').toLowerCase()});
   }
  }
  return out;
 }
 function exact(matches,query){
  const number=normal(query),hits=matches.filter(r=>r.accessoryId1016&&normal(r.no)===number);
  if(!hits.length)return matches;
  const refs=new Set(hits.map(r=>r.key));
  return hits.concat(matches.filter(r=>!hits.includes(r)&&!(r.kind==='asset'&&refs.has(r.key))));
 }
 const api={normal,extend,exact};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 if(!root||typeof document==='undefined')return;
 root.AccessorySearch1016=api;
 const beforeIndex=finderIndex;
 finderIndex=function(){
  // Reuse the held current asset snapshot. This adds no generator/finance read
  // and never indexes source or removed-accessory history.
  return extend(beforeIndex.apply(this,arguments),allAssets().filter(a=>!movedAway(a.key)));
 };
 const beforeMatches=finderMatches;
 finderMatches=function(query){return exact(beforeMatches.apply(this,arguments),query);};
 const beforeRow=finderRow;
 finderRow=function(it,i){
  if(!it.accessoryId1016)return beforeRow.apply(this,arguments);
  const a=assetOf(it.key),destination=a&&destinationOf(a);
  return '<div class="fi unit'+(i===FINDER.at?' on':'')+'" role="option" id="fi-'+i+'" aria-selected="'+(i===FINDER.at)+'" data-fi="'+i+'">'+refPlate(it.key,15)+'<span class="fim"><b>'+esc(it.no)+' · '+esc(it.label)+'</b><span>Contents'+(it.quantity1016!==null?' · Qty '+esc(it.quantity1016):'')+' · inside '+esc(it.key)+'</span><span class="fiw">'+esc(destination?.text||a?.name||it.key)+'</span></span><span class="fik">Open record</span></div>';
 };
 let selected=null;
 function selectedRow(){
  const drawer=document.getElementById('drawer');
  if(!selected||state.sel!==selected.key||!drawer?.classList.contains('on'))return null;
  const target=[...drawer.querySelectorAll('[data-accessory1016]')].find(el=>el.dataset.accessory1016===selected.accessoryId1016);
  if(target){target.classList.add('profile1006-selected');target.setAttribute('tabindex','-1');}
  return target;
 }
 const beforeOpen=openAsset;
 openAsset=function(ref,opts){
  if(selected?.key!==ref||!opts?.keep)selected=null;
  const result=beforeOpen.apply(this,arguments);selectedRow();return result;
 };
 const beforePick=finderPick;
 finderPick=function(i){
  const it=FINDER.list?.[i],result=beforePick.apply(this,arguments);
  selected=it?.accessoryId1016?it:null;
  const target=selectedRow(),drawer=document.getElementById('drawer');
  if(!target)return result;
  for(let parent=target.parentElement;parent&&parent!==drawer;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  const focus=row=>{if(row?.getClientRects().length){row.scrollIntoView({block:'center'});row.focus({preventScroll:true});}};
  focus(target);
  // A first-open drawer can be rebuilt while its layout settles. Re-find that
  // row once, without reopening a fold or taking control after another action.
  const choice=selected,intent=root.Persistence1010?.intent;
  requestAnimationFrame(()=>{
   if(selected!==choice||root.Persistence1010?.intent!==intent)return;
   focus(selectedRow());
  });
  return result;
 };
})(typeof window==='undefined'?null:window);
