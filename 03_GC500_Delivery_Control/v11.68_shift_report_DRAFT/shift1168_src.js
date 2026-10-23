/* Author: Andrew Fisher. Read-only shift reports use the existing servicing rules. */
var SvcShift1168 = (function () {
'use strict';
var active = null;
function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
function stamp(ms) { return Number.isFinite(ms) && ms > 0 ? new Date(ms+36000000).toISOString().slice(0,16).replace('T',' ')+' AEST' : 'Time unavailable'; }
function areaName(a) { return (a.n ? 'Area '+a.n+' · ' : '')+a.name; }
function snapshot(M) {
  var S=M.S||SvcState,D=M.D,day=M.day||S.autoDay(D,M.now),night=S.dayOf(D,day);
  if(!night)throw new Error('Choose a servicing night first.');
  if(!Number.isFinite(M.lastRead)||M.lastRead<=0)throw new Error('Wait for verified servicing progress before preparing a report.');
  var states=S.jobStates(M.events||[],M.now),saved=Object.create(null);
  Object.keys(states).forEach(function(k){if(!states[k].local)saved[k]=states[k];});
  var refs=D.areas.reduce(function(out,a){return out.concat(a.refs);},[]);
  var areas=D.areas.map(function(a){
    return {n:a.n,name:a.name,stats:S.groupStats(D,a.refs,day,saved),tasks:S.taskStats(D,a.refs,day,saved),refs:a.refs.map(function(r){
      return {ref:r.ref,stats:S.refStats(D,r,day,saved),lines:r.lines.map(function(l){
        return {id:l.id,label:l.label||l.kind,qty:l.qty,tasks:S.tasksFor(D,l,day).map(function(t){
          var v=states[S.jobKey(l.id,t,day)],done=!!v&&!v.local;
          return {id:t,label:D.tasks[t]||t,optional:S.isExtra(D,t),done:done,pending:!!v&&v.local,at:done?v.at:null};
        })};
      })};
    })};
  });
  var used={};areas.forEach(function(a){a.refs.forEach(function(r){r.lines.forEach(function(l){l.tasks.forEach(function(t){used[t.id]=true;});});});});
  return {day:day,night:night.label+(night.to?' → '+night.to:''),verified:stamp(M.lastRead),prepared:stamp(M.now),
    test:!!M.test1164||!!night.practice,stale:!!M.readStatus,areas:areas,
    overall:S.groupStats(D,refs,day,saved),tasks:S.taskStats(D,refs,day,saved),
    columns:Object.keys(D.tasks).filter(function(k){return used[k];}).map(function(k){return {id:k,label:D.tasks[k],optional:S.isExtra(D,k)};})};
}
function stateText(t) { return t.done?'Recorded complete':t.pending?'Waiting to sync — not recorded complete':'Not recorded complete'; }
function summary(s) {
  var g=s.overall,lines=['GC500 · Shift report', (s.test?'TEST / PRACTICE · ':'')+s.night+' · '+s.day,
    'Saved progress verified: '+s.verified];
  if(s.stale)lines.push('Refresh unavailable — last verified progress only.');
  lines.push(g.pct+'% recorded complete; '+g.refsDone+' of '+g.refs+' locations fully complete.',
    (g.refs-g.refsDone)+' locations have required work not recorded complete.');
  s.columns.forEach(function(t){var v=s.tasks[t.id];if(v)lines.push(t.label+': '+v.d+' of '+v.w+' recorded complete; '+(v.w-v.d)+' not recorded complete.');});
  lines.push('Counts are equipment services, not individual toilet pans. Unticked work needs crew confirmation; it is not proof the work was missed.','Author: Andrew Fisher');
  return lines.join('\n');
}
function table(head,body) { return '<div class="shift1168-scroll"><table><thead><tr>'+head.map(function(h){return '<th scope="col">'+esc(h)+'</th>';}).join('')+'</tr></thead><tbody>'+body.join('')+'</tbody></table></div>'; }
function row(cells) { return '<tr>'+cells.map(function(c){return '<td>'+c+'</td>';}).join('')+'</tr>'; }
function html(s) {
  var g=s.overall,body='<article class="shift1168-report"><h1>GC500 · Shift report</h1><p class="shift1168-night">'+(s.test?'TEST / PRACTICE · ':'')+esc(s.night)+' · '+esc(s.day)+'</p><p>Author: Andrew Fisher</p><p>Saved progress verified <b>'+esc(s.verified)+'</b>.</p>';
  if(s.stale)body+='<p class="shift1168-warning"><b>Refresh unavailable.</b> This is the last verified progress, not a current read.</p>';
  body+='<p class="shift1168-total"><b>'+g.pct+'% recorded complete · '+g.refsDone+' / '+g.refs+' locations fully complete</b><br/>'+(g.refs-g.refsDone)+' locations have required work not recorded complete.</p>';
  body+=table(['Service','Done','Not recorded','Total'],s.columns.filter(function(t){return s.tasks[t.id];}).map(function(t){var v=s.tasks[t.id];return row([esc(t.label),v.d,v.w-v.d,v.w]);}).concat([row(['<b>All equipment services</b>',g.d,g.w-g.d,g.w])]));
  body+='<p class="shift1168-note">Counts use the existing equipment quantities: one piece counts once for each required service. These are not toilet-pan counts. A location is fully complete only when every required service is recorded complete. Optional tasks are excluded from the percentage.</p><p class="shift1168-note"><b>Not recorded complete</b> means no active saved completion was available. Confirm with the crew before treating this as missed work. A water tick confirms “Water checked / refilled”; it does not establish that water was added or how much. Times below are AEST.</p>';
  body+='<h2>Area overview</h2>'+table(['Area','Locations complete','Services not recorded complete'],s.areas.map(function(a){return row([esc(areaName(a)),a.stats.refsDone+' / '+a.stats.refs,a.stats.w-a.stats.d]);}));
  var left=s.areas.filter(function(a){return a.refs.some(function(r){return r.lines.some(function(l){return l.tasks.some(function(t){return !t.done;});});});});
  body+='<h2>Follow-up list</h2>';
  if(!left.length)body+='<p>No unfinished jobs recorded for this night.</p>';
  left.forEach(function(a){
    var rows=[];a.refs.forEach(function(r){r.lines.forEach(function(l){var todo=l.tasks.filter(function(t){return !t.done;});if(todo.length)rows.push(row(['<b>'+esc(r.ref)+'</b><br/>'+esc(l.label)+'<br/>Quantity: '+l.qty,todo.map(function(t){return esc(t.label)+(t.optional?' (optional)':'')+(t.pending?' — waiting to sync':'');}).join('<br/>')]));});});
    body+='<h3>'+esc(areaName(a))+'</h3>'+table(['Reference / equipment','Work not recorded complete'],rows);
  });
  body+='<details class="shift1168-ledger"><summary>Full completion ledger — all locations and times</summary><h2>Full completion ledger</h2>';
  s.areas.forEach(function(a){
    var rows=[];a.refs.forEach(function(r){r.lines.forEach(function(l){
      rows.push(row(['<b>'+esc(r.ref)+'</b><br/>'+esc(l.label)+'<br/>Quantity: '+l.qty].concat(s.columns.map(function(col){var t=l.tasks.find(function(x){return x.id===col.id;});return !t?'Not required':t.done?'<span class="shift1168-done"><b>Done</b><br/>'+esc(stamp(t.at))+'</span>':'<span class="shift1168-missing">'+(t.pending?'Waiting to sync':'Not recorded complete')+'</span>'; }))));
    });});
    body+='<h3>'+esc(areaName(a))+'</h3>'+table(['Reference / equipment'].concat(s.columns.map(function(t){return t.label+(t.optional?' (optional)':'');})),rows);
  });
  body+='</details><p class="shift1168-note">Snapshot prepared '+esc(s.prepared)+'. Later entries are not included until you refresh this report. No servicing records are changed by this report.</p></article>';
  return body;
}
function csv(s) {
  function cell(v){var str=String(v==null?'':v);if(/^[\s]*[=+@-]/.test(str))str="'"+str;return '"'+str.replace(/"/g,'""')+'"';}
  var rows=[['Servicing night','Tracker','Area','Reference','Equipment','Quantity','Service','Status','Completion time AEST','Progress verified','Read status','Author']];
  s.areas.forEach(function(a){a.refs.forEach(function(r){r.lines.forEach(function(l){l.tasks.forEach(function(t){rows.push([s.day,s.test?'TEST / PRACTICE':'Event',areaName(a),r.ref,l.label,l.qty,t.label+(t.optional?' (optional)':''),stateText(t),t.done?stamp(t.at):'',s.verified,s.stale?'Last verified progress; refresh unavailable':'Verified read','Author: Andrew Fisher']);});});});});
  return '\ufeff'+rows.map(function(r){return r.map(cell).join(',');}).join('\r\n');
}
var PRINT_CSS='*{box-sizing:border-box}body{margin:24px;color:#193138;background:white;font:12px/1.45 Arial,sans-serif}h1{font-size:25px}h2{font-size:18px;margin-top:24px}h3{font-size:14px;margin-top:18px}h1,h2,h3{break-after:avoid}table{border-collapse:collapse;width:100%;margin:10px 0;table-layout:fixed}th,td{border:1px solid #cbd5d8;text-align:left;vertical-align:top;padding:7px;overflow-wrap:anywhere}th{background:#e9eff1}thead{display:table-header-group}tr{break-inside:avoid}.shift1168-note{font-size:11px}.shift1168-total,.shift1168-warning{padding:12px;background:#f0f3f4}.shift1168-warning{border-left:4px solid #ad5f00}.shift1168-done{color:#176747}.shift1168-missing{color:#87551b}summary{font-weight:bold}.shift1168-scroll{overflow:visible}button{padding:12px;font:inherit}@page{size:A4;margin:14mm}@media print{body{margin:0}.shift1168-print-controls,details>summary{display:none}.shift1168-ledger{display:block}.shift1168-ledger h2{break-before:page}}';
function documentHtml(s) { return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>GC500 shift report '+esc(s.day)+'</title><style>'+PRINT_CSS+'</style></head><body><div class="shift1168-print-controls"><button type="button" id="shift1168-print">Print / save PDF</button><p>Choose Save as PDF in your print options to keep or share this report.</p></div>'+html(s).replace('<details class="shift1168-ledger">','<details class="shift1168-ledger" open>')+'</body></html>'; }
function close(I) { if(!active||I&&active.I!==I)return;var a=active;active=null;a.serial++;a.dialog.close();a.dialog.remove();if(a.focus&&a.focus.isConnected)a.focus.focus({preventScroll:true}); }
function context(I) { if(active&&active.I===I&&(I.dead||!I.M||active.context!==I.M.context1164||active.day!==(I.M.day||(I.M.S||SvcState).autoDay(I.M.D,I.M.now))))close(I); }
function element(tag,text,attrs) {var el=document.createElement(tag);if(text)el.textContent=text;Object.keys(attrs||{}).forEach(function(k){el.setAttribute(k,attrs[k]);});return el;}
function open(I) {
  if(!I.M||I.dead)return;close();SvcShare1164.close();
  var dialog=element('dialog','',{class:'svc-share1164 svc-shift1168','aria-labelledby':'shift1168-title','data-ro':''}),head=element('div','',{class:'svc-share1164-head'}),title=element('h3','Shift report',{id:'shift1168-title'}),cancel=element('button','Close',{type:'button','data-ro':''}),status=element('p','Reading saved progress…',{role:'status'}),actions=element('div','',{class:'svc-share1164-actions'}),preview=element('div','',{class:'shift1168-preview'});
  head.append(title,cancel);dialog.append(head,status,actions,preview);document.body.appendChild(dialog);
  var a={I:I,dialog:dialog,context:I.M.context1164,day:I.M.day||(I.M.S||SvcState).autoDay(I.M.D,I.M.now),focus:document.activeElement,serial:0,s:null};active=a;
  function button(label,fn){var b=element('button',label,{type:'button','data-ro':''});b.onclick=fn;actions.appendChild(b);return b;}
  var print=button('Print / save PDF',function(){
    if(!a.s)return;var win=window.open('about:blank','_blank');
    if(!win){status.textContent='The print window was blocked. Allow pop-ups for this page and try again, or download the CSV.';return;}
    win.opener=null;win.document.open();win.document.write(documentHtml(a.s));win.document.close();
    win.document.getElementById('shift1168-print').onclick=function(){win.print();};
    win.setTimeout(function(){if(!win.closed){win.focus();win.print();}},250);
    status.textContent='Print view opened. Choose Save as PDF in the print options.';
  });
  var download=button('Download CSV',function(){
    if(!a.s)return;var url=URL.createObjectURL(new Blob([csv(a.s)],{type:'text/csv;charset=utf-8'})),link=element('a','',{href:url,download:'GC500-servicing-shift-'+a.s.day+'.csv','data-ro':''});dialog.appendChild(link);link.click();link.remove();setTimeout(function(){URL.revokeObjectURL(url);},1000);status.textContent='CSV download requested.';
  });
  var copy=button('Copy summary',async function(){
    if(!a.s)return;var text=summary(a.s);try{await navigator.clipboard.writeText(text);if(active===a)status.textContent='Shift summary copied.';}
    catch(e){if(active!==a)return;var box=dialog.querySelector('textarea');if(!box){box=element('textarea','',{'aria-label':'Shift summary to copy',readonly:''});actions.after(box);}box.value=text;box.focus();box.select();status.textContent='Select and copy the summary below.';}
  }),refresh=button('Refresh report',prepare);
  cancel.onclick=function(){close(I);};dialog.addEventListener('cancel',function(e){e.preventDefault();close(I);});dialog.showModal();cancel.focus();
  async function prepare(){
    var seq=++a.serial;[print,download,copy,refresh].forEach(function(b){b.disabled=true;});a.s=null;preview.textContent='';var box=dialog.querySelector('textarea');if(box)box.remove();status.textContent='Refreshing saved progress…';var failed=false;
    try{
      if(I.M.refresh)try{await I.M.refresh();}catch(e){failed=true;}
      context(I);if(active!==a||seq!==a.serial)return;
      var s=snapshot(I.M);if(failed)s.stale=true;a.s=s;preview.innerHTML=html(s);title.textContent='Shift report · '+s.night;
      status.textContent=(s.stale?'Last verified progress only. ':'')+'Saved progress verified '+s.verified+'. Report covers all areas for this night.';
      [print,download,copy].forEach(function(b){b.disabled=false;});
    }catch(e){if(active===a)status.textContent=e.message||'Could not prepare the report. Try again.';}
    finally{if(active===a&&seq===a.serial)refresh.disabled=false;}
  }
  prepare();
}
return {snapshot:snapshot,html:html,csv:csv,summary:summary,documentHtml:documentHtml,open:open,close:close,context:context};
})();
if(typeof module==='object'&&module&&module.exports)module.exports=SvcShift1168;
