/* Author: Andrew Fisher. Documentary infrastructure programme evidence only. */
function infrastructure951Row(key){return (DATA.infrastructure_review951.rows||[]).find(r=>r.reference===key)||null;}
function infrastructure951Html(key){
 const r=infrastructure951Row(key);if(!r)return '';
 const changes=Object.entries(r.changes).map(([column,v])=>`${column}: ${v.before==null?'not stated':String(v.before)} → ${v.after==null?'not stated':String(v.after)}`);
 return '<details class="inst" data-infrastructure951><summary>Infrastructure workbook evidence · '+esc(key)+'</summary><p>Received workbook · reviewed 9 Oct 2026 · '+esc(r.sourceSheet)+' row '+r.row+'. Source evidence only; current site records remain authoritative.</p>'+(r.caveat?'<p><strong>'+esc(r.caveat)+'</strong></p>':'')+'<ul>'+changes.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p>Source “Complete” is not an imported delivery, installation or final-position approval. Repeated worksheet copies do not create additional deliveries.</p></details>';
}
const infrastructure951OpenAsset=openAsset;
openAsset=function(key,opts){
 const result=infrastructure951OpenAsset.apply(this,arguments);
 const db=document.querySelector('#drawer.on .db');
 if(db){db.querySelectorAll('[data-infrastructure951]').forEach(x=>x.remove());const html=infrastructure951Html(key);if(html)db.insertAdjacentHTML('beforeend',html);}
 return result;
};
