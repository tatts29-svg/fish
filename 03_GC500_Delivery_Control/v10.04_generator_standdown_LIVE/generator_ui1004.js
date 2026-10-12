/* Author: Andrew Fisher. Generator hire uses the shared Revenue model; this view never stores totals. */
function generatorHtml1004(){
 const M=generatorModel1004(), rows=M.rows||[];
 const amount=v=>v==null||!Number.isFinite(Number(v))?'<span class="pl-todo">Not priced</span>':esc(money(Number(v)));
 const rateAmount=v=>v==null||!Number.isFinite(Number(v))?amount(null):esc(new Intl.NumberFormat('en-AU',{style:'currency',currency:'AUD',minimumFractionDigits:2,maximumFractionDigits:5}).format(v));
 const quantity=v=>v==null?'—':esc(fmtNum(v));
 const date=v=>v?'<time datetime="'+esc(v)+'" title="'+esc(fmtDate(v))+'">'+esc(fmtDay(v).dm)+'</time>':'<span class="pl-todo">Not confirmed</span>';
 const missing=Array.isArray(M.unpriced)?M.unpriced.length:Number(M.unpriced)||0;
 const fact=(label,value)=>'<dt>'+esc(label)+'</dt><dd>'+value+'</dd>';
 const record=r=>{
  const a=r.asset||(r.ref&&typeof assetOf==='function'?assetOf(r.ref):null);
  const key=a&&a.key?r.ref||a.key:null;
  const label=r.displayRef||(r.ref&&typeof generatorRefLabel994==='function'?generatorRefLabel994(r.ref):r.ref)||'Reference not confirmed';
  const assets=(r.assetNumbers||[]).filter(v=>v!=null&&String(v).trim());
  const issues=(r.issues||[]).filter(Boolean);
  const arrived=!!r.deliveredDate;
  const basis=r.rateSource?fact('Rate source',esc(r.rateSource)):'';
  const sourceLines=r.contractLines&&r.contractLines.length?fact('Contract lines',esc(r.contractLines.join(' · '))):'';
  const more='<details class="generator1004-more"><summary>More info</summary><dl>'+fact('Daily rate',rateAmount(r.dailyRate))+fact('Standdown rate',quantity(r.standdownDays)+' days · '+rateAmount(r.standdownRate)+' per day')+fact('Race charge',amount(r.raceCharge))+fact('Race weekend · 100%',quantity(r.eventDays)+' days')+basis+sourceLines+(issues.length?fact('To confirm',issues.map(esc).join('<br>')):'')+'</dl></details>';
  return '<tr data-generator1004-row="'+esc(r.id||r.ref||'')+'">'+
   '<td data-l="Reference / location"><div class="tr888-v">'+(key?'<button type="button" class="linkish generator1004-ref" data-generator1004-open="'+esc(key)+'">'+esc(label)+'</button>':'<b>'+esc(label)+'</b>')+'<div class="generator1004-location">'+esc(r.location||'Location not confirmed')+'</div>'+(key?'<button type="button" class="linkish generator1004-map" data-generator1004-map="'+esc(key)+'">Map</button>':'')+'</div></td>'+
   '<td data-l="Generator"><div class="tr888-v"><b>'+quantity(r.qty)+' × '+esc(r.item||'Generator')+'</b>'+(assets.length?'<div class="generator1004-assets"><span class="acc761-w">Asset'+(assets.length===1?'':'s')+'</span> '+assets.map(v=>'<span class="mono">'+esc(v)+'</span>').join(' · ')+'</div>':'')+more+'</div></td>'+
   '<td data-l="Dates"><div class="tr888-v generator1004-dates"><span><span class="acc761-w">'+(arrived?'Arrived':'Planned')+'</span> '+date(arrived?r.deliveredDate:r.plannedDate)+'</span><span><span class="acc761-w">Off hire</span> '+date(r.offhire)+'</span></div></td>'+
   '<td data-l="Branch"><div class="tr888-v">'+(r.branch?'<span class="chip ref mono">'+esc(r.branch)+'</span>':'<span class="pl-todo">Not confirmed</span>')+'</div></td>'+
   '<td data-l="Standdown charge" class="num"><div class="tr888-v"><b>'+amount(r.standdownCharge)+'</b></div></td>'+
   '<td data-l="Actual" class="num"><div class="tr888-v"><b>'+amount(r.actual)+'</b></div></td>'+
   '<td data-l="Remaining forecast" class="num"><div class="tr888-v"><b>'+amount(r.remaining)+'</b></div></td>'+
   '<td data-l="Total charge" class="num"><div class="tr888-v"><b>'+amount(r.forecast)+'</b></div></td></tr>';
 };
 return '<section id="generators1004" class="fin745 nosfold" aria-labelledby="generator1004-title">'+
  '<div class="fin745-heading"><div><p class="fin745-eyebrow">HIRE REVENUE · 2026 · AUD EX GST</p><h2 id="generator1004-title">Generators</h2></div></div>'+
  '<div class="fin745-metrics generator1004-metrics">'+
   '<div class="fin745-metric"><span>Actual'+(missing?' · priced':'')+'</span><strong data-generator1004-total="actual">'+amount(M.actual)+'</strong><small>Confirmed arrivals · full hire period<br>Standdown '+amount(M.standdownActual)+'</small></div>'+
   '<div class="fin745-metric"><span>Remaining forecast'+(missing?' · priced':'')+'</span><strong data-generator1004-total="remaining">'+amount(M.remaining)+'</strong><small>Awaiting delivery<br>Standdown '+amount(M.standdownRemaining)+'</small></div>'+
   '<div class="fin745-metric"><span>Total forecast'+(missing?' · priced':'')+'</span><strong data-generator1004-total="forecast">'+amount(M.forecast)+'</strong><small>Standdown '+amount(M.standdown)+'<br>Race weekend '+amount(M.race)+'</small></div></div>'+
  (missing?'<p class="generator1004-unpriced">'+esc(fmtNum(missing))+' record'+(missing===1?' needs':'s need')+' a date or rate.</p>':'')+
  '<details class="generator1004-basis"><summary>Charging basis</summary><dl>'+fact('Before 23 Oct','Published standdown rate from delivery')+fact('23–25 Oct','100% daily rate')+fact('After 25 Oct','No hire charge')+fact('Actual','Full hire period for confirmed arrivals')+fact('Remaining forecast','Full hire period from planned arrival')+'</dl></details>'+
  '<div class="fin745-table generator1004-table"><table class="tr888-stack"><thead><tr><th>Reference / location</th><th>Generator</th><th>Dates</th><th>Branch</th><th class="num">Standdown charge</th><th class="num">Actual</th><th class="num">Remaining forecast</th><th class="num">Total charge</th></tr></thead><tbody>'+
  (rows.length?rows.map(record).join(''):'<tr><td colspan="8">No generators on the record.</td></tr>')+'</tbody></table></div>'+ 
  '<p class="fin745-basis acc761-foot">Author: Andrew Fisher</p></section>';
}
function generatorBind1004(){
 const root=document.getElementById('generators1004');if(!root)return;
 root.querySelectorAll('[data-generator1004-open]').forEach(b=>b.onclick=()=>openAsset(b.dataset.generator1004Open));
 root.querySelectorAll('[data-generator1004-map]').forEach(b=>b.onclick=()=>showOnMap(b.dataset.generator1004Map));
}
