/* Author: Andrew Fisher. One visible photo group per identified unit; original photo homes remain unchanged. */
(function(){
'use strict';
function aliases(rows){return rows.filter(u=>u.physical&&u.id&&u.assetNo&&u.id!==u.assetNo&&rows.filter(r=>r.assetNo===u.assetNo).length===1).map(u=>({id:u.id,legacy:u.assetNo}));}
function photos(a,body){
 const rows=holdAssets(()=>gcModel925(a).rows),groups=[...body.querySelectorAll('.dphunit')];
 const find=id=>groups.find(g=>g.querySelector('.dphgrid')?.dataset.dphunit===id);
 for(const pair of aliases(rows)){
  const canonical=find(pair.id),legacy=find(pair.legacy);if(!canonical||!legacy||canonical===legacy)continue;
  const to=canonical.querySelector('.dphgrid'),from=legacy.querySelector('.dphgrid'),slots=[...to.children];
  // Move live nodes, not recreated markup: caption, replace, remove and pending-upload handlers retain their original homes.
  [...from.children].forEach((cell,i)=>{if(cell.classList.contains('dphnone'))return;const slot=slots[i];if(slot&&slot.classList.contains('dphnone'))slot.replaceWith(cell);else to.appendChild(cell);});
  legacy.querySelectorAll('.dphstray').forEach(el=>canonical.appendChild(el));
  const cells=[...to.children],count=cells.filter(el=>!el.classList.contains('dphnone')&&!el.classList.contains('dphsending')).length,queued=cells.filter(el=>el.classList.contains('dphsending')).length,label=canonical.querySelector(':scope > summary .w');
  if(label)label.textContent=(count?count+' photograph'+(count===1?'':'s'):'no photograph yet')+(queued?' · '+queued+' queued':'');
  canonical.dataset.photo935=pair.id;legacy.remove();
 }
}
const api={aliases,photos};if(typeof module!=='undefined'&&module.exports)module.exports=api;if(typeof window!=='undefined')window.Drawer935=api;
})();
