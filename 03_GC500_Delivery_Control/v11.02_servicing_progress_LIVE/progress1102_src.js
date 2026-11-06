/* Author: Andrew Fisher. Stable race-light servicing meters. Shared state supplies every value. */
var SvcProgress1102 = (function () {
'use strict';
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function count(v){return Number.isFinite(v)&&v>=0?v:0;}
function state(o){
  o=o||{};var pct=Number.isFinite(o.pct)?Math.max(0,Math.min(100,o.pct)):0,d=count(o.d),w=count(o.w),refs=count(o.refs),refsDone=count(o.refsDone);
  // A rounded or pending 100 never turns the final lamp green. This is a display
  // gate only: percentages and job weights remain the shared state's own values.
  var done=o.savedDone===true&&pct===100&&w>0&&d===w&&refs>0&&refsDone===refs&&!o.pending;
  var pending=!!o.pending,caption=done?'Complete':pending?'Waiting to sync':pct===100?'Awaiting confirmation':pct>0?'In progress':'Not started';
  return {pct:pct,d:d,w:w,refs:refs,refsDone:refsDone,done:done,pending:pending,caption:caption,reached:done?5:Math.min(4,Math.floor(pct/20)),size:o.size==='area'?'area':'overall',key:String(o.key||'progress'),label:String(o.label||'Servicing progress')};
}
var DOTS='';for(var y=14;y<=42;y+=7)for(var x=14;x<=42;x+=7)if((x-28)*(x-28)+(y-28)*(y-28)<=18*18)DOTS+='<circle cx="'+x+'" cy="'+y+'" r="2.05"/>';
function lamp(i,s){
  return '<span class="svc1102-unit"><span class="svc1102-lamp'+(i<s.reached?' is-on':'')+(s.done?' is-finished':'')+'" data-step="'+((i+1)*20)+'"><i class="svc1102-halo"></i><svg viewBox="0 0 56 56" focusable="false" aria-hidden="true"><circle cx="28" cy="28" r="23" fill="#050b0d" stroke="#869397" stroke-opacity=".35"/><circle cx="28" cy="28" r="20" class="svc1102-tint"/><g class="svc1102-dots">'+DOTS+'</g><path d="M12 19a19 19 0 0 1 31-3" fill="none" stroke="#d4e1e4" stroke-opacity=".22" stroke-width="1.5"/></svg></span><small>'+((i+1)*20)+'%</small></span>';
}
function spoken(s){return s.pct+'% complete. '+s.refsDone+' of '+s.refs+' references; '+s.d+' of '+s.w+' jobs. '+s.caption+'.';}
function html(o){
  var s=state(o);
  return '<span class="svc1102-meter svc1102-'+s.size+(s.done?' is-complete':'')+'" data-svc1102-key="'+esc(s.key)+'" data-pct="'+s.pct+'" data-d="'+s.d+'" data-w="'+s.w+'" data-done="'+s.done+'" data-pending="'+s.pending+'" role="progressbar" aria-label="'+esc(s.label)+'" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+s.pct+'" aria-valuetext="'+esc(spoken(s))+'">'+
    '<span class="svc1102-head"><span class="svc-big"><b class="svc-pct">'+s.pct+'%</b><span class="svc1102-caption">'+s.caption+'</span></span><span class="svc1102-counts"><span class="svc1102-ref-count"><strong>'+s.refsDone+' / '+s.refs+'</strong> references</span><span class="svc1102-job-count"><strong>'+s.d+' / '+s.w+'</strong> jobs</span></span></span>'+
    '<span class="svc1102-lights" aria-hidden="true">'+[0,1,2,3,4].map(function(i){return lamp(i,s);}).join('')+'</span></span>';
}
function text(node,value){if(node&&node.textContent!==String(value))node.textContent=String(value);}
function attr(node,key,value){value=String(value);if(node.getAttribute(key)!==value)node.setAttribute(key,value);}
function update(node,o){
  if(!node)return null;
  var meter=node.matches&&node.matches('.svc1102-meter')?node:node.querySelector('.svc1102-meter');
  if(!meter){var template=document.createElement('template');template.innerHTML=html(o);meter=template.content.firstElementChild;node.appendChild(meter);return meter;}
  var s=state(o);attr(meter,'data-svc1102-key',s.key);attr(meter,'data-pct',s.pct);attr(meter,'data-d',s.d);attr(meter,'data-w',s.w);attr(meter,'data-done',s.done);attr(meter,'data-pending',s.pending);attr(meter,'aria-label',s.label);attr(meter,'aria-valuenow',s.pct);attr(meter,'aria-valuetext',spoken(s));
  meter.classList.toggle('is-complete',s.done);meter.classList.toggle('svc1102-area',s.size==='area');meter.classList.toggle('svc1102-overall',s.size!=='area');
  text(meter.querySelector('.svc-pct'),s.pct+'%');text(meter.querySelector('.svc1102-caption'),s.caption);text(meter.querySelector('.svc1102-ref-count strong'),s.refsDone+' / '+s.refs);text(meter.querySelector('.svc1102-job-count strong'),s.d+' / '+s.w);
  meter.querySelectorAll('.svc1102-lamp').forEach(function(l,i){l.classList.toggle('is-on',i<s.reached);l.classList.toggle('is-finished',s.done);});
  return meter;
}
// No frame loop or timer. Short CSS transitions can be disabled by a hosting
// panel while hidden; the completion state remains visible without movement.
function pause(root,paused){if(root)root.classList.toggle('svc1102-paused',!!paused);}
return {html:html,update:update,state:state,pause:pause};
})();
if(typeof module==='object'&&module&&module.exports)module.exports=SvcProgress1102;
