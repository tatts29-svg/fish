/* Author: Andrew Fisher. Past days retain reference access; percentages use the shared whole-job progress index as at each date. */
(function(root){'use strict';
function model(day,today,read){
 if(!day.iso||day.iso>=today)return {past:false,percent:null};
 const p=read(day.iso),valid=p?.ready&&Number.isFinite(p.pct?.min)&&Number.isFinite(p.pct?.max)&&p.pct.min>=0&&p.pct.max<=100&&p.pct.min<=p.pct.max;
 if(!valid)return {past:true,percent:null,complete:false,text:'—',bound:false};
 const bound=p.pct.max-p.pct.min>.005,percent=bound?Math.floor((p.pct.min+1e-9)*100)/100:p.pct.min;
 return {past:true,percent,bound,text:percent.toLocaleString('en-AU',{maximumFractionDigits:2}),complete:!!p.allGreen&&!p.provisional&&p.pct.min===100&&p.pct.max===100};
}
function jobAtDate(day){
 /* Historical presentation must not leave date-specific calculations in the current render cache. */
 const memo=new Map(RENDER_MEMO);RENDER_MEMO.clear();
 try{return progress881Model(day);}finally{RENDER_MEMO.clear();for(const [key,value] of memo)RENDER_MEMO.set(key,value);}
}
let progressRevision=null;const progressCache=new Map();
function decorate(){
 const pane=document.getElementById('pane-timeline');if(!pane)return;
 const today=todayIso(),days=calendarDays(),byDay=new Map(days.map(d=>[d.iso,d]));
 const revision=today+JSON.stringify(S);if(revision!==progressRevision){progressRevision=revision;progressCache.clear();}
 const historical=iso=>{if(iso<'2026-10-07')return null;if(!progressCache.has(iso))progressCache.set(iso,jobAtDate(iso));return progressCache.get(iso);};
 for(const card of pane.querySelectorAll('.day[data-day]')){
  const day=byDay.get(card.dataset.day);if(!day)continue;
  const m=model(day,today,historical);if(!m.past)continue;
  card.classList.add('past984');card.dataset.past984=m.complete?'complete':'reference';
  card.style.setProperty('--past984-progress',String(m.percent??0)+'%');
  const header=card.querySelector('.dhr');if(header)header.innerHTML='<span class="past984-stamp">PAST DAY · CLOSED</span>';
  const band=document.createElement('span');band.className='past984-band';band.dataset.past984Summary='';
  band.innerHTML='<span class="past984-label">Job progress</span>'+(m.percent===null?'<span class="past984-empty">—</span>':'<b>'+(m.bound?'≥':'')+m.text+'<small>%</small></b>');
  card.querySelector('.dpan')?.append(band);
  const footer=card.querySelector('.dfoot');if(footer){const selected=card.classList.contains('on');footer.innerHTML='<span class="'+(selected?'dsel':'dmotto')+'">Reference'+(selected?' · selected':'')+'</span><i class="dflag" aria-hidden="true"></i>';}
  card.setAttribute('aria-label',card.getAttribute('aria-label')+'. Past day, reference. '+(m.percent===null?'Job progress unavailable.':(m.bound?'At least ':'')+m.text+' percent job progress as at '+day.iso+'.'));
  band.title='Job progress as at '+fmtDate(day.iso)+'. Same tracked category index as Today.';
 }
}
let lastDay=null;
function checkDay(){
 if(typeof document==='undefined'||document.hidden||typeof TPOD!=='undefined'&&TPOD.frozen)return false;
 const now=todayIso();if(lastDay===null){lastDay=now;return false;}if(now===lastDay)return false;lastDay=now;
 const pane=document.getElementById('pane-timeline');if(pane&&!pane.hidden){renderTimeline();return true;}return false;
}
if(typeof window!=='undefined') {
 lastDay=todayIso();
 const weatherBefore=wxCardHtml;wxCardHtml=function(iso){const html=weatherBefore.apply(this,arguments);return String(iso)<todayIso()?html.replace('No forecast</b>','History unavailable</b>'):html;};
 const previous=renderTimeline;renderTimeline=function(){const result=previous.apply(this,arguments);decorate();return result;};
 /* Reuse the existing visible clock tick: one redraw per Brisbane date change, no new timer. */
 const clockBefore=tpodTick;tpodTick=function(){const result=clockBefore.apply(this,arguments);checkDay();return result;};
}
root.PastDay984={model,decorate,checkDay};
})(typeof window!=='undefined'?window:globalThis);
