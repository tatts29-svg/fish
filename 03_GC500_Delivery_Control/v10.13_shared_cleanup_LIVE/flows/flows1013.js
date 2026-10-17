/* Author: Andrew Fisher. Keep reading state through registry refresh and tab disposal. */
(function(root){
'use strict';
const views=new Map();
function context(tab,pane){
 let view='';
 if(tab==='subhired')view=pane.querySelector('[data-supplier932-company][aria-pressed="true"]')?.dataset.supplier932Company||'';
 else if(tab==='costs'){const b=pane.querySelector('.finance857-nav [aria-pressed="true"]');view=b?.dataset.finance857||b?.dataset.finance888||'';}
 else if(tab==='today')view=pane.querySelector('#asOf')?.value||'';
 else if(tab==='timeline')view=pane.querySelector('.daystrip .day.on[data-day]')?.dataset.day||'';
 else if(tab==='demob')view=pane.querySelector('[data-dday816].on')?.dataset.dday816||'';
 else if(tab==='plant')view=String(state.plantGroup||'');
 return JSON.stringify([tab,view]);
}
function folds(pane){const counts=new Map();return [...pane.querySelectorAll('details')].map(el=>{const k=root.Persistence1010.key(el,pane),n=counts.get(k)||0;counts.set(k,n+1);return [k+'|'+n,el];});}
function depart(){
 const tab=state.tab,pane=document.getElementById('pane-'+tab);if(!pane||!root.Persistence1010)return;
 // Capture before native navigation releases a large hidden pane. Keep only booleans,
 // never old DOM, field values, financial data or a competing scroll/focus owner.
 views.set(context(tab,pane),new Map(folds(pane).map(([key,el])=>[key,el.open])));
 if(tab==='subhired')root.Flow994?.captureSubhired();
}
function arrive(tab){const pane=document.getElementById('pane-'+tab);if(!pane||!root.Persistence1010)return;const saved=views.get(context(tab,pane));if(saved)for(const [key,el]of folds(pane))if(saved.has(key))el.open=saved.get(key);}
const photoBefore=photoRedraw;
photoRedraw=function(){
 const tab=state.tab,pane=document.getElementById('pane-'+tab),held=root.Persistence1010?.capture(pane,true);
 try{return photoBefore.apply(this,arguments);}finally{if(state.tab===tab&&held)root.Persistence1010.restore(pane,held,true);}
};
function intentToken(){return {tab:state.tab,intent:root.Persistence1010?.intent};}
function current(token){const pane=document.getElementById('pane-'+token.tab);return state.tab===token.tab&&root.Persistence1010?.intent===token.intent&&!!pane&&!pane.hidden;}
function inventoryIntent(){return {...intentToken(),drill:JSON.stringify(INV.drill)};}
function currentInventory(token){return current(token)&&JSON.stringify(INV.drill)===token.drill;}
let inventoryReturn=null;
function returnToQuantity(){
 const held=inventoryReturn;if(!held||state.tab!==held.tab)return;
 const pane=document.getElementById(held.pane),target=[...pane?.querySelectorAll('['+held.attr+']')||[]].find(n=>n.getAttribute(held.attr)===held.value);
 if(!target||!target.getClientRects().length)return;
 target.focus({preventScroll:true});target.scrollIntoView({block:'nearest',inline:'nearest'});
}
const invBefore=invBind;
invBind=function(pane){
 const result=invBefore.apply(this,arguments);
 for(const button of pane.querySelectorAll('[data-invdrill],[data-invref87]')){
  const before=button.onclick,attr=button.hasAttribute('data-invref87')?'data-invref87':'data-invdrill';
  button.onclick=function(){inventoryReturn={tab:state.tab,pane:pane.id,attr,value:button.getAttribute(attr)};const r=before?.apply(this,arguments);if(!INV.drill)returnToQuantity();return r;};
 }
 for(const button of pane.querySelectorAll('[data-invdrill-x]')){const before=button.onclick;button.onclick=function(){const r=before?.apply(this,arguments);returnToQuantity();return r;};}
 return result;
};
root.Flows1013={depart,arrive,intentToken,current,inventoryIntent,currentInventory};
})(window);
