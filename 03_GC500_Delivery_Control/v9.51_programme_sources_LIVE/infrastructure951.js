/* Author: Andrew Fisher. Documentary infrastructure programme evidence only. */
function infrastructure951Row(key){return (DATA.infrastructure_review951.rows||[]).find(r=>r.reference===key)||null;}
function infrastructure951Date(value){
 if(value==null)return 'Not stated';
 if(/^\d{5}$/.test(String(value))){const d=new Date(Date.UTC(1899,11,30)+Number(value)*86400000);return d.getUTCDate()+' '+['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getUTCMonth()]+' '+d.getUTCFullYear();}
 return String(value);
}
function infrastructure951Html(key){
 const r=infrastructure951Row(key);if(!r)return '';
 const labels={A:'Facility',B:'Delivery type',C:'Equipment',D:'Install start',E:'Install end',F:'Notes',G:'Delivery notes',I:'Source status',J:'Source completion date',K:'Site notes'};
 const changes=Object.entries(r.changes).map(([column,v])=>{const date=column==='D'||column==='E';const val=x=>date?infrastructure951Date(x):(x==null?'Not stated':String(x));return '<li><strong>'+esc(labels[column]||column)+':</strong> '+esc(val(v.before))+' → '+esc(val(v.after))+'</li>';});
 return '<details class="inst" data-infrastructure951><summary>Infrastructure workbook evidence · '+esc(key)+'</summary><p>'+esc(r.facility)+'</p>'+(r.caveat?'<p><strong>'+esc(r.caveat)+'</strong></p>':'')+'<ul>'+changes.join('')+'</ul><p>Source status only; current site records remain authoritative. Reviewed 9 Oct 2026 · '+esc(r.sourceSheet)+' · row '+r.row+'.</p></details>';
}
const infrastructure951OpenAsset=openAsset;
openAsset=function(key,opts){
 const result=infrastructure951OpenAsset.apply(this,arguments);
 const db=document.querySelector('#drawer.on .db');
 if(db){db.querySelectorAll('[data-infrastructure951]').forEach(x=>x.remove());const html=infrastructure951Html(key);if(html)db.insertAdjacentHTML('beforeend',html);}
 return result;
};
