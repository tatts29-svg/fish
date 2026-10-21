/* Author: Andrew Fisher. Distinguish a saved board location from its original plan caption. */
(function(root){
'use strict';
function moved(board,position){
 const b=board||{},p=position||{};
 return [b.lat,b.lon,p.lat,p.lon].every(Number.isFinite)&&
  (Math.abs(b.lat-p.lat)>0.000001||Math.abs(b.lon-p.lon)>0.000001);
}
function title(b,p){return moved(b,p)?'Confirmed board location':String(b.title||'');}
function crop(b,p){return moved(b,p)?'Original plan position · use the current pin to navigate':'Red dot = position · photo = the spot';}
function placed(b,p){return moved(b,p)?'In place at the current pin':'In place as drawn';}
function basis(b,p){return moved(b,p)?String(p.how||'Saved position')+' · Original plan: '+String(b.title||''):String(b.basis||'');}
const api=Object.freeze({moved,title,crop,placed,basis});
root.VmsLocationWords1103=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window==='undefined'?globalThis:window);
