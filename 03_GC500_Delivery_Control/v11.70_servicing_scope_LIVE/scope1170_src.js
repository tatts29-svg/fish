/* Author: Andrew Fisher. Active servicing scope; original records are retained. */
var SvcScope1170 = (function () {
'use strict';
function excluded(ref) { return ref === 'SPASHDOWN'; }
function active(D) {
  if (D.history1170) return D;
  var history=[];
  var areas=D.areas.map(function(a){
    var kept=a.refs.filter(function(r){return !excluded(r.ref);});
    var removed=a.refs.filter(function(r){return excluded(r.ref);});
    if(removed.length)history.push(Object.assign({},a,{refs:removed}));
    return Object.assign({},a,{refs:kept});
  });
  return Object.assign({},D,{areas:areas,history1170:history});
}
function history(D,S,states,day) {
  var rows=[];
  active(D).history1170.forEach(function(a){a.refs.forEach(function(r){r.lines.forEach(function(l){
    S.tasksFor(D,l,day).forEach(function(t){
      var v=states[S.jobKey(l.id,t,day)];
      if(v)rows.push({area:(a.n?'Area '+a.n+' · ':'')+a.name,ref:r.ref,label:l.label||l.kind,qty:l.qty,task:D.tasks[t]||t,at:v.at,pending:!!v.local});
    });
  });});});
  return rows;
}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function stamp(ms){return Number.isFinite(ms)&&ms>0?new Date(ms+36000000).toISOString().slice(0,16).replace('T',' ')+' AEST':'Time unavailable';}
function historyHtml(rows) {
  if(!rows.length)return '';
  return '<section class="svc-history1170"><h3>Saved history · removed from servicing to-do</h3><p>These entries are retained for reference and are excluded from active servicing totals.</p><ul>'+rows.map(function(r){return '<li><b>'+esc(r.ref)+'</b> · '+esc(r.task)+' · '+(r.pending?'Waiting to sync — not recorded complete':'Recorded complete · '+esc(stamp(r.at)))+'<br/>'+esc(r.area)+' · '+esc(r.label)+'</li>';}).join('')+'</ul></section>';
}
return {excluded:excluded,active:active,history:history,historyHtml:historyHtml};
})();
if(typeof module==='object'&&module&&module.exports)module.exports=SvcScope1170;
