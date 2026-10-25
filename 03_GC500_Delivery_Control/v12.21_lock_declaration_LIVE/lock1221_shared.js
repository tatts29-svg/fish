/* Author: Andrew Fisher. Versioned declarations remain separate from completion totals. */
var SvcLock1221 = (function () {
'use strict';
var statement = 'I hereby declare that the toilets shown below have been pumped and cleaned, and the doors are locked.';
function valid(d) {
  var text = function(v,max){return typeof v==='string'&&v.length>0&&v.length<=max&&v===v.trim()&&!/[\x00-\x1f\x7f<>]/.test(v);};
  return !!d&&d.version===1&&text(d.by,100)&&text(d.crew,240)&&Number.isInteger(d.units)&&d.units>0&&d.units<=10000;
}
function same(a,b){return valid(a)&&valid(b)&&['version','by','crew','units'].every(function(k){return a[k]===b[k];});}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function time(s){var n=Date.parse(s);return isFinite(n)?new Date(n+36e6).toISOString().slice(0,16).replace('T',' ')+' AEST':'Not recorded';}
function report(I,day) {
  var events=I.events||[],st=I.S.jobStates(events,I.now),lines={},voided={},seen={},rows=[],legacy=0;
  I.D.areas.forEach(function(a){a.refs.forEach(function(r){r.lines.forEach(function(l){lines[l.id]={ref:r.ref,area:a.name,label:l.label||l.kind,nos:l.nos||[]};});});});
  events.forEach(function(e){if(e&&(e.void||e.voided))voided[e.id]=true;if(e&&Array.isArray(e.voids))e.voids.forEach(function(id){voided[id]=true;});});
  events.forEach(function(e){
    if(!e||e.day!==day||e.task!=='lockup'||e.done!==true||seen[e.id])return;seen[e.id]=true;
    var state=st[I.S.jobKey(e.line,e.task,e.day)],active=!!(state&&state.ids.indexOf(e.id)>=0);
    if(!valid(e.lock_declaration)){if(active&&!e.local)legacy++;return;}
    var d=e.lock_declaration,l=lines[e.line]||{},undo=events.filter(function(x){return x&&x.done===false&&x.line===e.line&&x.task===e.task&&x.day===e.day&&(x.undoes||[]).indexOf(e.id)>=0;});
    rows.push({id:e.id,ref:e.ref,line:e.line,area:l.area||'',label:l.label||e.line,nos:l.nos||[],units:d.units,by:d.by,crew:d.crew,
      declaredAt:e.tapped_at||e.at,receivedAt:e.at||null,withdrawnAt:undo.length?undo[undo.length-1].at:null,
      status:voided[e.id]?'Voided':!active?'Withdrawn':e.local?'Pending sync':'Recorded'});
  });
  rows.sort(function(a,b){return String(a.declaredAt).localeCompare(String(b.declaredAt))||a.ref.localeCompare(b.ref);});
  return {statement:statement,version:1,rows:rows,legacy:legacy};
}
function html(R) {
  var d=R.lockDeclarations;if(!d||(!R.day.final&&!d.rows.length&&!d.legacy))return '';
  var h='<div class="blk hd"><h2><i></i>Door-lock declarations</h2><div class="how"><p>'+esc(d.statement)+'</p><p>One named person confirms the units listed for each entry. The selected crew is recorded alongside them. Pump-out and cleaning completion ticks remain separate.</p>'+(d.legacy?'<p>'+d.legacy+' lock completion line(s) have no named declaration recorded.</p>':'')+(!d.rows.length?'<p>No named door-lock declarations recorded for this service night.</p>':'')+'</div></div>';
  d.rows.forEach(function(r){h+='<div class="blk lock1221-entry" style="border:1px solid #e2e8ec;border-left:4px solid #f26a1b;border-radius:8px;padding:12px;margin:8px 0;overflow-wrap:anywhere"><b>'+esc(r.ref)+' · '+esc(r.units)+' unit(s) · '+esc(r.status)+'</b><div>'+esc(r.area)+' · '+esc(r.label)+' · line '+esc(r.line)+'</div><p><b>Declared by '+esc(r.by)+'</b><br>Group: '+esc(r.crew)+'<br>Declared: '+esc(time(r.declaredAt))+'<br>Received by service: '+esc(time(r.receivedAt))+(r.withdrawnAt?'<br>Withdrawn: '+esc(time(r.withdrawnAt)):'')+'</p></div>';});
  return h;
}
return {statement:statement,valid:valid,same:same,report:report,html:html};
})();
if(typeof module==='object'&&module.exports)module.exports=SvcLock1221;
