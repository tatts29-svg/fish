/* Author: Andrew Fisher. Proposed physical supplier loads, driven by the same item remainder as Sub-hired. */
(function(){
'use strict';
const S996=window.Supplier996,base=dpLoads,baseId=ldId,baseOpen=ldIsOpen,baseBasis=dpBasisShort;
function residualDay(d,M){
 const scope=new Set(M.rows.map(r=>r.ref+'|'+r.item));
 return {...d,deliveries:(d.deliveries||[]).map(r=>({...r,events:(r.events||[]).filter(e=>!scope.has(r.a.key+'|'+e.item))})).filter(r=>r.events.length)};
}
function asNative(L,day){
 const groups=new Map();for(const stop of L.stops){const a=assetOf(stop.ref)||S996.requestAsset(stop.ref);if(!a)continue;if(!groups.has(stop.ref))groups.set(stop.ref,{a:{...a,asset_numbers:[],_bookingNumbers801:[],accessories:[],_supplier996:true},events:[],_supplier996:true});const row=groups.get(stop.ref);row.a._bookingNumbers801.push(...stop.numbers);row.events.push({task_id:'supplier996:'+stop.ref+':'+stop.item,date:day,movement:'install',item:stop.item,quantity_raw:stop.count,quantity_display:String(stop.count),carrier:'Event Portables',note:stop.identityPending?'Exact fleet numbers for this load are not allocated.':''});}
 return {kind:'deliveries',rows:[...groups.values()],time:null,timeRaw:'',carrier:'Event Portables',basis:'supplier996',_supplier996:L};
}
const daysBefore=programmeDays;
programmeDays=function(){const days=daysBefore.apply(this,arguments),M=S996.model();for(const r of M.remaining.filter(r=>r.sourceOnly&&r.date)){let d=days.find(d=>d.iso===r.date);if(!d){d={iso:r.date,deliveries:[],removals:[],loads:[]};days.push(d);}const a=S996.requestAsset(r.ref);if(!d.deliveries.some(x=>x.a.key===a.key))d.deliveries.push({a,events:a.events});}return days.sort((a,b)=>a.iso.localeCompare(b.iso));};
dpLoads=function(d){if(!d||d.iso<todayIso())return base.apply(this,arguments);const M=S996.model(),other=base(residualDay(d,M));return other.concat(S996.inboundLoads(d.iso).map(L=>asNative(L,d.iso)));};
ldId=function(d,g){return g._supplier996?d.iso+'|'+g.kind+'|supplier996:'+g._supplier996.id:baseId.apply(this,arguments);};
ldIsOpen=function(d,g){return g._supplier996?state.tlLoad===ldId(d,g):baseOpen.apply(this,arguments);};
dpBasisShort=function(g){return g._supplier996?'Proposed load '+g._supplier996.n+' · '+S996.loadText(g._supplier996):baseBasis.apply(this,arguments);};
Object.assign(S996,{residualDay,asNative});
})();
/* Source-row requests stay read-only until a native reference is linked. */
(function(){
'use strict';const S996=Supplier996,baseLabel=generatorRefLabel994,baseCard=dayCard;
generatorRefLabel994=function(key){const r=S996.requests.find(r=>r.id===String(key));return r?r.name:baseLabel.apply(this,arguments);};
dayCard=function(a){if(!a?._supplier996Request)return baseCard.apply(this,arguments);const r=S996.requests.find(r=>r.id===a.key);return '<article class="dcard supplier996-stop"><h3>'+esc(r.name)+' · 1 × FWF</h3><span>Sub-hired · Event Portables</span><span>'+esc(epDay819(r.date))+' · requested · no receipt recorded</span><details><summary>More info</summary><p>Exact toilet position and asset number are not recorded.</p><p>'+esc(r.source.file+' · '+r.source.sheet+' · row '+r.row)+'</p></details></article>';};
})();
