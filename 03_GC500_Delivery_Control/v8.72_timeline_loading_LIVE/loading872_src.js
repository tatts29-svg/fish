/* Author: Andrew Fisher. Shared building and toilet loading instructions; never infer truck side from a map orientation. */
function loading872Merge(a,b){
 const out={};const valid=x=>x&&['driver','passenger',''].includes(x.side)&&typeof x.by==='string'&&x.by.trim()&&Number.isFinite(Date.parse(x.at));
 for(const k of new Set(Object.keys(a||{}).concat(Object.keys(b||{})))){const A=(a||{})[k],B=(b||{})[k];if(!valid(A)&&!valid(B))continue;out[k]=!valid(A)?B:!valid(B)?A:A.at!==B.at?(A.at>B.at?A:B):(JSON.stringify(A)>JSON.stringify(B)?A:B);}
 return out;
}
function loading872Record(ref){return loading872Merge(((CROW.get(ref)||{}).delivery||{}).loading872,((S.delivery||{})[ref]||{}).loading872);}
function loading872Rows(a){
 if(!a||a._cancelled)return [];const lines=chargeLines(a).filter(l=>/toilet|\bfwf\b|pan\s*block|ablution|pee\s*panel|building|ticket\s*box|\bcont(?:ainer)?\b/i.test(l.item||'')&&!/tank/i.test(l.item||''));
 if(!lines.length)return [];const booked=Array.isArray(a._bookingNumbers801)?new Set(a._bookingNumbers801.map(String)):null,out=[],seen=new Set();
 lines.forEach(l=>{let nums=invItemNums(a,l.item).concat(subOf(a.key).filter(u=>!u.item||lineItemMatch(l.item,u.item)).map(u=>u.no)).map(String).filter(n=>n&&!/^MISCITEM$/i.test(n));nums=[...new Set(nums)].filter(n=>!booked||booked.has(n));
  if(nums.length)nums.forEach(n=>{if(!seen.has(n)){out.push({id:'u'+n,no:n,item:l.item});seen.add(n);}});
  else if(!booked||!booked.size)out.push({id:'item:'+l.item,no:'',item:l.item});
 });return out;
}
function loading872Side(a,id){const m=loading872Record(a.key);return (m[id]&&m[id].side)||'';}
function loading872Words(side){return side==='driver'?'Door to driver side':side==='passenger'?'Door to passenger side':'Door side not set';}
function loading872Set(ref,id,side){
 const a=assetOf(ref);if(!a||!loading872Rows(a).some(x=>x.id===id)||!['driver','passenger',''].includes(side)||!mayWrite('the loading direction'))return false;const who=whoAmI();if(!who)return false;
 const d=(S.delivery||(S.delivery={}))[ref]||((S.delivery)[ref]={}),old=loading872Record(ref),prev=old[id];
 if(prev&&prev.side===side)return true;const at=new Date(Math.max(Date.now(),prev?Date.parse(prev.at)+1:0)).toISOString();d.loading872=Object.assign({},d.loading872||{},{[id]:{side,by:who,at}});bump();flash(ref+' · '+loading872Words(side)+' saved.');return true;
}
function loading872Editor(a){
 const rows=loading872Rows(a);if(!rows.length)return '';const can=capability()==='edit'&&!SYNC.readonly;
 return '<details class="loading872"><summary>Loading · '+esc(loading872Compact(a))+'</summary><div>'+rows.map(r=>'<fieldset><legend>'+esc(r.item)+(r.no?' · Asset '+esc(r.no):'')+'</legend>'+['driver','passenger'].map(side=>'<label><input type="radio" name="door872-'+esc(a.key+'-'+r.id)+'" data-door872-ref="'+esc(a.key)+'" data-door872-unit="'+esc(r.id)+'" value="'+side+'"'+(loading872Side(a,r.id)===side?' checked':'')+(can?'':' disabled')+'> '+loading872Words(side)+'</label>').join('')+(can?'<button type="button" class="btn" data-door872-clear="'+esc(a.key)+'" data-door872-unit="'+esc(r.id)+'">Clear</button>':'')+'</fieldset>').join('')+'</div></details>';
}
function loading872Compact(a){const rows=loading872Rows(a);if(!rows.length)return '';const sides=[...new Set(rows.map(r=>loading872Side(a,r.id)))];return sides.length===1?loading872Words(sides[0]):rows.map(r=>(r.no?'Asset '+r.no:r.item)+': '+loading872Words(loading872Side(a,r.id))).join(' · ');}
function loading872Sheet(a){
 const rows=loading872Rows(a);if(!rows.length)return '';const groups=new Map();rows.forEach(r=>{const side=loading872Side(a,r.id),key=r.item+'|'+side;if(!groups.has(key))groups.set(key,{item:r.item,side,nums:[]});if(r.no)groups.get(key).nums.push(r.no);});
 return '<div class="loading872-sheet"><b>Loading · truck door side</b>'+[...groups.values()].map(r=>'<div>'+esc(r.item)+(r.nums.length?' · Asset '+(r.nums.length===1?'no. ':'nos. ')+r.nums.map(esc).join(' · '):'')+'<br>'+['driver','passenger'].map(s=>(s===r.side?'☑':'☐')+' '+loading872Words(s)).join(' · ')+(r.side?'':' · Confirm before loading')+'</div>').join('')+'</div>';
}
function loading872AssetHtml(a){
 const shown=dpNums(a),known=shown.length?shown:assetNumbersOf(assetOf(a.key)||a);const nums=[...new Set(known.map(String).filter(n=>n&&!/^MISCITEM$/i.test(n)))];return nums.length?'<span class="asset872"><span>Asset '+(nums.length===1?'no.':'nos.')+'</span><b>'+nums.map(esc).join(' · ')+'</b></span>':'';
}
function loading872Checks(m,assets){
 const rows=assets.flatMap(a=>loading872Rows(a).map(r=>({a,r,side:loading872Side(a,r.id)})));if(!rows.length)return m;
 m.checks=m.checks.concat([{id:'loading-door-side',text:'I have checked each building/toilet’s door-to-driver/passenger-side loading instruction with the driver before loading.'}]);
 rows.forEach(({a,r,side})=>{const text=a.key+(r.no?' · Asset '+r.no:' · '+r.item)+': '+loading872Words(side);if(side)m.report.push(text);else m.warnings.push({key:a.key,text:text+' — confirm and record before loading.'});});return m;
}
const loading872DriverModel=driverModel826;driverModel826=function(iso,only){const m=loading872DriverModel(iso,only),sel=selectedDriver826(iso,only);return m&&sel?loading872Checks(m,sel.loads.flatMap(x=>x.g.rows.map(r=>r.a))):m;};
const loading872DemobModel=demobModel826;demobModel826=function(iso,br,what,n){const m=loading872DemobModel(iso,br,what,n);return m?loading872Checks(m,selectedDemob826(iso,br,what,n).flatMap(L=>L.stops.map(s=>assetOf(s.r.key))).filter(Boolean)):m;};
const loading872Truck=dpTruck;dpTruck=function(g,doc){return loading872Truck(g,doc)+g.rows.map(r=>loading872Sheet(r.a)).join('');};
const loading872DropPage=dropPage;dropPage=function(a,...args){return loading872DropPage(a,...args).replace('<div class="rs-go">',loading872Sheet(a)+'<div class="rs-go">');};
const loading872DemobSheet=sheet816;sheet816=function(iso,L){return loading872DemobSheet(iso,L).replace('<h2>Sign-off</h2>',[...new Set(L.stops.map(s=>s.r.key))].map(k=>loading872Sheet(assetOf(k))).join('')+'<h2>Sign-off</h2>');};
document.addEventListener('change',e=>{const n=e.target;if(!n.matches('[data-door872-ref]'))return;const main=document.querySelector('main'),y=main&&main.scrollTop;loading872Set(n.dataset.door872Ref,n.dataset.door872Unit,n.value);if(main)main.scrollTop=y;});
document.addEventListener('click',e=>{const n=e.target.closest('[data-door872-clear]');if(!n)return;e.preventDefault();loading872Set(n.dataset.door872Clear,n.dataset.door872Unit,'');const box=n.closest('fieldset');if(box)box.querySelectorAll('input').forEach(x=>x.checked=false);});
