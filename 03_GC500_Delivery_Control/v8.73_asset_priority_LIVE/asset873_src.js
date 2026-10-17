/* Author: Andrew Fisher. Current allocations are cargo identity; booking numbers remain historical evidence. */
function asset873Clean(a,nums){return [...new Set((nums||[]).map(String).map(n=>n.trim()).filter(n=>n&&!/^MISCITEM$/i.test(n)&&!tombedHere('num/'+a.key+'/'+n)))];}
function asset873Allocated(a,item){
 const full=assetOf(a.key)||a,sup=localSupplied(a.key),lines=chargeLines(full).filter(l=>l.item),typed=(sup.items||[]).filter(l=>!item||lineItemMatch(item,l.asked));
 const itemNums=typed.flatMap(l=>l.nums||[]),elsewhere=new Set((sup.items||[]).filter(l=>item&&!lineItemMatch(item,l.asked)).flatMap(l=>l.nums||[]).map(String));
 if(itemNums.length)return asset873Clean(full,itemNums);
 const own=asset873Clean(full,[...(S.assetNumbers||{})[a.key]||[],...(sup.asset_numbers||[])]).filter(n=>!elsewhere.has(n));
 if(!item||lines.length<=1)return own;
 // A number entered at reference level cannot guess which of several different items it belongs to.
 const m=itemNumbersOf(full);return m?own.filter(n=>Object.entries(m).some(([it,ns])=>lineItemMatch(item,it)&&ns.map(String).includes(n))):[];
}
function asset873Numbers(a){
 if(!a)return [];const booked=Array.isArray(a._bookingNumbers801),items=booked?(a.item_types||[]):null;
 const current=booked?[...new Set(items.flatMap(it=>asset873Allocated(a,it)))]:asset873Allocated(a);
 if(!current.length)return asset873Clean(a,booked?a._bookingNumbers801:dpNumsBefore801(a));
 if(!booked||!a._bookingSource801||!(a._bookingSource801.loads||[]).length||a._bookingSource801.loads.length===1)return current;
 // Preserve a split load only when its recorded numbers identify that load. Never put all of a reference on each truck.
 return current.filter(n=>a._bookingNumbers801.map(String).includes(n));
}
dpNums=asset873Numbers;
bookingNosLine801=function(a){return asset873Numbers(a).map(esc).join(' · ');};
const asset873Sub=sheet808Sub;sheet808Sub=function(a){return Array.isArray(a._bookingNumbers801)?subOf(a.key).filter(x=>asset873Numbers(a).includes(String(x.no))):asset873Sub(a);};
loading872AssetHtml=function(a){const nums=asset873Numbers(a);return nums.length?'<span class="asset872"><span>Asset '+(nums.length===1?'no.':'nos.')+'</span><b>'+nums.map(esc).join(' · ')+'</b></span>':Array.isArray(a._bookingNumbers801)&&asset873Allocated(a).length?'<span class="asset872">Current allocation · confirm asset for this split load</span>':'';};
