/* Author: Andrew Fisher. Report presentation only; the shared snapshot remains authoritative. */
function html(s) {
  var g=s.overall;
  function section(n,title,sub) { return '<div class="report1172-section"><span>'+n+'</span><div><h2>'+esc(title)+'</h2>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</div></div>'; }
  function num(v,kind) { return '<strong class="report1172-number '+(kind||'')+'">'+esc(v)+'</strong>'; }
  function equipment(r,l) { var label=String(l.label||''),prefix=String(l.qty)+' × ';if(label.indexOf(prefix)===0)label=label.slice(prefix.length);return '<b class="report1172-ref">'+esc(r.ref)+'</b><span class="report1172-equipment"><span class="report1172-qty">Qty '+esc(l.qty)+'</span> · '+esc(label)+'</span>'; }
  function taskName(t) { return esc(t.label)+(t.optional?' (optional)':''); }
  function time(ms) { return esc(stamp(ms).replace(' AEST','')).replace(' ','<br/>'); }
  var body='<article class="shift1168-report report1172"><section class="report1172-cover">'+
    '<header class="report1172-brand"><div class="report1172-wordmark">coates</div><div>GOLD COAST 500<span>OPERATIONS · 2026</span></div></header>'+
    '<div class="report1172-title"><p class="report1172-eyebrow">SHIFT HANDOVER</p><h1>Servicing<br/>shift report</h1><p class="shift1168-night">'+(s.test?'<b>TEST / PRACTICE · </b>':'')+esc(s.night)+'</p><p class="report1172-date">Servicing night: '+esc(s.day)+' · All times AEST</p></div>'+
    '<div class="report1172-meta"><span><b>Author: Andrew Fisher</b></span><span>Saved progress verified<br/><b>'+esc(s.verified)+'</b></span></div>';
  if(s.stale)body+='<p class="shift1168-warning"><b>Refresh unavailable.</b> This is the last verified progress, not a current read. Refresh before relying on current totals.</p>';
  body+='<div class="report1172-kpis"><div><strong>'+g.pct+'<small>%</small></strong><span>Required services<br/>recorded complete</span></div><div><strong>'+g.refsDone+'<small> / '+g.refs+'</small></strong><span>Locations<br/>fully complete</span></div><div class="report1172-kpi-follow"><strong>'+(g.refs-g.refsDone)+'</strong><span>Locations needing<br/>follow-up confirmation</span></div></div>'+
    section('01','Shift at a glance','Saved completions for the selected servicing night.')+
    table(['Service','Recorded complete','To confirm','Total'],s.columns.filter(function(t){return s.tasks[t.id];}).map(function(t){var v=s.tasks[t.id];return row([taskName(t),num(v.d,'report1172-good'),num(v.w-v.d,v.w-v.d?'report1172-follow':''),v.w]);}).concat([row(['<b>All required equipment services</b>',num(g.d,'report1172-good'),num(g.w-g.d,'report1172-follow'),num(g.w)])]))+
    '<div class="report1172-explain"><h3>What needs attention?</h3><p><b>To confirm = not recorded complete.</b> Check the follow-up list with the crew before treating an item as missed work. A tick confirms a saved completion; it is not an independent inspection.</p><p>Each equipment item counts once per required service, not once per toilet pan. Optional tasks do not affect the completion percentage.</p><p><b>Water checked / refilled</b> confirms the check was recorded. It does not establish that water was added or how much.</p></div></section>';
  body+='<section class="report1172-area-summary">'+section('02','Area overview','Use this overview to see where follow-up is needed.')+
    table(['Area','Locations complete','Services to confirm'],s.areas.map(function(a){var remaining=a.stats.w-a.stats.d;return row([esc(areaName(a)),a.stats.refsDone+' / '+a.stats.refs,num(remaining,remaining?'report1172-follow':'report1172-good')]);}))+
    '<p class="shift1168-note">A location is fully complete only when all required services have a saved completion. Areas without required work are shown as 0 / 0.</p></section>';
  var left=s.areas.filter(function(a){return a.refs.some(function(r){return r.lines.some(function(l){return l.tasks.some(function(t){return !t.done;});});});});
  body+='<section class="report1172-followup">'+section('03','Work to follow up','These services have no saved completion. Confirm with the crew; optional work is labelled.')+'<div class="report1172-follow-list">';
  if(!left.length)body+='<p class="report1172-clear">All listed services have a recorded completion for this night.</p>';
  left.forEach(function(a){
    var rows=[];a.refs.forEach(function(r){r.lines.forEach(function(l){var todo=l.tasks.filter(function(t){return !t.done;});if(todo.length)rows.push(row([equipment(r,l),todo.map(function(t){return '<div class="report1172-task"><span aria-hidden="true">'+(t.pending?'↻':'○')+'</span><div>'+taskName(t)+(t.pending?'<small>Waiting to sync — not recorded complete</small>':'')+'</div></div>';}).join('')]));});});
    body+='<div class="report1172-area"><h3>'+esc(areaName(a))+'</h3>'+table(['Reference / equipment','Work not recorded complete'],rows)+'</div>';
  });
  body+='</div></section><details class="shift1168-ledger"><summary>View full completion record · all locations and times</summary>'+section('04','Full completion record','Saved completion times are AEST. “To confirm” means not recorded complete.')+
    '<p class="shift1168-note">✓ Recorded = saved completion · ○ To confirm = no saved completion · ↻ Waiting to sync = not yet saved · — Not required</p>';
  s.areas.forEach(function(a){
    var rows=[];a.refs.forEach(function(r){r.lines.forEach(function(l){
      rows.push(row([equipment(r,l)].concat(s.columns.map(function(col){var t=l.tasks.find(function(x){return x.id===col.id;});return !t?'<span class="report1172-na">— Not required</span>':t.done?'<span class="shift1168-done"><b>✓ Recorded</b><small>'+time(t.at)+'</small></span>':'<span class="shift1168-missing"><b>'+(t.pending?'↻ Waiting to sync':'○ To confirm')+'</b><small>Not recorded complete</small></span>'; }))));
    });});
    body+='<div class="report1172-area"><h3>'+esc(areaName(a))+'</h3>'+table(['Reference / equipment'].concat(s.columns.map(function(t){return t.label+(t.optional?' (optional)':'');})),rows)+'</div>';
  });
  body+='</details>'+SvcScope1170.historyHtml(s.history1170||[])+'<footer class="report1172-footer"><b>coates · GC500</b><p>Snapshot prepared '+esc(s.prepared)+'. Refresh the report to include later entries.</p><p>Author: Andrew Fisher · No servicing records are changed by this report.</p></footer></article>';
  return body;
}
