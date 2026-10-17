/* Author: Andrew Fisher. D024 legend correction and evidence-based physical scope.
 * Original source rows and shared history stay intact. A symbol is not a supplied machine.
 */
function lighting882Screen(a){return a&&a.origin==='drawing'&&a.drawing==='D024-26003-02'&&a.tower_series==='circuit';}
function lighting882DrawingOnly(a){
 if(!a||a.origin!=='drawing'||a.drawing!=='D024-26003-02'||!['keyed','circuit'].includes(a.tower_series)||(a.events||[]).length)return false;
 const d=deliveryOf(a.key);
 return !assetNumbersOf(a).length&&!rentalOf(a.key)&&!d.done&&!(d.recorded&&d.state==='on site')&&!(unitsOf(a.key)||[]).length;
}
function lighting882Alias(a,rows){
 if(!a?._added||!a.source_row||a.discipline!=='Lighting towers')return null;
 const parent=rows.find(x=>x.key===a.source_row&&!x._cancelled&&!x.relocation&&!movedAway(x.key));
 if(!parent||parent.discipline!=='Lighting towers')return null;
 const nums=assetNumbersOf(a),parentNums=assetNumbersOf(parent);
 return nums.length&&nums.every(n=>parentNums.includes(n))?{parent:parent.key,numbers:nums}:null;
}
function lighting882Projection(a,rows){
 const screen=lighting882Screen(a),symbol=lighting882DrawingOnly(a),alias=lighting882Alias(a,rows);
 if(!screen&&!symbol&&!alias)return a;
 const out=Object.assign({},a,{_mapContext882:symbol,_sourceAlias882:alias});
 if(screen){out.discipline='Big screens';out.product='Big Screen';out.item_types=['Big Screen'];out.name='Big screen '+String(a.key).replace(/^\D+/,'')+' · D024 drawing symbol';out._screenSymbol882=true;}
 return out;
}
const lighting882Build=buildAllAssets;
buildAllAssets=function(){const rows=lighting882Build();return rows.map(a=>lighting882Projection(a,rows)).filter(a=>!a._mapContext882&&!a._sourceAlias882);};
const lighting882Asset=assetOf;
assetOf=function(key){const found=lighting882Asset(key);if(found)return found;return heldMemo('lighting-context882',()=>{const rows=lighting882Build();return rows.map(a=>lighting882Projection(a,rows)).filter(a=>a._mapContext882||a._sourceAlias882);}).find(a=>a.key===key)||null;};
const lighting882Lines=chargeLines;chargeLines=function(a){return a?._mapContext882||a?._sourceAlias882?[]:lighting882Lines(a);};
function lighting882Audit(asOf){
 const rows=lighting882Build(),lighting=allAssets().filter(a=>!a._cancelled&&a.discipline==='Lighting towers'),map=rows.filter(a=>a.drawing==='D024-26003-02'&&a.tower_series==='keyed');
 const symbols=rows.filter(lighting882DrawingOnly),aliases=rows.map(a=>({a,alias:lighting882Alias(a,rows)})).filter(x=>x.alias);
 const qty=lighting.reduce((n,a)=>n+unitsAsked(a),0),onsite=lighting.reduce((n,a)=>{const d=deliveryAsOf(a.key,asOf||todayIso());return n+(d.recorded&&(d.state==='on site'||d.done)?unitsAsked(a):0)},0);
 return {mapCallouts:map.length,boq:DATA.lighting_review882?.boq??null,recordedScope:qty,onSite:onsite,drawingOnly:symbols.length,screenSymbols:rows.filter(lighting882Screen).length,aliases:aliases.map(x=>({key:x.a.key,parent:x.alias.parent})),provisional:DATA.lighting_review882?.boq!=null&&qty!==DATA.lighting_review882.boq||qty!==map.length};
}
const lighting882Groups=todayGroupDetails841;
todayGroupDetails841=function(...args){const r=lighting882Groups(...args);if(r.health?.ready){const a=lighting882Audit(args[0]);r.lighting.notes.push('Lighting scope: '+a.recordedScope+' unique units on current equipment references; '+a.mapCallouts+' keyed lighting callouts on D024'+(a.boq!=null?'; '+a.boq+' units in the Schedule (5) BOQ':'')+'. These source totals remain separate until reconciled. Drawing-only symbols and source-row copies do not add supplied machines.');}return r;};
const lighting882Summary=todayWorkSummary848;
todayWorkSummary848=function(...args){const r=lighting882Summary(...args),x=r.byId?.lighting;if(x&&r.health?.ready){const a=lighting882Audit(args[0]);if(a.provisional){x.pctKind=x.pct==null?'unknown':'recorded-scope';x.pctLabel='Complete in recorded scope';x.scope='Unique recorded equipment';x.scopeUnconfirmed882=true;x.basis+=' Full-job scope is unreconciled: D024 keyed callouts and Schedule (5) BOQ retain their own totals. This percentage covers unique recorded equipment only.';}}return r;};
const lighting882Drawer=drawerTidy;drawerTidy=function(a){lighting882Drawer(a);if(!a||!a._mapContext882&&!a._sourceAlias882)return;const dr=document.getElementById('drawer');if(!dr||dr.querySelector('.lighting882-notice'))return;const n=document.createElement('p');n.className='notice info lighting882-notice';n.textContent=a._sourceAlias882?'Linked source unit · counted with '+a._sourceAlias882.parent+'. Existing reference history is retained; this copy adds no extra machine.':a._screenSymbol882?'D024 big-screen symbol · map context only. This is not an additional lighting tower.':'D024 lighting callout · map context only. An unmatched drawing callout does not add an extra supplied tower.';const body=dr.querySelector('.dbody')||dr;body.prepend(n);};
